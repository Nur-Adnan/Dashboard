import { google, sheets_v4 } from 'googleapis';

let sheetsClient: sheets_v4.Sheets | null = null;

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (!sheetsClient) {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheetsClient = google.sheets({ version: 'v4', auth });
  }
  return sheetsClient;
}

export const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '';

export async function readSheet(sheetName: string): Promise<string[][]> {
  try {
    const client = await getSheetsClient();
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });
    const rows = response.data.values || [];
    return rows.slice(1);
  } catch (error) {
    console.error(`Error reading sheet ${sheetName}:`, error);
    return [];
  }
}

export async function appendRow(sheetName: string, values: unknown[]): Promise<void> {
  try {
    const client = await getSheetsClient();
    await client.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: 'RAW',
      requestBody: {
        values: [values],
      },
    });
  } catch (error) {
    console.error(`Error appending row to ${sheetName}:`, error);
    throw error;
  }
}

export async function updateRow(sheetName: string, rowIndex: number, values: unknown[]): Promise<void> {
  try {
    const client = await getSheetsClient();
    const range = `${sheetName}!${rowIndex}:${rowIndex}`;
    await client.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [values],
      },
    });
  } catch (error) {
    console.error(`Error updating row in ${sheetName}:`, error);
    throw error;
  }
}

export async function deleteRow(sheetName: string, rowIndex: number): Promise<void> {
  try {
    const client = await getSheetsClient();
    // Get the sheet ID first
    const meta = await client.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = meta.data.sheets?.find(s => s.properties?.title === sheetName);
    if (!sheet?.properties?.sheetId) throw new Error(`Sheet "${sheetName}" not found`);

    await client.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0-based
              endIndex: rowIndex,        // exclusive
            },
          },
        }],
      },
    });
  } catch (error) {
    console.error(`Error deleting row in ${sheetName}:`, error);
    throw error;
  }
}
export async function findRowIndex(sheetName: string, columnIndex: number, value: string): Promise<number> {
  try {
    const client = await getSheetsClient();
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });
    const rows = response.data.values || [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][columnIndex] === value) {
        return i + 1;
      }
    }
    return -1;
  } catch (error) {
    console.error(`Error finding row in ${sheetName}:`, error);
    return -1;
  }
}