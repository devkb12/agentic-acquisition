// Profile vocabulary: the reviewer's focus. It changes order and highlights in
// this browser only; scores always come from the n8n workflow.
import type { FirmSummary } from "./types";
import type { Profile } from "./api";

export const ROLES = ["TrueGrit Capital", "VIMANA", "Capstone team", "Other reviewer"];

export const STATE_OPTIONS = [
  { code: "FL", label: "Florida" },
  { code: "GA", label: "Georgia" },
];

export const CATEGORIES: { label: string; re: RegExp }[] = [
  { label: "Insurance defense", re: /insurance[\s-]*defen[cs]e|insurer|carrier|panel counsel|claims? (defen|litigation)/i },
  { label: "Coverage counsel", re: /coverage|bad[\s-]faith|duty to (defend|indemnify)|reservation of rights/i },
  { label: "Workers' comp defense", re: /workers['’]?\s*comp/i },
  { label: "General liability", re: /general liability|casualty/i },
  { label: "Professional liability", re: /professional liability|errors (and|&) omissions|e&o|d&o|directors (and|&) officers/i },
  { label: "Medical malpractice defense", re: /medical malpractice|med[\s-]?mal|health ?care (liability|litigation)/i },
  { label: "Trucking & auto", re: /trucking|transportation|commercial auto|motor carrier/i },
  { label: "Construction defect", re: /construction/i },
  { label: "Premises liability", re: /premises/i },
  { label: "Product liability", re: /products? liability|toxic tort/i },
  { label: "Commercial litigation", re: /commercial litigation|business litigation|business torts?/i },
  { label: "Employment defense", re: /employment/i },
];

export const SIZE_BANDS = [
  { label: "10–50 attorneys", min: 10, max: 50 },
  { label: "50–150 attorneys", min: 50, max: 150 },
  { label: "150–400 attorneys", min: 150, max: 400 },
  { label: "Any size", min: 0, max: Infinity },
];

export function categoriesIn(text: string): string[] {
  return CATEGORIES.filter((c) => c.re.test(text)).map((c) => c.label);
}

/** Practice categories of the firm that the reviewer said they care about. */
export function focusMatches(firm: FirmSummary, profile: Profile | null): string[] {
  if (!profile?.practices.length) return [];
  const text = firm.practiceAreas.join("; ");
  return CATEGORIES.filter((c) => profile.practices.includes(c.label) && c.re.test(text)).map((c) => c.label);
}

export function inSizeBand(firm: FirmSummary, profile: Profile | null): boolean | null {
  const band = SIZE_BANDS.find((b) => b.label === profile?.size);
  if (!band || band.max === Infinity || firm.attorneys === null) return null;
  return firm.attorneys >= band.min && firm.attorneys <= band.max;
}

export function stateLabels(codes: string[]): string[] {
  return STATE_OPTIONS.filter((s) => codes.includes(s.code)).map((s) => s.label);
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}
