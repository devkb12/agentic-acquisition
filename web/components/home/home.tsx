"use client";

// Home page, in the editorial rhythm: hero → the problem → how it works (diagram)
// → the workspace (deep stage demo) → data layers → human in the loop (index)
// → common questions → closing call to action.
import Link from "next/link";
import type { CSSProperties } from "react";
import { SiteFooter, SiteHeader } from "../site-chrome";
import { Label, Monogram, Reveal, ScoreBar } from "../ui";
import { PlaybackControls, useDemo } from "./demo";

export function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Problem />
        <HowItWorks />
        <WorkspaceDemo />
        <DataLayers />
        <HumanInTheLoop />
        <Questions />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}

const rise = (i: number) => ({ "data-rise": "", style: { "--i": i } as CSSProperties });

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="wrap">
        <div {...rise(0)}>
          <Label grey>Research for TrueGrit Capital × VIMANA</Label>
        </div>
        <h1 id="hero-title" className="display" {...rise(1)}>
          Firm research
          <br />
          you can check.
        </h1>
        <p className="lead" {...rise(2)}>
          An AI research agent finds insurance-defense firms across Florida, Georgia, the Carolinas and Virginia, reads their websites, checks public records
          and scores each one against TrueGrit&apos;s criteria. Your team reviews every result.
        </p>
        <div className="hero-actions" {...rise(3)}>
          <Link href="/app" className="text-link">
            Open the workspace <span className="glyph" aria-hidden>→</span>
          </Link>
          <a href="#how-it-works" className="quiet-link">
            <span className="glyph" aria-hidden>▷</span> See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

const PROBLEMS = [
  {
    title: "Search results lean plaintiff",
    text: "Google Maps surfaces personal-injury firms first. Defense firms that work for insurers are harder to find and easy to miss.",
  },
  {
    title: "Size and revenue are hidden",
    text: "Few firms publish attorney counts or revenue, so analysts piece size together from partial clues on many pages.",
  },
  {
    title: "Every claim needs a source",
    text: "A sponsor can't act on a summary. Each fact has to trace back to a web page or a public record someone can check.",
  },
];

function Problem() {
  return (
    <section className="section centered" aria-labelledby="problem-title">
      <div className="wrap">
        <Reveal>
          <Label>The problem</Label>
          <h2 id="problem-title" className="h2">
            Finding the right firm
            <br />
            takes weeks of reading.
          </h2>
          <p className="lead">
            The firms exist, but the signal is buried in websites, registries and search results that favour the other side of
            the courtroom.
          </p>
        </Reveal>
        <div className="ruled-cols">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} i={i + 1}>
              <span className="index">{String(i + 1).padStart(2, "0")}</span>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "Discover",
    short: "Maps, Sunbiz, USAspending",
    text: "Search Google Maps and the Justia directory across 34 cities in five Southeast states, add Florida's Sunbiz registry and USAspending.gov, then drop duplicates and firms already on file.",
  },
  {
    title: "Read and classify",
    short: "Up to eight pages per site",
    text: "Read each firm's website. OpenAI classifies practice areas, defense versus plaintiff, civil versus criminal, carriers and size.",
  },
  {
    title: "Score",
    short: "Keyword scorecard and fit model",
    text: "Apply the sponsor's insurance keyword scorecard and a 100-point fit model. Mainly plaintiff or criminal firms are rated Low whatever their score.",
  },
  {
    title: "Review",
    short: "A person decides",
    text: "High and moderate fits get deeper research and join the review queue. A person checks the evidence and records a decision.",
  },
];

function HowItWorks() {
  // Frames 0–3 light one stage each; frame 4 is the finished run.
  const [demoRef, demo] = useDemo(5, (s) => (s === 0 ? 1600 : 1900));
  const active = Math.min(demo.step, 3);
  const finished = demo.step === 4;
  return (
    <section className="section split-section" id="how-it-works" aria-labelledby="how-title">
      <div className="wrap split-visual">
        <Reveal>
          <Label>How it works</Label>
          <h2 id="how-title" className="h2">
            From a map search
            <br />
            to a reviewed shortlist.
          </h2>
          <p className="lead">One n8n workflow with 56 steps runs end to end and writes everything to a Google Sheet that people review.</p>
          <ol className="step-list">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <button type="button" aria-current={!finished && i === active ? "step" : undefined} onClick={() => demo.jump(i)}>
                  <span className="index">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <b>{s.title}</b>
                    <span className="text">{s.text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal i={1}>
          <figure style={{ margin: 0 }} aria-labelledby="how-caption">
            <div className="scene" ref={demoRef}>
              <div className="scene-bar">
                <span className="title">
                  <span className="live-dot" aria-hidden /> Research workflow · 56 steps in n8n
                </span>
                <PlaybackControls demo={demo} name="workflow diagram" />
              </div>
              <div className="sources" aria-label="Sources">
                <span>Google Maps</span>
                <span>Firm websites</span>
                <span>Florida Sunbiz</span>
                <span>USAspending.gov</span>
              </div>
              <div className="feed" aria-hidden />
              <ol className="pipeline" aria-label="Workflow stages">
                {STEPS.map((s, i) => {
                  const lit = finished || i < demo.step;
                  const on = !finished && i === demo.step;
                  return (
                    <li key={s.title} className={`pnode${i === 2 ? " core" : ""}${on ? " on" : ""}${lit ? " lit done" : ""}`} aria-current={on ? "step" : undefined}>
                      <span className="index">{String(i + 1).padStart(2, "0")}</span>
                      <b>{s.title}</b>
                      <small>{s.short}</small>
                    </li>
                  );
                })}
              </ol>
              <div className="slow-path" aria-hidden>
                <span className="arc" style={{ left: "37.5%", width: "50%" }} />
                <span className="why" style={{ left: "42%" }}>
                  Too little evidence: read again
                </span>
              </div>
              <div className="scene-out">
                <span>
                  Writes to <b>Company_Leads, AI_Analysis, Source_Log, Review_Queue</b>
                </span>
                <span>{finished ? "✓ Run complete" : `Stage ${active + 1} of 4`}</span>
              </div>
            </div>
            <figcaption id="how-caption" className="scene-caption">
              Each run moves firms through four stages. Firms with too little evidence are rated Insufficient information and go
              back for another read instead of being scored as zero.
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

const RANKED = [
  { id: "gulfcoastdefense.example", name: "Gulf Coast Insurance Defense Group", score: 97, fit: "High", stage: "Needs review" },
  { id: "peachtreecoverage.example", name: "Peachtree Coverage & Litigation", score: 91, fit: "High", stage: "Investigate further" },
  { id: "savannahwcdefense.example", name: "Savannah Workers' Comp Defense", score: 85, fit: "Moderate", stage: "Needs review" },
  { id: "tampabaycasualty.example", name: "Tampa Bay Casualty Counsel", score: 64, fit: "Moderate", stage: "Needs more evidence" },
];

const SCENARIOS = [
  { title: "Rank the firms", frames: 5 },
  { title: "Open a firm file", frames: 5 },
  { title: "Record a decision", frames: 4 },
];
const STARTS = SCENARIOS.map((_, i) => SCENARIOS.slice(0, i).reduce((n, s) => n + s.frames, 0));
const TOTAL = SCENARIOS.reduce((n, s) => n + s.frames, 0);

function WorkspaceDemo() {
  const [demoRef, demo] = useDemo(TOTAL, (s) => (STARTS.includes(s + 1) ? 2200 : 950));
  const scenario = STARTS.reduce((at, start, i) => (demo.step >= start ? i : at), 0);
  const frame = demo.step - STARTS[scenario]!;
  const pick = (i: number) => demo.jump(demo.playing ? STARTS[i]! : STARTS[i]! + SCENARIOS[i]!.frames - 1, demo.playing);

  return (
    <section className="section centered" id="workspace" aria-labelledby="ws-title">
      <div className="wrap">
        <Reveal>
          <Label>The workspace</Label>
          <h2 id="ws-title" className="h2">
            Every firm, ranked
            <br />
            with its evidence.
          </h2>
          <p className="lead">
            Search and filter every screened firm, open a firm file to see the score and each sourced claim, and record a
            decision your whole team can see.
          </p>
          <Link href="/app" className="text-link">
            Open the workspace <span className="glyph" aria-hidden>→</span>
          </Link>
        </Reveal>

        <Reveal i={1} className="stage-band on-stage">
          <div className="stage-frame" ref={demoRef}>
            <div className="stage-side">
              <Label>Scenarios</Label>
              <div className="stage-tabs" role="tablist" aria-label="Workspace scenarios">
                {SCENARIOS.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    role="tab"
                    id={`scn-${i}`}
                    aria-selected={scenario === i}
                    aria-controls="scn-panel"
                    tabIndex={scenario === i ? 0 : -1}
                    className="stage-tab"
                    onClick={() => pick(i)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                        e.preventDefault();
                        const n = (i + 1) % SCENARIOS.length;
                        pick(n);
                        document.getElementById(`scn-${n}`)?.focus();
                      }
                      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                        e.preventDefault();
                        const n = (i + SCENARIOS.length - 1) % SCENARIOS.length;
                        pick(n);
                        document.getElementById(`scn-${n}`)?.focus();
                      }
                    }}
                  >
                    <span className="n">{String(i + 1).padStart(2, "0")}</span>
                    <span>{s.title}</span>
                    <span className="arrow" aria-hidden>
                      →
                    </span>
                  </button>
                ))}
              </div>
              <p className="stage-note">Fictional firms and figures. The real workspace reads the TrueGrit research sheet.</p>
              <PlaybackControls demo={demo} name="workspace demonstration" />
            </div>

            <div className="mock" id="scn-panel" role="tabpanel" aria-labelledby={`scn-${scenario}`}>
              {scenario === 0 && <RankMock frame={frame} />}
              {scenario === 1 && <FileMock frame={frame} />}
              {scenario === 2 && <DecideMock frame={frame} />}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function MockTop({ path, title, status }: { path: string; title: string; status: string }) {
  return (
    <div className="mock-top">
      <span className="t">
        <span>{path} / </span>
        {title}
      </span>
      <span className="status-line">
        <span className="dot ok" aria-hidden /> {status}
      </span>
    </div>
  );
}

function RankMock({ frame }: { frame: number }) {
  return (
    <>
      <MockTop path="Workspace" title="Ranked firms" status="Sheet connected" />
      <div className="mock-body">
        <h4>Insurance-defense firms, ranked by fit</h4>
        <div className="facts-row">
          <div>
            <small>Firms researched</small>
            <b>48</b>
          </div>
          <div>
            <small>High or moderate fit</small>
            <b>9</b>
          </div>
          <div>
            <small>Awaiting review</small>
            <b className="review">6</b>
          </div>
        </div>
        <div className="mock-table" role="table" aria-label="Ranked firms (fictional)">
          <div className="mock-row head" role="row">
            <span role="columnheader">Firm</span>
            <span role="columnheader">Fit score</span>
            <span role="columnheader">Stage</span>
          </div>
          {RANKED.slice(0, frame).map((r) => (
            <div key={r.id} className="mock-row arrive" role="row">
              <span className="who" role="cell">
                <Monogram name={r.name} />
                <span>{r.name}</span>
              </span>
              <span role="cell">
                <span className="pct">
                  {r.score}% <span className={`fit fit-${r.fit.toLowerCase()}`}>{r.fit}</span>
                </span>
                <ScoreBar value={r.score} />
              </span>
              <span role="cell" className="muted-note">
                {r.stage}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mock-foot">
        <span className="dot warn" aria-hidden /> Sample records: fictional firms from the workflow&apos;s demo mode
      </div>
    </>
  );
}

const FACTORS = [
  { label: "Insurance-defense focus", points: 27, max: 30 },
  { label: "Firm size in the 10–400 band", points: 18, max: 20 },
  { label: "Carrier relationships", points: 14, max: 20 },
];

function FileMock({ frame }: { frame: number }) {
  return (
    <>
      <MockTop path="Firm file" title="Gulf Coast Insurance Defense Group" status="Evidence linked" />
      <div className="mock-body">
        <h4>Gulf Coast Insurance Defense Group</h4>
        <p>Tampa, FL · gulfcoastdefense.example</p>
        <div className="facts-row">
          <div>
            <small>Attorney count</small>
            <b className="verified">42 ✓</b>
          </div>
          <div>
            <small>Est. revenue</small>
            <b className="review">$12.6M – $21.0M</b>
          </div>
          <div>
            <small>Entity status</small>
            <b className="verified">Active ✓</b>
          </div>
        </div>
        <div className="mock-factors">
          {FACTORS.slice(0, frame).map((f) => (
            <div key={f.label} className="mock-factor arrive">
              <span>{f.label}</span>
              <span className="v">
                {f.points}/{f.max}
              </span>
              <ScoreBar value={(f.points / f.max) * 100} />
            </div>
          ))}
        </div>
        {frame >= 4 && (
          <p className="arrive" style={{ marginTop: 14, fontSize: 13, color: "var(--ink)" }}>
            Panel counsel for three national carriers<span className="cite">1</span>, with 42 attorneys on the firm&apos;s people
            page<span className="cite">2</span>.
          </p>
        )}
      </div>
      <div className="mock-foot">
        <span className="dot ok" aria-hidden /> Every claim links to the page or record it came from
      </div>
    </>
  );
}

const DECISIONS = ["Investigate further", "Needs more evidence", "Not a fit", "Data corrected"];

function DecideMock({ frame }: { frame: number }) {
  return (
    <>
      <MockTop path="Firm file" title="Human review" status="Signed in this browser" />
      <div className="mock-body">
        <h4>Record a decision</h4>
        <p>Check the evidence, correct anything wrong, and give your reasoning.</p>
        <div className="mock-decisions">
          {DECISIONS.map((d, i) => (
            <span key={d} className={frame >= 1 && i === 0 ? "on" : undefined}>
              {d}
              {frame >= 1 && i === 0 ? " ✓" : ""}
            </span>
          ))}
        </div>
        {frame >= 2 && (
          <p className="bubble arrive">
            Carrier panel list matches the website. Confirm the attorney count against the Florida Bar before any outreach.
          </p>
        )}
        {frame >= 3 && (
          <p className="mock-confirm arrive">
            <span aria-hidden>✓</span> Saved to the Review_Queue sheet at 10:42
          </p>
        )}
      </div>
      <div className="mock-foot">
        <span className="dot ok" aria-hidden /> A person makes every call
      </div>
    </>
  );
}

function DataLayers() {
  return (
    <section className="section split-section" id="data" aria-labelledby="data-title" style={{ borderBottom: "1px solid var(--line)" }}>
      <div className="wrap split-even">
        <Reveal>
          <Label>Data layers</Label>
          <h2 id="data-title" className="h2">
            Public records first,
            <br />
            AI on top.
          </h2>
          <p className="lead">
            The base layer is what anyone can check. The signal layer is what the AI reads into it, and every field is labelled
            Verified, Estimated or Missing.
          </p>
          <details className="disclosure" style={{ marginTop: 22, borderTop: "1px solid var(--line)" }}>
            <summary>
              How does each review improve the next run? <span className="plus" aria-hidden />
            </summary>
            <div className="body">
              Reviewers correct fields such as attorney counts. The next run picks up those corrections and rescores the firm, so
              the shortlist improves with use.
              <div className="loop-row" aria-label="Run, score, review, correct, re-run">
                {["Run", "Score", "Review", "Correct", "Re-run"].map((l, i) => (
                  <span key={l} style={{ display: "contents" }}>
                    {i > 0 && (
                      <span className="glyph" aria-hidden>
                        →
                      </span>
                    )}
                    <span>{l}</span>
                  </span>
                ))}
              </div>
            </div>
          </details>
        </Reveal>
        <Reveal i={1}>
          <ol className="ledger">
            <li>
              <span className="key">
                <span className="index">01</span>Base layer
              </span>
              <div>
                <h3>Listings, websites and registries</h3>
                <p>Where a firm is, what it says about itself, and whether the state and federal government have it on file.</p>
                <div className="chips">
                  {["Google Maps (SerpApi, Apify)", "Firm websites", "Florida Sunbiz", "USAspending.gov"].map((x) => (
                    <span key={x} className="chip-tag">
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            </li>
            <li>
              <span className="key">
                <span className="index">02</span>Signal layer
              </span>
              <div>
                <h3>Classification, scorecard and signals</h3>
                <p>What the firm practises, which side it represents, and any sourced sign of growth, succession or change.</p>
                <div className="chips">
                  {["OpenAI classification", "Insurance keyword scorecard v2.3", "Leadership and succession signals"].map((x) => (
                    <span key={x} className="chip-tag focus">
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            </li>
            <li>
              <span className="key">
                <span className="index">03</span>Planned
              </span>
              <div>
                <h3>Defense-bar directories</h3>
                <p>Seed discovery from FDLA, GDLA, DRI and CLM member lists, where insurance-defense firms gather.</p>
              </div>
            </li>
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

const INDEX = [
  {
    href: "/about#principles",
    cat: "Principles",
    meta: "5 rules",
    title: "Five principles behind every score",
    note: "Evidence first, missing is not negative, hard gates before scores, provisional weights, people decide.",
  },
  {
    href: "/about#methodology",
    cat: "Methodology",
    meta: "Live settings",
    title: "What the workflow searches and how it scores",
    note: "Cities, search phrases, the 100-point fit model and the sponsor's keyword scorecard, read from the workflow.",
  },
  {
    href: "/about#limits",
    cat: "Known limits",
    meta: "4 notes",
    title: "What to keep in mind when reading a score",
    note: "Search bias, scraper limits, and which figures are estimates rather than verified facts.",
  },
];

function HumanInTheLoop() {
  return (
    <section className="section editorial" aria-labelledby="hitl-title">
      <div className="wrap">
        <Reveal className="index-head">
          <div>
            <Label>Human in the loop</Label>
            <h2 id="hitl-title" className="h2">
              AI researches.
              <br />
              People decide.
            </h2>
          </div>
          <Link href="/about" className="text-link">
            About the project <span className="glyph" aria-hidden>→</span>
          </Link>
        </Reveal>
        <ol className="editorial-index">
          {INDEX.map((e, i) => (
            <Reveal as="li" key={e.href} i={i}>
              <Link href={e.href}>
                <span className="cat">
                  {e.cat}
                  <span>{e.meta}</span>
                </span>
                <span className="title">{e.title}</span>
                <span className="blurb">{e.note}</span>
                <span className="glyph" aria-hidden>
                  →
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "Does a high score mean a firm is for sale?",
    a: "No. Lodestar does research only. A high score means a firm is worth a person's time, not that it is for sale or approved for outreach. A named reviewer records every decision.",
  },
  {
    q: "Where does the data come from?",
    a: "Google Maps listings (through SerpApi and Apify), each firm's own website, Florida's Sunbiz registry and USAspending.gov. Every verified claim links to the page or record it came from.",
  },
  {
    q: "What happens when information is missing?",
    a: "That part of the score is left out rather than counted as zero, and the score says how much of the model it covers. Firms with too little evidence are rated Insufficient information.",
  },
  {
    q: "How are attorney counts and revenue worked out?",
    a: "Attorney counts come from firm websites and Bar records and are tagged Verified, Estimated or Missing. Revenue is modeled as attorneys × $300k–$500k, the sponsor's rule of thumb, unless a source reports it.",
  },
  {
    q: "Why do so few strong fits appear in each run?",
    a: "Google Maps returns mostly plaintiff personal-injury firms, and plaintiff or criminal firms are rated Low whatever their score. Defense-bar directories are planned as a better starting list.",
  },
];

function Questions() {
  return (
    <section className="section faq-section" aria-labelledby="faq-title">
      <div className="wrap split-faq">
        <Reveal>
          <Label>Common questions</Label>
          <h2 id="faq-title" className="h2">
            Before you read
            <br />a score.
          </h2>
        </Reveal>
        <Reveal i={1} className="faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>
                {f.q} <span className="plus" aria-hidden />
              </summary>
              <div className="answer">
                <p>{f.a}</p>
              </div>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="closing" aria-labelledby="cta-title">
      <div className="wrap">
        <Reveal>
          <h2 id="cta-title">
            Open the workspace
            <br />
            and review the shortlist.
          </h2>
          <p className="lead">
            An ASU MSAIB capstone with TrueGrit Capital and VIMANA. Fit weights are provisional until the sponsors confirm a
            rubric.
          </p>
        </Reveal>
        <Reveal i={1} className="cta">
          <Link href="/app" className="button">
            Open the workspace <span className="glyph" aria-hidden>→</span>
          </Link>
          <span className="meta">Research only. A person makes every call.</span>
        </Reveal>
      </div>
    </section>
  );
}
