import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load .env.local since ts-node doesn't auto-load it like Next.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const SHEETS = ['students', 'attendance_logs', 'progress_logs', 'team_updates', 'users'];

const HEADERS: Record<string, string[]> = {
  students: ['id', 'name', 'batch', 'mentor_email', 'stage', 'risk_status', 'risk_reasons', 'last_activity_date', 'created_at', 'updated_at'],
  attendance_logs: ['id', 'student_id', 'date', 'present', 'logged_by'],
  progress_logs: ['id', 'student_id', 'note', 'logged_at', 'logged_by'],
  team_updates: ['id', 'submitted_by', 'role', 'date', 'goals', 'achievements', 'blockers', 'submitted_at'],
  users: ['id', 'name', 'email', 'role', 'active', 'password_hash'],
};

async function setupSheets() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    console.error('GOOGLE_SPREADSHEET_ID not set in .env.local');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log('Checking spreadsheet...\n');

  for (const sheetName of SHEETS) {
    try {
      await sheets.spreadsheets.get({
        spreadsheetId,
        ranges: [sheetName],
      });
      console.log(`✓ Sheet "${sheetName}" exists`);
    } catch {
      console.log(`Creating sheet "${sheetName}"...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: sheetName },
            },
          }],
        },
      });
      console.log(`✓ Sheet "${sheetName}" created`);
    }
  }

  console.log('\nAdding headers...\n');

  for (const [sheetName, headers] of Object.entries(HEADERS)) {
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:Z1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
      console.log(`✓ Headers added to "${sheetName}"`);
    } catch (err) {
      console.error(`Error adding headers to "${sheetName}":`, err);
    }
  }

  console.log('\nCreating default admin user...\n');

  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const adminUser = [
    uuidv4(),
    'Admin User',
    'admin@example.com',
    'admin',
    'true',
    hashedPassword,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'users',
    valueInputOption: 'RAW',
    requestBody: { values: [adminUser] },
  });

  console.log('✓ Default admin user created');
  console.log(`  Email: admin@example.com`);
  console.log(`  Password: ${adminPassword}`);
  console.log('\n⚠️  IMPORTANT: Change the admin password after first login!\n');

  console.log('=== SETUP COMPLETE ===\n');
  console.log('Next steps:');
  console.log('1. Share your Google Sheet with the service account email:');
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
  console.log(`   Email: ${credentials.client_email}`);
  console.log('2. Add your team members to the "users" sheet');
  console.log('3. Run: npm run dev');
}

setupSheets().catch(console.error);