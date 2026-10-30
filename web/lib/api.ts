// The one data facade for components. Shared research data comes from the
// server routes (which read the n8n feed); per-browser state (profile, saved
// firms, tour) lives in localStorage, and every access is wrapped in try/catch.
import type {
  Decision,
  EvidencePage,
  FirmDetail,
  FirmSummary,
  ReviewInput,
  Stage,
  WorkspaceData,
} from "./types";

// ---- research data (server) -------------------------------------------------

class ApiError extends Error {}

async function getJSON<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { cache: "no-store" });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError((body && body.error) || `The server answered ${res.status}.`);
  return body as T;
}

let workspacePromise: Promise<WorkspaceData> | null = null;

/** All firms, runs and settings. Cached for this page session so moving between screens is instant. */
export function getWorkspace(opts: { reload?: boolean } = {}): Promise<WorkspaceData> {
  if (!workspacePromise || opts.reload) {
    workspacePromise = getJSON<WorkspaceData>("/api/feed").catch((e) => {
      workspacePromise = null;
      throw e;
    });
  }
  return workspacePromise.then(applyLocalReviews);
}

export async function getFirm(id: string): Promise<FirmDetail> {
  const firm = await getJSON<FirmDetail>(`/api/firms/${encodeURIComponent(id)}`);
  return applyLocalReview(firm);
}

export function searchEvidence(q: {
  q?: string;
  status?: string;
  field?: string;
  sample?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<EvidencePage> {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.status) p.set("status", q.status);
  if (q.field) p.set("field", q.field);
  if (q.sample) p.set("sample", "1");
  p.set("page", String(q.page ?? 1));
  p.set("pageSize", String(q.pageSize ?? 50));
  return getJSON<EvidencePage>(`/api/evidence?${p}`);
}

/** Saves a decision to the Review_Queue sheet through the server, then remembers it in this browser. */
export async function submitReview(input: ReviewInput): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError((body && body.error) || `The server answered ${res.status}.`);
  const reviews = read<Record<string, LocalReview>>(KEYS.reviews, {});
  reviews[input.companyId] = { ...input, reviewedAt: new Date().toISOString() };
  write(KEYS.reviews, reviews);
  saveProfile({ ...(getProfile() ?? emptyProfile()), name: input.reviewer });
}

// ---- per-browser state ------------------------------------------------------

const KEYS = {
  profile: "aai.profile",
  saved: "aai.saved",
  reviews: "aai.reviews",
  tour: "aai.tourSeen",
};

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private window, blocked site data) */
  }
}

export interface Profile {
  name: string;
  role: string;
  states: string[];
  focus: string;
  practices: string[];
  size: string;
}

export const emptyProfile = (): Profile => ({ name: "", role: "", states: [], focus: "", practices: [], size: "" });

export function getProfile(): Profile | null {
  const p = read<Profile | null>(KEYS.profile, null);
  return p && p.name ? { ...emptyProfile(), ...p } : null;
}

export function saveProfile(p: Profile) {
  write(KEYS.profile, p);
}

export function getSavedIds(): string[] {
  return read<string[]>(KEYS.saved, []);
}

export function setSaved(id: string, on: boolean): string[] {
  const ids = getSavedIds().filter((x) => x !== id);
  if (on) ids.unshift(id);
  write(KEYS.saved, ids);
  return ids;
}

export function tourSeen(): boolean {
  return read<boolean>(KEYS.tour, false);
}

export function markTourSeen() {
  write(KEYS.tour, true);
}

// A decision saved from this browser shows straight away, even before the
// sheet is read again. The sheet's own answer wins once it is newer.
interface LocalReview extends ReviewInput {
  reviewedAt: string;
}

function overlay<T extends FirmSummary>(firm: T, mine: LocalReview | undefined): T {
  if (!mine) return firm;
  const sheet = firm.review;
  if (sheet?.decision && (sheet.reviewedAt ?? "") >= mine.reviewedAt) return firm;
  return {
    ...firm,
    decision: mine.decision,
    stage: mine.decision as Stage,
    review: {
      whyQueued: sheet?.whyQueued ?? "",
      verify: sheet?.verify ?? [],
      queuedAt: sheet?.queuedAt ?? null,
      decision: mine.decision as Decision,
      notes: mine.notes,
      corrections: mine.corrections,
      reviewer: mine.reviewer,
      reviewedAt: mine.reviewedAt,
    },
  };
}

function applyLocalReviews(data: WorkspaceData): WorkspaceData {
  const mine = read<Record<string, LocalReview>>(KEYS.reviews, {});
  if (!Object.keys(mine).length) return data;
  return { ...data, firms: data.firms.map((f) => overlay(f, mine[f.id])) };
}

function applyLocalReview(firm: FirmDetail): FirmDetail {
  return overlay(firm, read<Record<string, LocalReview>>(KEYS.reviews, {})[firm.id]);
}

/** Finds a researched firm by name or web address. */
export function lookupFirm(firms: FirmSummary[], query: string): FirmSummary | null {
  const q = query
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
  if (q.length < 2) return null;
  return (
    firms.find((f) => f.domain?.toLowerCase() === q || f.id.toLowerCase() === q) ??
    firms.find((f) => f.name.toLowerCase() === q) ??
    firms.find((f) => f.name.toLowerCase().includes(q) || (f.domain ?? "").toLowerCase().includes(q)) ??
    null
  );
}
