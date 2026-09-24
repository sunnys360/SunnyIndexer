import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Search,
  Briefcase,
  Calendar,
  Radio,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface SchemaBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseUrlInIndexer: (url: string) => void;
}

export const SchemaBridgeModal: React.FC<SchemaBridgeModalProps> = ({
  isOpen,
  onClose,
  onUseUrlInIndexer
}) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'validator'>('generator');

  // Generator State
  const [schemaType, setSchemaType] = useState<'JobPosting' | 'Event' | 'BroadcastEvent'>('JobPosting');
  const [title, setTitle] = useState('Senior Operations Analyst');
  const [description, setDescription] = useState('Immediate vacancy for leading business development projects. View official portfolio, specifications, and project assets at our documentation link.');
  const [targetUrl, setTargetUrl] = useState('https://example.com/target-page-to-index');
  const [companyOrHost, setCompanyOrHost] = useState('Apex Global Network');
  const [location, setLocation] = useState('Remote / New York, NY');
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date(Date.now() + 86400000 * 20);
    return d.toISOString().split('T')[0];
  });
  const [generatedResult, setGeneratedResult] = useState<{
    jsonLd: string;
    embedHtml: string;
    instructions: string[];
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Validator State
  const [testUrl, setTestUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/indexing/generate-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaType,
          title,
          description,
          targetUrl,
          companyOrHost,
          location,
          eventDate
        })
      });
      const data = await res.json();
      setGeneratedResult(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl.trim()) return;
    setIsValidating(true);
    setValidationError(null);
    setValidationResult(null);

    try {
      const res = await fetch('/api/indexing/validate-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Validation failed');
      }
      setValidationResult(data);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to inspect page schema');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Job & Event Priority Bridge Strategy
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full">
                  100% Google API Compliant
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Google Indexing API prioritizes <strong>JobPosting</strong> &amp; <strong>Event</strong> schema pages to crawl and index target links rapidly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition border-b-2 ${
              activeTab === 'generator'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1. Generate Schema &amp; Bridge HTML
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('validator')}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition border-b-2 ${
              activeTab === 'validator'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            2. Live Pre-Validate Published Page
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'generator' ? (
            <div className="space-y-5">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1.5">
                <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> How the Job/Event Indexing Method Works:
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Google officially prioritizes crawling for pages containing structured <code className="text-emerald-300">JobPosting</code> or <code className="text-emerald-300">Event</code> JSON-LD markup.
                  By publishing a job or event page that contains your target link, Googlebot visits the bridge page immediately, follows your target URL, and pulls it into the search index without waiting weeks.
                </p>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    onClick={() => setSchemaType('JobPosting')}
                    className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition ${
                      schemaType === 'JobPosting'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-emerald-400">
                      <Briefcase className="w-4 h-4" /> JobPosting
                    </span>
                    <span className="text-[11px] text-slate-400">Fastest Googlebot pickup</span>
                  </label>

                  <label
                    onClick={() => setSchemaType('Event')}
                    className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition ${
                      schemaType === 'Event'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-blue-400">
                      <Calendar className="w-4 h-4" /> Event
                    </span>
                    <span className="text-[11px] text-slate-400">Conferences, launches</span>
                  </label>

                  <label
                    onClick={() => setSchemaType('BroadcastEvent')}
                    className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition ${
                      schemaType === 'BroadcastEvent'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-purple-400">
                      <Radio className="w-4 h-4" /> BroadcastEvent
                    </span>
                    <span className="text-[11px] text-slate-400">Live streams & webinars</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target URL To Index (Your Actual Page)
                    </label>
                    <input
                      type="url"
                      required
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://yourwebsite.com/page-you-want-indexed"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {schemaType === 'JobPosting' ? 'Job Title' : 'Event Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Lead Technical Architect"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {schemaType === 'JobPosting' ? 'Hiring Company' : 'Organizer / Host'}
                      </label>
                      <input
                        type="text"
                        required
                        value={companyOrHost}
                        onChange={(e) => setCompanyOrHost(e.target.value)}
                        placeholder="e.g. Acme Media Corp"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Location / Mode
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Remote / Chicago, IL"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {schemaType === 'JobPosting' ? 'Posting Expiry' : 'Event Date'}
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Brief Description
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  {isGenerating ? (
                    <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Code2 className="w-4 h-4" />
                      Generate Google-Compliant Schema &amp; HTML Bridge
                    </>
                  )}
                </button>
              </form>

              {generatedResult && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Ready to Embed (Copy &amp; Paste into your Job/Event Page)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedResult.embedHtml)}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? 'Copied HTML!' : 'Copy Embed HTML'}
                    </button>
                  </div>

                  <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56">
                    {generatedResult.embedHtml}
                  </pre>

                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">Publishing Steps:</p>
                    {generatedResult.instructions.map((step, i) => (
                      <p key={i} className="text-slate-400">{step}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Validator Tab */
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1.5">
                <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Search className="w-4 h-4" /> Live Host Page Pre-Validation:
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Enter your published job or event page URL. We will inspect its HTML and JSON-LD markup to verify that Google Indexing API will recognize it and extract all outbound target URLs for priority indexing.
                </p>
              </div>

              <form onSubmit={handleValidate} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://your-site.com/jobs/senior-dev-posting"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isValidating}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {isValidating ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        Analyze
                      </>
                    )}
                  </button>
                </div>
              </form>

              {validationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {validationResult && (
                <div className="space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      {validationResult.schemaValidForGoogleIndexingApi ? (
                        <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <div className="font-semibold text-xs text-white">
                          {validationResult.isJobOrEventHost
                            ? `Valid ${validationResult.detectedSchemaType} Schema Detected`
                            : 'Standard Web Page (No Job/Event Schema)'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {validationResult.message}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        validationResult.schemaValidForGoogleIndexingApi
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {validationResult.schemaValidForGoogleIndexingApi
                        ? 'Google Indexing API Priority: HIGH'
                        : 'Standard Dispatch'}
                    </span>
                  </div>

                  {validationResult.schemaTitle && (
                    <div className="text-xs text-slate-300">
                      <strong>Schema Title:</strong> {validationResult.schemaTitle}
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Outbound Target URLs Discovered ({validationResult.outboundTargetUrls?.length || 0}):</span>
                    </div>

                    {validationResult.outboundTargetUrls && validationResult.outboundTargetUrls.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {validationResult.outboundTargetUrls.map((u: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 flex items-center justify-between truncate"
                          >
                            <span className="truncate mr-2">{u}</span>
                            <a
                              href={u}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-white shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        No outbound links detected. Ensure your job/event page has an anchor link or JSON-LD reference pointing to the target URL you want indexed.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onUseUrlInIndexer(testUrl);
                        onClose();
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Use This Host URL in Indexer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
