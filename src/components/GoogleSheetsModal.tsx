import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  HardDrive,
  ExternalLink,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  LogOut,
  FolderPlus
} from 'lucide-react';
import { IndexingResult } from '../types';
import {
  exportToGoogleSheets,
  importFromGoogleSheet,
  uploadFileToDrive,
  ExportSheetResponse,
  DriveUploadResponse
} from '../services/googleWorkspace';
import { googleSignIn, logout } from '../services/googleAuth';
import { WorkspaceConfirmModal } from './WorkspaceConfirmModal';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  results: IndexingResult[];
  onImportUrls: (urls: string[]) => void;
  onAddLog: (level: 'info' | 'success' | 'warning' | 'error', message: string, source?: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  results,
  onImportUrls,
  onAddLog
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [sheetTitle, setSheetTitle] = useState(
    `Indexing Audit - ${new Date().toISOString().slice(0, 10)}`
  );
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    url?: string;
  } | null>(null);

  // Confirmation modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    actionType: 'export_sheets' | 'export_drive' | 'import_sheets';
    title: string;
    description: string;
    itemCount?: number;
    actionToExecute: () => Promise<void>;
  }>({
    isOpen: false,
    actionType: 'export_sheets',
    title: '',
    description: '',
    actionToExecute: async () => {}
  });

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onUserChange(res.user);
        onAddLog('success', `Signed in to Google as ${res.user.email} with Drive & Sheets access.`, 'GOOGLE_AUTH');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed');
      onAddLog('error', `Google sign-in error: ${err.message}`, 'GOOGLE_AUTH');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onUserChange(null);
    onAddLog('info', 'Signed out from Google account.', 'GOOGLE_AUTH');
  };

  // Trigger export to Google Sheets with mandatory user confirmation
  const initiateExportSheets = () => {
    if (results.length === 0) {
      setErrorMsg('No indexing results available to export.');
      return;
    }

    setConfirmModalState({
      isOpen: true,
      actionType: 'export_sheets',
      title: 'Export Audit Results to Google Sheets',
      description: `Create a new Google Spreadsheet titled "${sheetTitle}" in your Google Drive and write ${results.length} crawl verification records?`,
      itemCount: results.length,
      actionToExecute: async () => {
        setIsProcessing(true);
        setErrorMsg(null);
        setSuccessInfo(null);
        try {
          const res: ExportSheetResponse = await exportToGoogleSheets(sheetTitle, results);
          setSuccessInfo({
            message: `Successfully created "${res.title}" with ${res.rowsExported} audit rows!`,
            url: res.spreadsheetUrl
          });
          onAddLog('success', `Created Google Sheet "${res.title}" at ${res.spreadsheetUrl}`, 'GOOGLE_SHEETS');
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed exporting to Google Sheets');
          onAddLog('error', `Google Sheets export failed: ${err.message}`, 'GOOGLE_SHEETS');
        } finally {
          setIsProcessing(false);
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Trigger export to Google Drive as CSV with confirmation
  const initiateExportDrive = () => {
    if (results.length === 0) {
      setErrorMsg('No indexing results available to export.');
      return;
    }

    let csv = '\uFEFFTarget URL,Timestamp,Status,Method,Googlebot Dispatched,Latency (ms),Details\n';
    for (const r of results) {
      const safeUrl = `"${(r.url || '').replace(/"/g, '""')}"`;
      const safeDetails = `"${(r.details || r.message || '').replace(/"/g, '""')}"`;
      csv += `${safeUrl},${r.timestamp},${r.status},${r.methodUsed},${r.googlebotTriggered ? 'YES' : 'NO'},${r.crawlLatencyMs || 0},${safeDetails}\n`;
    }

    const fileName = `indexing-report-${new Date().toISOString().slice(0, 10)}.csv`;

    setConfirmModalState({
      isOpen: true,
      actionType: 'export_drive',
      title: 'Save CSV Report to Google Drive',
      description: `Upload file "${fileName}" with ${results.length} records to your Google Drive root folder?`,
      itemCount: results.length,
      actionToExecute: async () => {
        setIsProcessing(true);
        setErrorMsg(null);
        setSuccessInfo(null);
        try {
          const driveRes: DriveUploadResponse = await uploadFileToDrive(fileName, csv, 'text/csv');
          setSuccessInfo({
            message: `Saved file "${driveRes.fileName}" directly to your Google Drive!`,
            url: driveRes.webViewLink
          });
          onAddLog('success', `Saved CSV "${driveRes.fileName}" to Google Drive`, 'GOOGLE_DRIVE');
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed uploading to Google Drive');
          onAddLog('error', `Google Drive upload failed: ${err.message}`, 'GOOGLE_DRIVE');
        } finally {
          setIsProcessing(false);
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Import URLs from Google Sheet
  const handleImportSheets = async () => {
    if (!sheetUrlInput.trim()) {
      setErrorMsg('Please enter a Google Sheet URL or ID.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      const sheetData = await importFromGoogleSheet(sheetUrlInput);
      if (sheetData.urls.length === 0) {
        setErrorMsg(`Connected to "${sheetData.title}", but no valid HTTP/HTTPS URLs were found in the sheet.`);
      } else {
        onImportUrls(sheetData.urls);
        setSuccessInfo({
          message: `Loaded ${sheetData.urls.length} URLs from "${sheetData.title}" into the submission queue!`
        });
        onAddLog('success', `Imported ${sheetData.urls.length} URLs from Google Sheet "${sheetData.title}"`, 'GOOGLE_SHEETS');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed reading Google Sheet.');
      onAddLog('error', `Google Sheet read error: ${err.message}`, 'GOOGLE_SHEETS');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Google Workspace Integration (Sheets & Drive)
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* User Auth Status Banner */}
            {currentUser ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase border border-emerald-500/30">
                    {currentUser.email?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <span className="text-white font-medium block">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Connected to Google Drive & Sheets API
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1 text-slate-400 hover:text-red-400 text-[11px] flex items-center gap-1 transition cursor-pointer"
                  title="Disconnect Google Account"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-center space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-white">Connect Google Account</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sign in to seamlessly export real-time indexing reports to Google Sheets and import URL batches directly from Google Drive.
                  </p>
                </div>

                {/* Official GSI Button per guidelines */}
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="inline-flex items-center justify-center gap-3 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-lg transition shadow cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}

            {/* Error and Success Notifications */}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successInfo && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-1.5 text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="font-medium">{successInfo.message}</span>
                </div>
                {successInfo.url && (
                  <div className="pt-1">
                    <a
                      href={successInfo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold underline text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in Google Sheets / Drive
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Tab selection */}
            <div className="flex border-b border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('export');
                  setErrorMsg(null);
                  setSuccessInfo(null);
                }}
                className={`py-2 px-4 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'export'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Export Reports
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('import');
                  setErrorMsg(null);
                  setSuccessInfo(null);
                }}
                className={`py-2 px-4 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'import'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Import URLs from Sheets
              </button>
            </div>

            {/* Export Tab */}
            {activeTab === 'export' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Spreadsheet Title
                  </label>
                  <input
                    type="text"
                    value={sheetTitle}
                    onChange={(e) => setSheetTitle(e.target.value)}
                    placeholder="Indexing Report"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Includes {results.length} crawl results, latencies, Googlebot flags, and timestamps.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={initiateExportSheets}
                    disabled={!currentUser || isProcessing || results.length === 0}
                    className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-500/20"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Create Google Spreadsheet ({results.length} rows)
                  </button>

                  <button
                    type="button"
                    onClick={initiateExportDrive}
                    disabled={!currentUser || isProcessing || results.length === 0}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium rounded-lg border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                    title="Upload CSV to Google Drive"
                  >
                    <HardDrive className="w-4 h-4 text-sky-400" />
                    Save CSV to Drive
                  </button>
                </div>

                {!currentUser && (
                  <p className="text-[11px] text-amber-400 text-center">
                    * Sign in with Google above to enable direct export to Google Drive & Sheets.
                  </p>
                )}
              </div>
            )}

            {/* Import Tab */}
            {activeTab === 'import' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Google Spreadsheet URL or ID
                  </label>
                  <input
                    type="text"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5n.../edit"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Reads URLs from the spreadsheet cells and queues them into the bulk submission box.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleImportSheets}
                    disabled={!currentUser || isProcessing || !sheetUrlInput.trim()}
                    className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-500/20"
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Fetching URLs from Sheet...
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-4 h-4" />
                        Extract URLs & Load into Queue
                      </>
                    )}
                  </button>
                </div>

                {!currentUser && (
                  <p className="text-[11px] text-amber-400 text-center">
                    * Sign in with Google above to read spreadsheets from your Google account.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog */}
      <WorkspaceConfirmModal
        isOpen={confirmModalState.isOpen}
        actionType={confirmModalState.actionType}
        title={confirmModalState.title}
        description={confirmModalState.description}
        itemCount={confirmModalState.itemCount}
        isLoading={isProcessing}
        onConfirm={confirmModalState.actionToExecute}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
