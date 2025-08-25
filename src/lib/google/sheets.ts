import { google } from 'googleapis';

// Google Sheets API configuration
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Initialize Google Auth client
function getAuthClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google service account credentials not configured');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
  return auth;
}

// Get Google Sheets API client (ensures JWT is authorized)
async function getSheetsClient() {
  const auth = getAuthClient();
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

// Map sheet keys to environment variable sheet IDs
const SHEET_ID_MAP: Record<string, string> = {
  chatbot: process.env.LEADS_SHEET_CHATBOT_ID || '',
  voicebot: process.env.LEADS_SHEET_VOICEBOT_ID || '',
  career: process.env.LEADS_SHEET_CAREER_ID || '',
  footer: process.env.LEADS_SHEET_FOOTER_ID || '',
  contact: process.env.LEADS_SHEET_CONTACT_ID || '',
};

// Validate sheet key and get corresponding sheet ID
function getSheetId(sheetKey: string): string {
  const sheetId = SHEET_ID_MAP[sheetKey];
  if (!sheetId) {
    throw new Error(`Invalid sheet key: ${sheetKey}`);
  }
  return sheetId;
}

// Read data from Google Sheet
export async function readSheetData(sheetKey: string): Promise<string[][]> {
  try {
    const sheets = await getSheetsClient();
    const sheetId = getSheetId(sheetKey);
    // Determine the actual first sheet title instead of assuming 'Sheet1'
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId, includeGridData: false });
    const firstSheetTitle = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${firstSheetTitle}!A:Z`,
    });

    const values = response.data.values;

    if (!values || values.length === 0) {
      return [
        ['Name', 'Email', 'Phone', 'Source', 'Stage', 'Owner', 'Created At']
      ];
    }

    return values as string[][];
  } catch (error: any) {
    const apiMessage = error?.response?.data?.error?.message || error?.message || 'Unknown error';
    const code = error?.code || error?.response?.status;
    console.error('Error reading sheet data:', { code, apiMessage });

    if (code === 403 && /unregistered callers|not allow unregistered callers/i.test(apiMessage)) {
      throw new Error('Google Sheets API rejected the request: Unregistered caller. Ensure the Google Sheets API is enabled for the service account\'s project AND the spreadsheet is shared with the exact service account email.');
    }

    if (code === 403 && /permission/i.test(apiMessage)) {
      throw new Error('The service account does not have permission to access this spreadsheet. Share it with the service account email as an Editor.');
    }

    throw new Error(`Failed to read sheet data: ${apiMessage}`);
  }
}

// Write data to Google Sheet
export async function writeSheetData(sheetKey: string, data: string[][]): Promise<void> {
  try {
    const sheets = await getSheetsClient();
    const sheetId = getSheetId(sheetKey);

    if (data.length > 20000) {
      throw new Error('Data exceeds maximum allowed rows (20,000)');
    }

    if (data.length > 0 && data[0].length > 100) {
      throw new Error('Data exceeds maximum allowed columns (100)');
    }

    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const firstSheetTitle = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';

    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${firstSheetTitle}!A:Z`,
    });

    if (data.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${firstSheetTitle}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: data,
        },
      });
    }
  } catch (error: any) {
    const apiMessage = error?.response?.data?.error?.message || error?.message || 'Unknown error';
    const code = error?.code || error?.response?.status;
    console.error('Error writing sheet data:', { code, apiMessage });

    if (code === 403 && /unregistered callers|not allow unregistered callers/i.test(apiMessage)) {
      throw new Error('Google Sheets API rejected the request: Unregistered caller. Ensure the Google Sheets API is enabled for the service account\'s project AND the spreadsheet is shared with the exact service account email.');
    }

    if (code === 403 && /permission/i.test(apiMessage)) {
      throw new Error('The service account does not have permission to write to this spreadsheet. Share it with the service account email as an Editor.');
    }

    throw new Error(`Failed to write sheet data: ${apiMessage}`);
  }
}

// Get sheet metadata (title, last modified, etc.)
export async function getSheetMetadata(sheetKey: string) {
  try {
    const sheets = await getSheetsClient();
    const sheetId = getSheetId(sheetKey);

    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      includeGridData: false,
    });

    return {
      title: response.data.properties?.title,
      // 'updated' is not part of types; avoid strict access
      lastModified: (response.data.properties as any)?.updated,
      sheets: response.data.sheets?.map(sheet => ({
        title: sheet.properties?.title,
        gridProperties: sheet.properties?.gridProperties,
      })),
    };
  } catch (error: any) {
    const apiMessage = error?.response?.data?.error?.message || error?.message || 'Unknown error';
    const code = error?.code || error?.response?.status;
    console.error('Error getting sheet metadata:', { code, apiMessage });

    if (code === 403 && /unregistered callers|not allow unregistered callers/i.test(apiMessage)) {
      throw new Error('Google Sheets API rejected the request: Unregistered caller. Ensure the Google Sheets API is enabled for the service account\'s project AND the spreadsheet is shared with the exact service account email.');
    }

    if (code === 403 && /permission/i.test(apiMessage)) {
      throw new Error('The service account does not have permission to access this spreadsheet. Share it with the service account email as an Editor.');
    }

    throw new Error(`Failed to get sheet metadata: ${apiMessage}`);
  }
}


