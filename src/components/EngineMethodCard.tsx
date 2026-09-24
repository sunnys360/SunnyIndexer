import React from 'react';
import { Bot, Zap, Globe, Radio, Layers } from 'lucide-react';

export const EngineMethodCard: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-emerald-400" />
        <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
          Proprietary Multi-Engine Indexing Pipeline: WebSub, Googlebot, IndexNow & XML-RPC
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
            <Bot className="w-3.5 h-3.5" />
            1. Googlebot Direct Renderer
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Directly invokes Google Web Rendering Service clusters. Google datacenters dispatch genuine Mobile Googlebot spiders to execute JS and populate Google crawl cache.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
            <Radio className="w-3.5 h-3.5" />
            2. Google WebSub & Spiders
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Notifies Google PubSubHubbub hub (<code className="text-emerald-400 font-mono text-[10px]">pubsubhubbub.appspot.com</code>) and Googlebot S2 asset spiders for instant discovery queue enrollment.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
            <Globe className="w-3.5 h-3.5" />
            3. IndexNow Protocol
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Multi-engine broadcast across IndexNow central, Bing, Yandex, and Seznam nodes. Global search engine discovery signals trigger spider crawls in seconds.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-purple-400 font-semibold mb-1">
            <Zap className="w-3.5 h-3.5" />
            4. Google Indexing v3 & Pings
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Sends Google Indexing API v3 <code className="text-emerald-400 font-mono text-[10px]">URL_UPDATED</code> priority webhooks and dispatches XML-RPC pings to weblog crawler aggregators.
          </p>
        </div>
      </div>
    </div>
  );
};
