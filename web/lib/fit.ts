// Vocabulary shared by server and client: fit labels, review stages, decisions.
import type { Decision, Fit, FieldStatus, Stage } from "./types";

export const FITS: Fit[] = ["High Fit", "Moderate Fit", "Low Fit", "Insufficient Information"];

export const FIT_SHORT: Record<Fit, string> = {
  "High Fit": "High",
  "Moderate Fit": "Moderate",
  "Low Fit": "Low",
  "Insufficient Information": "Insufficient info",
};

/** Ranking order: firms that could fit first, screened-out firms last. */
const FIT_RANK: Record<Fit, number> = {
  "High Fit": 0,
  "Moderate Fit": 1,
  "Insufficient Information": 2,
  "Low Fit": 3,
};
export const fitRank = (fit: Fit) => FIT_RANK[fit] ?? 4;

export const DECISIONS: Decision[] = ["Investigate further", "Needs more evidence", "Not a fit", "Data corrected"];

export const STAGES: Stage[] = [
  "Needs review",
  "Needs more evidence",
  "Data corrected",
  "Investigate further",
  "Not a fit",
  "Screened out",
];

/** Stages a reviewer still acts on, shown as Pipeline columns. */
export const ACTIVE_STAGES: Stage[] = ["Needs review", "Needs more evidence", "Data corrected", "Investigate further"];

export const STAGE_HINT: Record<Stage, string> = {
  "Needs review": "High or moderate fit with no decision yet",
  "Needs more evidence": "Too little evidence to score, or a reviewer asked for more",
  "Data corrected": "A reviewer corrected a field; rerun to rescore",
  "Investigate further": "A reviewer wants a closer look",
  "Not a fit": "A reviewer ruled it out",
  "Screened out": "Low fit on the sponsor criteria",
};

export const STATUS_LABEL: Record<FieldStatus, string> = {
  verified: "Verified",
  estimated: "Estimated",
  missing: "Missing",
  conflicting: "Conflicting",
  sample: "Sample",
};

export function asFit(v: unknown): Fit | null {
  return FITS.includes(v as Fit) ? (v as Fit) : null;
}

export function asDecision(v: unknown): Decision | null {
  return DECISIONS.includes(v as Decision) ? (v as Decision) : null;
}

export function isStage(v: unknown): v is Stage {
  return STAGES.includes(v as Stage);
}

const FIELD_LABELS: Record<string, string> = {
  website_page: "Website page",
  website_text: "Website text",
  company_name: "Firm name",
  b2b_focus: "Client focus",
  hiring_expansion_signals: "Hiring or expansion",
  insurance_defense_fit: "Insurance-defense fit",
  defense_vs_plaintiff: "Defense vs plaintiff",
  civil_vs_criminal: "Civil vs criminal",
  target_classification: "AI classification",
  insurance_score: "Insurance keyword score",
  federal_awards: "Federal contract awards",
  entity_status: "Entity status",
  year_founded: "Year founded",
  attorney_count: "Attorney count",
  employee_count: "Employee count",
  office_count: "Office count",
  practice_areas_detail: "Practice areas (detail)",
  medical_malpractice_client_orientation: "Med-mal client side",
  criminal_defense_practice: "Criminal defense practice",
  potential_opportunity: "Potential opportunity",
  potential_risks: "Potential risks",
  experience_metrics: "Experience metrics",
  leadership_transition: "Leadership transition",
  confidence_score: "AI confidence",
};

/** "signal:leadership_change" → "Signal · Leadership change" */
export function fieldLabel(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  if (field.startsWith("signal:")) return "Signal · " + sentence(field.slice(7));
  return sentence(field);
}

export function signalKind(field: string): string {
  return sentence(field.replace(/^signal:/, ""));
}

function sentence(s: string): string {
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
