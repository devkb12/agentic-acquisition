"use client";

// About: principles, methodology (read live from the workflow settings) and known limits.
import { CircleAlert, Gavel, Info, Scale, ShieldCheck, SearchCheck, TriangleAlert, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getWorkspace } from "@/lib/api";
import type { Config } from "@/lib/types";
import { SiteFooter, SiteHeader } from "../site-chrome";
import { ScoreBar } from "../ui";

const PRINCIPLES = [
  {
    icon: SearchCheck,
    title: "Evidence first",
    text: "Every field is labelled Verified, Estimated or Missing, and every verified claim links to the page or record it came from.",
  },
  {
    icon: Info,
    title: "Missing is not negative",
    text: "When the workflow can't find something, that part of the score is left out rather than counted as zero. The score says how much of the model it covers.",
  },
  {
    icon: Scale,
    title: "Hard gates before scores",
    text: "Firms that mainly represent plaintiffs or practise criminal law are rated Low fit whatever their score.",
  },
  {
    icon: TriangleAlert,
    title: "Provisional weights",
    text: "The fit weights are a starting point. They change once TrueGrit and VIMANA confirm a rubric.",
  },
  {
    icon: Users,
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

  useEffect(() => {
    getWorkspace()
      .then((d) => setCfg(d.config))
      .catch((e: Error) => setError(e.message));
  }, []);

  const w = cfg?.weights ?? {};
  const t = cfg?.thresholds ?? {};
  const loc = cfg?.discovery_locations ?? {};

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="subpage" aria-labelledby="about-title">
          <div className="glow" aria-hidden />
          <div className="grid-bg grid-hero" aria-hidden />
          <div className="wrap" style={{ position: "relative" }}>
            <div className="eyebrow">About</div>
            <h1 id="about-title">
              Built to support
              <br />
              <em>a human decision.</em>
            </h1>
            <p className="lead">
              Agentic Acquisition Intelligence is an ASU MSAIB capstone for TrueGrit Capital and VIMANA. It researches Florida
              and Georgia insurance-defense law firms and explains how each one fits the sponsors&apos; criteria.
            </p>
          </div>
        </section>

        <div className="wrap">
          <p className="statement">
            This tool does research. <b>It does not decide which firms to pursue</b>, and nothing in it means a firm is for
            sale or approved for outreach.
          </p>

          <section className="principles" aria-labelledby="principles-title">
            <h2 id="principles-title">
              Five principles
              <br />
              <em>behind every score.</em>
            </h2>
            <ol className="principle-list">
              {PRINCIPLES.map((p, i) => (
                <li key={p.title}>
                  <span className="index">{String(i + 1).padStart(2, "0")}</span>
                  <p.icon size={18} aria-hidden />
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="method" id="methodology" aria-labelledby="method-title">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <div>
                <div className="eyebrow">Methodology</div>
                <h2 id="method-title" style={{ fontSize: "clamp(32px, 3.6vw, 44px)", lineHeight: 1.1, margin: "14px 0 0" }}>
                  What the workflow searches
                  <br />
                  <em>and how it scores.</em>
                </h2>
              </div>
              <p className="lead">
                These settings are read live from the n8n workflow&apos;s Run Configuration. Change them there and the next run
                uses them.
              </p>
            </div>

            {error && (
              <div className="alert" role="alert" style={{ marginTop: 24 }}>
                <CircleAlert size={15} /> <span>Could not load the live settings. {error}</span>
              </div>
            )}

            <div className="method-grid">
              <div className="panel">
                <div className="eyebrow">01 · Scope</div>
                <h3>Where it looks</h3>
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
                  !error && <span className="spinner" role="status" aria-label="Loading settings" />
                )}
              </div>
              <div className="panel">
                <div className="eyebrow">02 · Fit model</div>
                <h3>How the 100 points split</h3>
                {Object.entries(w).map(([k, v]) => (
                  <div key={k} className="weight-row">
                    <span>{k.replace(/_/g, " ")}</span>
                    <ScoreBar value={(v / 30) * 100} />
                    <span className="num">{v}</span>
                  </div>
                ))}
                {cfg && (
                  <dl className="kv" style={{ marginTop: 16 }}>
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
                )}
              </div>
            </div>

            <div className="eyebrow" style={{ marginTop: 40 }}>
              03 · Insurance keyword scorecard (sponsor criteria v2.3)
            </div>
            <p className="lead" style={{ maxWidth: 700, marginTop: 8 }}>
              Each term found on a firm&apos;s website counts once. The total is blended 50/50 with the AI&apos;s practice
              assessment in the insurance-defense part of the fit score.
            </p>
            <div className="tiers">
              {SCORECARD.map((s) => (
                <div key={s.w} className="card tier">
                  <b className={s.w.startsWith("+") ? "pos" : "neg"}>{s.w}</b>
                  <h4>{s.title}</h4>
                  <p>{s.terms}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="method" id="limits" aria-labelledby="limits-title">
            <div className="eyebrow">Known limits</div>
            <h2 id="limits-title" style={{ fontSize: "clamp(28px, 3vw, 38px)", margin: "14px 0 0" }}>
              What to keep <em>in mind.</em>
            </h2>
            <ul className="limits">
              {LIMITS.map((l) => (
                <li key={l}>
                  <TriangleAlert size={14} aria-hidden /> <span>{l}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="context-box">
            <ShieldCheck size={22} aria-hidden />
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                <Gavel size={12} /> Team and sponsors
              </div>
              <p>
                Built by Dev Bhattacharyya, Dareen Alsaeed, Hana Ryu and Madison Schuler for TrueGrit Capital and VIMANA. The
                output is research for a human reviewer.
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
