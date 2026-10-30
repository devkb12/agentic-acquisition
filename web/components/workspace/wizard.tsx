"use client";

// Onboarding wizard: one question per card. Opens on a first visit (can't be
// dismissed), as "New search" on return visits, and pre-filled from Edit profile.
import { ArrowLeft, ArrowRight, Check, CornerDownLeft, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { emptyProfile, type Profile } from "@/lib/api";
import { CATEGORIES, ROLES, SIZE_BANDS, STATE_OPTIONS, categoriesIn, firstName } from "@/lib/profile";
import { plural } from "@/lib/format";
import { useFocusTrap } from "../use-focus-trap";

export type WizardMode = "first" | "new" | "edit";

const MAX_PRACTICES = 5;
const MIN_FINISH_MS = 2600;

export function Wizard({
  mode,
  initial,
  ready,
  counts,
  onDone,
  onClose,
}: {
  mode: WizardMode;
  initial: Profile | null;
  /** Resolves when the research data is loaded. */
  ready: Promise<unknown>;
  counts: { firms: number; evidence: number } | null;
  onDone: (p: Profile) => void;
  onClose: () => void;
}) {
  const [p, setP] = useState<Profile>(() => initial ?? emptyProfile());
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [finishing, setFinishing] = useState(false);
  const [lit, setLit] = useState(0);
  const [done, setDone] = useState(false);
  const touchedPractices = useRef(Boolean(initial?.practices.length));
  const ref = useRef<HTMLDivElement>(null);
  const dismissable = mode !== "first";
  const name = firstName(p.name) || "you";

  useFocusTrap(ref, true, dismissable && !finishing ? onClose : undefined);

  // Each new question puts the cursor in its answer.
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, [step]);

  const steps = [
    {
      eyebrow: "About you",
      question: "First, what should we call you?",
      hint: "Your name signs the review decisions you save. It stays in this browser.",
      valid: p.name.trim().length > 1,
    },
    {
      eyebrow: "Your role",
      question: `Thanks, ${name}. Which team are you reviewing for?`,
      hint: "Shown on your profile so others know who made a call.",
      valid: Boolean(p.role),
    },
    {
      eyebrow: "Geography",
      question: `Which states should ${name === "you" ? "your" : name + "'s"} view focus on?`,
      hint: "The research covers Florida and Georgia. Pick one or both.",
      valid: p.states.length > 0,
    },
    {
      eyebrow: "What a good fit looks like",
      question: "In a sentence, what kind of firm are you hoping to find?",
      hint: "For example: insurance-defense firms with workers' comp and trucking work, 20 to 100 attorneys.",
      valid: true,
    },
    {
      eyebrow: "Practice focus",
      question: `${name === "you" ? "Which" : name + ", which"} practice areas matter most?`,
      hint: `Pick up to ${MAX_PRACTICES}. We pre-selected the ones your answer mentioned. Matching firms get highlighted; scores don't change.`,
      valid: p.practices.length > 0 && Boolean(p.size),
    },
  ];
  const s = steps[step]!;
  const lastStep = step === steps.length - 1;

  const go = (to: number) => {
    setDir(to > step ? "fwd" : "back");
    if (to === 4 && !touchedPractices.current) {
      const found = categoriesIn(p.focus);
      setP((prev) => ({ ...prev, practices: found.length ? found.slice(0, MAX_PRACTICES) : ["Insurance defense"] }));
    }
    setStep(to);
  };

  const finish = () => {
    if (!s.valid) return;
    setFinishing(true);
  };

  useEffect(() => {
    if (!finishing) return;
    const timers = [1, 2, 3, 4].map((n) => setTimeout(() => setLit(n), n * 550));
    let alive = true;
    Promise.all([ready.catch(() => undefined), new Promise((r) => setTimeout(r, MIN_FINISH_MS))]).then(() => {
      if (!alive) return;
      setLit(4);
      setDone(true);
      setTimeout(() => alive && onDone(p), 650);
    });
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishing]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" || e.shiftKey || finishing) return;
    if ((e.target as HTMLElement).tagName === "BUTTON") return;
    e.preventDefault();
    if (!s.valid) return;
    if (lastStep) finish();
    else go(step + 1);
  };

  const toggle = (key: "states" | "practices", v: string) => {
    if (key === "practices") touchedPractices.current = true;
    setP((prev) => {
      const has = prev[key].includes(v);
      if (!has && key === "practices" && prev.practices.length >= MAX_PRACTICES) return prev;
      return { ...prev, [key]: has ? prev[key].filter((x) => x !== v) : [...prev[key], v] };
    });
  };

  const checklist = [
    counts ? `Loading ${plural(counts.firms, "researched firm")} from the TrueGrit sheet` : "Loading researched firms from the TrueGrit sheet",
    counts ? `Joining ${counts.evidence.toLocaleString()} evidence records to each firm` : "Joining evidence records to each firm",
    `Applying your focus: ${[...p.states, ...p.practices.slice(0, 2)].join(", ") || "all firms"}`,
    "Ranking by fit, then by score and evidence coverage",
  ];

  return (
    <div className="scrim">
      <div
        ref={ref}
        className="wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-q"
        onKeyDown={onKey}
      >
        {finishing ? (
          <div className="finish" role="status" aria-live="polite">
            <div className={`orb${done ? " done" : ""}`}>{done ? <Check size={36} /> : <span className="spinner" />}</div>
            <h2 id="wizard-q">{done ? "Your workspace is ready" : `Setting up your view, ${name}`}</h2>
            <ul className="checklist">
              {checklist.map((c, i) => (
                <li key={c} className={lit > i ? "lit" : ""}>
                  <Check size={15} /> {c}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div className="wizard-top">
              <span>
                Question {step + 1} of {steps.length}
              </span>
              {dismissable && (
                <button type="button" className="round-x" onClick={onClose} aria-label="Close">
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="progress" aria-hidden>
              <i style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>

            <div className={`wizard-step ${dir}`} key={step}>
              <div className="eyebrow">{s.eyebrow}</div>
              <h2 id="wizard-q">{s.question}</h2>
              <p className="hint">{s.hint}</p>

              {step === 0 && (
                <input
                  className="wizard-input"
                  value={p.name}
                  onChange={(e) => setP({ ...p, name: e.target.value })}
                  placeholder="Your full name"
                  autoComplete="name"
                  aria-labelledby="wizard-q"
                  data-autofocus
                />
              )}
              {step === 1 && (
                <div className="chip-grid" role="group" aria-labelledby="wizard-q">
                  {ROLES.map((r, i) => (
                    <button
                      key={r}
                      type="button"
                      className="chip"
                      aria-pressed={p.role === r}
                      onClick={() => setP({ ...p, role: r })}
                      data-autofocus={i === 0 ? true : undefined}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
              {step === 2 && (
                <div className="chip-grid" role="group" aria-labelledby="wizard-q">
                  {STATE_OPTIONS.map((o, i) => (
                    <button
                      key={o.code}
                      type="button"
                      className="chip"
                      aria-pressed={p.states.includes(o.code)}
                      onClick={() => toggle("states", o.code)}
                      data-autofocus={i === 0 ? true : undefined}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {step === 3 && (
                <textarea
                  className="wizard-input"
                  value={p.focus}
                  onChange={(e) => setP({ ...p, focus: e.target.value })}
                  placeholder="Insurance-defense firms that represent carriers…"
                  aria-labelledby="wizard-q"
                  data-autofocus
                />
              )}
              {step === 4 && (
                <>
                  <span className="label-sm" id="practice-label">
                    Practice areas · {p.practices.length}/{MAX_PRACTICES}
                  </span>
                  <div className="chip-grid" role="group" aria-labelledby="practice-label">
                    {CATEGORIES.map((c, i) => (
                      <button
                        key={c.label}
                        type="button"
                        className="chip"
                        aria-pressed={p.practices.includes(c.label)}
                        onClick={() => toggle("practices", c.label)}
                        data-autofocus={i === 0 ? true : undefined}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <span className="label-sm" id="size-label">
                    Firm size
                  </span>
                  <div className="chip-grid" role="group" aria-labelledby="size-label">
                    {SIZE_BANDS.map((b) => (
                      <button key={b.label} type="button" className="chip" aria-pressed={p.size === b.label} onClick={() => setP({ ...p, size: b.label })}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="wizard-foot">
              {step > 0 && (
                <button type="button" className="button button-small button-outline" onClick={() => go(step - 1)}>
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              <span className="enter-hint">
                Press Enter <CornerDownLeft size={11} style={{ display: "inline", verticalAlign: -1 }} />
              </span>
              <button
                type="button"
                className="button button-small"
                disabled={!s.valid}
                onClick={() => (lastStep ? finish() : go(step + 1))}
              >
                {lastStep ? "Show my firms" : "Next"} <ArrowRight size={14} />
              </button>
            </div>
            {mode === "new" && (
              <button type="button" className="back-link" onClick={onClose}>
                <ArrowLeft size={13} /> Back to your last results
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
