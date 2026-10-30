"use client";

// Firm file (/firms/[id]): score ring, why it matches, evidence, keyword chart,
// public records, recommended next action, human review and context.
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  CircleAlert,
  CircleCheck,
  Compass,
  FileText,
  Flag,
  Gavel,
  Globe,
  Landmark,
  ListChecks,
  MapPin,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Building2,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { getFirm, getProfile, getSavedIds, setSaved as storeSaved, submitReview } from "@/lib/api";
import { DECISIONS, STATUS_LABEL, asDecision } from "@/lib/fit";
import { NO_DATA, compact, date, money, phone, place, range, scorePhrase } from "@/lib/format";
import type { Decision, Evidence, FieldStatus, FirmDetail } from "@/lib/types";
import { ToastProvider, useToast } from "../toast";
import { TOUR_STEPS, Tour } from "../tour";
import { DataBadge, FitPill, PathEyebrow, ScoreBar, StatusTag, stageClass } from "../ui";

export function FirmPage({ id }: { id: string }) {
  return (
    <ToastProvider>
      <FirmPageInner id={id} />
    </ToastProvider>
  );
}

function FirmPageInner({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [firm, setFirm] = useState<FirmDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setError(null);
    getFirm(id)
      .then(setFirm)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSaved(getSavedIds().includes(id));
    const params = new URLSearchParams(window.location.search);
    setDecision(asDecision(params.get("decision")));
    const t = params.get("tour");
    if (t !== null) setTourIndex(Math.max(0, Math.min(Number(t) || 0, TOUR_STEPS.length - 1)));
    /* eslint-enable react-hooks/set-state-in-effect */
    load();
  }, [id, load]);

  // Arriving from a table's status menu: open on the review panel.
  useEffect(() => {
    if (firm && window.location.hash === "#review") reviewRef.current?.scrollIntoView({ block: "start" });
  }, [firm]);

  const onTourIndex = (i: number) => {
    const step = TOUR_STEPS[i]!;
    if (step.page === "workspace") router.push(`/app?tour=${i}${step.view && step.view !== "overview" ? `#${step.view}` : ""}`);
    else setTourIndex(i);
  };

  const toggleSave = () => {
    if (!firm) return;
    const on = !saved;
    storeSaved(firm.id, on);
    setSaved(on);
    toast(on ? `Saved ${firm.name}.` : `Removed ${firm.name} from saved.`);
  };

  const chooseDecision = (d: Decision) => {
    setDecision(d);
    reviewRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100vh" }}>
      <header className="detail-bar">
        <Link href="/app" className="brand-tile" aria-label="Back to the workspace">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={20} height={20} />
        </Link>
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/app">AAI</Link>
          <span className="sep">/</span>
          <Link href="/app">Workspace</Link>
          <span className="sep">/</span>
          <b>{firm?.name ?? "Firm file"}</b>
        </nav>
        <div className="right" style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <button type="button" className="tour-launch" onClick={() => onTourIndex(TOUR_STEPS.findIndex((s) => s.page === "detail"))} disabled={!firm}>
            <Compass size={14} aria-hidden /> <span className="lbl">Take the tour</span>
          </button>
          <DataBadge label="TrueGrit sheet" />
        </div>
      </header>

      <main id="main" className="detail">
        <Link href="/app" className="text-link small muted">
          <ArrowLeft size={13} /> Back to all firms
        </Link>

        {!firm && !error && (
          <div className="phase" role="status" style={{ minHeight: "60vh" }}>
            <div className="phase-box">
              <span className="spinner" />
              <h2>Opening the firm file…</h2>
              <p>Joining this firm&apos;s lead, analysis, review and evidence records.</p>
            </div>
          </div>
        )}
        {error && !firm && (
          <div className="phase" style={{ minHeight: "60vh" }}>
            <div className="phase-box">
              <div className="alert" role="alert">
                <CircleAlert size={16} />
                <span>{error}</span>
              </div>
              <button type="button" className="button button-small" onClick={load}>
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          </div>
        )}

        {firm && (
          <>
            <div className="print-only" style={{ fontSize: 10, marginBottom: 8 }}>
              Agentic Acquisition Intelligence · research brief printed {date(new Date().toISOString())} · research only, not a
              recommendation to acquire
            </div>
            <div className="detail-head">
              <div>
                <PathEyebrow parts={["Firm file", firm.sample ? "Sample data" : firm.state || "Research"]} />
                <h1>{firm.name}</h1>
                <div className="facts">
                  <FitPill fit={firm.fit} />
                  <span>{place(firm.city, firm.state)}</span>
                  {firm.attorneys !== null && (
                    <>
                      <span className="sep">·</span>
                      <span>{firm.attorneys} attorneys</span>
                    </>
                  )}
                  {firm.years !== null && (
                    <>
                      <span className="sep">·</span>
                      <span>{firm.years} years</span>
                    </>
                  )}
                  {firm.website && (
                    <>
                      <span className="sep">·</span>
                      <a href={firm.website} target="_blank" rel="noopener noreferrer" className="text-link small">
                        {firm.domain ?? "Website"} <ArrowUpRight size={12} />
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className="score-ring-wrap" data-tour="detail-score">
                <div
                  className={`score-ring${firm.fit === "Insufficient Information" ? " muted" : ""}`}
                  style={{ ["--p" as string]: firm.score ?? 0 }}
                  role="img"
                  aria-label={`Fit score ${firm.score ?? "not available"} out of 100`}
                >
                  <span>{firm.score ?? "—"}</span>
                </div>
                <div>
                  <div className="label">AAI fit score</div>
                  <div className="phrase">{scorePhrase(firm.fit)}</div>
                  <div className="cov">
                    {firm.coverage !== null ? `${firm.coverage}% of the model had evidence` : "Coverage unknown"}
                  </div>
                </div>
              </div>
            </div>

            <div className="action-row">
              <button type="button" className="button button-small button-outline" aria-pressed={saved} onClick={toggleSave}>
                {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} {saved ? "Saved" : "Save"}
              </button>
              <label className="select-with-icon">
                <ListChecks size={14} aria-hidden />
                <span className="sr-only">Review stage</span>
                <select
                  className={`stage-select ${stageClass(firm.stage)}`}
                  value={decision ?? firm.stage}
                  onChange={(e) => {
                    const d = asDecision(e.target.value);
                    if (d) chooseDecision(d);
                  }}
                >
                  <option value={firm.stage}>{firm.stage}</option>
                  <optgroup label="Record a decision…">
                    {DECISIONS.filter((d) => d !== firm.stage).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <button type="button" className="button button-small button-outline" onClick={() => window.print()}>
                <Printer size={14} /> Export brief
              </button>
              <button
                type="button"
                className="button button-small push"
                onClick={() => reviewRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })}
              >
                Record decision <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-main">
                <SummaryPanel firm={firm} />
                <FactorsPanel firm={firm} />
                <FactsPanel firm={firm} />
                {(firm.risks.length > 0 || firm.missing.length > 0) && <FlagsPanel firm={firm} />}
                <EvidencePanel evidence={firm.evidence} />
                <KeywordChart firm={firm} />
                <RecordsPanel firm={firm} />
              </div>

              <aside className="detail-aside" aria-label="Review">
                <div className="panel next-panel">
                  <span className="icon-tile" aria-hidden>
                    <ArrowRight size={16} />
                  </span>
                  <div className="eyebrow" style={{ marginTop: 12 }}>
                    Recommended next action
                  </div>
                  <p className="sentence">{firstSentence(firm.recommendedAction) ?? "Review the evidence and record a decision."}</p>
                  <p className="detail-line">
                    {firm.review?.verify.length
                      ? `Verify: ${firm.review.verify.slice(0, 3).join("; ")}.`
                      : "Suggested by the workflow's AI. A person decides."}
                  </p>
                  <button
                    type="button"
                    className="text-link small"
                    onClick={() => {
                      reviewRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
                      document.getElementById("rv-notes")?.focus({ preventScroll: true });
                    }}
                  >
                    Add a note <ArrowRight size={13} />
                  </button>
                </div>
                <ReviewPanel
                  firm={firm}
                  decision={decision}
                  setDecision={setDecision}
                  panelRef={reviewRef}
                  onSaved={(f) => {
                    setFirm(f);
                    toast(`${f.name} moved to ${f.stage}.`);
                  }}
                />
                <ContextPanel firm={firm} />
              </aside>
            </div>

            <p className="footnote">
              <ShieldCheck size={16} />
              AAI is a decision-support tool for TrueGrit Capital and VIMANA. Verify the source before acting. Nothing here
              means a firm is for sale or approved for outreach.
            </p>
          </>
        )}
      </main>

      {tourIndex !== null && firm && <Tour index={tourIndex} onIndex={onTourIndex} onClose={() => setTourIndex(null)} />}
    </div>
  );
}

function firstSentence(s: string | null): string | null {
  if (!s) return null;
  const m = s.replace(/^Human reviewer:\s*/i, "").match(/^.*?[.!?](\s|$)/);
  const t = (m ? m[0] : s).trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function SummaryPanel({ firm }: { firm: FirmDetail }) {
  return (
    <section className="panel summary-panel" aria-labelledby="sum-h">
      <div className="panel-head" style={{ marginBottom: 0 }}>
        <h2 id="sum-h">
          <span className="icon-tile" aria-hidden>
            <Sparkles size={15} />
          </span>
          Summary
        </h2>
        <span className="ai-label">
          <span className="dot indigo" aria-hidden /> Written by OpenAI from the firm&apos;s website text
        </span>
      </div>
      <p className="lead-text">{firm.summary ?? "No AI summary was recorded for this firm."}</p>
      {firm.description && <p className="muted-note" style={{ marginBottom: 12 }}>{firm.description}</p>}
      <div className="tag-row">
        {firm.practiceAreas.length ? (
          firm.practiceAreas.map((p) => (
            <span key={p} className="chip-tag">
              {p}
            </span>
          ))
        ) : (
          <span className="muted-note">No practice areas found.</span>
        )}
      </div>
    </section>
  );
}

function FactorsPanel({ firm }: { firm: FirmDetail }) {
  return (
    <section className="panel" aria-labelledby="why-h">
      <div className="panel-head">
        <h2 id="why-h">
          Why it <em>matches</em>
        </h2>
        <span className="muted-note">
          {firm.score !== null ? `${firm.score}/100` : "No score"} · {firm.coverage ?? "?"}% of the model scored
        </span>
      </div>
      {firm.factors.length ? (
        firm.factors.map((f) => (
          <div key={f.key} className={`factor${f.scored ? "" : " unscored"}`}>
            <div className="lbl">
              {f.label}
              {f.confidence && <span className="conf">{f.confidence} confidence</span>}
            </div>
            <div className="val">{f.scored ? `${f.points}/${f.max}` : "Not scored"}</div>
            <ScoreBar value={f.scored && f.max ? ((f.points ?? 0) / f.max) * 100 : 0} thick muted={!f.scored} />
            <div className="factor-note">{f.note}</div>
          </div>
        ))
      ) : (
        <p className="muted-note">No score breakdown recorded.</p>
      )}
      <p className="muted-note" style={{ marginTop: 12 }}>
        Not scored means no evidence was found, not zero. Fit weights are provisional until the sponsors confirm a rubric.
      </p>
    </section>
  );
}

function Fact({ label, value, status }: { label: string; value: string | null; status: FieldStatus }) {
  return (
    <div className="fact">
      <div className="l">{label}</div>
      <div className="v">
        {value ? value : <span className="none">Not found</span>}
        <StatusTag status={value ? status : "missing"} />
      </div>
    </div>
  );
}

function FactsPanel({ firm }: { firm: FirmDetail }) {
  return (
    <section className="panel" aria-labelledby="facts-h">
      <div className="panel-head">
        <h2 id="facts-h">
          Practice, size <em>and entity</em>
        </h2>
      </div>
      <div className="facts-grid">
        <Fact label="Defense vs plaintiff" value={firm.defenseVsPlaintiff} status="estimated" />
        <Fact label="Civil vs criminal" value={firm.civilVsCriminal} status="estimated" />
        <Fact label="Insurance-defense fit (AI)" value={firm.insuranceDefenseFitAI} status="estimated" />
        <Fact label="Client focus (AI)" value={firm.clientFocusAI} status="estimated" />
        <Fact label="Attorneys" value={firm.attorneys !== null ? compact(firm.attorneys) : null} status={firm.attorneysStatus} />
        <Fact label="Employees" value={firm.employees} status={firm.employeesStatus} />
        <Fact label="Estimated revenue" value={firm.revenue ? range(firm.revenue) : null} status={firm.revenueStatus} />
        <Fact label="In 10–400 attorney band" value={firm.inSizeBand} status="estimated" />
        <Fact label="Offices" value={firm.officeCount} status="estimated" />
        <Fact label="Year founded" value={firm.yearFounded} status={firm.yearFoundedStatus} />
        <Fact
          label="Entity status"
          value={firm.entityStatus ? `${firm.entityStatus}${firm.entityName ? ` · ${firm.entityName}` : ""}` : null}
          status={firm.entityVerified ? "verified" : "missing"}
        />
        <Fact
          label="Federal contract awards"
          value={firm.federalAwardsCount ? `${firm.federalAwardsCount} · ${money(firm.federalAwardsTotal)}` : firm.federalAwardsCount === 0 ? "None found" : null}
          status="verified"
        />
      </div>
      <div style={{ marginTop: 14, display: "grid", gap: 8, fontSize: 12, color: "var(--soft)" }}>
        <div>
          <b style={{ color: "var(--text)" }}>Insurance keyword score: </b>
          {firm.insuranceScore !== null ? (firm.insuranceScore > 0 ? "+" : "") + firm.insuranceScore : "n/a"}
          {firm.insuranceBand && <span className="muted-note"> · {firm.insuranceBand}</span>}
        </div>
        {firm.carriers && (
          <div>
            <span className="muted-note">Carriers named on the website: </span>
            {firm.carriers}
          </div>
        )}
        {firm.leadership && (
          <div>
            <span className="muted-note">Leadership named publicly: </span>
            {firm.leadership}
          </div>
        )}
      </div>
    </section>
  );
}

function FlagsPanel({ firm }: { firm: FirmDetail }) {
  return (
    <section className="panel" aria-labelledby="flags-h">
      <div className="panel-head">
        <h2 id="flags-h">
          Flags <em>and gaps</em>
        </h2>
      </div>
      {firm.risks.length > 0 && (
        <ul className="flag-list">
          {firm.risks.map((r) => (
            <li key={r}>
              <Flag size={13} /> <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
      {firm.missing.length > 0 && (
        <p className="muted-note" style={{ marginTop: 12 }}>
          <b style={{ color: "var(--soft)" }}>Missing:</b> {firm.missing.join("; ")}
        </p>
      )}
      <p className="muted-note" style={{ marginTop: 6 }}>
        Missing information is not evidence of poor fit.
      </p>
    </section>
  );
}

const EV_ICON: Record<string, typeof Globe> = {
  website_page: Globe,
  entity_status: Landmark,
  federal_awards: Building2,
  address: MapPin,
};

const EV_LIMIT = 12;

function EvidencePanel({ evidence }: { evidence: Evidence[] }) {
  const [status, setStatus] = useState<FieldStatus | "">("");
  const [all, setAll] = useState(false);
  const statuses = useMemo(() => [...new Set(evidence.map((e) => e.status))], [evidence]);
  const rows = evidence.filter((e) => !status || e.status === status);
  const shown = all ? rows : rows.slice(0, EV_LIMIT);
  return (
    <section className="panel" aria-labelledby="ev-h" data-tour="detail-evidence">
      <div className="panel-head">
        <h2 id="ev-h">
          Evidence <em>({evidence.length})</em>
        </h2>
        <span className="source-stamp">
          <ScrollText size={12} /> Sourced records
        </span>
      </div>
      <div className="evidence-filters" role="group" aria-label="Filter evidence">
        <button type="button" className="chip" aria-pressed={!status} onClick={() => setStatus("")}>
          All
        </button>
        {statuses.map((s) => (
          <button key={s} type="button" className="chip" aria-pressed={status === s} onClick={() => setStatus(status === s ? "" : s)}>
            {STATUS_LABEL[s]} <span className="ct">{evidence.filter((e) => e.status === s).length}</span>
          </button>
        ))}
      </div>
      {shown.length ? (
        shown.map((e) => {
          const Icon = EV_ICON[e.field] ?? (e.field.startsWith("signal:") ? Flag : FileText);
          return (
            <div key={e.id} className="ev">
              <span className="ev-icon" aria-hidden>
                <Icon size={14} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="ev-title">
                  {e.label} <StatusTag status={e.status} />
                  <span className="date">{date(e.date)}</span>
                </div>
                <div className="ev-value">{e.value || "—"}</div>
                {e.quote && <q>{e.quote}</q>}
                <div className="ev-src">{e.source}</div>
              </div>
              {e.url ? (
                <a className="ev-link" href={e.url} target="_blank" rel="noopener noreferrer" aria-label={`Open source for ${e.label}`}>
                  <ArrowUpRight size={15} />
                </a>
              ) : (
                <span />
              )}
            </div>
          );
        })
      ) : (
        <p className="muted-note">No evidence rows logged for this firm.</p>
      )}
      {rows.length > EV_LIMIT && (
        <button type="button" className="text-link small show-more" onClick={() => setAll((a) => !a)}>
          {all ? "Show fewer" : `Show all ${rows.length}`} <ArrowRight size={13} />
        </button>
      )}
    </section>
  );
}

const TIERS = [5, 3, 1, -3, -5];

function KeywordChart({ firm }: { firm: FirmDetail }) {
  const counts = TIERS.map((w) => firm.terms.filter((t) => t.weight === w).length);
  const max = Math.max(4, ...counts);
  const ticks = [max, Math.round(max / 2), 0];
  return (
    <section className="panel" aria-labelledby="kw-h">
      <div className="panel-head">
        <h2 id="kw-h">
          Insurance keyword <em>matches</em>
        </h2>
        <span className="muted-note">Net score {firm.insuranceScore !== null ? (firm.insuranceScore > 0 ? "+" : "") + firm.insuranceScore : "n/a"}</span>
      </div>
      <div className="chart" role="img" aria-label={TIERS.map((w, i) => `${counts[i]} ${counts[i] === 1 ? "term" : "terms"} worth ${w > 0 ? "+" : ""}${w}`).join(", ")}>
        <div className="chart-y" aria-hidden>
          {ticks.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
        <div className="chart-plot" aria-hidden>
          <span className="gridline" style={{ top: 0 }} />
          <span className="gridline" style={{ top: "50%" }} />
          {counts.map((c, i) => (
            <div
              key={TIERS[i]}
              className={`chart-bar${TIERS[i]! < 0 ? " neg" : ""}${c === 0 ? " zero" : ""}`}
              style={{ height: `${(c / max) * 100}%` }}
            >
              <span>{c}</span>
            </div>
          ))}
        </div>
        <div className="chart-x" aria-hidden>
          {TIERS.map((w) => (
            <span key={w}>{w > 0 ? `+${w}` : `−${Math.abs(w)}`}</span>
          ))}
        </div>
      </div>
      <p className="chart-caption">
        Terms found on the firm&apos;s website, grouped by sponsor scorecard weight (v2.3). Each term counts once.
        {firm.terms.length > 0 && <> Found: {firm.terms.map((t) => t.term).join(", ")}.</>}
        {firm.terms.length === 0 && firm.pagesScraped === 0 && <> No website text was retrieved for this firm.</>}
      </p>
    </section>
  );
}

function RecordsPanel({ firm }: { firm: FirmDetail }) {
  const rows: { source: string; record: string; status: FieldStatus; url: string | null }[] = [
    {
      source: "State registry",
      record: firm.entityStatus
        ? `${firm.entityName ?? firm.name} · ${firm.entityStatus}${firm.entityFileDate ? ` · filed ${firm.entityFileDate}` : ""}`
        : "No registry match",
      status: firm.entityVerified ? "verified" : "missing",
      url: firm.entitySourceUrl,
    },
    {
      source: "USAspending.gov",
      record:
        firm.federalAwardsCount === null
          ? "Not checked"
          : firm.federalAwardsCount === 0
            ? "No federal contract awards found"
            : `${firm.federalAwardsCount} awards · ${money(firm.federalAwardsTotal)}`,
      status: firm.federalAwardsCount === null ? "missing" : "verified",
      url: null,
    },
    {
      source: "Google Maps",
      record: [firm.googleCategory?.split(" | ")[0], firm.googleRating !== null ? `${firm.googleRating}★` : null, phone(firm.phone)]
        .filter(Boolean)
        .join(" · ") || NO_DATA,
      status: firm.googleCategory ? "verified" : "missing",
      url: firm.mapsUrl,
    },
    {
      source: "Firm website",
      record: firm.pagesScraped ? `${firm.pagesScraped} pages read` : "No pages read",
      status: firm.pagesScraped ? "verified" : "missing",
      url: firm.website,
    },
  ];
  return (
    <section className="panel" aria-labelledby="rec-h">
      <div className="panel-head">
        <h2 id="rec-h">
          Public <em>records</em>
        </h2>
      </div>
      <div className="table-scroll">
        <table className="records">
          <thead>
            <tr>
              <th>Source</th>
              <th>Record</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Link</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.source}>
                <td>{r.source}</td>
                <td>{r.record}</td>
                <td>
                  <StatusTag status={r.status} />
                </td>
                <td>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${r.source} record`}>
                      <ArrowUpRight size={14} />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const DECISION_CLASS: Record<Decision, string> = {
  "Investigate further": "d-investigate",
  "Needs more evidence": "",
  "Not a fit": "d-notfit",
  "Data corrected": "",
};

function ReviewPanel({
  firm,
  decision,
  setDecision,
  panelRef,
  onSaved,
}: {
  firm: FirmDetail;
  decision: Decision | null;
  setDecision: (d: Decision) => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onSaved: (f: FirmDetail) => void;
}) {
  const [notes, setNotes] = useState("");
  const [corrections, setCorrections] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const R = firm.review;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(getProfile()?.name ?? "");
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!decision) {
      setErr("Choose a decision first.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await submitReview({
        companyId: firm.id,
        companyName: firm.name,
        decision,
        corrections: corrections.trim(),
        notes: notes.trim(),
        reviewer: name.trim(),
      });
      const reviewedAt = new Date().toISOString();
      onSaved({
        ...firm,
        decision,
        stage: decision,
        review: {
          whyQueued: R?.whyQueued ?? "",
          verify: R?.verify ?? [],
          queuedAt: R?.queuedAt ?? null,
          decision,
          notes: notes.trim(),
          corrections: corrections.trim(),
          reviewer: name.trim(),
          reviewedAt,
        },
      });
      setConfirmed(`Saved to the Review_Queue sheet at ${new Date(reviewedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`);
      setNotes("");
      setCorrections("");
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel review-panel" id="review" ref={panelRef} aria-labelledby="rev-h" data-tour="detail-review" style={{ scrollMarginTop: 76 }}>
      <div className="panel-head" style={{ marginBottom: 0 }}>
        <h2 id="rev-h">
          <span className="icon-tile" aria-hidden style={{ width: 32, height: 32 }}>
            <ShieldCheck size={15} />
          </span>
          Human review
        </h2>
      </div>
      <p className="promise">
        <b>AI researches. People decide.</b> Check the evidence, correct anything wrong, and record your reasoning.
      </p>
      {firm.queuedFit && (
        <div className="changed-note">
          <TriangleAlert size={14} /> Queued as {firm.queuedFit}; a later run rated it {firm.fit}.
        </div>
      )}
      {R?.decision && (
        <div className="current-decision">
          Current decision: <b>{R.decision}</b>
          {R.reviewer && <> by {R.reviewer}</>}
          {R.reviewedAt && <> on {date(R.reviewedAt)}</>}
          {R.notes && <div style={{ marginTop: 4 }}>“{R.notes}”</div>}
        </div>
      )}
      {R?.whyQueued && !R.decision && (
        <div className="current-decision">
          <b>Why it was queued:</b> {R.whyQueued}
        </div>
      )}
      <form onSubmit={submit}>
        <div className="decision-buttons" role="group" aria-label="Decision">
          {DECISIONS.map((d) => (
            <button key={d} type="button" className={DECISION_CLASS[d]} aria-pressed={decision === d} onClick={() => setDecision(d)}>
              {d}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="rv-notes">Rationale</label>
          <textarea
            id="rv-notes"
            className="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What you checked and why you decided this"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="rv-corr">Corrections (optional)</label>
          <input
            id="rv-corr"
            className="input"
            value={corrections}
            onChange={(e) => setCorrections(e.target.value)}
            placeholder="attorney_count = 42; year_founded = 1998"
          />
        </div>
        <div className="field">
          <label htmlFor="rv-name">Your name</label>
          <input id="rv-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </div>
        {err && (
          <div className="alert" role="alert">
            <CircleAlert size={15} /> <span>{err}</span>
          </div>
        )}
        <button type="submit" className="button" disabled={busy || !decision}>
          {busy ? (
            <>
              <span className="spinner small" /> Saving…
            </>
          ) : (
            <>
              <Gavel size={15} /> Save decision
            </>
          )}
        </button>
        {confirmed && (
          <p className="confirm-line" role="status">
            <CircleCheck size={14} /> {confirmed}
          </p>
        )}
      </form>
    </section>
  );
}

function ContextPanel({ firm }: { firm: FirmDetail }) {
  return (
    <section className="panel" aria-labelledby="ctx-h">
      <div className="panel-head">
        <h2 id="ctx-h">Context</h2>
      </div>
      <dl className="context-list">
        <dt>Review stage</dt>
        <dd>{firm.stage}</dd>
        <dt>Data confidence</dt>
        <dd>{firm.dataConfidence ?? NO_DATA}</dd>
        <dt>Address</dt>
        <dd>{firm.address ?? NO_DATA}</dd>
        <dt>Offices</dt>
        <dd>{firm.offices ?? NO_DATA}</dd>
        <dt>Last researched</dt>
        <dd>{date(firm.lastResearched)}</dd>
        <dt>Workflow run</dt>
        <dd>{firm.runId ?? "—"}</dd>
        <dt>Data mode</dt>
        <dd>{firm.sample ? "Sample (fictional)" : "Live"}</dd>
      </dl>
      <p className="caveat">
        <span className="dot yellow" aria-hidden />
        Attorney counts, size and revenue are estimates unless tagged Verified. Revenue ≈ attorneys × $300k–$500k.
      </p>
    </section>
  );
}
