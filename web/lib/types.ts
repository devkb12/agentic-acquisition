// Shapes shared by the server routes and the client. The server joins the six
// Google Sheet tabs from the n8n feed into these records (see lib/feed.ts).

export type Fit = "High Fit" | "Moderate Fit" | "Low Fit" | "Insufficient Information";

/** Decisions the n8n review endpoint accepts (n8n/code-nodes/dashboard/validate-review.js). */
export type Decision = "Investigate further" | "Needs more evidence" | "Not a fit" | "Data corrected";

/** Where a firm sits in the review workflow. Decisions override the automatic stages. */
export type Stage =
  | "Needs review"
  | "Needs more evidence"
  | "Data corrected"
  | "Investigate further"
  | "Not a fit"
  | "Screened out";

export type FieldStatus = "verified" | "estimated" | "missing" | "conflicting" | "sample";

export type Confidence = "High" | "Medium" | "Low";

export interface ReviewInfo {
  decision: Decision | null;
  notes: string;
  corrections: string;
  reviewer: string;
  reviewedAt: string | null;
  whyQueued: string;
  verify: string[];
  queuedAt: string | null;
}

export interface Signal {
  kind: string;
  text: string;
  date: string | null;
}

export interface FirmSummary {
  id: string;
  name: string;
  state: string;
  city: string;
  website: string | null;
  domain: string | null;
  fit: Fit;
  /** Normalized 0–100 fit score on the evidence available. */
  score: number | null;
  /** Share of the 100-point model that had evidence to score. */
  coverage: number | null;
  insuranceScore: number | null;
  insuranceBand: string | null;
  attorneys: number | null;
  attorneysStatus: FieldStatus;
  revenue: string | null;
  revenueStatus: FieldStatus;
  practiceAreas: string[];
  entityStatus: string | null;
  entityVerified: boolean;
  years: number | null;
  stage: Stage;
  decision: Decision | null;
  review: ReviewInfo | null;
  /** Fit recorded when the firm was queued, when it differs from today's fit. */
  queuedFit: Fit | null;
  sample: boolean;
  lastResearched: string | null;
  signal: Signal | null;
  hasSourcedEvidence: boolean;
  missing: string[];
}

export interface Factor {
  key: string;
  label: string;
  max: number;
  points: number | null;
  scored: boolean;
  note: string;
  confidence: Confidence | null;
}

export interface Evidence {
  id: string;
  firmId: string;
  firmName: string;
  field: string;
  label: string;
  value: string;
  status: FieldStatus;
  source: string;
  url: string | null;
  quote: string;
  date: string | null;
  sample: boolean;
}

export interface KeywordHit {
  term: string;
  weight: number;
}

export interface FirmDetail extends FirmSummary {
  address: string | null;
  phone: string | null;
  description: string | null;
  googleCategory: string | null;
  googleRating: number | null;
  pagesScraped: number | null;
  summary: string | null;
  dataConfidence: string | null;
  opportunity: string | null;
  recommendedAction: string | null;
  factors: Factor[];
  risks: string[];
  terms: KeywordHit[];
  carriers: string | null;
  leadership: string | null;
  offices: string | null;
  officeCount: string | null;
  employees: string | null;
  employeesStatus: FieldStatus;
  yearFounded: string | null;
  yearFoundedStatus: FieldStatus;
  inSizeBand: string | null;
  defenseVsPlaintiff: string | null;
  civilVsCriminal: string | null;
  insuranceDefenseFitAI: string | null;
  clientFocusAI: string | null;
  entityName: string | null;
  entityFileDate: string | null;
  entitySourceUrl: string | null;
  federalAwardsCount: number | null;
  federalAwardsTotal: number | null;
  evidence: Evidence[];
  runId: string | null;
  analyzedAt: string | null;
  mapsUrl: string | null;
}

export interface RunRow {
  id: string;
  finishedAt: string | null;
  mode: string;
  dataMode: string;
  status: string;
  discovered: number | null;
  rejected: number | null;
  duplicates: number | null;
  droppedOverLimit: number | null;
  processed: number | null;
  high: number | null;
  moderate: number | null;
  low: number | null;
  insufficient: number | null;
  aiFailures: number | null;
  enrichmentFailures: number | null;
  serpapi: number | null;
  apifyMaps: number | null;
  sunbiz: number | null;
  usaspending: number | null;
  registryMatches: number | null;
}

export interface RunSummary {
  text: string;
  runId: string | null;
  generatedAt: string | null;
  dataMode: string;
}

export interface Config {
  run_mode?: string;
  demo_mode?: boolean;
  limit_per_state?: number;
  demo_limit_per_state?: number;
  states?: string[];
  search_queries?: string[];
  discovery_locations?: Record<string, string[]>;
  weights?: Record<string, number>;
  thresholds?: { high?: number; moderate?: number; min_coverage?: number };
  scorecard_bands?: { strong?: number; moderate?: number };
  revenue_per_attorney?: { low?: number; high?: number };
  size_band_attorneys?: { min?: number; max?: number };
  scrape_max_pages?: number;
}

export interface WorkspaceData {
  generatedAt: string | null;
  config: Config;
  firms: FirmSummary[];
  runs: RunRow[];
  summary: RunSummary | null;
  evidenceCount: number;
}

export interface EvidencePage {
  rows: Evidence[];
  total: number;
  page: number;
  pageSize: number;
  fields: string[];
}

export interface ReviewInput {
  companyId: string;
  companyName: string;
  decision: Decision;
  corrections: string;
  notes: string;
  reviewer: string;
}
