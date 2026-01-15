import { Advice, MatchRecord } from '../types';

// Constants for Google API
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Initialize the Google API Client
export const initializeGoogleApi = (clientId: string, apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const checkInit = () => {
      if (gapiInited && gisInited) resolve();
    };

    // Initialize GAPI
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: apiKey, // Note: This is usually the Sheets API key, but we reuse the passed key if it supports it, or rely on token.
          discoveryDocs: DISCOVERY_DOCS,
        });
        gapiInited = true;
        checkInit();
      } catch (err) {
        console.error("Error initializing GAPI client", err);
        reject(err);
      }
    });

    // Initialize GIS
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: '', // Defined at request time
      });
      gisInited = true;
      checkInit();
    } catch (err) {
      console.error("Error initializing GIS client", err);
      reject(err);
    }
  });
};

// Handle Login
export const handleLogin = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
        throw (resp);
      }
      resolve();
    };

    if (window.gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

// Check if user is logged in
export const checkAuth = (): boolean => {
  return window.gapi && window.gapi.client && window.gapi.client.getToken() !== null;
};

// --- Sheet Operations ---

const KNOWLEDGE_SHEET = 'Knowledge_Base';
const MATCH_SHEET = 'Match_History';

export const fetchKnowledgeBase = async (spreadsheetId: string): Promise<Advice[]> => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${KNOWLEDGE_SHEET}!A2:H`, // Assuming header is row 1
    });

    const rows = response.result.values || [];
    return rows.map((row: string[]) => ({
      timestamp: row[0],
      video_title: row[1],
      video_url: row[2],
      content: row[3],
      role_tags: row[4],
      champion_tags: row[5],
      category: row[6] as any,
      importance: row[7] as any,
    }));
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    throw error;
  }
};

export const appendAdvice = async (spreadsheetId: string, adviceList: Advice[]): Promise<void> => {
  const values = adviceList.map(a => [
    a.timestamp,
    a.video_title,
    a.video_url,
    a.content,
    a.role_tags,
    a.champion_tags,
    a.category,
    a.importance
  ]);

  try {
    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${KNOWLEDGE_SHEET}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
  } catch (error) {
    console.error("Error appending advice:", error);
    throw error;
  }
};

export const fetchMatchHistory = async (spreadsheetId: string): Promise<MatchRecord[]> => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${MATCH_SHEET}!A2:H`,
    });

    const rows = response.result.values || [];
    return rows.map((row: string[]) => ({
      timestamp: row[0],
      role: row[1],
      champion: row[2],
      result: row[3] as 'Win' | 'Loss',
      achievement_rate: parseFloat(row[4]),
      checked_count: parseInt(row[5]),
      total_count: parseInt(row[6]),
      note: row[7],
    }));
  } catch (error) {
    console.error("Error fetching matches:", error);
    throw error;
  }
};

export const appendMatchRecord = async (spreadsheetId: string, record: MatchRecord): Promise<void> => {
  const values = [[
    record.timestamp,
    record.role,
    record.champion,
    record.result,
    record.achievement_rate,
    record.checked_count,
    record.total_count,
    record.note
  ]];

  try {
    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${MATCH_SHEET}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
  } catch (error) {
    console.error("Error appending match:", error);
    throw error;
  }
};

// Helper to initialize sheets if they don't exist (basic error handling helper)
export const ensureSheetsExist = async (spreadsheetId: string) => {
    // This is complex in GAPI alone without risk of overwriting. 
    // We assume the user has set up the sheet based on the tutorial/docs for now.
    // In a full prod app, we'd check metadata and add sheets if missing.
    console.log(`Assuming Spreadsheet ${spreadsheetId} has Knowledge_Base and Match_History sheets.`);
}