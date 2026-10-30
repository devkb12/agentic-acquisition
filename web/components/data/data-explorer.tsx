"use client";

// Data explorer (/app/data): the raw evidence log and the workflow run log.
import { ArrowLeft, ArrowRight, ArrowUpRight, CircleAlert, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getWorkspace, searchEvidence } from "@/lib/api";
import { STATUS_LABEL, fieldLabel } from "@/lib/fit";
import { date } from "@/lib/format";
import type { EvidencePage, FieldStatus, RunRow, WorkspaceData } from "@/lib/types";
import { DataBadge, PathEyebrow, StatusTag } from "../ui";

type Tab = "evidence" | "runs";
const PAGE_SIZE = 50;
const STATUSES: FieldStatus[] = ["verified", "estimated", "missing", "sample"];

export function DataExplorer() {
  const [tab, setTab] = useState<Tab>("evidence");
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.location.hash === "#runs") setTab("runs");
    getWorkspace()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  const pick = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", t === "runs" ? "#runs" : window.location.pathname);
  };

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100vh" }}>
      <header className="detail-bar">
        <Link href="/app" className="brand-tile" aria-label="Back to the workspace">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mono.svg" alt="" width={20} height={20} />
        </Link>
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/app">Lodestar</Link>
          <span className="sep">/</span>
          <Link href="/app">Workspace</Link>
          <span className="sep">/</span>
          <b>Data explorer</b>
        </nav>
        <div style={{ marginLeft: "auto" }}>
          <DataBadge label={data ? `TrueGrit sheet · ${date(data.generatedAt)}` : "TrueGrit sheet"} />
        </div>
      </header>
      <main id="main" className="detail">
        <Link href="/app" className="text-link small muted">
          <ArrowLeft size={13} /> Back to the workspace
        </Link>
        <div className="view-head" style={{ marginTop: 18 }}>
          <div>
            <PathEyebrow parts={["Workspace", "Source data"]} />
            <h1>
              The raw records <em>behind every score</em>
            </h1>
            <p className="desc">
              Every evidence row the workflow logged in the Source_Log tab, and every run in Run_Log. Use it to check a claim
              or to see why a run had errors.
            </p>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label="Data">
          <button type="button" role="tab" aria-selected={tab === "evidence"} onClick={() => pick("evidence")}>
            Evidence log {data && <span className="ct">{data.evidenceCount.toLocaleString()}</span>}
          </button>
          <button type="button" role="tab" aria-selected={tab === "runs"} onClick={() => pick("runs")}>
            Workflow runs {data && <span className="ct">{data.runs.length}</span>}
          </button>
        </div>

        {error && !data ? (
          <div className="alert" role="alert">
            <CircleAlert size={15} /> <span>Could not load the research data. {error}</span>
          </div>
        ) : tab === "evidence" ? (
          <EvidenceTable />
        ) : data ? (
          <RunsTable runs={data.runs} />
        ) : (
          <div className="empty" role="status">
            <span className="spinner" /> Reading the run log…
          </div>
        )}
      </main>
    </div>
  );
}

function EvidenceTable() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<FieldStatus | "">("");
  const [field, setField] = useState("");
  const [sample, setSample] = useState(false);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<EvidencePage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBusy(true);
    searchEvidence({ q: debounced, status, field, sample, page, pageSize: PAGE_SIZE })
      .then((r) => {
        if (!alive) return;
        setResult(r);
        setError(null);
      })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [debounced, status, field, sample, page, attempt]);

  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };
  const pages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div className="table-panel">
      <div className="table-toolbar">
        <div className="title">
          Evidence records
          <small aria-live="polite">{result ? `${result.total.toLocaleString()} matching` : "Loading…"}</small>
        </div>
        <label className="search">
          <Search size={14} aria-hidden />
          <span className="sr-only">Search evidence</span>
          <input
            className="input"
            type="search"
            value={q}
            onChange={(e) => reset(() => setQ(e.target.value))}
            placeholder="Search firm, field, value or source"
          />
        </label>
        <label>
          <span className="sr-only">Field</span>
          <select className="select" value={field} onChange={(e) => reset(() => setField(e.target.value))}>
            <option value="">All fields</option>
            {result?.fields.map((f) => (
              <option key={f} value={f}>
                {fieldLabel(f)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="filter-row" role="group" aria-label="Filter by status">
        <button type="button" className="chip" aria-pressed={!status} onClick={() => reset(() => setStatus(""))}>
          All statuses
        </button>
        {STATUSES.map((s) => (
          <button key={s} type="button" className="chip" aria-pressed={status === s} onClick={() => reset(() => setStatus(status === s ? "" : s))}>
            {STATUS_LABEL[s]}
          </button>
        ))}
        <label className="toggle">
          <input type="checkbox" checked={sample} onChange={(e) => reset(() => setSample(e.target.checked))} /> Include sample
          data
        </label>
      </div>
      {error ? (
        <div className="empty">
          <div className="alert" role="alert">
            <CircleAlert size={15} /> <span>{error}</span>
          </div>
          <button type="button" className="button button-small" onClick={() => setAttempt((a) => a + 1)}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      ) : result && result.rows.length ? (
        <div className="table-scroll" aria-busy={busy}>
          <table className="data compact">
            <thead>
              <tr>
                <th>Firm</th>
                <th>Field</th>
                <th>Value and quote</th>
                <th>Status</th>
                <th>Source</th>
                <th>Retrieved</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/firms/${encodeURIComponent(e.firmId)}`} className="text-link small">
                      {e.firmName}
                    </Link>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{e.label}</td>
                  <td className="ev-cell">
                    <span className="clamp">{e.value || "—"}</span>
                    {e.quote && <q>{e.quote}</q>}
                  </td>
                  <td>
                    <StatusTag status={e.status} />
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    {e.source}
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-link small" style={{ marginLeft: 6 }} aria-label="Open source">
                        <ArrowUpRight size={12} />
                      </a>
                    )}
                  </td>
                  <td className="num" style={{ whiteSpace: "nowrap" }}>
                    {date(e.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : busy ? (
        <div className="empty" role="status">
          <span className="spinner" /> Searching the evidence log…
        </div>
      ) : (
        <div className="empty">
          <b>No evidence matches</b>
          <span>Try another search or status.</span>
        </div>
      )}
      <div className="table-foot">
        <span className="left">
          <span className="dot yellow" aria-hidden /> Source_Log tab of the TrueGrit sheet. Website text rows are left out to
          keep this readable.
        </span>
        {result && result.total > PAGE_SIZE && (
          <span className="pager">
            <button type="button" className="toolbar-button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
              <ArrowLeft size={13} />
            </button>
            Page {page} of {pages}
            <button type="button" className="toolbar-button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
              <ArrowRight size={13} />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

const RUN_COLUMNS: { key: keyof RunRow; label: string; bad?: boolean }[] = [
  { key: "discovered", label: "Found" },
  { key: "duplicates", label: "Duplicates" },
  { key: "droppedOverLimit", label: "Over limit" },
  { key: "processed", label: "Researched" },
  { key: "high", label: "High" },
  { key: "moderate", label: "Moderate" },
  { key: "low", label: "Low" },
  { key: "insufficient", label: "Insufficient" },
  { key: "aiFailures", label: "AI failures", bad: true },
  { key: "enrichmentFailures", label: "Enrichment failures", bad: true },
];

function RunsTable({ runs }: { runs: RunRow[] }) {
  if (!runs.length) return <div className="table-panel empty">No runs logged yet.</div>;
  return (
    <div className="table-panel">
      <div className="table-toolbar">
        <div className="title">
          Workflow runs <small>newest first</small>
        </div>
      </div>
      <div className="table-scroll">
        <table className="data compact">
          <thead>
            <tr>
              <th>Run</th>
              <th>Finished</th>
              <th>Mode</th>
              <th>Status</th>
              {RUN_COLUMNS.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th>Sources (Maps · Sunbiz · USAspending)</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id}>
                <td className="num">{r.id}</td>
                <td className="num" style={{ whiteSpace: "nowrap" }}>
                  {date(r.finishedAt, true)}
                </td>
                <td>
                  {r.dataMode === "LIVE" ? "Live" : <span className="tag sample">Sample</span>}
                </td>
                <td className={r.status.includes("error") ? "bad" : "good"} style={{ whiteSpace: "nowrap" }}>
                  {r.status.replace(/_/g, " ") || "—"}
                </td>
                {RUN_COLUMNS.map((c) => {
                  const v = r[c.key] as number | null;
                  return (
                    <td key={c.key} className={`num${c.bad && v ? " bad" : ""}`}>
                      {v ?? "—"}
                    </td>
                  );
                })}
                <td className="num" style={{ whiteSpace: "nowrap" }}>
                  {[(r.serpapi ?? 0) + (r.apifyMaps ?? 0), r.sunbiz ?? 0, r.usaspending ?? 0].join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-foot">
        <span className="left">
          <span className="dot yellow" aria-hidden /> Run_Log tab. “Completed with errors” usually means some AI
          classifications or website reads failed and those firms need a rerun.
        </span>
      </div>
    </div>
  );
}
