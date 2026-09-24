import { getAccessToken } from './googleAuth';
import { IndexingResult, IndexCheckResult } from '../types';

export interface ExportSheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  rowsExported: number;
}

export interface ImportSheetResponse {
  spreadsheetId: string;
  title: string;
  urls: string[];
}

export interface DriveUploadResponse {
  fileId: string;
  webViewLink?: string;
  fileName: string;
}

/**
 * Creates a formatted Google Spreadsheet in the user's Google Drive
 * and populates it with indexing audit results.
 */
export async function exportToGoogleSheets(
  sheetTitle: string,
  results: IndexingResult[]
): Promise<ExportSheetResponse> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google first.');
  }

  // 1. Create the new Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle || `Indexing Report - ${new Date().toISOString().slice(0, 10)}`
      }
    })
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to create Google Sheet (${createRes.status})`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const firstSheetName = sheetData.sheets?.[0]?.properties?.title || 'Sheet1';

  // 2. Prepare headers and row values
  const headerRow = [
    'Target URL',
    'Timestamp',
    'Status',
    'Method Used',
    'Googlebot Dispatched',
    'Crawl Latency (ms)',
    'Engine Telemetry Details'
  ];

  const dataRows = results.map((r) => [
    r.url || '',
    r.timestamp || '',
    r.status || '',
    r.methodUsed || '',
    r.googlebotTriggered ? 'TRUE' : 'FALSE',
    r.crawlLatencyMs || 0,
    r.details || r.message || ''
  ]);

  const allValues = [headerRow, ...dataRows];

  // 3. Append data to the sheet
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    firstSheetName
  )}!A1:append?valueInputOption=USER_ENTERED`;

  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: allValues
    })
  });

  if (!appendRes.ok) {
    const appendErr = await appendRes.json().catch(() => ({}));
    throw new Error(appendErr.error?.message || 'Spreadsheet created, but failed to write rows');
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: sheetData.properties?.title || sheetTitle,
    rowsExported: results.length
  };
}

/**
 * Creates a formatted Google Spreadsheet with Google Index status check results.
 */
export async function exportCheckResultsToGoogleSheets(
  sheetTitle: string,
  results: IndexCheckResult[]
): Promise<ExportSheetResponse> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google first.');
  }

  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle || `Google Index Status Audit - ${new Date().toISOString().slice(0, 10)}`
      }
    })
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to create Google Sheet (${createRes.status})`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const firstSheetName = sheetData.sheets?.[0]?.properties?.title || 'Sheet1';

  // 2. Prepare headers and rows
  const headerRow = [
    'Target URL',
    'Index Status',
    'Is Indexed (SERP)',
    'site: Query Match',
    'Exact Quote Match',
    'Google Cache Found',
    'HTTP Status',
    'Meta Robots Allowed',
    'Canonical URL',
    'SERP Title',
    'Details',
    'Google Search URL',
    'Checked At'
  ];

  const dataRows = results.map((r) => [
    r.url || '',
    r.status || '',
    r.isIndexed ? 'YES' : 'NO',
    r.siteQueryFound ? 'FOUND' : 'MISSING',
    r.quoteQueryFound ? 'MATCH' : 'NO',
    r.googleCacheFound ? 'YES' : 'NO',
    r.httpStatus || 0,
    r.metaRobotsAllowed ? 'ALLOWED' : 'NOINDEX',
    r.canonicalUrl || '',
    r.serpSnippet?.title || '',
    r.details || '',
    r.googleSearchUrl || '',
    r.timestamp || ''
  ]);

  const allValues = [headerRow, ...dataRows];

  // 3. Append data
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    firstSheetName
  )}!A1:append?valueInputOption=USER_ENTERED`;

  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: allValues
    })
  });

  if (!appendRes.ok) {
    const appendErr = await appendRes.json().catch(() => ({}));
    throw new Error(appendErr.error?.message || 'Spreadsheet created, but failed to write rows');
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: sheetData.properties?.title || sheetTitle,
    rowsExported: results.length
  };
}


/**
 * Imports URLs from a Google Sheet (either by URL or Spreadsheet ID).
 */
export async function importFromGoogleSheet(
  spreadsheetUrlOrId: string
): Promise<ImportSheetResponse> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google first.');
  }

  // Extract ID
  const cleanInput = spreadsheetUrlOrId.trim();
  const match = cleanInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = match ? match[1] : cleanInput;

  if (!spreadsheetId) {
    throw new Error('Invalid Google Sheet URL or ID provided.');
  }

  // 1. Fetch metadata to discover sheets
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Could not access Google Sheet (${metaRes.status}). Check permissions.`);
  }

  const metaData = await metaRes.json();
  const sheetTitle = metaData.sheets?.[0]?.properties?.title || 'Sheet1';
  const docTitle = metaData.properties?.title || 'Google Sheet';

  // 2. Fetch sheet values
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetTitle
    )}!A1:Z5000`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!valuesRes.ok) {
    const err = await valuesRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed reading values from sheet "${sheetTitle}".`);
  }

  const valuesData = await valuesRes.json();
  const rows: any[][] = valuesData.values || [];

  // 3. Scan and collect valid URLs
  const foundUrls: string[] = [];
  const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

  for (const row of rows) {
    for (const cell of row) {
      if (typeof cell === 'string') {
        const trimmed = cell.trim();
        if (urlRegex.test(trimmed)) {
          foundUrls.push(trimmed);
        } else if (trimmed.includes('.') && !trimmed.includes(' ') && !trimmed.startsWith('#')) {
          // Check if candidate domain/path without scheme
          try {
            const parsed = new URL(`https://${trimmed}`);
            if (parsed.hostname.includes('.')) {
              foundUrls.push(`https://${trimmed}`);
            }
          } catch {
            // not a valid url
          }
        }
      }
    }
  }

  const uniqueUrls = Array.from(new Set(foundUrls));

  return {
    spreadsheetId,
    title: docTitle,
    urls: uniqueUrls
  };
}

/**
 * Uploads a file (e.g. CSV or TXT) to Google Drive.
 */
export async function uploadFileToDrive(
  fileName: string,
  content: string,
  mimeType: string = 'text/csv'
): Promise<DriveUploadResponse> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google first.');
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: mimeType
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload file to Google Drive (${res.status})`);
  }

  const data = await res.json();
  return {
    fileId: data.id,
    webViewLink: data.webViewLink,
    fileName: data.name || fileName
  };
}
