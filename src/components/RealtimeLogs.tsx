import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';
import { Terminal, Trash2, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface RealtimeLogsProps {
  logs: LogEntry[];
  onClearLogs?: () => void;
}

export const RealtimeLogs: React.FC<RealtimeLogsProps> = ({ logs, onClearLogs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div id="realtime-logs-container" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
            Real-Time Engine Telemetry & Error Log
          </h3>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
        </div>

        {onClearLogs && (
          <button
            id="clear-logs-btn"
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer font-mono"
          >
            <Trash2 className="w-3 h-3" />
            Clear Console
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="p-3 bg-slate-950 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-1.5 selection:bg-slate-800"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 text-[11px] italic py-8 text-center">
            System ready. Crawler diagnostic logs and API response traces will stream here in real time.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-1.5 rounded flex items-start gap-2 text-[11px] leading-relaxed transition ${
                log.level === 'error'
                  ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                  : log.level === 'warning'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  : log.level === 'success'
                  ? 'bg-emerald-500/5 text-emerald-300'
                  : 'bg-slate-900/60 text-slate-300'
              }`}
            >
              {getLogIcon(log.level)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-0.5">
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold">
                    {log.source}
                  </span>
                  {log.url && (
                    <span className="truncate max-w-[200px] text-slate-400 font-mono" title={log.url}>
                      {log.url}
                    </span>
                  )}
                </div>
                <div className="break-words font-sans">{log.message}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
