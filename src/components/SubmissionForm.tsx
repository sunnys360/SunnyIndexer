import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Link2,
  Play,
  Sparkles,
  AlertCircle,
  FileText,
  Bot,
  Globe,
  Zap,
  Radio,
  FileSpreadsheet,
  Square,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { IndexingMethod } from '../types';

interface SubmissionFormProps {
  onStartSubmission: (urls: string[], method: IndexingMethod) => void;
  isRunning: boolean;
  progress?: { current: number; total: number; currentUrl: string } | null;
  quotaRemaining: number;
  externalUrls?: string[];
  onOpenGoogleSheets?: () => void;
  onOpenSchemaModal?: () => void;
  onStopSubmission?: () => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  onStartSubmission,
  isRunning,
  progress,
  quotaRemaining,
  externalUrls,
  onOpenGoogleSheets,
  onOpenSchemaModal,
  onStopSubmission
}) => {
  const [rawText, setRawText] = useState('');
  const [method, setMethod] = useState<IndexingMethod>('all_methods');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalUrls && externalUrls.length > 0) {
      setRawText((prev) => {
        const existing = prev.trim();
        const incoming = externalUrls.join('\n');
        return existing ? `${existing}\n${incoming}` : incoming;
      });
    }
  }, [externalUrls]);

  // Parse valid URLs from text
  const parseUrls = (text: string): string[] => {
    const lines = text.split(/[\r\n, ]+/);
    const valid: string[] = [];
    for (const item of lines) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      try {
        let candidate = trimmed;
        if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
          candidate = `https://${candidate}`;
        }
        const parsed = new URL(candidate);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          valid.push(candidate);
        }
      } catch {
        // ignore invalid lines
      }
    }
    return Array.from(new Set(valid));
  };

  const detectedUrls = parseUrls(rawText);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText((prev) => (prev ? `${prev}\n${content}` : content));
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read uploaded file.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (detectedUrls.length === 0) {
      setErrorMsg('Please enter at least one valid URL (e.g., https://example.com/page-1).');
      return;
    }

    if (detectedUrls.length > quotaRemaining) {
      setErrorMsg(`Submission count (${detectedUrls.length}) exceeds your remaining daily quota (${quotaRemaining}).`);
      return;
    }

    onStartSubmission(detectedUrls, method);
  };

  const insertSampleUrls = () => {
    const samples = [
      'https://example.com/careers/digital-strategist-job',
      'https://example.com/events/live-indexing-webinar-2026',
      'https://example.org/articles/googlebot-crawling-guide',
      'https://example.net/services/rapid-cloud-indexing'
    ].join('\n');
    setRawText(samples);
    setErrorMsg(null);
  };

  const handleClear = () => {
    setRawText('');
    setErrorMsg(null);
  };

  const percentComplete = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" />
            Submit URLs to Index in Google Search
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            URLs are automatically processed through <strong>all native methods</strong> to trigger Googlebot spiders and get indexed fast.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="insert-samples-btn"
            type="button"
            onClick={insertSampleUrls}
            disabled={isRunning}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 font-mono cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Try Sample URLs
          </button>
          {rawText && (
            <button
              id="clear-text-btn"
              type="button"
              onClick={handleClear}
              disabled={isRunning}
              className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 4 Active Methods Indicator Banner */}
      <div className="mt-3.5 p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300 flex items-center gap-1 text-emerald-400 font-mono text-[10px] uppercase tracking-wider">
          <Zap className="w-3 h-3 fill-current" /> Active Engine Pipeline:
        </span>
        <span className="inline-flex items-center gap-1 text-amber-300">
          <Bot className="w-3 h-3" /> 1. Googlebot Mobile Renderer
        </span>
        <span className="inline-flex items-center gap-1 text-emerald-300">
          <Radio className="w-3 h-3" /> 2. Google WebSub Hub
        </span>
        <span className="inline-flex items-center gap-1 text-blue-300">
          <Globe className="w-3 h-3" /> 3. IndexNow Broadcast
        </span>
        <span className="inline-flex items-center gap-1 text-purple-300">
          <Zap className="w-3 h-3" /> 4. XML-RPC Ping Network
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5">
        {/* URL Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="urls-input-field" className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Paste Target URLs (One per line)
            </label>
            <span className={`text-xs font-mono font-medium ${detectedUrls.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              {detectedUrls.length} {detectedUrls.length === 1 ? 'URL' : 'URLs'} ready
            </span>
          </div>

          <textarea
            id="urls-input-field"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={isRunning}
            placeholder={`https://yourwebsite.com/new-article\nhttps://yourwebsite.com/product-page\nhttps://yourwebsite.com/category-listing`}
            rows={5}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition resize-y"
          />
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div id="submission-error-box" className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Real-time Progress Bar (shown when processing) */}
        {isRunning && progress && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                Dispatching URLs via All Methods...
              </span>
              <span className="font-mono text-emerald-400 font-semibold">
                {progress.current} / {progress.total} ({percentComplete}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            {progress.currentUrl && (
              <p className="text-[11px] text-slate-400 font-mono truncate">
                Current: <span className="text-slate-200">{progress.currentUrl}</span>
              </p>
            )}
          </div>
        )}

        {/* Advanced Method Selector (Collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition cursor-pointer"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Advanced: Method Selection ({method === 'all_methods' ? 'All Methods Enabled' : method})</span>
          </button>

          {showAdvanced && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setMethod('job_event_priority')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer relative overflow-hidden ${
                  method === 'job_event_priority'
                    ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-emerald-400 flex items-center gap-1 mb-0.5">
                  <Briefcase className="w-3 h-3" /> Job / Event Bridge
                </div>
                <p className="text-[10px] text-slate-400">Google API v3 Priority for JobPosting & Event schema</p>
              </button>

              <button
                type="button"
                onClick={() => setMethod('all_methods')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  method === 'all_methods'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-emerald-400 flex items-center gap-1 mb-0.5">
                  <Zap className="w-3 h-3" /> All Methods (Best)
                </div>
                <p className="text-[10px] text-slate-400">Googlebot + WebSub + IndexNow + XML-RPC</p>
              </button>

              <button
                type="button"
                onClick={() => setMethod('googlebot_direct')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  method === 'googlebot_direct'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-amber-400 flex items-center gap-1 mb-0.5">
                  <Bot className="w-3 h-3" /> Googlebot Only
                </div>
                <p className="text-[10px] text-slate-400">Forces Google Mobile-Renderer spider</p>
              </button>

              <button
                type="button"
                onClick={() => setMethod('indexnow_bing')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  method === 'indexnow_bing'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-blue-400 flex items-center gap-1 mb-0.5">
                  <Globe className="w-3 h-3" /> IndexNow Only
                </div>
                <p className="text-[10px] text-slate-400">Bing, Yandex, & Seznam crawler push</p>
              </button>

              <button
                type="button"
                onClick={() => setMethod('google_indexing_api')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  method === 'google_indexing_api'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-purple-400 flex items-center gap-1 mb-0.5">
                  <Play className="w-3 h-3" /> Google API Only
                </div>
                <p className="text-[10px] text-slate-400">OAuth / Service Account Indexing v3</p>
              </button>
            </div>
          )}
        </div>

        {/* Auto-Verification Banner */}
        <div className="flex items-center justify-between text-[11px] text-emerald-400/90 font-mono bg-emerald-950/20 border border-emerald-800/40 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Automatic Google Index Verification active — checks all indexing signals automatically upon URL submission.</span>
          </div>
          <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 font-semibold">
            Zero Manual Steps
          </span>
        </div>

        {/* Action Controls & Big Submit Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Left file input tools */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              id="upload-file-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRunning}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              Upload .txt / .csv
            </button>

            {onOpenGoogleSheets && (
              <button
                id="import-sheets-btn"
                type="button"
                onClick={onOpenGoogleSheets}
                disabled={isRunning}
                className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 rounded-lg text-xs font-medium border border-emerald-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Import URLs from Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Google Sheets
              </button>
            )}

            {onOpenSchemaModal && (
              <button
                id="open-schema-tool-btn"
                type="button"
                onClick={onOpenSchemaModal}
                disabled={isRunning}
                className="px-3 py-2 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Open Job/Event Schema Generator & Validator"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                Job / Event Bridge Tool
              </button>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {isRunning && onStopSubmission && (
              <button
                id="stop-indexing-btn"
                type="button"
                onClick={onStopSubmission}
                className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Stop the current indexing run"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop
              </button>
            )}

            <button
              id="submit-indexing-btn"
              type="submit"
              disabled={isRunning || detectedUrls.length === 0}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                isRunning || detectedUrls.length === 0
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20 active:scale-[0.98]'
              }`}
            >
              {isRunning ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Processing All Methods...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  {method === 'job_event_priority'
                    ? `Index ${detectedUrls.length > 0 ? `${detectedUrls.length} URLs` : ''} via Job/Event Bridge (Google API v3 Priority)`
                    : `Index ${detectedUrls.length > 0 ? `${detectedUrls.length} URLs` : 'URLs'} in Google Search (All Methods)`}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
