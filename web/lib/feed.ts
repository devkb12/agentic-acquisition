// Server-only: reads the n8n research feed, caches it in memory and joins the
// six Google Sheet tabs into firm records. Never import this from a client component.
import { after } from "next/server";
import { asDecision, asFit, fieldLabel, fitRank, isStage, signalKind } from "./fit";
import type {
  Confidence,
  Config,
  Evidence,
  EvidencePage,
  Factor,
  FieldStatus,
  FirmDetail,
  FirmSummary,
  Fit,
  ReviewInfo,
  ReviewInput,
  RunRow,
  RunSummary,
  Stage,
  WorkspaceData,
} from "./types";

type Row = Record<string, unknown>;

interface RawFeed {
  generated_at?: string;
  config?: Config;
  leads?: Row[];
  analysis?: Row[];
  sources?: Row[];
  review?: Row[];
  runs?: Row[];
  dashboard?: Row[];
}

export class FeedError extends Error {
  constructor(
    public code: "not-configured" | "unauthorized" | "upstream",
    message: string,
  ) {
    super(message);
  }
}

const DEFAULT_BASE = "https://agenticacquisitions.app.n8n.cloud/webhook";
/** Serve cached data without refetching for this long; after that, serve it once more and refresh in the background. */
const FRESH_MS = 5 * 60_000;

function settings() {
  const key = process.env.TRUEGRIT_ACCESS_KEY;
  if (!key) {
    throw new FeedError(
      "not-configured",
      "The server has no TRUEGRIT_ACCESS_KEY set, so it cannot read the research feed.",
    );
  }
  return { base: (process.env.N8N_BASE_URL || DEFAULT_BASE).replace(/\/$/, ""), key };
}

// ---- cache ------------------------------------------------------------------

let cache: { raw: RawFeed; at: number } | null = null;
let inflight: Promise<RawFeed> | null = null;

async function fetchFeed(): Promise<RawFeed> {
  const { base, key } = settings();
  let res: Response;
  try {
    res = await fetch(`${base}/truegrit-data?key=${encodeURIComponent(key)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new FeedError("upstream", "The n8n data service did not answer. Check that the dashboard workflow is published.");
  }
  if (res.status === 401) throw new FeedError("unauthorized", "The n8n data service rejected the access key.");
  if (!res.ok) throw new FeedError("upstream", `The n8n data service answered ${res.status}.`);
  return (await res.json()) as RawFeed;
}

function refresh(): Promise<RawFeed> {
  inflight ??= fetchFeed()
    .then((raw) => {
      cache = { raw, at: Date.now() };
      derived = null;
      return raw;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

async function getRaw(): Promise<RawFeed> {
  if (!cache) return refresh();
  if (Date.now() - cache.at > FRESH_MS) {
    after(() => refresh().catch(() => undefined));
  }
  return cache.raw;
}

// ---- helpers ----------------------------------------------------------------

const EMPTY = new Set(["", "unknown", "n/a", "none", "null", "undefined"]);

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return EMPTY.has(s.toLowerCase()) ? null : s;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function list(v: unknown): string[] {
  return String(v ?? "")
    .split(/;\s*/)
    .map((x) => x.trim())
    .filter((x) => x && !EMPTY.has(x.toLowerCase()));
}

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

function url(v: unknown): string | null {
  const s = str(v);
  return s && /^https?:\/\//i.test(s) ? s : null;
}

function evidenceStatus(v: unknown): FieldStatus {
  switch (String(v)) {
    case "verified":
      return "verified";
    case "estimated":
      return "estimated";
    case "sample_demo":
      return "sample";
    default:
      return "missing";
  }
}

const later = (a: string | null, b: string | null) => (a ?? "") > (b ?? "");

// ---- join ---------------------------------------------------------------------

interface Joined {
  id: string;
  lead: Row;
  ai: Row;
  review: Row | null;
  sources: Row[];
}

interface Derived {
  data: WorkspaceData;
  joined: Map<string, Joined>;
  evidence: Evidence[];
}

let derived: Derived | null = null;

function derive(raw: RawFeed): Derived {
  if (derived) return derived;
  const joined = new Map<string, Joined>();
  const rec = (id: string) => {
    let j = joined.get(id);
    if (!j) joined.set(id, (j = { id, lead: {}, ai: {}, review: null, sources: [] }));
    return j;
  };
  for (const r of raw.leads ?? []) if (str(r.company_id)) rec(String(r.company_id)).lead = r;
  for (const r of raw.analysis ?? []) if (str(r.company_id)) rec(String(r.company_id)).ai = r;
  for (const r of raw.review ?? []) {
    const j = joined.get(String(r.company_id));
    // The queue can hold several rows per firm; keep the newest.
    if (j && (!j.review || later(str(r.reviewed_at) ?? str(r.queued_at), str(j.review.reviewed_at) ?? str(j.review.queued_at))))
      j.review = r;
  }
  for (const r of raw.sources ?? []) joined.get(String(r.company_id))?.sources.push(r);

  const evidence: Evidence[] = [];
  const firms: FirmSummary[] = [];
  for (const j of joined.values()) {
    const s = summarize(j);
    firms.push(s);
    j.sources.forEach((row, i) => evidence.push(toEvidence(row, j.id, s.name, i)));
  }
  firms.sort((a, b) => fitRank(a.fit) - fitRank(b.fit) || (b.score ?? -1) - (a.score ?? -1));

  derived = {
    joined,
    evidence,
    data: {
      generatedAt: str(raw.generated_at),
      config: raw.config ?? {},
      firms,
      runs: (raw.runs ?? []).map(toRun).sort((a, b) => (later(a.finishedAt, b.finishedAt) ? -1 : 1)),
      summary: latestSummary(raw.dashboard ?? []),
      evidenceCount: evidence.length,
    },
  };
  return derived;
}

function statusOf(j: Joined, field: string): FieldStatus | null {
  const hits = j.sources.filter((s) => s.field === field);
  if (!hits.length) return null;
  const statuses = hits.map((h) => String(h.status));
  const values = new Set(hits.map((h) => str(h.value)?.toLowerCase()).filter(Boolean));
  if (values.size > 1 && statuses.includes("verified")) return "conflicting";
  return statuses.includes("verified") ? "verified" : evidenceStatus(statuses[0]);
}

function stageOf(fit: Fit, leadStatus: string | null, review: ReviewInfo | null): Stage {
  if (review?.decision) return review.decision;
  if (review && (fit === "High Fit" || fit === "Moderate Fit")) return "Needs review";
  if (isStage(leadStatus)) return leadStatus;
  if (fit === "Low Fit") return "Screened out";
  return fit === "Insufficient Information" ? "Needs more evidence" : "Needs review";
}

function summarize(j: Joined): FirmSummary {
  const L = j.lead;
  const A = j.ai;
  const fit = asFit(str(L.final_fit)) ?? asFit(str(A.final_fit)) ?? "Insufficient Information";
  const R = j.review;
  const review: ReviewInfo | null = R
    ? {
        decision: asDecision(R.reviewer_decision),
        notes: str(R.reviewer_notes) ?? "",
        corrections: str(R.reviewer_corrections) ?? "",
        reviewer: str(R.reviewed_by) ?? "",
        reviewedAt: str(R.reviewed_at),
        whyQueued: str(R.why_queued) ?? "",
        verify: list(R.verification_needed).filter((x) => !/^Unscored/.test(x)),
        queuedAt: str(R.queued_at),
      }
    : null;
  const queuedFit = R ? asFit(str(R.final_fit)) : null;
  const attorneys = num(L.attorney_count);
  const revenue = str(L.revenue_estimate) ?? str(L.revenue);

  const signals = j.sources
    .filter((s) => String(s.field).startsWith("signal:"))
    .sort((a, b) => (later(str(a.extracted_at), str(b.extracted_at)) ? -1 : 1));
  const sig = signals.find((s) => s.field !== "signal:other") ?? signals[0];

  return {
    id: j.id,
    name: str(L.company_name) ?? str(A.company_name) ?? j.id,
    state: str(L.state) ?? str(A.state) ?? "",
    city: str(L.city) ?? "",
    website: url(L.website),
    domain: str(L.domain),
    fit,
    score: num(A.normalized_score ?? L.normalized_score),
    coverage: num(A.evidence_coverage_pct),
    insuranceScore: num(L.insurance_score ?? A.insurance_score),
    insuranceBand: str(L.insurance_band) ?? str(A.insurance_band),
    attorneys,
    attorneysStatus: attorneys !== null ? (statusOf(j, "attorney_count") ?? "estimated") : "missing",
    revenue,
    revenueStatus: revenue ? (String(L.revenue_status) === "verified" ? "verified" : "estimated") : "missing",
    practiceAreas: list(L.practice_areas ?? A.practice_areas),
    entityStatus: str(L.entity_status),
    entityVerified: String(L.entity_status_label) === "Verified",
    years: num(L.years_in_operation),
    stage: stageOf(fit, str(L.review_status), review),
    decision: review?.decision ?? null,
    review,
    queuedFit: queuedFit && queuedFit !== fit ? queuedFit : null,
    sample: (str(L.data_mode) ?? str(A.data_mode)) !== "LIVE",
    lastResearched: str(L.last_collected_at) ?? str(A.analyzed_at),
    signal: sig ? { kind: signalKind(String(sig.field)), text: clip(String(sig.value ?? ""), 140), date: str(sig.extracted_at) } : null,
    hasSourcedEvidence: j.sources.some((s) => s.status === "verified" && url(s.source_url)),
    missing: list(A.missing_information).filter((m) => !/^Unscored/.test(m)),
  };
}

function toEvidence(r: Row, firmId: string, firmName: string, i: number): Evidence {
  const field = String(r.field ?? "");
  return {
    id: str(r.log_key) ?? `${firmId}#${i}`,
    firmId,
    firmName,
    field,
    label: fieldLabel(field),
    value: clip(String(r.value ?? ""), 600),
    status: evidenceStatus(r.status),
    source: str(r.source) ?? "",
    url: url(r.source_url),
    quote: clip(str(r.evidence_quote) ?? "", 400),
    date: str(r.extracted_at),
    sample: String(r.data_mode) !== "LIVE",
  };
}

const RUN_FIELDS: [keyof RunRow, string][] = [
  ["discovered", "candidates_discovered"],
  ["rejected", "rejected_invalid"],
  ["duplicates", "duplicates_removed"],
  ["droppedOverLimit", "dropped_over_limit"],
  ["processed", "companies_processed"],
  ["high", "high_fit"],
  ["moderate", "moderate_fit"],
  ["low", "low_fit"],
  ["insufficient", "insufficient_information"],
  ["aiFailures", "ai_classification_failures"],
  ["enrichmentFailures", "enrichment_failures"],
  ["serpapi", "serpapi_results"],
  ["apifyMaps", "apify_maps_results"],
  ["sunbiz", "sunbiz_records"],
  ["usaspending", "usaspending_records"],
  ["registryMatches", "registry_matches"],
];

function toRun(r: Row): RunRow {
  const run = {
    id: String(r.run_id ?? r.row_number ?? ""),
    finishedAt: str(r.finished_at),
    mode: str(r.run_mode) ?? "",
    dataMode: str(r.data_mode) ?? "",
    status: str(r.status) ?? "",
  } as RunRow;
  for (const [k, col] of RUN_FIELDS) (run as unknown as Record<string, number | null>)[k] = num(r[col]);
  return run;
}

function latestSummary(rows: Row[]): RunSummary | null {
  // Older rows used an earlier column layout (col_1…col_13); only rows with an executive_summary count.
  const usable = rows.filter((r) => str(r.executive_summary));
  const live = usable.filter((r) => r.data_mode === "LIVE");
  const pick = (live.length ? live : usable).sort((a, b) =>
    later(str(a.generated_at), str(b.generated_at)) ? -1 : 1,
  )[0];
  if (!pick) return null;
  return {
    text: String(pick.executive_summary),
    runId: str(pick.run_id),
    generatedAt: str(pick.generated_at),
    dataMode: str(pick.data_mode) ?? "",
  };
}

// ---- detail -------------------------------------------------------------------

function factorConfidence(j: Joined, key: string): Confidence {
  switch (key) {
    case "geography":
    case "completeness":
      return "High";
    case "size":
      return statusOf(j, "attorney_count") === "verified" ? "High" : "Medium";
    case "history":
      return statusOf(j, "year_founded") === "verified" ? "High" : "Medium";
    default:
      return "Medium";
  }
}

function parseFactors(j: Joined): Factor[] {
  let rows: Row[] = [];
  try {
    rows = JSON.parse(String(j.ai.score_breakdown_json || "[]"));
  } catch {
    rows = [];
  }
  return rows.map((c) => {
    const scored = Boolean(c.scored);
    const key = String(c.key ?? "");
    return {
      key,
      label: String(c.label ?? key),
      max: num(c.max) ?? 0,
      points: scored ? num(c.points) : null,
      scored,
      note: String(c.note ?? ""),
      confidence: scored ? factorConfidence(j, key) : null,
    };
  });
}

function detail(j: Joined, s: FirmSummary, evidence: Evidence[]): FirmDetail {
  const L = j.lead;
  const A = j.ai;
  const order: Record<FieldStatus, number> = { verified: 0, conflicting: 1, estimated: 2, sample: 3, missing: 4 };
  const yearFounded = str(L.year_founded);
  const employees = str(L.employee_count);
  return {
    ...s,
    address: str(L.address),
    phone: str(L.phone),
    description: str(L.description),
    googleCategory: str(L.google_category),
    googleRating: num(L.google_rating),
    pagesScraped: num(L.pages_scraped),
    summary: str(A.ai_reason),
    dataConfidence: str(A.data_confidence),
    opportunity: str(A.potential_opportunity),
    recommendedAction: str(A.recommended_next_action),
    factors: parseFactors(j),
    risks: list(A.risk_factors),
    terms: list(L.insurance_terms_matched || A.insurance_terms_matched).map((t) => {
      const m = t.match(/^(.*)\(([+\-−]?\d+)\)\s*$/);
      return m ? { term: m[1].trim(), weight: Number(m[2].replace("−", "-")) } : { term: t, weight: 0 };
    }),
    carriers: str(L.carrier_relationships),
    leadership: str(L.leadership),
    offices: str(L.offices),
    officeCount: str(L.office_count),
    employees,
    employeesStatus: employees ? (statusOf(j, "employee_count") ?? "estimated") : "missing",
    yearFounded,
    yearFoundedStatus: yearFounded ? (statusOf(j, "year_founded") ?? "estimated") : "missing",
    inSizeBand: str(L.in_size_band),
    defenseVsPlaintiff: str(L.defense_vs_plaintiff) ?? str(A.defense_vs_plaintiff),
    civilVsCriminal: str(L.civil_vs_criminal) ?? str(A.civil_vs_criminal),
    insuranceDefenseFitAI: str(A.insurance_defense_fit),
    clientFocusAI: str(A.b2b_focus),
    entityName: str(L.entity_name),
    entityFileDate: str(L.entity_file_date),
    entitySourceUrl: url(L.entity_source_url),
    federalAwardsCount: num(L.federal_awards_count),
    federalAwardsTotal: num(L.federal_awards_total),
    evidence: evidence
      .filter((e) => e.firmId === j.id && e.field !== "website_text")
      .sort((a, b) => order[a.status] - order[b.status]),
    runId: str(A.run_id) ?? str(L.last_run_id),
    analyzedAt: str(A.analyzed_at),
    mapsUrl: list(L.source_urls).find((u) => /google\.com\/maps/.test(u)) ?? null,
  };
}

// ---- public API -------------------------------------------------------------------

export async function getWorkspaceData(): Promise<WorkspaceData> {
  return derive(await getRaw()).data;
}

export async function getFirmDetail(id: string): Promise<FirmDetail | null> {
  const d = derive(await getRaw());
  const j = d.joined.get(id);
  const s = d.data.firms.find((f) => f.id === id);
  return j && s ? detail(j, s, d.evidence) : null;
}

export async function searchEvidence(opts: {
  q: string;
  status: string;
  field: string;
  includeSample: boolean;
  page: number;
  pageSize: number;
}): Promise<EvidencePage> {
  const d = derive(await getRaw());
  const q = opts.q.trim().toLowerCase();
  const rows = d.evidence.filter(
    (e) =>
      e.field !== "website_text" &&
      (opts.includeSample || !e.sample) &&
      (!opts.status || e.status === opts.status) &&
      (!opts.field || e.field === opts.field) &&
      (!q || `${e.firmName} ${e.label} ${e.value} ${e.source} ${e.quote}`.toLowerCase().includes(q)),
  );
  rows.sort((a, b) => (later(a.date, b.date) ? -1 : later(b.date, a.date) ? 1 : a.firmName.localeCompare(b.firmName)));
  const start = (opts.page - 1) * opts.pageSize;
  return {
    rows: rows.slice(start, start + opts.pageSize),
    total: rows.length,
    page: opts.page,
    pageSize: opts.pageSize,
    fields: [...new Set(d.evidence.map((e) => e.field))].filter((f) => f !== "website_text").sort(),
  };
}

/** Sends a decision to the n8n review endpoint, then records it in the cached feed so it shows at once. */
export async function saveReview(input: ReviewInput): Promise<void> {
  const { base, key } = settings();
  let res: Response;
  try {
    res = await fetch(`${base}/truegrit-review`, {
      method: "POST",
      // n8n's Validate Review node parses a JSON string body.
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        key,
        company_id: input.companyId,
        company_name: input.companyName,
        decision: input.decision,
        corrections: input.corrections,
        notes: input.notes,
        reviewer: input.reviewer,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new FeedError("upstream", "The n8n review service did not answer.");
  }
  const body = (await res.json().catch(() => ({ ok: res.ok }))) as { ok?: boolean; error?: string };
  if (!res.ok || !body.ok) throw new FeedError("upstream", body.error || `The n8n review service answered ${res.status}.`);

  if (cache) {
    const review = (cache.raw.review ??= []);
    const reviewedAt = new Date().toISOString();
    const patch = {
      reviewer_decision: input.decision,
      reviewer_notes: input.notes,
      reviewer_corrections: input.corrections,
      reviewed_by: input.reviewer,
      reviewed_at: reviewedAt,
    };
    const existing = review.filter((r) => r.company_id === input.companyId);
    if (existing.length) existing.forEach((r) => Object.assign(r, patch));
    else review.push({ company_id: input.companyId, company_name: input.companyName, ...patch });
    derived = null;
  }
}
