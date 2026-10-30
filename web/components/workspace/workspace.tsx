"use client";

// The workspace (/app): sidebar, top bar, five views, onboarding wizard,
// product tour and firm lookup.
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CircleAlert,
  Compass,
  Database,
  LayoutDashboard,
  Plus,
  RefreshCw,
  ShieldCheck,
  SquareKanban,
  Trophy,
  UserRound,
  Laptop,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getProfile,
  getSavedIds,
  getWorkspace,
  markTourSeen,
  saveProfile,
  setSaved as storeSaved,
  tourSeen,
  type Profile,
} from "@/lib/api";
import { date, initials, plural } from "@/lib/format";
import { SIZE_BANDS, firstName, stateLabels } from "@/lib/profile";
import type { FirmSummary, WorkspaceData } from "@/lib/types";
import { ToastProvider, useToast } from "../toast";
import { TOUR_STEPS, Tour, type TourView } from "../tour";
import { DataBadge, PathEyebrow } from "../ui";
import { FirmTable } from "./firm-table";
import { LookupModal } from "./lookup-modal";
import { OutcomesView, PipelineView, ProfileView, ViewHead } from "./views";
import { Wizard, type WizardMode } from "./wizard";

type View = TourView;

const VIEWS: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "pipeline", label: "Pipeline", icon: SquareKanban },
  { id: "outcomes", label: "Outcomes", icon: Trophy },
  { id: "profile", label: "Profile", icon: UserRound },
];

const viewFromHash = (): View => {
  const h = window.location.hash.slice(1);
  return VIEWS.some((v) => v.id === h) ? (h as View) : "overview";
};

export function Workspace() {
  return (
    <ToastProvider>
      <WorkspaceInner />
    </ToastProvider>
  );
}

function WorkspaceInner() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSavedIds] = useState<string[]>([]);
  const [view, setView] = useState<View>("overview");
  const [wizard, setWizard] = useState<WizardMode | null>(null);
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);
  const [ready, setReady] = useState<Promise<WorkspaceData> | null>(null);

  const load = useCallback((reload = false) => {
    setError(null);
    const p = getWorkspace({ reload });
    setReady(p);
    p.then(setData).catch((e: Error) => setError(e.message));
    return p;
  }, []);

  // Browser-only state is read after mount so the server render matches.
  useEffect(() => {
    const p = getProfile();
    /* eslint-disable react-hooks/set-state-in-effect */
    setProfile(p);
    setSavedIds(getSavedIds());
    setView(viewFromHash());
    setMounted(true);
    const tour = new URLSearchParams(window.location.search).get("tour");
    if (!p) setWizard("first");
    else if (tour !== null) setTourIndex(Math.max(0, Math.min(Number(tour) || 0, TOUR_STEPS.length - 1)));
    /* eslint-enable react-hooks/set-state-in-effect */
    load();
    const onHash = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [load]);

  // Offer the tour once, after setup, when the data is on screen.
  useEffect(() => {
    if (data && profile && !wizard && tourIndex === null && !tourSeen()) {
      markTourSeen();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTourIndex(0);
    }
  }, [data, profile, wizard, tourIndex]);

  const goView = useCallback((v: View) => {
    setView(v);
    history.replaceState(null, "", v === "overview" ? window.location.pathname : `#${v}`);
  }, []);

  const firms = useMemo(() => data?.firms ?? [], [data]);
  const live = useMemo(() => {
    const l = firms.filter((f) => !f.sample);
    return l.length ? l : firms;
  }, [firms]);
  const topFirm = live[0];

  const onTourIndex = useCallback(
    (i: number) => {
      const step = TOUR_STEPS[i]!;
      if (step.page === "detail") {
        if (topFirm) router.push(`/firms/${encodeURIComponent(topFirm.id)}?tour=${i}`);
        else setTourIndex(null);
        return;
      }
      if (step.view) goView(step.view);
      setTourIndex(i);
    },
    [goView, router, topFirm],
  );

  const toggleSave = useCallback(
    (f: FirmSummary) => {
      const on = !saved.includes(f.id);
      setSavedIds(storeSaved(f.id, on));
      toast(on ? `Saved ${f.name}.` : `Removed ${f.name} from saved.`);
    },
    [saved, toast],
  );

  const finishWizard = (p: Profile) => {
    saveProfile(p);
    setProfile(p);
    const first = wizard === "first";
    setWizard(null);
    goView("overview");
    if (!first) toast("Your view is updated.");
  };

  const onFound = (f: FirmSummary) => {
    setLookupOpen(false);
    setPinned((p) => [f.id, ...p.filter((x) => x !== f.id)]);
    goView("overview");
    toast(`${f.name}: fit score ${f.score ?? "not available"}${f.score !== null ? "%" : ""} (${f.fit}).`);
  };

  const phase = !mounted ? "loading" : error && !data ? "error" : !data ? "loading" : !profile ? "setup" : "ready";
  const savedFirms = firms.filter((f) => saved.includes(f.id));
  const awaiting = live.filter((f) => f.stage === "Needs review").length;
  const decided = live.filter((f) => f.decision).length;
  const counts: Record<View, number | null> = {
    overview: live.length,
    saved: savedFirms.length,
    pipeline: awaiting,
    outcomes: decided,
    profile: null,
  };
  const viewLabel = VIEWS.find((v) => v.id === view)!.label;
  const dialogOpen = Boolean(wizard || lookupOpen || tourIndex !== null);

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Workspace" inert={dialogOpen}>
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={30} height={30} />
          <span>
            AAI
            <small>BETA</small>
          </span>
        </Link>
        <div className="side-label">Workspace</div>
        <button type="button" className="switcher" onClick={() => goView("profile")} disabled={!profile}>
          <span className="avatar-square" aria-hidden>
            {profile ? initials(profile.name) : "–"}
          </span>
          <div>
            <b>{profile ? profile.name : "Not set up yet"}</b>
            <small>{profile?.role || "TrueGrit × VIMANA research"}</small>
          </div>
        </button>
        <div className="side-label">Views</div>
        <nav className="side-nav" data-tour="nav" aria-label="Views">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" aria-current={view === v.id ? "page" : undefined} onClick={() => goView(v.id)} title={v.label}>
              <v.icon size={16} aria-hidden />
              <span className="lbl">{v.label}</span>
              {data && counts[v.id] !== null && <span className="ct">{counts[v.id]}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot" data-tour="data-links">
          <Link href="/app/data" className="side-link" title="Data explorer">
            <Database size={16} aria-hidden /> <span className="lbl">Data explorer</span>
          </Link>
          <Link href="/" className="side-link" title="Back to site">
            <ArrowLeft size={16} aria-hidden /> <span className="lbl">Back to site</span>
          </Link>
          <hr />
          <div className="local-row">
            <Laptop size={13} aria-hidden /> This browser — saved locally
          </div>
        </div>
      </aside>

      <div className="main" inert={dialogOpen}>
        <header className="topbar">
          <nav className="crumbs" aria-label="Breadcrumb">
            <span>AAI</span>
            <span className="sep">/</span>
            <span>Workspace</span>
            <span className="sep">/</span>
            <b>{viewLabel}</b>
          </nav>
          <div className="right">
            <button type="button" className="tour-launch" onClick={() => onTourIndex(0)} disabled={phase !== "ready"}>
              <Compass size={14} aria-hidden /> <span className="lbl">Take the tour</span>
            </button>
            <DataBadge label={data ? `TrueGrit sheet · ${date(data.generatedAt)}` : "TrueGrit sheet"} />
            <span className="avatar-round" title={profile?.name} aria-hidden>
              {profile ? initials(profile.name) : "–"}
            </span>
          </div>
        </header>

        <main id="main" className="content">
          {phase === "loading" && (
            <div className="phase" role="status">
              <div className="phase-box">
                <span className="spinner" />
                <h2>Ranking firms…</h2>
                <p>
                  Reading the TrueGrit research sheet. The first load after a quiet spell can take up to 15 seconds while
                  n8n reads all six tabs.
                </p>
              </div>
            </div>
          )}
          {phase === "error" && (
            <div className="phase">
              <div className="phase-box">
                <div className="alert" role="alert">
                  <CircleAlert size={16} />
                  <span>Could not load the research data. {error}</span>
                </div>
                <button type="button" className="button button-small" onClick={() => load(true)}>
                  <RefreshCw size={14} /> Try again
                </button>
              </div>
            </div>
          )}
          {phase === "setup" && (
            <div className="phase">
              <div className="phase-box">
                <span className="icon-tile">
                  <UserRound size={20} />
                </span>
                <h2>Set up your view</h2>
                <p>Five quick questions: your name for signing reviews, and the states and practice areas you care about.</p>
                <button type="button" className="button button-small" onClick={() => setWizard("first")}>
                  Start <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
          {phase === "ready" && data && profile && (
            <>
              {view === "overview" && (
                <Overview
                  data={data}
                  live={live}
                  profile={profile}
                  saved={saved}
                  pinned={pinned}
                  onToggleSave={toggleSave}
                  onNewSearch={() => setWizard("new")}
                  onLookup={() => setLookupOpen(true)}
                />
              )}
              {view === "saved" && (
                <>
                  <ViewHead
                    path="Saved"
                    title="Your saved"
                    accent="shortlist"
                    desc="Firms you bookmarked in this browser. Saving a firm is private to you and does not record a decision."
                  />
                  {savedFirms.length ? (
                    <FirmTable firms={savedFirms} title="Saved firms" profile={profile} saved={saved} pinned={[]} onToggleSave={toggleSave} />
                  ) : (
                    <div className="table-panel empty">
                      <Bookmark size={22} />
                      <b>Nothing saved yet</b>
                      <span>Use the bookmark at the start of any row in Overview to build a shortlist.</span>
                      <button type="button" className="button button-small button-outline" onClick={() => goView("overview")}>
                        Go to Overview
                      </button>
                    </div>
                  )}
                </>
              )}
              {view === "pipeline" && <PipelineView firms={live} />}
              {view === "outcomes" && <OutcomesView firms={live} />}
              {view === "profile" && <ProfileView profile={profile} onEdit={() => setWizard("edit")} />}
            </>
          )}
        </main>
      </div>

      {wizard && (
        <Wizard
          mode={wizard}
          initial={wizard === "first" ? null : profile}
          ready={ready ?? Promise.resolve()}
          counts={data ? { firms: live.length, evidence: data.evidenceCount } : null}
          onDone={finishWizard}
          onClose={() => setWizard(null)}
        />
      )}
      {lookupOpen && (
        <LookupModal
          firms={() => (ready ?? getWorkspace()).then((d) => d.firms)}
          onFound={onFound}
          onClose={() => setLookupOpen(false)}
        />
      )}
      {tourIndex !== null && phase === "ready" && (
        <Tour index={tourIndex} onIndex={onTourIndex} onClose={() => setTourIndex(null)} />
      )}
    </div>
  );
}

function Overview({
  data,
  live,
  profile,
  saved,
  pinned,
  onToggleSave,
  onNewSearch,
  onLookup,
}: {
  data: WorkspaceData;
  live: FirmSummary[];
  profile: Profile;
  saved: string[];
  pinned: string[];
  onToggleSave: (f: FirmSummary) => void;
  onNewSearch: () => void;
  onLookup: () => void;
}) {
  const t = data.config.thresholds ?? {};
  const fl = live.filter((f) => f.state === "FL").length;
  const ga = live.filter((f) => f.state === "GA").length;
  const strong = live.filter((f) => f.fit === "High Fit" || f.fit === "Moderate Fit");
  const awaiting = live.filter((f) => f.stage === "Needs review").length;
  const sourced = live.filter((f) => f.hasSourcedEvidence).length;
  const lastRun = data.runs[0];
  const top = strong[0];
  const sampleCount = data.firms.length - live.length;

  const gaps = useMemo(() => {
    const m = new Map<string, number>();
    live.forEach((f) => f.missing.forEach((g) => m.set(g, (m.get(g) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [live]);

  const size = SIZE_BANDS.find((b) => b.label === profile.size);
  const matched = [
    stateLabels(profile.states).join(" & "),
    profile.practices.join(", "),
    size && size.max !== Infinity ? size.label : null,
  ].filter(Boolean);

  return (
    <>
      <div className="view-head">
        <div>
          <PathEyebrow parts={["Workspace", "TrueGrit sheet"]} />
          <h1>
            Insurance-defense firms, <em>ranked by fit</em>
          </h1>
          <p className="desc">
            {firstName(profile.name)}&apos;s view{profile.role ? ` for ${profile.role}` : ""}: every firm the research
            workflow has screened in Florida and Georgia, with the evidence behind each score.
          </p>
          <p className="matched">
            <b>Matched on:</b> {matched.join(" · ") || "all firms"}
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="button button-small button-outline" onClick={onNewSearch}>
            New search
          </button>
          <button type="button" className="button button-small" onClick={onLookup} data-tour="lookup">
            <Plus size={14} /> Find a firm
          </button>
        </div>
      </div>

      {sampleCount > 0 && live.length !== data.firms.length && (
        <div className="banner">
          <span className="dot indigo" aria-hidden />
          {plural(sampleCount, "sample firm")} from early test runs {sampleCount === 1 ? "is" : "are"} left out of these
          numbers. Untick “Hide sample data” in the table to see {sampleCount === 1 ? "it" : "them"}.
        </div>
      )}

      <div className="metrics" data-tour="metrics">
        <div className="metric">
          <div className="label">Firms researched</div>
          <div className="value">{live.length}</div>
          <div className="caption">
            <span className="dot green" aria-hidden />
            {fl} in Florida · {ga} in Georgia, across {data.runs.filter((r) => r.dataMode === "LIVE").length} live runs
          </div>
        </div>
        <div className="metric">
          <div className="label">High or moderate fit</div>
          <div className="value">{strong.length}</div>
          <div className="caption">
            <span className="dot green" aria-hidden />
            Score ≥ {t.moderate ?? 45} with ≥ {t.min_coverage ?? 40}% of the model backed by evidence. Weights are
            provisional.
          </div>
        </div>
        <div className="metric">
          <div className="label">Awaiting review</div>
          <div className="value">{awaiting}</div>
          <div className="caption">
            <span className="dot green" aria-hidden />
            High or moderate fits queued for a person, with no decision saved yet.
          </div>
        </div>
        <div className="metric">
          <div className="label">With sourced evidence</div>
          <div className="value">
            {sourced}
            <small>of {live.length}</small>
          </div>
          <div className="caption">
            <span className="dot green" aria-hidden />
            At least one verified claim with a link to its source page or record.
          </div>
        </div>
      </div>

      <div className="section-title">
        <div>
          <div className="eyebrow">Ranked firms</div>
          <h2>
            Every screened firm, <em>best fit first</em>
          </h2>
        </div>
        {lastRun && (
          <span className="muted-note">
            Last run {date(lastRun.finishedAt, true)} · {lastRun.status.replace(/_/g, " ")}
          </span>
        )}
      </div>

      <FirmTable
        firms={data.firms}
        title="All firms"
        profile={profile}
        saved={saved}
        pinned={pinned}
        onToggleSave={onToggleSave}
        tour
      />

      <div className="notes">
        <div className="card note">
          <span className="icon-tile" aria-hidden>
            <ShieldCheck size={17} />
          </span>
          <div>
            <div className="eyebrow">Human review</div>
            <p>
              AI researches. People decide.{" "}
              {top ? (
                <>
                  Start with <b>{top.name}</b>, the strongest fit so far.
                </>
              ) : (
                "No high or moderate fits yet."
              )}
            </p>
          </div>
          {top ? (
            <Link className="square-arrow" href={`/firms/${encodeURIComponent(top.id)}`} aria-label={`Open ${top.name}`}>
              <ArrowRight size={15} />
            </Link>
          ) : (
            <span />
          )}
        </div>
        <div className="card note">
          <span className="icon-tile" aria-hidden>
            <Database size={17} />
          </span>
          <div>
            <div className="eyebrow">Source data</div>
            <p>
              {data.evidenceCount.toLocaleString()} evidence records and {plural(data.runs.length, "workflow run")}.
              Check any claim against its source.
            </p>
          </div>
          <Link className="square-arrow" href="/app/data" aria-label="Open the data explorer">
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <div className="split">
        <div className="panel">
          <div className="ai-label">
            <span className="dot indigo" aria-hidden /> Written by the workflow&apos;s AI for run {data.summary?.runId ?? "—"} ·{" "}
            {date(data.summary?.generatedAt)}
          </div>
          <h3>
            Latest run <em>summary</em>
          </h3>
          {data.summary ? (
            <div className="summary-text">{data.summary.text}</div>
          ) : (
            <p className="muted-note">No run summary yet.</p>
          )}
        </div>
        <div className="panel">
          <div className="eyebrow">Across all live firms</div>
          <h3>
            Most common <em>gaps</em>
          </h3>
          {gaps.length ? (
            gaps.map(([g, n]) => (
              <div key={g} className="gap-row">
                <span>{g}</span>
                <span className="num">{n}</span>
              </div>
            ))
          ) : (
            <p className="muted-note">No gaps recorded.</p>
          )}
          <p className="muted-note" style={{ marginTop: 10 }}>
            Missing information is not evidence of poor fit.
          </p>
        </div>
      </div>
    </>
  );
}
