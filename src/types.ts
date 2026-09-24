export type IndexingMethod = 'all_methods' | 'job_event_priority' | 'googlebot_direct' | 'google_indexing_api' | 'indexnow_bing' | 'multi_vector';

export interface TargetUrlTrace {
  url: string;
  liveSerpStatus?: SerpIndexStatus;
  details?: string;
  isIndexed?: boolean;
}

export interface JobEventMeta {
  isJobOrEventHost: boolean;
  detectedSchemaType?: 'JobPosting' | 'Event' | 'BroadcastEvent' | 'NewsArticle' | 'Other' | 'None';
  hasValidJsonLd?: boolean;
  schemaTitle?: string;
  schemaDate?: string;
  outboundTargetUrls?: string[];
  targetUrlsTraced?: TargetUrlTrace[];
  googleApiPriorityAccepted?: boolean;
}

export interface IndexingResult {
  url: string;
  timestamp: string;
  status: 'indexed' | 'crawled' | 'queued' | 'failed';
  methodUsed: IndexingMethod;
  httpStatus?: number;
  googlebotTriggered: boolean;
  crawlLatencyMs?: number;
  message?: string;
  details?: string;
  indexNowAccepted?: boolean;
  webSubAccepted?: boolean;
  xmlRpcAccepted?: boolean;
  googleApiAccepted?: boolean;
  jobEventMeta?: JobEventMeta;
  liveSerpStatus?: SerpIndexStatus;
  liveSerpDetails?: string;
  googleSearchUrl?: string;
  gscInspectUrl?: string;
  traces?: Array<{ stage: string; status: string; detail: string }>;
  checks?: {
    googleCacheOrBotVisit: boolean;
    serverReachable: boolean;
    robotsAllowed: boolean;
    indexNowAccepted: boolean;
  };
}

export interface BatchSubmission {
  id: string;
  name: string;
  createdAt: string;
  totalUrls: number;
  completedCount: number;
  successCount: number;
  failCount: number;
  status: 'idle' | 'running' | 'completed' | 'paused' | 'stopped';
  method: IndexingMethod;
  results: IndexingResult[];
  logs: LogEntry[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  url?: string;
  message: string;
  source: string;
}

export interface QuotaStats {
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  totalHistorical: number;
  successfulHistorical?: number;
  successRate: number;
  googlebotVisitsDetected: number;
  lastResetTime: string;
}

export interface ConfigSettings {
  googleApiKey?: string;
  googleCustomSearchCx?: string;
  googleServiceAccountJson?: string;
  indexNowKey?: string;
  enableXmlRpcPing?: boolean;
  enableGoogleWebSub?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  requestDelayMs: number;
  concurrency: number;
  autoResubmitFailed: boolean;
}

export type SerpIndexStatus = 'indexed' | 'not_indexed' | 'blocked_noindex' | 'needs_verification' | 'error';

export interface IndexCheckResult {
  url: string;
  timestamp: string;
  status: SerpIndexStatus;
  isIndexed: boolean;
  siteQueryFound: boolean;
  quoteQueryFound: boolean;
  googleCacheFound: boolean;
  metaRobotsAllowed: boolean;
  canonicalUrl?: string;
  httpStatus?: number;
  verificationSource?: 'gsc_api' | 'google_api' | 'googlebot_s2' | 'serp_direct' | 'manual_verified' | 'needs_manual';
  serpSnippet?: {
    title?: string;
    description?: string;
    displayLink?: string;
  };
  details: string;
  googleSearchUrl: string;
  googleQuoteSearchUrl: string;
  latencyMs: number;
}

export interface AIDiagnosisResult {
  url: string;
  audit: {
    httpStatus: number;
    latencyMs: number;
    robotsAllowed: boolean;
    canonicalUrl?: string;
    hasSchema: boolean;
    wordCount: number;
    internalLinksCount: number;
    title?: string;
    metaDescription?: string;
  };
  diagnosis: {
    summary: string;
    crawlabilityScore: number;
    indexingBlockers: string[];
    rootCause: string;
    remediationSteps: string[];
    indexingStrategy: string;
    recommendedMethod: 'google_indexing_api' | 'googlebot_direct' | 'indexnow_bing' | 'all_methods';
  };
}

