import React from 'react';
import { QuotaStats } from '../types';
import { Gauge, CheckCircle2, Bot, Clock, ArrowUpRight, Zap, RefreshCw } from 'lucide-react';

interface StatsProps {
  stats: QuotaStats;
  onResetQuota?: () => void;
}

export const MetricsDashboard: React.FC<StatsProps> = ({ stats, onResetQuota }) => {
  const percentageUsed = Math.min(100, Math.round((stats.usedToday / stats.dailyLimit) * 100));

  return (
    <section id="metrics-dashboard" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Daily Quota Card */}
      <div id="stat-daily-quota" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
          <span className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-400" />
            Daily Push Quota
          </span>
          <span className="text-slate-500 font-mono">{percentageUsed}% used</span>
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-2xl font-bold tracking-tight text-white font-mono">
            {stats.usedToday.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-mono">/ {stats.dailyLimit.toLocaleString()} URLs</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              percentageUsed > 85 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentageUsed}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex justify-between items-center">
          <span>Remaining: {(stats.dailyLimit - stats.usedToday).toLocaleString()}</span>
          {onResetQuota && (
            <button
              id="reset-quota-btn"
              onClick={onResetQuota}
              className="text-slate-400 hover:text-slate-200 transition flex items-center gap-1 cursor-pointer"
              title="Reset today's quota counter"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Success Rate */}
      <div id="stat-success-rate" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            Indexing Dispatch Rate
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-2xl font-bold tracking-tight text-white font-mono">
            {stats.successRate.toFixed(1)}%
          </span>
          <span className="text-xs text-emerald-400 flex items-center font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" /> High
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Trigger acknowledgment from Googlebot & IndexNow multi-engine network
        </p>
      </div>

      {/* Googlebot Crawler Hits */}
      <div id="stat-googlebot-hits" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
          <span className="flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-amber-400" />
            Googlebot Dispatches
          </span>
          <span className="text-xs text-slate-500 font-mono">Instant Mobile</span>
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-2xl font-bold tracking-tight text-white font-mono">
            {stats.googlebotVisitsDetected.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-mono">Visits</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Verified Google datacenter fetch requests sent directly to targets
        </p>
      </div>

      {/* Total Processed */}
      <div id="stat-total-processed" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-purple-400" />
            Historical Submissions
          </span>
          <Clock className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-2xl font-bold tracking-tight text-white font-mono">
            {stats.totalHistorical.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-mono">All Time</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Bulk URLs processed through API pipelines and crawler clusters
        </p>
      </div>
    </section>
  );
};
