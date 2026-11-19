"use client";

// Small shared pieces of the design system.
import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { FIT_SHORT, STATUS_LABEL } from "@/lib/fit";
import { initials } from "@/lib/format";
import type { FieldStatus, Fit, Stage } from "@/lib/types";

/** 12px blue section label (or grey with `grey`). */
export function Label({ children, grey, live, className = "" }: { children: ReactNode; grey?: boolean; live?: boolean; className?: string }) {
  return (
    <div className={`label${grey ? " grey" : ""} ${className}`}>
      {live && <span className="live-dot" aria-hidden />}
      {children}
    </div>
  );
}

/** Label that reads like a path: Workspace / TrueGrit sheet */
export function PathLabel({ parts }: { parts: string[] }) {
  return (
    <div className="label">
      {parts.map((p, i) => (
        <Fragment key={p}>
          {i > 0 && (
            <span className="sep" aria-hidden>
              /
            </span>
          )}
          <span>{p}</span>
        </Fragment>
      ))}
    </div>
  );
}

/** The Lodestar star, drawn in the accent color. */
export function StarMark({ className = "mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden fill="none">
      <circle cx="32" cy="34" r="20.5" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
      <path d="M32 1.5 38 28 57 34 38 40 32 62.5 26 40 7 34 26 28Z" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ small }: { small?: boolean }) {
  return (
    <span className={`wordmark${small ? " small" : ""}`}>
      <StarMark />
      <span className="word">lodestar</span>
    </span>
  );
}

const FIT_CLASS: Record<Fit, string> = {
  "High Fit": "fit-high",
  "Moderate Fit": "fit-moderate",
  "Low Fit": "fit-low",
  "Insufficient Information": "fit-insufficient",
};

export function FitPill({ fit }: { fit: Fit }) {
  return <span className={`fit ${FIT_CLASS[fit]}`}>{fit === "Insufficient Information" ? "Insufficient info" : fit}</span>;
}

export function fitShort(fit: Fit) {
  return FIT_SHORT[fit];
}

export function StatusTag({ status }: { status: FieldStatus }) {
  return <span className={`tag ${status}`}>{STATUS_LABEL[status]}</span>;
}

export function ScoreBar({ value, muted, thick }: { value: number | null; muted?: boolean; thick?: boolean }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className={`score-bar${muted ? " muted" : ""}${thick ? " thick" : ""}`} aria-hidden>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Fit score as a thin ring with a serif numeral. */
export function ScoreRing({ value, muted, label }: { value: number | null; muted?: boolean; label: string }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className={`score-ring${muted ? " muted" : ""}`} role="img" aria-label={label}>
      <svg viewBox="0 0 64 64" aria-hidden>
        <circle className="track" cx="32" cy="32" r={r} fill="none" strokeWidth="3" />
        <circle className="arc" cx="32" cy="32" r={r} fill="none" strokeWidth="3" strokeDasharray={`${(pct / 100) * c} ${c}`} />
      </svg>
      <span className="n" aria-hidden>
        {value ?? "—"}
      </span>
    </div>
  );
}

export function Monogram({ name }: { name: string; id?: string }) {
  return (
    <span className="monogram" aria-hidden>
      {initials(name)}
    </span>
  );
}

export function stageClass(stage: Stage) {
  return "st-" + stage.toLowerCase().replace(/\s+/g, "-");
}

export function DataBadge({ label }: { label: string }) {
  return (
    <span className="data-badge" title="Where this data comes from">
      <span className="dot warn" aria-hidden /> {label}
    </span>
  );
}

/** Marks an element as entered the first time it scrolls into view (CSS plays `rise` once). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.dataset.entered = "true";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.entered = "true";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function Reveal({ children, i = 0, className, as = "div" }: { children: ReactNode; i?: number; className?: string; as?: "div" | "li" | "section" }) {
  const ref = useReveal<HTMLDivElement>();
  const Tag = as as "div";
  return (
    <Tag ref={ref} className={className} data-reveal="" style={i ? ({ "--i": i } as CSSProperties) : undefined}>
      {children}
    </Tag>
  );
}
