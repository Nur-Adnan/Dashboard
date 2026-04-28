/**
 * Migration: Add job_focus, terminated, hired columns to the students sheet.
 *
 * Current layout (cols A–J):
 *   id | name | batch | mentor_email | stage | risk_status | risk_reasons | last_activity_date | created_at | updated_at
 *
 * Target layout (cols A–M):
 *   id | name | batch | mentor_email | stage | risk_status | risk_reasons | last_activity_date | job_focus | terminated | hired | created_at | updated_at
 *
 * The script:
 *   1. Reads all current rows from the students sheet.
 *   2. Inserts 3 new columns (K, L, M) by shifting created_at / updated_at right.
 *   3. Writes the updated header row.
 *   4. Backfills every existing data row with defaults: job_focus='', terminated='false', hired='false'.
 *
 * Run once:
 *   npx ts-node --esm scripts/migrate-student-columns.ts
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const SHEET = 'students';

// New full header order
const NEW_HEADERS = [
  'id', 'name', 'batch', 'mentor_email', 'stage',
  'risk_status', 'risk_reasons', 'last_activity_date',
  'job_focus', 'terminated', 'hired',
  'created_at', 'updated_at',
];

async function run() {
  if (!SPREADSHEET_ID) {
    console.error('❌  GOOGLE_SPREADSHEET_ID not set in .env.local');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // 1. Read all existing data (including header row)
  console.log(`Reading "${SHEET}" sheet...`);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET,
  });

  const rows: string[][] = (response.data.values || []) as string[][];

  if (rows.length === 0) {
    console.log('Sheet is empty — writing headers only.');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [NEW_HEADERS] },
    });
    console.log('✅  Headers written.');
    return;
  }

  const headerRow = rows[0];
  console.log(`Current headers: ${headerRow.join(', ')}`);

  // Guard: already migrated?
  if (headerRow.includes('job_focus')) {
    console.log('✅  Migration already applied — job_focus column exists. Nothing to do.');
    return;
  }

  // 2. Rebuild every row with the new column layout.
  //    Old indices: 0–7 stay, then we insert 3 new cols, then old 8 (created_at) and 9 (updated_at).
  const newRows: string[][] = rows.map((row, i) => {
    if (i === 0) {
      // Header row
      return NEW_HEADERS;
    }
    // Data row — old layout: [0..7] + [8=created_at, 9=updated_at]
    return [
      row[0] || '',  // id
      row[1] || '',  // name
      row[2] || '',  // batch
      row[3] || '',  // mentor_email
      row[4] || '',  // stage
      row[5] || '',  // risk_status
      row[6] || '',  // risk_reasons
      row[7] || '',  // last_activity_date
      '',            // job_focus  (new — default empty)
      'false',       // terminated (new — default false)
      'false',       // hired      (new — default false)
      row[8] || '',  // created_at  (shifted from col I → col L)
      row[9] || '',  // updated_at  (shifted from col J → col M)
    ];
  });

  // 3. Write everything back in one shot
  console.log(`Migrating ${newRows.length - 1} student row(s)...`);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: newRows },
  });

  console.log('✅  Migration complete!');
  console.log(`   Headers are now: ${NEW_HEADERS.join(', ')}`);
  console.log(`   ${newRows.length - 1} existing row(s) backfilled with job_focus='', terminated='false', hired='false'`);
}

run().catch((err) => {
  console.error('❌  Migration failed:', err);
  process.exit(1);
});
