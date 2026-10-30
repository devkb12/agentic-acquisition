"use client";

// The ranked firm table: search, sort, fit and stage chips, save toggles and
// a status menu that opens the firm's review panel.
import { ArrowUpRight, Bookmark, BookmarkCheck, SearchX, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DECISIONS, FITS, STAGES, fitRank } from "@/lib/fit";
import { NO_DATA, compact, place, range } from "@/lib/format";
import { focusMatches, inSizeBand } from "@/lib/profile";
import type { Profile } from "@/lib/api";
import type { FirmSummary, Fit, Stage } from "@/lib/types";
import { FitPill, Monogram, ScoreBar, StatusTag, fitShort, stageClass } from "../ui";

type Sort = "best" | "focus" | "score-desc" | "score-asc" | "attorneys" | "name" | "recent";

const SORTS: { value: Sort; label: string }[] = [
  { value: "best", label: "Best fit first" },
  { value: "focus", label: "Best match to my focus" },
  { value: "score-desc", label: "Highest score" },
  { value: "score-asc", label: "Lowest score" },
  { value: "attorneys", label: "Most attorneys" },
  { value: "name", label: "Name A–Z" },
  { value: "recent", label: "Recently researched" },
];

export interface TableFilters {
  fit: Fit | "";
  stage: Stage | "";
}

export function FirmTable({
  firms,
  title,
  profile,
  saved,
  pinned,
  onToggleSave,
  initialFilters,
  tour,
  emptyHint,
}: {
  firms: FirmSummary[];
  title: string;
  profile: Profile | null;
  saved: string[];
  pinned: string[];
  onToggleSave: (f: FirmSummary) => void;
  initialFilters?: Partial<TableFilters>;
  tour?: boolean;
  emptyHint?: string;
}) {
  const router = useRouter();
  const hasLive = firms.some((f) => !f.sample);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("best");
  const [fit, setFit] = useState<Fit | "">(initialFilters?.fit ?? "");
  const [stage, setStage] = useState<Stage | "">(initialFilters?.stage ?? "");
  const [hideSample, setHideSample] = useState(hasLive);
  const states = useMemo(() => profile?.states ?? [], [profile]);

  const base = useMemo(
    () => firms.filter((f) => !(hideSample && f.sample) && (!states.length || states.includes(f.state) || pinned.includes(f.id))),
    [firms, hideSample, states, pinned],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = base.filter(
      (f) =>
        (!fit || f.fit === fit) &&
        (!stage || f.stage === stage) &&
        (!needle || `${f.name} ${f.city} ${f.state} ${f.domain ?? ""} ${f.practiceAreas.join(" ")}`.toLowerCase().includes(needle)),
    );
    const focusScore = (f: FirmSummary) => focusMatches(f, profile).length * 2 + (inSizeBand(f, profile) ? 1 : 0);
    const byBest = (a: FirmSummary, b: FirmSummary) => fitRank(a.fit) - fitRank(b.fit) || (b.score ?? -1) - (a.score ?? -1);
    out.sort((a, b) => {
      switch (sort) {
        case "focus":
          return focusScore(b) - focusScore(a) || byBest(a, b);
        case "score-desc":
          return (b.score ?? -1) - (a.score ?? -1);
        case "score-asc":
          return (a.score ?? 101) - (b.score ?? 101);
        case "attorneys":
          return (b.attorneys ?? -1) - (a.attorneys ?? -1);
        case "name":
          return a.name.localeCompare(b.name);
        case "recent":
          return (b.lastResearched ?? "").localeCompare(a.lastResearched ?? "");
        default:
          return byBest(a, b);
      }
    });
    // Firms found with "Find a firm" stay on top for this session.
    const top = pinned.map((id) => out.find((f) => f.id === id)).filter((f): f is FirmSummary => Boolean(f));
    return [...top, ...out.filter((f) => !pinned.includes(f.id))];
  }, [base, q, fit, stage, sort, profile, pinned]);

  const fitCount = (k: Fit) => base.filter((f) => f.fit === k).length;
  const stageCount = (k: Stage) => base.filter((f) => f.stage === k).length;
  const clear = () => {
    setQ("");
    setFit("");
    setStage("");
  };

  const onStage = (f: FirmSummary, value: string) => {
    router.push(`/firms/${encodeURIComponent(f.id)}?decision=${encodeURIComponent(value)}#review`);
  };

  return (
    <div className="table-panel">
      <div className="table-toolbar" data-tour={tour ? "toolbar" : undefined}>
        <div className="title">
          {title}
          <small aria-live="polite">
            {rows.length} of {base.length} shown
          </small>
        </div>
        <label className="search">
          <Search size={14} aria-hidden />
          <span className="sr-only">Search firms</span>
          <input
            className="input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search firm, city or practice"
          />
        </label>
        <label>
          <span className="sr-only">Sort</span>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            {SORTS.filter((s) => s.value !== "focus" || profile?.practices.length).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="filter-row" data-tour={tour ? "filters" : undefined} role="group" aria-label="Filters">
        <button type="button" className="chip" aria-pressed={!fit} onClick={() => setFit("")}>
          All fits
        </button>
        {FITS.map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={fit === k} onClick={() => setFit(fit === k ? "" : k)}>
            {fitShort(k)} <span className="ct">{fitCount(k)}</span>
          </button>
        ))}
        <span className="divider" aria-hidden />
        <button type="button" className="chip" aria-pressed={!stage} onClick={() => setStage("")}>
          All stages
        </button>
        {STAGES.map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={stage === k} onClick={() => setStage(stage === k ? "" : k)}>
            {k} <span className="ct">{stageCount(k)}</span>
          </button>
        ))}
        {firms.some((f) => f.sample) && hasLive && (
          <label className="toggle">
            <input type="checkbox" checked={hideSample} onChange={(e) => setHideSample(e.target.checked)} /> Hide sample data
          </label>
        )}
      </div>

      {rows.length ? (
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>
                  <span className="sr-only">Saved</span>
                </th>
                <th>Firm</th>
                <th>Fit score</th>
                <th>Attorneys</th>
                <th>Practice areas</th>
                <th>Location</th>
                <th>Recent signal</th>
                <th>Review stage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const isSaved = saved.includes(f.id);
                const focus = focusMatches(f, profile);
                const thin = f.fit === "Insufficient Information" || (f.coverage ?? 100) < 40;
                return (
                  <tr
                    key={f.id}
                    className={pinned.includes(f.id) ? "pinned" : undefined}
                    style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
                    data-tour={tour && i === 0 ? "first-row" : undefined}
                  >
                    <td style={{ width: 44 }}>
                      <button
                        type="button"
                        className="toolbar-button"
                        aria-pressed={isSaved}
                        aria-label={isSaved ? `Remove ${f.name} from saved` : `Save ${f.name}`}
                        onClick={() => onToggleSave(f)}
                      >
                        {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      </button>
                    </td>
                    <td>
                      <div className="firm-cell">
                        <Monogram name={f.name} id={f.id} />
                        <div style={{ minWidth: 0 }}>
                          <Link href={`/firms/${encodeURIComponent(f.id)}`} className="name" title={f.name}>
                            {f.name}
                          </Link>
                          <div className="sub">
                            <Link href={`/firms/${encodeURIComponent(f.id)}`} className="view" tabIndex={-1}>
                              View file <ArrowUpRight size={11} />
                            </Link>
                            {pinned.includes(f.id) && <span>Looked up this session</span>}
                            {f.sample && <span className="tag sample">Sample</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="score-cell">
                      <div className="top">
                        <span className="pct">{f.score !== null ? `${f.score}%` : "—"}</span>
                        <FitPill fit={f.fit} />
                      </div>
                      <ScoreBar value={f.score} muted={thin} />
                      <div className="cov" style={{ marginTop: 4 }}>
                        {f.coverage !== null ? `${f.coverage}% of model had evidence` : NO_DATA}
                      </div>
                    </td>
                    <td className="fig-cell">
                      {f.attorneys !== null ? <b>{compact(f.attorneys)}</b> : <span className="muted-note">{NO_DATA}</span>}
                      {f.attorneys !== null && <StatusTag status={f.attorneysStatus} />}
                      {f.revenue && <div className="sub">{range(f.revenue)} est.</div>}
                    </td>
                    <td>
                      <div className="tags-cell">
                        {focus.map((c) => (
                          <span key={c} className="chip-tag focus" title="Matches your focus">
                            {c}
                          </span>
                        ))}
                        {f.practiceAreas.slice(0, focus.length ? 1 : 2).map((p) => (
                          <span key={p} className="chip-tag" title={p}>
                            {p}
                          </span>
                        ))}
                        {!f.practiceAreas.length && !focus.length && <span className="muted-note">{NO_DATA}</span>}
                      </div>
                    </td>
                    <td>{place(f.city, f.state)}</td>
                    <td className="signal-cell">
                      {f.signal ? (
                        <>
                          <b>{f.signal.kind}</b>
                          <span className="clamp">{f.signal.text}</span>
                        </>
                      ) : (
                        <span className="muted-note">No recent signal</span>
                      )}
                    </td>
                    <td>
                      <label>
                        <span className="sr-only">Review stage for {f.name}</span>
                        <select
                          className={`stage-select ${stageClass(f.stage)}`}
                          value={f.stage}
                          onChange={(e) => onStage(f, e.target.value)}
                        >
                          <option value={f.stage}>{f.stage}</option>
                          <optgroup label="Record a decision…">
                            {DECISIONS.filter((d) => d !== f.stage).map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </label>
                      {f.queuedFit && <div className="muted-note" style={{ marginTop: 4 }}>Fit changed since queued</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <SearchX size={22} />
          <b>No firms match</b>
          <span>{emptyHint ?? "Try a different search or clear the filters."}</span>
          {(q || fit || stage) && (
            <button type="button" className="button button-small button-outline" onClick={clear}>
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="table-foot">
        <span className="left">
          <span className="dot yellow" aria-hidden /> Research from public websites, Google Maps, Sunbiz and USAspending.
          Attorney counts and revenue are estimates unless tagged Verified.
        </span>
        <span>Scores support, not replace, human judgment.</span>
      </div>
    </div>
  );
}
