import React, { useState } from 'react';
import { ConfigSettings } from '../types';
import {
  Settings,
  Key,
  Send,
  Cpu,
  Sliders,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Upload,
  Radio,
  Globe2,
  FileCode,
  X
} from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigSettings;
  onSave: (newConfig: ConfigSettings) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  const [localConfig, setLocalConfig] = useState<ConfigSettings>(config);
  const [isTestingGoogleSa, setIsTestingGoogleSa] = useState(false);
  const [googleSaStatus, setGoogleSaStatus] = useState<{ success?: boolean; message?: string; clientEmail?: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localConfig);
    onClose();
  };

  const handleTestGoogleServiceAccount = async () => {
    if (!localConfig.googleServiceAccountJson) {
      setGoogleSaStatus({ success: false, message: 'Please paste your Google Cloud Service Account JSON key first' });
      return;
    }

    setIsTestingGoogleSa(true);
    setGoogleSaStatus(null);
    try {
      const res = await fetch('/api/indexing/test-service-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceAccountJson: localConfig.googleServiceAccountJson })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGoogleSaStatus({
          success: true,
          clientEmail: data.clientEmail,
          message: data.message
        });
      } else {
        setGoogleSaStatus({ success: false, message: data.error || 'Failed to authenticate Service Account key' });
      }
    } catch (e: any) {
      setGoogleSaStatus({ success: false, message: e.message || 'Verification failed' });
    } finally {
      setIsTestingGoogleSa(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setLocalConfig({ ...localConfig, googleServiceAccountJson: content });
      setGoogleSaStatus(null);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Indexing Engine & API Configuration</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Native Multi-Engine Architecture */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Zap className="w-4 h-4" />
              <span>Native Search Engine Crawler Dispatch Channels</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Our self-contained indexing engine broadcasts URLs simultaneously to search bot gateways without relying on external commercial indexing subscriptions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-start gap-2 p-2 bg-slate-900 border border-slate-800 rounded cursor-pointer hover:border-emerald-500/50 transition">
                <input
                  type="checkbox"
                  checked={localConfig.enableGoogleWebSub !== false}
                  onChange={(e) => setLocalConfig({ ...localConfig, enableGoogleWebSub: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 mt-0.5"
                />
                <div>
                  <span className="text-slate-200 font-medium block flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-400" /> Google WebSub Push
                  </span>
                  <span className="text-slate-400 text-[10px]">Pings Google's official PubSubHubbub crawler discovery hub</span>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2 bg-slate-900 border border-slate-800 rounded cursor-pointer hover:border-emerald-500/50 transition">
                <input
                  type="checkbox"
                  checked={localConfig.enableXmlRpcPing !== false}
                  onChange={(e) => setLocalConfig({ ...localConfig, enableXmlRpcPing: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 mt-0.5"
                />
                <div>
                  <span className="text-slate-200 font-medium block flex items-center gap-1">
                    <Globe2 className="w-3 h-3 text-sky-400" /> XML-RPC Ping Network
                  </span>
                  <span className="text-slate-400 text-[10px]">Broadcasts weblog updates to Ping-o-matic & aggregation hubs</span>
                </div>
              </label>
            </div>
          </div>

          {/* Official Google Indexing API & Google Search Console */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                Google Service Account JSON (Google Indexing v3 & GSC Inspection)
              </label>
              <label className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium">
                <Upload className="w-3 h-3" /> Upload .json key
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              value={localConfig.googleServiceAccountJson || ''}
              onChange={(e) => {
                setLocalConfig({ ...localConfig, googleServiceAccountJson: e.target.value });
                setGoogleSaStatus(null);
              }}
              rows={3}
              placeholder='Paste Google Cloud Service Account JSON key (e.g. {"type": "service_account", "client_email": "..."})'
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-[11px] focus:border-emerald-500 focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-500">
                Grants official access to Google Indexing API (URL_UPDATED notifications) & Search Console URL Inspection.
              </p>
              <button
                type="button"
                onClick={handleTestGoogleServiceAccount}
                disabled={isTestingGoogleSa || !localConfig.googleServiceAccountJson}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] font-medium transition cursor-pointer shrink-0 disabled:opacity-40"
              >
                {isTestingGoogleSa ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {googleSaStatus && (
              <div className={`text-[11px] flex items-center gap-1.5 p-2 rounded ${googleSaStatus.success ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/40' : 'bg-rose-900/30 text-rose-300 border border-rose-800/40'}`}>
                {googleSaStatus.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                <span>{googleSaStatus.message}</span>
              </div>
            )}
          </div>

          {/* IndexNow Key */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                IndexNow API Key (Bing, Yandex, Seznam Protocol)
              </label>
              <a
                href="/api/indexing/download-key"
                download
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
              >
                <FileCode className="w-3 h-3" /> Download Key File
              </a>
            </div>
            <input
              type="text"
              value={localConfig.indexNowKey || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, indexNowKey: e.target.value })}
              placeholder="3a649887b8b74ffca0b741e98d9bfa21"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Signs bulk notifications pushed directly to Bing and Yandex indexing nodes. Host this key in your site's root as <code className="text-slate-400">/your-key.txt</code>.
            </p>
          </div>

          {/* Google Custom Search API (Optional) */}
          <div className="border-t border-slate-800 pt-3">
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Google Custom Search API (Optional Automated SERP Verification)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Google API Key</span>
                <input
                  type="password"
                  value={localConfig.googleApiKey || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, googleApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Search Engine ID (CX)</span>
                <input
                  type="text"
                  value={localConfig.googleCustomSearchCx || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, googleCustomSearchCx: e.target.value })}
                  placeholder="0123456789abcdef:ghijk"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Optional: For official Google Programmable Search JSON queries with 100 free checks per day.
            </p>
          </div>

          {/* Custom Telegram Alerts */}
          <div className="border-t border-slate-800 pt-3">
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              Custom Telegram Alerts (Optional Push Webhook)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Bot Token</span>
                <input
                  type="password"
                  value={localConfig.telegramBotToken || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, telegramBotToken: e.target.value })}
                  placeholder="123456:ABC-DEF1234ghIkl..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Chat / Channel ID</span>
                <input
                  type="text"
                  value={localConfig.telegramChatId || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, telegramChatId: e.target.value })}
                  placeholder="-100123456789"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Speed & Concurrency controls */}
          <div className="border-t border-slate-800 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                Concurrency (Threads)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={localConfig.concurrency}
                onChange={(e) => setLocalConfig({ ...localConfig, concurrency: parseInt(e.target.value) || 2 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                Inter-Request Delay (ms)
              </label>
              <input
                type="number"
                min="0"
                max="5000"
                step="100"
                value={localConfig.requestDelayMs}
                onChange={(e) => setLocalConfig({ ...localConfig, requestDelayMs: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 text-[11px]">Settings are preserved in local browser state</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
