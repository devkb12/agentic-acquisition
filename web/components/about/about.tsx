"use client";

// About: principles, methodology (read live from the workflow settings) and known limits.
import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getWorkspace } from "@/lib/api";
import type { Config } from "@/lib/types";
import { SiteFooter, SiteHeader } from "../site-chrome";
import { Label, Reveal, ScoreBar } from "../ui";

const PRINCIPLES = [
  {
    title: "Evidence first",
    text: "Every field is labelled Verified, Estimated or Missing, and every verified claim links to the page or record it came from.",
  },
  {
    title: "Missing is not negative",
    text: "When the workflow can't find something, that part of the score is left out rather than counted as zero. The score says how much of the model it covers.",
  },
  {
    title: "Hard gates before scores",
    text: "Firms that mainly represent plaintiffs or practise criminal law are rated Low fit whatever their score.",
  },
  {
    title: "Provisional weights",
    text: "The fit weights are a starting point. They change once TrueGrit and VIMANA confirm a rubric.",
  },
  {
    title: "People decide",
    text: "The system ranks and explains. A named reviewer records every decision, with a reason, in the shared sheet.",
  },
];

const SCORECARD = [
  {
    w: "+5",
    title: "Direct insurance focus",
    terms: "insurance defense, insurer representation, carriers, panel counsel, coverage counsel, duty to defend, bad faith defense, reinsurance, TPA, subrogation",
  },
  {
    w: "+3",
    title: "Insurance-funded defense",
    terms: "casualty, general liability, trucking defense, construction defect, premises liability, professional liability, med-mal defense, workers' comp defense, product liability",
  },
  {
    w: "+1",
    title: "Relevant with insurance evidence",
    terms: "commercial litigation, employment defense, construction litigation, healthcare litigation, appellate, regulatory defense",
  },
  {
    w: "−3",
    title: "Mainly non-insurance work",
    terms: "M&A, corporate transactions, securities, tax, bankruptcy, IP, white collar, trusts & estates, immigration, family law",
  },
  {
    w: "−5",
    title: "Wrong side of the ecosystem",
    terms: "plaintiff personal injury, contingency fee, “no fee unless we win”, accident victims, policyholder representation, suing insurers",
  },
];

const LIMITS = [
  "Google Maps search returns mostly plaintiff personal-injury firms, so few strong fits surface per run.",
  "On Apify's free plan only five scraper runs can go at once; a direct homepage fetch is the fallback.",
  "Attorney counts, revenue and size are estimates unless a source verifies them.",
  "Revenue is estimated as attorneys × $300k–$500k, the sponsor's rule of thumb.",
];

export function About() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    getWorkspace()
      .then((d) => {
        setCfg(d.config);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [attempt]);

  const w = cfg?.weights ?? {};
  const t = cfg?.thresholds ?? {};
  const loc = cfg?.discovery_locations ?? {};

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="page-hero" aria-labelledby="about-title">
          <div className="wrap">
            <Label grey>About Lodestar</Label>
            <h1 id="about-title" className="display">
              Built to support
              <br />a human decision.
            </h1>
            <p className="lead">
              Lodestar is the research dashboard of Agentic Acquisition Intelligence, an ASU MSAIB capstone for TrueGrit Capital
              and VIMANA. It researches Florida and Georgia insurance-defense law firms and explains how each one fits the
              sponsors&apos; criteria.
            </p>
          </div>
        </section>

        <section className="section centered" aria-label="What this tool does">
          <div className="wrap">
            <Reveal>
              <p className="statement-line">
                This tool does research. It does not decide which firms to pursue,{" "}
                <span>and nothing in it means a firm is for sale or approved for outreach.</span>
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section split-section" id="principles" aria-labelledby="principles-title">
          <div className="wrap split-even">
            <Reveal>
              <Label>Principles</Label>
              <h2 id="principles-title" className="h2">
                Five principles
                <br />
                behind every score.
              </h2>
            </Reveal>
            <Reveal i={1}>
              <ol className="ledger">
                {PRINCIPLES.map((p, i) => (
                  <li key={p.title}>
                    <span className="key">
                      <span className="index">{String(i + 1).padStart(2, "0")}</span>
                    </span>
                    <div>
                      <h3>{p.title}</h3>
                      <p>{p.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        <section className="section centered" id="methodology" aria-labelledby="method-title">
          <div className="wrap">
            <Reveal>
              <Label>Methodology</Label>
              <h2 id="method-title" className="h2">
                What the workflow searches
                <br />
                and how it scores.
              </h2>
              <p className="lead">
                These settings are read live from the n8n workflow&apos;s Run Configuration. Change them there and the next run
                uses them.
              </p>
            </Reveal>

            {error && (
              <div className="alert" role="alert" style={{ marginTop: 28, maxWidth: 560, marginInline: "auto" }}>
                <CircleAlert size={15} strokeWidth={1.5} />
                <span>
                  Could not load the live settings. {error}{" "}
                  <button type="button" className="text-link small" onClick={() => setAttempt((a) => a + 1)}>
                    Try again ↻
                  </button>
                </span>
              </div>
            )}

            {(cfg || !error) && (
            <div className="method-grid">
              <Reveal className="mock">
                <div className="mock-top">
                  <span className="t">
                    <span>01 / </span>Where it looks
                  </span>
                  {cfg && (
                    <span className="status-line">
                      <span className="dot ok" aria-hidden /> Read live
                    </span>
                  )}
                </div>
                <div className="mock-body">
                  {cfg ? (
                    <dl className="kv">
                      <dt>Run mode</dt>
                      <dd>
                        {cfg.run_mode ?? "—"}
                        {cfg.demo_mode ? " (demo size)" : ""}
                      </dd>
                      <dt>States</dt>
                      <dd>{(cfg.states ?? []).join(", ")}</dd>
                      {Object.entries(loc).map(([k, v]) => (
                        <div key={k} style={{ display: "contents" }}>
                          <dt>{k} search cities</dt>
                          <dd>{v.join(", ")}</dd>
                        </div>
                      ))}
                      <dt>Search phrases</dt>
                      <dd>{(cfg.search_queries ?? []).join(" · ")}</dd>
                      <dt>Firms per state, per run</dt>
                      <dd>{cfg.demo_mode ? `${cfg.demo_limit_per_state} (demo)` : cfg.limit_per_state}</dd>
                      <dt>Size screen</dt>
                      <dd>
                        {cfg.size_band_attorneys?.min ?? 10}–{cfg.size_band_attorneys?.max ?? 400} attorneys
                      </dd>
                      <dt>Pages read per website</dt>
                      <dd>{cfg.scrape_max_pages ?? 8}</dd>
                    </dl>
                  ) : (
                    !error && <SkeletonRows label="Loading the live settings" />
                  )}
                </div>
              </Reveal>
              <Reveal className="mock" i={1}>
                <div className="mock-top">
                  <span className="t">
                    <span>02 / </span>How the 100 points split
                  </span>
                </div>
                <div className="mock-body">
                  {cfg ? (
                    <>
                      {Object.entries(w).map(([k, v]) => (
                        <div key={k} className="weight-row">
                          <span>{k.replace(/_/g, " ")}</span>
                          <ScoreBar value={(v / 30) * 100} />
                          <span className="num">{v}</span>
                        </div>
                      ))}
                      <dl className="kv" style={{ marginTop: 18 }}>
                        <dt>High fit</dt>
                        <dd>Normalized score ≥ {t.high ?? 70}</dd>
                        <dt>Moderate fit</dt>
                        <dd>≥ {t.moderate ?? 45}</dd>
                        <dt>Insufficient information</dt>
                        <dd>Less than {t.min_coverage ?? 40}% of the model could be scored</dd>
                        <dt>Keyword bands</dt>
                        <dd>
                          Strong ≥ {cfg.scorecard_bands?.strong ?? 15}, moderate ≥ {cfg.scorecard_bands?.moderate ?? 5}
                        </dd>
                      </dl>
                    </>
                  ) : (
                    !error && <SkeletonRows label="Loading the fit model" />
                  )}
                </div>
              </Reveal>
            </div>
            )}
          </div>
        </section>

        <section className="section split-section" aria-labelledby="scorecard-title">
          <div className="wrap split-even">
            <Reveal>
              <Label>03 / Keyword scorecard</Label>
              <h2 id="scorecard-title" className="h2">
                Sponsor criteria,
                <br />
                version 2.3.
              </h2>
              <p className="lead">
                Each term found on a firm&apos;s website counts once. The total is blended 50/50 with the AI&apos;s practice
                assessment in the insurance-defense part of the fit score.
              </p>
            </Reveal>
            <Reveal i={1}>
              <ol className="ledger tier-list">
                {SCORECARD.map((s) => (
                  <li key={s.w}>
                    <span className="key">
                      <span className={`w ${s.w.startsWith("+") ? "pos" : "neg"}`}>{s.w}</span>
                    </span>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.terms}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        <section className="section split-section" id="limits" aria-labelledby="limits-title">
          <div className="wrap split-even">
            <Reveal>
              <Label>Known limits</Label>
              <h2 id="limits-title" className="h2">
                What to keep
                <br />
                in mind.
              </h2>
            </Reveal>
            <Reveal i={1}>
              <ul className="limits">
                {LIMITS.map((l) => (
                  <li key={l}>
                    <span className="glyph" aria-hidden>
                      ◦
                    </span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="section split-section" aria-label="Name and team">
          <div className="wrap split-even">
            <Reveal>
              <Label>Why “Lodestar”</Label>
              <p className="lead" style={{ marginTop: 14, maxWidth: "none" }}>
                A lodestar is the star you steer by. In law, the lodestar method values legal work as hours times a reasonable
                rate, close to how this tool estimates a firm&apos;s revenue from its attorney count.
              </p>
            </Reveal>
            <Reveal i={1}>
              <Label>Team and sponsors</Label>
              <p className="lead" style={{ marginTop: 14, maxWidth: "none" }}>
                Built by Dev Bhattacharyya, Dareen Alsaeed, Hana Ryu and Madison Schuler for TrueGrit Capital and VIMANA. The
                output is research for a human reviewer.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="closing" aria-labelledby="cta-title">
          <div className="wrap">
            <Reveal>
              <h2 id="cta-title">
                See the research
                <br />
                behind each firm.
              </h2>
              <p className="lead">Every firm the workflow has screened, ranked by fit, with the evidence for each score.</p>
            </Reveal>
            <Reveal i={1} className="cta">
              <Link href="/app" className="button">
                Open the workspace <span className="glyph" aria-hidden>→</span>
              </Link>
              <span className="meta">Research only. A person makes every call.</span>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SkeletonRows({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} style={{ display: "grid", gap: 14, paddingTop: 6 }}>
      {[80, 60, 72, 50, 66].map((w, i) => (
        <span key={i} className="skeleton-line" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}
