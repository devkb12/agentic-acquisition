"use client";

// Home page: ten storytelling sections about the research system.
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  Check,
  Database,
  FileSearch,
  Gauge,
  Globe,
  LayoutDashboard,
  Radar,
  ScanSearch,
  ShieldCheck,
  SquareKanban,
  UserRound,
  Users,
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SiteFooter, SiteHeader } from "../site-chrome";
import { Monogram } from "../ui";

const EASE = [0.2, 0.8, 0.2, 1] as const;

function useFade(delay = 0) {
  const reduce = useReducedMotion();
  return reduce
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, delay, ease: EASE },
      };
}

const reveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  shown: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: EASE } }),
};

function Reveal({ children, i = 0, className, as = "div" }: { children: ReactNode; i?: number; className?: string; as?: "div" | "article" }) {
  const reduce = useReducedMotion();
  const Comp = as === "article" ? motion.article : motion.div;
  if (reduce) return <Comp className={className}>{children}</Comp>;
  return (
    <Comp className={className} variants={reveal} initial="hidden" whileInView="shown" viewport={{ once: true, margin: "-60px" }} custom={i}>
      {children}
    </Comp>
  );
}

export function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <FlowStrip />
        <Problem />
        <HowItWorks />
        <Preview />
        <Loop />
        <DataLayers />
        <HumanBand />
        <ContextNote />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}

function MaskLine({ children, delay }: { children: ReactNode; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="line">
      {reduce ? (
        <span>{children}</span>
      ) : (
        <motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.75, delay, ease: EASE }}>
          {children}
        </motion.span>
      )}
    </span>
  );
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--pointer-x", `${e.clientX - r.left}px`);
      el.style.setProperty("--pointer-y", `${e.clientY - r.top}px`);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [reduce]);

  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <div className="grid-bg grid-hero" aria-hidden />
      <div className="glow a" aria-hidden />
      <div className="glow b" aria-hidden />
      <div className="wrap hero-grid">
        <div>
          <motion.div {...useFade(0.1)}>
            <div className="eyebrow">
              <span className="live-dot" aria-hidden /> Live research · Florida &amp; Georgia insurance-defense firms
            </div>
          </motion.div>
          <h1 id="hero-title">
            <MaskLine delay={0.2}>Firm research</MaskLine>
            <MaskLine delay={0.33}>
              <em>you can check.</em>
            </MaskLine>
          </h1>
          <motion.p className="hero-intro" {...useFade(0.55)}>
            An AI research agent finds law firms, reads their websites, checks state and federal records, and scores each
            one against TrueGrit&apos;s acquisition criteria. Your team reviews every result.
          </motion.p>
          <motion.div className="hero-actions" {...useFade(0.75)}>
            <Link href="/app" className="button">
              Open workspace <ArrowRight size={15} />
            </Link>
            <a href="#how-it-works" className="text-link">
              See how it works <ArrowDown size={14} />
            </a>
          </motion.div>
          <motion.p className="trust" {...useFade(0.95)}>
            <ShieldCheck size={13} aria-hidden /> Research only · every claim linked to its source · a person makes every call
          </motion.p>
        </div>
        <motion.div className="hero-visual" aria-hidden {...useFade(0.4)}>
          <span className="ring r1" />
          <span className="ring r2" />
          <span className="ring r3" />
          <span className="light" />
          <span className="drift-dot d1" />
          <span className="drift-dot d2" />
          <span className="drift-dot d3" />
          <div className="mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={180} height={180} />
          </div>
        </motion.div>
      </div>
      <motion.div className="wrap hero-bottom" {...useFade(1.15)}>
        <span>01 — Research for TrueGrit Capital × VIMANA</span>
        <span>Scroll to explore ↓</span>
      </motion.div>
    </section>
  );
}

const FLOW = [
  { n: "01", label: "DISCOVER", icon: Radar },
  { n: "02", label: "READ", icon: Globe },
  { n: "03", label: "VERIFY", icon: FileSearch },
  { n: "04", label: "SCORE", icon: Gauge },
  { n: "05", label: "REVIEW", icon: Users },
];

function FlowStrip() {
  return (
    <section className="flow-strip" aria-label="How a firm moves through the system">
      <div className="wrap">
        <p>Five steps take a firm from a Google Maps search to a reviewed shortlist.</p>
        <div className="flow">
          {FLOW.map((f, i) => (
            <div key={f.n} style={{ display: "contents" }}>
              {i > 0 && <span className="flow-line" aria-hidden />}
              <div className="flow-node">
                <span className="bubble">
                  <f.icon size={16} aria-hidden />
                </span>
                <span>
                  <b>{f.n}</b>
                  {f.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PROBLEMS = [
  {
    title: "Search results lean plaintiff",
    text: "Google Maps surfaces personal-injury firms first. Defense firms that work for insurers are harder to find and easy to miss.",
    color: "var(--indigo)",
  },
  {
    title: "Size and revenue are hidden",
    text: "Few firms publish attorney counts or revenue, so analysts piece size together from partial clues on many pages.",
    color: "var(--azure)",
  },
  {
    title: "Every claim needs a source",
    text: "A sponsor can't act on a summary. Each fact has to trace back to a web page or a public record someone can check.",
    color: "var(--cyan)",
  },
];

function Problem() {
  return (
    <section className="section alt" aria-labelledby="problem-title">
      <div className="grid-bg" aria-hidden />
      <div className="wrap" style={{ position: "relative" }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">The problem</div>
            <h2 id="problem-title">
              Finding the right firm
              <br />
              <em>takes weeks of reading.</em>
            </h2>
          </div>
          <p className="lead">
            TrueGrit is looking for insurance-defense practices in Florida and Georgia. The firms exist, but the signal is
            buried in websites, registries and search results that favour the other side of the courtroom.
          </p>
        </div>
        <div className="problem-cards">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} i={i} as="article" className="card problem-card">
              <span className="index">{String(i + 1).padStart(2, "0")}</span>
              <ArrowUpRight size={16} className="corner" aria-hidden />
              <span className="rule" style={{ background: p.color }} aria-hidden />
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
    icon: Radar,
    text: "Search Google Maps across ten Florida and Georgia cities with SerpApi and Apify, add Florida's Sunbiz registry and USAspending.gov, then remove duplicates and firms already on file.",
  },
  {
    title: "Read and classify",
    icon: ScanSearch,
    text: "Crawl up to eight pages of each firm's website. OpenAI reads the text and classifies practice areas, defense versus plaintiff, civil versus criminal, carriers and size.",
  },
  {
    title: "Score",
    icon: Gauge,
    text: "Apply the sponsor's insurance keyword scorecard and a 100-point fit model. Mainly plaintiff or criminal firms are rated Low whatever their score.",
  },
  {
    title: "Review",
    icon: ShieldCheck,
    text: "High and moderate fits get deeper research and join the review queue. A person checks the evidence and records a decision in the shared sheet.",
  },
];

function HowItWorks() {
  const [active, setActive] = useState(0);
  const S = STEPS[active]!;
  return (
    <section className="section" id="how-it-works" aria-labelledby="how-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">How it works</div>
            <h2 id="how-title">
              From a map search
              <br />
              <em>to a reviewed shortlist.</em>
            </h2>
          </div>
          <p className="lead">One n8n workflow with 56 steps runs end to end and writes everything to a Google Sheet that people review.</p>
        </div>
        <div className="how-grid">
          <div className="card how-visual" aria-hidden>
            <div className="grid-bg grid-card" />
            <span className="orbit o1">
              <span className="drift-dot" />
            </span>
            <span className="orbit o2" />
            <span className="center" key={active}>
              <S.icon size={30} strokeWidth={1.4} />
            </span>
            <div className="meta">
              <span className="title">{S.title}</span>
              <span className="index">{String(active + 1).padStart(2, "0")} / 04</span>
              <span className="pill-active">
                <span className="dot green" /> ACTIVE
              </span>
            </div>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                className={`step${i === active ? " active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-pressed={i === active}
              >
                <span className="index">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </span>
                <Check size={16} className="check" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const SAMPLE_ROWS = [
  { id: "gulfcoastdefense.example", name: "Gulf Coast Insurance Defense Group", score: 97, stage: "Needs review" },
  { id: "peachtreecoverage.example", name: "Peachtree Coverage & Litigation", score: 97, stage: "Investigate further" },
  { id: "savannahwcdefense.example", name: "Savannah Workers Comp Defense", score: 85, stage: "Needs review" },
];

function Preview() {
  return (
    <section className="section alt2" id="intelligence" aria-labelledby="preview-title">
      <div className="wrap preview-grid">
        <div>
          <div className="eyebrow">The workspace</div>
          <h2 id="preview-title">
            Every firm, ranked
            <br />
            <em>with its evidence.</em>
          </h2>
          <p className="lead" style={{ marginBottom: 28 }}>
            Search and filter every screened firm, open a firm file to see the score breakdown and each sourced claim, and
            record a decision your whole team can see.
          </p>
          <Link href="/app" className="button">
            Open workspace <ArrowRight size={15} />
          </Link>
        </div>
        <Reveal>
          <div className="mini-dash" aria-label="Preview of the workspace using fictional sample firms" role="img">
            <div className="mini-rail" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" />
              <LayoutDashboard size={15} className="on" />
              <SquareKanban size={15} />
              <Database size={15} />
              <UserRound size={15} />
            </div>
            <div className="mini-body" aria-hidden>
              <div className="eyebrow">Workspace / TrueGrit sheet</div>
              <h4>
                Good morning. Three firms <em>need review.</em>
              </h4>
              <div className="mini-stats">
                <div className="mini-stat">
                  <b>4</b>
                  <span>Firms researched</span>
                </div>
                <div className="mini-stat">
                  <b>3</b>
                  <span>High fit</span>
                </div>
                <div className="mini-stat">
                  <b>250</b>
                  <span>Evidence rows</span>
                </div>
              </div>
              <div className="mini-table">
                <div className="mini-row head">
                  <span>Firm</span>
                  <span>Fit score</span>
                  <span>Stage</span>
                </div>
                {SAMPLE_ROWS.map((r) => (
                  <div key={r.id} className="mini-row">
                    <span className="who">
                      <Monogram name={r.name} id={r.id} />
                      <span>{r.name}</span>
                    </span>
                    <span>
                      <b className="num">{r.score}%</b>
                      <span className="score-bar" style={{ marginTop: 4 }}>
                        <i style={{ width: `${r.score}%` }} />
                      </span>
                    </span>
                    <span className={r.stage === "Investigate further" ? "fit fit-high" : "fit fit-moderate"}>{r.stage}</span>
                  </div>
                ))}
              </div>
              <div className="mini-foot">
                <span className="dot yellow" /> Sample records: fictional firms from the workflow&apos;s demo mode
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const LOOP = ["Run", "Score", "Review", "Correct", "Re-run"];

function Loop() {
  return (
    <section className="section" aria-labelledby="loop-title">
      <div className="wrap">
        <div className="eyebrow">The loop</div>
        <h2 id="loop-title">
          Each review makes
          <br />
          <em>the next run sharper.</em>
        </h2>
        <p className="lead">
          Reviewers correct fields such as attorney counts. The next run picks up those corrections and rescores the firm, so
          the shortlist improves with use.
        </p>
        <div className="loop" aria-label="Run, score, review, correct, re-run">
          {LOOP.map((l, i) => (
            <div key={l} style={{ display: "contents" }}>
              {i > 0 && <span className={`loop-line${i < 2 ? " lit" : ""}`} aria-hidden />}
              <div className={`loop-node${i < 2 ? " lit" : ""}`}>
                <i aria-hidden />
                <span>{l}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DataLayers() {
  return (
    <section className="section alt" id="data" aria-labelledby="data-title">
      <div className="grid-bg" aria-hidden />
      <div className="wrap section-head" style={{ alignItems: "center", marginBottom: 0, position: "relative" }}>
        <div>
          <div className="eyebrow">Data layers</div>
          <h2 id="data-title">
            Public records first,
            <br />
            <em>AI on top.</em>
          </h2>
          <p className="lead">
            The base layer is what anyone can check. The signal layer is what the AI reads into it, and every field is labelled
            Verified, Estimated or Missing.
          </p>
          <p className="planned">
            <span className="tag">Planned</span> Seed discovery from defense-bar directories (FDLA, GDLA, DRI, CLM).
          </p>
        </div>
        <div className="layers">
          <span className="scan" aria-hidden />
          <Reveal className="card layer">
            <div className="eyebrow">01 / Base layer</div>
            <h3>Listings, websites and registries</h3>
            <p>Where a firm is, what it says about itself, and whether the state and federal government have it on file.</p>
            <ul>
              {["Google Maps (SerpApi, Apify)", "Firm websites", "Florida Sunbiz", "USAspending.gov"].map((x) => (
                <li key={x} className="chip-tag">
                  {x}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="card layer" i={1}>
            <div className="eyebrow">02 / Signal layer</div>
            <h3>Classification, scorecard and signals</h3>
            <p>What the firm practices, which side it represents, and any sourced sign of growth, succession or change.</p>
            <ul>
              {["OpenAI classification", "Insurance keyword scorecard v2.3", "Leadership and succession signals"].map((x) => (
                <li key={x} className="chip-tag focus">
                  {x}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function HumanBand() {
  return (
    <section className="section" aria-labelledby="hitl-title">
      <div className="wrap hitl">
        <div>
          <div className="eyebrow">Human in the loop</div>
          <h2 id="hitl-title">
            AI researches.
            <br />
            <em>People decide.</em>
          </h2>
          <p className="lead">
            Nothing in this system decides to pursue a firm. A high score means a firm is worth a person&apos;s time, not that it
            is for sale.
          </p>
        </div>
        <div className="hitl-flow">
          <Reveal className="hitl-box">
            <div className="eyebrow">
              <span className="dot indigo" /> AI layer
            </div>
            <p>Finds firms, reads websites, classifies practice, scores fit and drafts a summary with sources.</p>
          </Reveal>
          <span className="hitl-arrow" aria-hidden>
            <ArrowRight size={20} />
          </span>
          <Reveal className="hitl-box human" i={1}>
            <div className="eyebrow">
              <span className="dot cyan" /> Human review
            </div>
            <p>Checks the evidence, corrects mistakes, and records a decision with a reason and a name.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ContextNote() {
  return (
    <section className="context-band" aria-label="Project context">
      <div className="wrap">
        <div className="eyebrow">Capstone · 2026</div>
        <p>
          An ASU MSAIB capstone with TrueGrit Capital and VIMANA. Fit weights are provisional until the sponsors confirm a
          rubric.
        </p>
        <Link href="/about#methodology" className="text-link">
          Read the methodology <ArrowUpRight size={14} />
        </Link>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="closing" aria-labelledby="cta-title">
      <span className="big-ring" aria-hidden />
      <div className="wrap" style={{ position: "relative" }}>
        <div className="eyebrow">
          <BookOpenText size={12} /> Ready when you are
        </div>
        <h2 id="cta-title">
          Open the workspace
          <br />
          <em>and review the shortlist.</em>
        </h2>
        <Link href="/app" className="button">
          Open workspace <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
