"use client";

// Product tour: spotlights elements marked with data-tour="…" and walks
// through the workspace and a firm page. Hosts move between views and pages.
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useFocusTrap } from "./use-focus-trap";

export type TourPage = "workspace" | "detail";
export type TourView = "overview" | "saved" | "pipeline" | "outcomes" | "profile";

export interface TourStep {
  page: TourPage;
  view?: TourView;
  target?: string;
  eyebrow: string;
  title: string;
  body: ReactNode;
}

export const TOUR_STEPS: TourStep[] = [
  {
    page: "workspace",
    eyebrow: "Welcome",
    title: "A research desk for firm screening",
    body: (
      <>
        This workspace lists every law firm the n8n research workflow has screened, ranked by fit with the sponsor
        criteria. <b>AI researches. People decide.</b> The tour takes about a minute, and you can leave it any time
        with Esc.
      </>
    ),
  },
  {
    page: "workspace",
    view: "overview",
    target: "nav",
    eyebrow: "Navigation",
    title: "Five views",
    body: (
      <ul>
        <li>
          <b>Overview</b>: every firm, ranked and filterable
        </li>
        <li>
          <b>Saved</b>: your shortlist in this browser
        </li>
        <li>
          <b>Pipeline</b> and <b>Outcomes</b>: where reviews stand
        </li>
        <li>
          <b>Profile</b>: your name and focus
        </li>
      </ul>
    ),
  },
  {
    page: "workspace",
    view: "overview",
    target: "metrics",
    eyebrow: "Overview",
    title: "Four numbers, each explained",
    body: (
      <>
        Each card says how it is counted. Sample firms from early test runs are left out unless you choose to show
        them.
      </>
    ),
  },
  {
    page: "workspace",
    view: "overview",
    target: "lookup",
    eyebrow: "Find a firm",
    title: "Jump straight to a firm",
    body: (
      <>
        Type a firm&apos;s name or web address. If the workflow has researched it, the firm is pinned to the top of the
        table. If not, you&apos;ll see how to add it to a future run.
      </>
    ),
  },
  {
    page: "workspace",
    view: "overview",
    target: "toolbar",
    eyebrow: "Firm table",
    title: "Search and sort",
    body: (
      <>
        Search by firm, city or practice area. <b>Best fit first</b> ranks High, then Moderate, then Insufficient
        information, then Low, and by score within each.
      </>
    ),
  },
  {
    page: "workspace",
    view: "overview",
    target: "filters",
    eyebrow: "Firm table",
    title: "Filter by fit and review stage",
    body: (
      <>
        The first chips filter by fit. After the divider, filter by review stage, from <b>Needs review</b> to{" "}
        <b>Not a fit</b>.
      </>
    ),
  },
  {
    page: "workspace",
    view: "overview",
    target: "first-row",
    eyebrow: "Firm table",
    title: "Reading a row",
    body: (
      <ul>
        <li>
          <b>Fit score</b> with the share of the model that had evidence. A high score on little evidence is shown
          muted.
        </li>
        <li>Attorneys are tagged Verified, Estimated or Missing.</li>
        <li>The status menu opens the firm&apos;s review panel.</li>
      </ul>
    ),
  },
  {
    page: "workspace",
    view: "pipeline",
    target: "panel-pipeline",
    eyebrow: "Pipeline",
    title: "Where every review stands",
    body: <>One column per active stage. Select a firm to open its file.</>,
  },
  {
    page: "workspace",
    view: "outcomes",
    target: "panel-outcomes",
    eyebrow: "Outcomes",
    title: "Decisions at a glance",
    body: <>Firms marked for a closer look, firms still in review, firms ruled out, and the share decided so far.</>,
  },
  {
    page: "workspace",
    view: "profile",
    target: "panel-profile",
    eyebrow: "Profile",
    title: "Your name and focus",
    body: (
      <>
        Stored in this browser only. Your name signs your review decisions. Your focus changes the order and
        highlights. It never changes a score.
      </>
    ),
  },
  {
    page: "workspace",
    view: "overview",
    target: "data-links",
    eyebrow: "Source data",
    title: "Check the raw records",
    body: <>The data explorer searches every evidence row and lists each workflow run with its errors.</>,
  },
  {
    page: "detail",
    target: "detail-score",
    eyebrow: "Firm file",
    title: "Score and why it fits",
    body: (
      <>
        The ring is the fit score on the evidence available. Below, each factor shows its points and confidence.{" "}
        <b>Not scored is not zero</b>: it means nothing was found.
      </>
    ),
  },
  {
    page: "detail",
    target: "detail-evidence",
    eyebrow: "Firm file",
    title: "Every claim has a source",
    body: <>Each evidence row shows its status, where it came from, a link, and the quoted text when there is one.</>,
  },
  {
    page: "detail",
    target: "detail-review",
    eyebrow: "Firm file",
    title: "Record your decision",
    body: (
      <>
        Choose a decision, give your reasoning and save. It goes to the Review_Queue tab of the TrueGrit sheet.{" "}
        <b>Export brief</b> prints a one-page file for the sponsors.
      </>
    ),
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_W = 390;
const GAP = 14;
const PAD = 6;

export function Tour({
  index,
  onIndex,
  onClose,
}: {
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const step = TOUR_STEPS[index]!;
  const cardRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const last = index === TOUR_STEPS.length - 1;

  const next = useCallback(() => (last ? onClose() : onIndex(index + 1)), [last, onClose, onIndex, index]);
  const back = useCallback(() => index > 0 && onIndex(index - 1), [index, onIndex]);

  useFocusTrap(cardRef, true, onClose);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back]);

  // Find the target, scroll it into view, then measure it. Retries while a view or page renders.
  useLayoutEffect(() => {
    let cancelled = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const measure = () => {
      if (cancelled) return;
      if (!step.target) {
        setRect(null);
        return;
      }
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!el) {
        if (tries++ < 30) timer = setTimeout(measure, 100);
        else setRect(null);
        return;
      }
      const tall = el.getBoundingClientRect().height > window.innerHeight * 0.6;
      el.scrollIntoView({ block: tall ? "start" : "center", behavior: "instant" as ScrollBehavior });
      if (tall) window.scrollBy({ top: -70, behavior: "instant" as ScrollBehavior });
      const r = el.getBoundingClientRect();
      setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: Math.min(r.height + PAD * 2, window.innerHeight - 24) });
    };
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [step.target, index]);

  // Place the card beside the spotlight, or centred when there is no target.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(CARD_W, vw - 24);
    const h = card.offsetHeight;
    const clampTop = (t: number) => Math.max(12, Math.min(t, vh - h - 12));
    const clampLeft = (l: number) => Math.max(12, Math.min(l, vw - w - 12));
    if (!rect) {
      setPos({ top: clampTop((vh - h) / 2), left: clampLeft((vw - w) / 2) });
      return;
    }
    if (rect.left + rect.width + GAP + w <= vw - 12) setPos({ top: clampTop(rect.top), left: rect.left + rect.width + GAP });
    else if (rect.left - GAP - w >= 12) setPos({ top: clampTop(rect.top), left: rect.left - GAP - w });
    else if (rect.top + rect.height + GAP + h <= vh - 12) setPos({ top: rect.top + rect.height + GAP, left: clampLeft(rect.left) });
    else if (rect.top - GAP - h >= 12) setPos({ top: rect.top - GAP - h, left: clampLeft(rect.left) });
    // Tall targets: dock the card to the bottom corner, over the lower part of the target.
    else setPos({ top: clampTop(vh - h - 12), left: clampLeft(vw - w - 12) });
  }, [rect, index]);

  return (
    <div className="tour-layer">
      <div className="tour-blocker" onClick={onClose} aria-hidden />
      {rect ? (
        <div className="tour-spot" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />
      ) : (
        <div className="tour-dim" />
      )}
      <div
        ref={cardRef}
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        key={index}
        style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden" }}
      >
        <div className="eyebrow">
          {String(index + 1).padStart(2, "0")} / {String(TOUR_STEPS.length).padStart(2, "0")} · {step.eyebrow}
        </div>
        <h3 id="tour-title">{step.title}</h3>
        <div className="body">{step.body}</div>
        <div className="tour-progress" aria-hidden>
          <i style={{ width: `${((index + 1) / TOUR_STEPS.length) * 100}%` }} />
        </div>
        <div className="tour-foot">
          <button type="button" className="skip" onClick={onClose}>
            Skip tour
          </button>
          {index > 0 && (
            <button type="button" className="button button-small button-outline" onClick={back}>
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <button type="button" className="button button-small" onClick={next} data-autofocus>
            {last ? (
              "Finish"
            ) : (
              <>
                <span className="long">Next step</span>
                <span className="short">Next</span> <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
        <div className="tour-keys">← → to move · Esc to close</div>
      </div>
    </div>
  );
}
