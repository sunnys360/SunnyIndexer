import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { MetricsDashboard } from './components/MetricsDashboard';
import { SubmissionForm } from './components/SubmissionForm';
import { ResultsTable } from './components/ResultsTable';
import { RealtimeLogs } from './components/RealtimeLogs';
import { ConfigModal } from './components/ConfigModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { IndexCheckerTool } from './components/IndexCheckerTool';
import { IndexingResult, IndexCheckResult, LogEntry, QuotaStats, ConfigSettings, IndexingMethod } from './types';
import { initAuth, getAccessToken } from './services/googleAuth';
import { exportCheckResultsToGoogleSheets } from './services/googleWorkspace';
import { SchemaBridgeModal } from './components/SchemaBridgeModal';
import { AdminLogin } from './components/AdminLogin';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { checkAuthMe, logoutAdmin, AdminUser } from './services/auth';
import {
  Bot,
  Settings,
  FileSpreadsheet,
  Zap,
  SearchCheck,
  CheckCircle2,
  Terminal,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Radio,
  Globe,
  Briefcase,
  LogOut,
  KeyRound,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

const DEFAULT_CONFIG: ConfigSettings = {
  requestDelayMs: 400,
  concurrency: 2,
  autoResubmitFailed: true,
  indexNowKey: '3a649887b8b74ffca0b741e98d9bfa21'
};

const INITIAL_STATS: QuotaStats = {
  dailyLimit: 25000,
  usedToday: 0,
  remainingToday: 25000,
  totalHistorical: 0,
  successfulHistorical: 0,
  successRate: 100,
  googlebotVisitsDetected: 0,
  lastResetTime: new Date().toISOString()
};

export default function App() {
  const [stats, setStats] = useState<QuotaStats>(() => {
    try {
      const saved = localStorage.getItem('fast_indexing_stats') || localStorage.getItem('speedy_indexing_stats');
      return saved ? JSON.parse(saved) : INITIAL_STATS;
    } catch {
      return INITIAL_STATS;
    }
  });

  const [config, setConfig] = useState<ConfigSettings>(() => {
    try {
      const saved = localStorage.getItem('fast_indexing_config') || localStorage.getItem('speedy_indexing_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [results, setResults] = useState<IndexingResult[]>(() => {
    try {
      const saved = localStorage.getItem('fast_indexing_results') || localStorage.getItem('speedy_indexing_results');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log-init-1',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'CORE_ENGINE',
      message: 'Google Fast Indexer initialized. Native pipeline active: WebSub Hub, Mobile Googlebot Spiders, IndexNow, and XML-RPC pings.'
    }
  ]);

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; currentUrl: string } | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [importedUrls, setImportedUrls] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showDeepChecker, setShowDeepChecker] = useState(false);

  const isCancelledRef = useRef(false);

  // Verify Admin Authentication on Mount
  useEffect(() => {
    checkAuthMe().then((res) => {
      if (res.authenticated && res.user) {
        setAdminUser(res.user);
      }
      setIsAuthLoading(false);
    });

    const handleAuthExpired = () => {
      setAdminUser(null);
      addLog('warning', 'Admin session expired. Please log in again.', 'AUTH');
    };
    window.addEventListener('admin_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('admin_auth_expired', handleAuthExpired);
  }, []);

  // Initialize Firebase Google Auth listener
  useEffect(() => {
    const unsubscribe = initAuth((user) => {
      setCurrentUser(user);
      if (user) {
        addLog('info', `Google user session active: ${user.email}`, 'AUTH');
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('fast_indexing_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('fast_indexing_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('fast_indexing_results', JSON.stringify(results.slice(0, 1000)));
  }, [results]);

  const addLog = (level: LogEntry['level'], message: string, source = 'INDEXER', url?: string) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      url
    };
    setLogs((prev) => [...prev.slice(-250), entry]);
  };

  const handleStopSubmission = () => {
    isCancelledRef.current = true;
    addLog('warning', 'Cancellation signal received. Terminating indexing queue...', 'MANAGER');
  };

  const handleStartSubmission = async (
    urls: string[],
    method: IndexingMethod = 'all_methods'
  ) => {
    if (urls.length === 0) return;

    setIsRunning(true);
    isCancelledRef.current = false;
    setProgress({ current: 0, total: urls.length, currentUrl: urls[0] });
    addLog('info', `Starting submission of ${urls.length} URLs using ${method}...`, 'DISPATCHER');

    const googleToken = await getAccessToken();

    let processedCount = 0;
    let successfulDispatches = 0;
    let googlebotHits = 0;

    const concurrency = Math.max(1, Math.min(5, config.concurrency || 2));
    const chunks: string[][] = [];
    for (let i = 0; i < urls.length; i += concurrency) {
      chunks.push(urls.slice(i, i + concurrency));
    }

    for (let c = 0; c < chunks.length; c++) {
      if (isCancelledRef.current) {
        addLog('warning', `Submission stopped by user after processing ${processedCount} URLs.`, 'MANAGER');
        break;
      }

      const currentChunk = chunks[c];

      await Promise.all(
        currentChunk.map(async (url, idx) => {
          if (isCancelledRef.current) return;
          const globalIdx = c * concurrency + idx + 1;
          setProgress({ current: globalIdx, total: urls.length, currentUrl: url });
          addLog('info', `Targeting [${globalIdx}/${urls.length}]: Dispatching crawl signals...`, 'ENGINE', url);

          try {
            const response = await fetch('/api/indexing/submit-url', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(googleToken ? { 'Authorization': `Bearer ${googleToken}` } : {})
              },
              body: JSON.stringify({
                url,
                method,
                options: {
                  googleApiKey: config.googleApiKey,
                  googleAccessToken: googleToken || undefined,
                  googleServiceAccountJson: config.googleServiceAccountJson,
                  indexNowKey: config.indexNowKey,
                  enableGoogleWebSub: config.enableGoogleWebSub,
                  enableXmlRpcPing: config.enableXmlRpcPing,
                  sendTelegramAlert: Boolean(config.telegramBotToken && config.telegramChatId),
                  telegramBotToken: config.telegramBotToken,
                  telegramChatId: config.telegramChatId
                }
              })
            });

            const data = await response.json();

            if (response.ok && data.success) {
              successfulDispatches++;
              if (data.googlebotTriggered) googlebotHits++;

              const newResult: IndexingResult = {
                url,
                timestamp: new Date().toISOString(),
                status: data.googlebotTriggered ? 'crawled' : 'queued',
                methodUsed: method,
                googlebotTriggered: Boolean(data.googlebotTriggered),
                webSubAccepted: Boolean(data.webSubAccepted),
                indexNowAccepted: Boolean(data.indexNowAccepted),
                xmlRpcAccepted: Boolean(data.xmlRpcAccepted),
                crawlLatencyMs: data.crawlLatencyMs,
                jobEventMeta: data.jobEventMeta,
                googleSearchUrl: data.googleSearchUrl || `https://www.google.com/search?q=site:${encodeURIComponent(url)}`,
                gscInspectUrl: data.gscInspectUrl,
                message: data.googlebotTriggered
                  ? 'Googlebot Mobile Spider triggered from Google datacenters'
                  : 'Queued in multi-engine discovery pipeline'
              };

              setResults((prev) => {
                const filtered = prev.filter((r) => r.url !== url);
                return [newResult, ...filtered];
              });

              if (data.jobEventMeta?.isJobOrEventHost) {
                const targetsCount = data.jobEventMeta.outboundTargetUrls?.length || 0;
                addLog(
                  'success',
                  `[Bridge Crawl] Detected ${data.jobEventMeta.detectedSchemaType} host ("${data.jobEventMeta.schemaTitle || ''}"). Found ${targetsCount} outbound target link(s) dispatched to Googlebot.`,
                  'SCHEMA_BRIDGE',
                  url
                );
              }

              if (data.traces && Array.isArray(data.traces)) {
                data.traces.forEach((trace: any) => {
                  addLog(trace.status === 'ok' ? 'success' : 'warning', `[${trace.stage}] ${trace.detail}`, 'CRAWLER', url);
                });
              }

              addLog('success', `All crawl signals dispatched (${data.crawlLatencyMs}ms)`, 'BOT_ROUTER', url);

              // AUTOMATED INDEX VERIFICATION: Check Google indexing status automatically without manual browser intervention
              try {
                addLog('info', `Automating Google index check for [${globalIdx}/${urls.length}]: ${url}...`, 'AUTO_AUDIT', url);
                const checkRes = await fetch('/api/indexing/check-index-status', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    url,
                    options: {
                      googleApiKey: config.googleApiKey,
                      googleCustomSearchCx: config.googleCustomSearchCx,
                      googleServiceAccountJson: config.googleServiceAccountJson,
                      googleAccessToken: googleToken || undefined
                    }
                  })
                });

                if (checkRes.ok) {
                  const checkData = await checkRes.json();
                  newResult.liveSerpStatus = checkData.status;
                  newResult.liveSerpDetails = checkData.details;
                  if (checkData.isIndexed) {
                    newResult.status = 'indexed';
                    newResult.message = `Confirmed Indexed on Google Search (${checkData.details})`;
                    addLog('success', `Google Index Status: Confirmed Indexed! (${checkData.details})`, 'AUTO_AUDIT', url);
                  } else {
                    newResult.message = `${newResult.message} • ${checkData.details}`;
                    addLog('info', `Google Index Status: ${checkData.details}`, 'AUTO_AUDIT', url);
                  }

                  setResults((prev) => {
                    const filtered = prev.filter((r) => r.url !== url);
                    return [newResult, ...filtered];
                  });
                }
              } catch (checkErr: any) {
                addLog('warning', `Automated index check note: ${checkErr.message}`, 'AUTO_AUDIT', url);
              }
            } else {
              const failResult: IndexingResult = {
                url,
                timestamp: new Date().toISOString(),
                status: 'failed',
                methodUsed: method,
                googlebotTriggered: false,
                googleSearchUrl: `https://www.google.com/search?q=site:${encodeURIComponent(url)}`,
                message: data.error || 'Failed to dispatch'
              };
              setResults((prev) => {
                const filtered = prev.filter((r) => r.url !== url);
                return [failResult, ...filtered];
              });
              addLog('error', `Failed indexing push: ${data.error || 'Server error'}`, 'ERROR_HANDLER', url);
            }
          } catch (err: any) {
            const failResult: IndexingResult = {
              url,
              timestamp: new Date().toISOString(),
              status: 'failed',
              methodUsed: method,
              googlebotTriggered: false,
              googleSearchUrl: `https://www.google.com/search?q=site:${encodeURIComponent(url)}`,
              message: err.message || 'Network exception'
            };
            setResults((prev) => {
              const filtered = prev.filter((r) => r.url !== url);
              return [failResult, ...filtered];
            });
            addLog('error', `Network error during submission: ${err.message}`, 'NETWORK', url);
          }

          processedCount++;

          if (config.requestDelayMs && config.requestDelayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, config.requestDelayMs));
          }
        })
      );
    }

    // Update session metrics
    setStats((prev) => {
      const newUsed = prev.usedToday + processedCount;
      const newRemaining = Math.max(0, prev.dailyLimit - newUsed);
      const totalSuccess = (prev.successfulHistorical || 0) + successfulDispatches;
      const totalAttempted = prev.totalHistorical + processedCount;
      const rate = totalAttempted > 0 ? Math.round((totalSuccess / totalAttempted) * 100) : 100;

      return {
        ...prev,
        usedToday: newUsed,
        remainingToday: newRemaining,
        totalHistorical: totalAttempted,
        successfulHistorical: totalSuccess,
        successRate: rate,
        googlebotVisitsDetected: prev.googlebotVisitsDetected + googlebotHits
      };
    });

    setProgress(null);
    setIsRunning(false);
    addLog('success', `Completed batch: ${successfulDispatches} successful dispatches across all native methods.`, 'CORE_ENGINE');
  };

  // Live In-Place Google SERP Verification for individual URL
  const handleVerifyUrlSerp = async (url: string) => {
    try {
      addLog('info', `Checking live Google SERP index for: ${url}`, 'SERP_VERIFIER', url);
      const res = await fetch('/api/indexing/check-index-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          options: {
            googleApiKey: config.googleApiKey,
            googleCustomSearchCx: config.googleCustomSearchCx
          }
        })
      });

      const data = await res.json();
      if (res.ok) {
        setResults((prev) =>
          prev.map((r) =>
            r.url === url
              ? {
                  ...r,
                  liveSerpStatus: data.status,
                  liveSerpDetails: data.details,
                  status: data.isIndexed ? 'indexed' : r.status
                }
              : r
          )
        );
        addLog(
          data.isIndexed ? 'success' : 'info',
          `Google SERP verification: ${data.details}`,
          'SERP_VERIFIER',
          url
        );
      }
    } catch (err: any) {
      addLog('error', `SERP check failed: ${err.message}`, 'SERP_VERIFIER', url);
    }
  };

  const [isAutoVerifyingAll, setIsAutoVerifyingAll] = useState(false);

  // Auto-verify all URLs without manual intervention
  const handleAutoVerifyAll = async () => {
    if (results.length === 0 || isAutoVerifyingAll) return;
    setIsAutoVerifyingAll(true);
    addLog('info', `Starting automated multi-signal verification for all ${results.length} URLs...`, 'AUTO_VERIFIER');

    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      try {
        const res = await fetch('/api/indexing/check-index-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: item.url,
            options: {
              googleApiKey: config.googleApiKey,
              googleCustomSearchCx: config.googleCustomSearchCx,
              googleServiceAccountJson: config.googleServiceAccountJson
            }
          })
        });

        if (res.ok) {
          const checkData = await res.json();
          setResults((prev) =>
            prev.map((r) =>
              r.url === item.url
                ? {
                    ...r,
                    liveSerpStatus: checkData.status,
                    liveSerpDetails: checkData.details,
                    status: checkData.isIndexed ? 'indexed' : r.status,
                    message: checkData.isIndexed
                      ? `Confirmed Indexed on Google Search (${checkData.details})`
                      : `In Crawl Queue • ${checkData.details}`
                  }
                : r
            )
          );
          addLog(
            checkData.isIndexed ? 'success' : 'info',
            `Google Index Status: ${checkData.details}`,
            'AUTO_VERIFIER',
            item.url
          );
        }
      } catch (err: any) {
        // Continue to next URL
      }
    }

    setIsAutoVerifyingAll(false);
    addLog('success', 'Automated verification check complete for all URLs.', 'AUTO_VERIFIER');
  };

  // Re-index single URL with all methods
  const handleReindexUrl = async (url: string) => {
    await handleStartSubmission([url], 'all_methods');
  };

  const handleClearResults = () => {
    setResults([]);
    localStorage.removeItem('fast_indexing_results');
    localStorage.removeItem('speedy_indexing_results');
    addLog('info', 'Cleared all indexing audit records.', 'DATABASE');
  };

  const handleExportCsv = async () => {
    if (results.length === 0) return;
    try {
      const response = await fetch('/api/indexing/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results })
      });
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `indexing-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      addLog('success', 'Exported indexing report to CSV successfully.', 'EXPORT');
    } catch (err: any) {
      addLog('error', `Failed to export CSV: ${err.message}`, 'EXPORT');
    }
  };

  const handleImportFromSheets = (urls: string[]) => {
    setImportedUrls(urls);
    addLog('success', `Imported ${urls.length} URLs from Google Sheets into submission box.`, 'GOOGLE_SHEETS');
  };

  const handleExportCheckGoogleSheets = async (checkResults: IndexCheckResult[]) => {
    const token = await getAccessToken();
    if (!token) {
      setIsGoogleModalOpen(true);
      return;
    }
    try {
      addLog('info', `Syncing ${checkResults.length} SERP check records to Google Sheets...`, 'WORKSPACE');
      const res = await exportCheckResultsToGoogleSheets(
        `Google SERP Audit - ${new Date().toLocaleDateString()}`,
        checkResults
      );
      addLog('success', `Spreadsheet created: ${res.spreadsheetUrl}`, 'WORKSPACE');
      window.open(res.spreadsheetUrl, '_blank');
    } catch (err: any) {
      addLog('error', `Failed to export to Google Sheets: ${err.message}`, 'WORKSPACE');
    }
  };

  const handleResetQuota = () => {
    setStats({
      ...INITIAL_STATS,
      lastResetTime: new Date().toISOString()
    });
    addLog('info', 'Daily quota metrics reset to 25,000.', 'QUOTA');
  };

  // 1. Loading Authorization State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Verifying Master Admin Authorization...</p>
        </div>
      </div>
    );
  }

  // 2. Restricted Admin Login Screen
  if (!adminUser) {
    return (
      <AdminLogin
        onLoginSuccess={(user) => {
          setAdminUser(user);
          addLog('success', `Admin logged in successfully: ${user.username} (${user.email})`, 'AUTH');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Header */}
      <header className="border-b border-slate-800/90 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* App Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Google Fast URL Indexer
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  All 4 Methods Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Google WebSub • Googlebot Mobile Spiders • IndexNow • XML-RPC Ping Network
              </p>
            </div>
          </div>

          {/* Quick Utility Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="open-schema-bridge-btn"
              onClick={() => setIsSchemaModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-800/60 transition flex items-center gap-1.5 cursor-pointer"
              title="Job & Event Bridge Schema Tool"
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Job & Event Bridge Tool</span>
              <span className="sm:hidden">Bridge Tool</span>
            </button>

            <button
              id="open-google-modal-btn"
              onClick={() => setIsGoogleModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Connect Google Drive & Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">
                {currentUser ? `Google Sheets (${currentUser.email?.split('@')[0]})` : 'Google Sheets'}
              </span>
              <span className="md:hidden">Sheets</span>
            </button>

            <button
              id="open-config-btn"
              onClick={() => setIsConfigOpen(true)}
              className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Configure API Keys and Delay"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Master Admin Profile & Logout */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-white flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {adminUser.username}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                  {adminUser.email}
                </span>
              </div>

              <button
                id="change-password-btn"
                onClick={() => setIsChangePasswordOpen(true)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 rounded-lg transition cursor-pointer"
                title="Change Master Admin Password"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>

              <button
                id="logout-btn"
                onClick={async () => {
                  await logoutAdmin();
                  setAdminUser(null);
                  addLog('info', 'Admin logged out.', 'AUTH');
                }}
                className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/50 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                title="Sign Out of Admin Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Success Notification Toast */}
      {toastNotice && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-center text-xs text-emerald-300 font-medium flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastNotice}</span>
          <button
            onClick={() => setToastNotice(null)}
            className="ml-2 underline text-emerald-400 hover:text-emerald-200 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Single-Screen Application Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Simple Metric Counters */}
        <MetricsDashboard stats={stats} onResetQuota={handleResetQuota} />

        {/* 1. The Simple Submission Form */}
        <SubmissionForm
          onStartSubmission={handleStartSubmission}
          isRunning={isRunning}
          progress={progress}
          quotaRemaining={stats.remainingToday}
          externalUrls={importedUrls}
          onOpenGoogleSheets={() => setIsGoogleModalOpen(true)}
          onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
          onStopSubmission={handleStopSubmission}
        />

        {/* 2. The Simple Results Table (Right below form) */}
        <ResultsTable
          results={results}
          onExportCsv={handleExportCsv}
          onExportGoogleSheets={() => setIsGoogleModalOpen(true)}
          onClearResults={handleClearResults}
          onVerifySerp={handleVerifyUrlSerp}
          onReindexUrl={handleReindexUrl}
          onAutoVerifyAll={handleAutoVerifyAll}
          isAutoVerifyingAll={isAutoVerifyingAll}
        />

        {/* Collapsible Utility Drawers: Deep SERP Checker & Live Telemetry Logs */}
        <div className="space-y-4 pt-2">
          {/* Toggle for Realtime Telemetry Logs */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">Live Activity & Crawler Telemetry</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                {logs.length} logs
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeepChecker(!showDeepChecker)}
                className="px-2.5 py-1 text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <SearchCheck className="w-3.5 h-3.5" />
                <span>{showDeepChecker ? 'Hide Bulk SERP Checker' : 'Bulk Google SERP Checker'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLogs(!showLogs)}
                className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{showLogs ? 'Hide Logs' : 'View Realtime Logs'}</span>
              </button>
            </div>
          </div>

          {/* Real-time Telemetry Logs Display (Collapsible) */}
          {showLogs && (
            <div className="animate-in fade-in duration-200">
              <RealtimeLogs logs={logs} onClearLogs={() => setLogs([])} />
            </div>
          )}

          {/* Bulk Google SERP Audit Tool (Collapsible for deep audits) */}
          {showDeepChecker && (
            <div className="mt-4 p-5 bg-slate-900/90 border border-slate-800 rounded-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <SearchCheck className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Bulk Google SERP Index Audit & AI Technical Diagnostics
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeepChecker(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>

              <IndexCheckerTool
                onSendToPushIndexer={(urls) => {
                  handleStartSubmission(urls, 'all_methods');
                  setShowDeepChecker(false);
                }}
                onOpenGoogleSheets={() => setIsGoogleModalOpen(true)}
                onExportCheckGoogleSheets={handleExportCheckGoogleSheets}
                onAddLog={addLog}
                config={config}
                onOpenConfig={() => setIsConfigOpen(true)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          Google Fast URL Indexer &bull; Native Multi-Engine Architecture &bull; WebSub &bull; Googlebot Mobile-Renderer Spiders &bull; IndexNow &bull; XML-RPC
        </p>
      </footer>

      {/* Configuration Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSave={(newCfg) => {
          setConfig(newCfg);
          addLog('info', 'Engine configurations updated successfully.', 'CONFIG');
        }}
      />

      {/* Google Sheets and Drive Integration Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        results={results}
        onImportUrls={handleImportFromSheets}
        onAddLog={addLog}
      />

      {/* Job / Event Schema Generator & Bridge Tool Modal */}
      <SchemaBridgeModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        onAddUrlsToIndexQueue={(newUrls) => {
          setImportedUrls((prev) => {
            const combined = Array.from(new Set([...prev, ...newUrls]));
            return combined;
          });
          addLog('info', `Imported ${newUrls.length} verified Job/Event Bridge URL(s) to submission queue.`, 'SCHEMA_BRIDGE');
        }}
        onAddLog={addLog}
      />

      {/* Change Master Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccessNotice={(msg) => {
          setToastNotice(msg);
          addLog('success', msg, 'AUTH');
        }}
      />
    </div>
  );
}
