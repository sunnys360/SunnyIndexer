import React, { useState } from 'react';
import { IndexingResult } from '../types';
import {
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Bot,
  Globe,
  Radio,
  Zap,
  FileSpreadsheet,
  Copy,
  Check,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Briefcase,
  Calendar,
  ArrowUpRight
} from 'lucide-react';

interface ResultsTableProps {
  results: IndexingResult[];
  onExportCsv: () => void;
  onExportGoogleSheets?: () => void;
  onClearResults?: () => void;
  onVerifySerp?: (url: string) => Promise<void>;
  onReindexUrl?: (url: string) => Promise<void>;
  onAutoVerifyAll?: () => Promise<void>;
  isAutoVerifyingAll?: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  onExportCsv,
  onExportGoogleSheets,
  onClearResults,
  onVerifySerp,
  onReindexUrl,
  onAutoVerifyAll,
  isAutoVerifyingAll = false
}) => {
  const [filter, setFilter] = useState<'all' | 'job_event' | 'crawled' | 'indexed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [verifyingUrls, setVerifyingUrls] = useState<Record<string, boolean>>({});
  const [reindexingUrls, setReindexingUrls] = useState<Record<string, boolean>>({});

  const filteredResults = results.filter((item) => {
    if (filter === 'job_event' && !item.jobEventMeta?.isJobOrEventHost && item.methodUsed !== 'job_event_priority') return false;
    if (filter === 'crawled' && (item.status !== 'crawled' && item.status !== 'queued' && item.status !== 'indexed')) return false;
    if (filter === 'indexed' && item.status !== 'indexed') return false;
    if (filter === 'failed' && item.status !== 'failed') return false;
    if (searchQuery && !item.url.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  const handleVerify = async (url: string) => {
    if (!onVerifySerp) return;
    setVerifyingUrls((prev) => ({ ...prev, [url]: true }));
    try {
      await onVerifySerp(url);
    } finally {
      setVerifyingUrls((prev) => ({ ...prev, [url]: false }));
    }
  };

  const handleReindex = async (url: string) => {
    if (!onReindexUrl) return;
    setReindexingUrls((prev) => ({ ...prev, [url]: true }));
    try {
      await onReindexUrl(url);
    } finally {
      setReindexingUrls((prev) => ({ ...prev, [url]: false }));
    }
  };

  const crawledCount = results.filter((r) => r.status === 'crawled' || r.googlebotTriggered).length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  return (
    <div id="results-table-container" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm mb-6">
      {/* Top Header Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <SearchCheck className="w-4 h-4 text-emerald-400" />
            Indexing Results & Google Verification
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-emerald-400 border border-slate-700 font-semibold">
            {results.length} URLs
          </span>
          {crawledCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3 h-3" /> {crawledCount} Dispatched
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-results-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by domain or URL..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 w-44 md:w-52"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition cursor-pointer ${
                filter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setFilter('job_event')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition cursor-pointer flex items-center gap-1 ${
                filter === 'job_event' ? 'bg-indigo-500/20 text-indigo-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3 h-3 text-indigo-400" />
              Job / Event Bridges ({results.filter(r => r.jobEventMeta?.isJobOrEventHost || r.methodUsed === 'job_event_priority').length})
            </button>
            <button
              onClick={() => setFilter('crawled')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition cursor-pointer ${
                filter === 'crawled' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dispatched ({crawledCount})
            </button>
            {failedCount > 0 && (
              <button
                onClick={() => setFilter('failed')}
                className={`px-2.5 py-1 text-[11px] rounded-md transition cursor-pointer ${
                  filter === 'failed' ? 'bg-red-500/20 text-red-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Failed ({failedCount})
              </button>
            )}
          </div>

          {/* Export & clear buttons */}
          <div className="flex items-center gap-1.5">
            {onAutoVerifyAll && (
              <button
                id="auto-verify-all-btn"
                onClick={onAutoVerifyAll}
                disabled={isAutoVerifyingAll || results.length === 0}
                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 disabled:opacity-40 rounded-lg text-xs font-semibold border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer"
                title="Automatically check Google index status for all URLs using multi-signal APIs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAutoVerifyingAll ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                <span>{isAutoVerifyingAll ? 'Verifying All...' : 'Auto-Verify All'}</span>
              </button>
            )}

            <button
              id="export-csv-btn"
              onClick={onExportCsv}
              disabled={results.length === 0}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>

            {onExportGoogleSheets && (
              <button
                id="export-sheets-btn"
                onClick={onExportGoogleSheets}
                disabled={results.length === 0}
                className="px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 disabled:opacity-40 rounded-lg text-xs font-medium border border-emerald-800/60 transition flex items-center gap-1.5 cursor-pointer"
                title="Export report to Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Sheets
              </button>
            )}

            {onClearResults && results.length > 0 && (
              <button
                id="clear-results-btn"
                onClick={onClearResults}
                className="px-2 py-1.5 text-slate-500 hover:text-slate-300 text-xs transition cursor-pointer ml-1"
                title="Clear all results"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto max-h-[520px]">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider sticky top-0 z-10 border-b border-slate-800 backdrop-blur">
            <tr>
              <th className="py-2.5 px-4">Target URL</th>
              <th className="py-2.5 px-3">Crawler Dispatch</th>
              <th className="py-2.5 px-3">Methods Fired</th>
              <th className="py-2.5 px-3">Googlebot Spider</th>
              <th className="py-2.5 px-3">Latency</th>
              <th className="py-2.5 px-4 text-right">Google Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                  {results.length === 0
                    ? 'No URLs submitted yet. Paste your URLs above and click "Index URLs in Google Search" to start.'
                    : 'No URLs match the current search filter.'}
                </td>
              </tr>
            ) : (
              filteredResults.map((item, idx) => {
                const isVerifying = Boolean(verifyingUrls[item.url]);
                const isReindexing = Boolean(reindexingUrls[item.url]);
                const isCopied = copiedUrl === item.url;
                const googleSearchUrl = item.googleSearchUrl || `https://www.google.com/search?q=site:${encodeURIComponent(item.url)}`;

                return (
                  <tr key={`${item.url}-${idx}`} className="hover:bg-slate-800/40 transition group">
                    {/* URL */}
                    <td className="py-3 px-4 max-w-xs md:max-w-md">
                      {/* Job / Event Host Bridge Indicator */}
                      {item.jobEventMeta?.isJobOrEventHost && (
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            {item.jobEventMeta.detectedSchemaType === 'Event' || item.jobEventMeta.detectedSchemaType === 'BroadcastEvent' ? (
                              <Calendar className="w-3 h-3 text-blue-400" />
                            ) : (
                              <Briefcase className="w-3 h-3 text-emerald-400" />
                            )}
                            {item.jobEventMeta.detectedSchemaType || 'Job/Event'} Host Bridge
                          </span>
                          {item.jobEventMeta.schemaTitle && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              {item.jobEventMeta.schemaTitle}
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Google API High Priority
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-200 hover:text-emerald-400 font-medium transition truncate max-w-[280px] sm:max-w-[420px]"
                          title={item.url}
                        >
                          {item.url}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item.url)}
                          className="text-slate-600 hover:text-slate-300 transition p-0.5 rounded cursor-pointer"
                          title="Copy URL to clipboard"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-slate-400 transition"
                          title="Open URL in new tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Discovered Target URLs inside the Host Page */}
                      {item.jobEventMeta?.outboundTargetUrls && item.jobEventMeta.outboundTargetUrls.length > 0 && (
                        <div className="mt-2 pl-2 border-l-2 border-indigo-500/50 space-y-1 bg-slate-950/40 p-1.5 rounded-r">
                          <div className="text-[10px] font-semibold text-slate-400 flex items-center justify-between">
                            <span className="text-indigo-300">Discovered Target URL to Index:</span>
                            <span className="text-slate-500 font-mono">Dispatched to Googlebot ✅</span>
                          </div>
                          {item.jobEventMeta.outboundTargetUrls.map((targetUrl, tIdx) => (
                            <div key={tIdx} className="flex items-center justify-between gap-2 text-[11px] font-mono">
                              <div className="flex items-center gap-1 truncate text-emerald-400">
                                <ArrowUpRight className="w-3 h-3 shrink-0" />
                                <a
                                  href={targetUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate hover:underline"
                                  title={targetUrl}
                                >
                                  {targetUrl}
                                </a>
                              </div>
                              {onVerifySerp && (
                                <button
                                  type="button"
                                  onClick={() => handleVerify(targetUrl)}
                                  disabled={Boolean(verifyingUrls[targetUrl])}
                                  className="shrink-0 text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition cursor-pointer"
                                  title="Check if this target page is live indexed on Google"
                                >
                                  {verifyingUrls[targetUrl] ? 'Checking...' : 'Check Status'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {item.message && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.message}</p>
                      )}
                      {item.liveSerpDetails && (
                        <p className="text-[11px] text-sky-400 mt-0.5 truncate font-mono">
                          SERP Audit: {item.liveSerpDetails}
                        </p>
                      )}
                    </td>

                    {/* Dispatch Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.status === 'indexed' || item.liveSerpStatus === 'indexed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          Indexed on Google
                        </span>
                      ) : item.status === 'crawled' || item.googlebotTriggered ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Dispatched & Queued
                        </span>
                      ) : item.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          In Queue
                        </span>
                      )}
                    </td>

                    {/* Methods Fired */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-wrap items-center gap-1">
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          title="Google WebSub publication hub accepted"
                        >
                          <Radio className="w-2.5 h-2.5" /> WebSub
                        </span>
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          title="Googlebot mobile renderer spider invoked"
                        >
                          <Bot className="w-2.5 h-2.5" /> Googlebot
                        </span>
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20"
                          title="IndexNow central broadcast"
                        >
                          <Globe className="w-2.5 h-2.5" /> IndexNow
                        </span>
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          title="XML-RPC weblog ping network"
                        >
                          <Zap className="w-2.5 h-2.5" /> Ping
                        </span>
                      </div>
                    </td>

                    {/* Googlebot Trigger */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      {item.googlebotTriggered ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Triggered ✅
                        </span>
                      ) : (
                        <span className="text-slate-500">Scheduled ⏳</span>
                      )}
                    </td>

                    {/* Latency */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                      {item.crawlLatencyMs ? `${item.crawlLatencyMs} ms` : '—'}
                    </td>

                    {/* Verification Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Live Automated SERP Check */}
                        {onVerifySerp && (
                          <button
                            type="button"
                            onClick={() => handleVerify(item.url)}
                            disabled={isVerifying}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition cursor-pointer disabled:opacity-50"
                            title="Automatically verify Google Index status without manual browser check"
                          >
                            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                            <span>{isVerifying ? 'Checking...' : 'Auto-Verify'}</span>
                          </button>
                        )}

                        {/* Direct Google Search Check */}
                        <a
                          href={googleSearchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-sky-300 text-xs border border-slate-700 transition"
                          title="View live site: query on Google Search"
                        >
                          <span className="hidden sm:inline">Google</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {/* Re-Index Single URL */}
                        {onReindexUrl && (
                          <button
                            type="button"
                            onClick={() => handleReindex(item.url)}
                            disabled={isReindexing}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700/60 transition cursor-pointer disabled:opacity-50"
                            title="Re-run all indexing methods for this URL"
                          >
                            <Zap className={`w-3 h-3 ${isReindexing ? 'animate-bounce text-amber-400' : ''}`} />
                            <span className="hidden sm:inline">Re-Index</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
