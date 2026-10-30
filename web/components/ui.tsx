// Small shared pieces of the design system.
import type { ReactNode } from "react";
import { FIT_SHORT, STATUS_LABEL } from "@/lib/fit";
import { initials } from "@/lib/format";
import type { FieldStatus, Fit, Stage } from "@/lib/types";

export function Eyebrow({ children, live, className = "" }: { children: ReactNode; live?: boolean; className?: string }) {
  return (
    <div className={`eyebrow ${className}`}>
      {live && <span className="live-dot" aria-hidden />}
      {children}
    </div>
  );
}

/** Eyebrow that reads like a path: WORKSPACE / GOOGLE SHEET */
export function PathEyebrow({ parts }: { parts: string[] }) {
  return (
    <div className="eyebrow">
      {parts.map((p, i) => (
        <span key={p}>
          {i > 0 && <span className="sep">/ </span>}
          {p}
        </span>
      ))}
    </div>
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

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function Monogram({ name, id }: { name: string; id: string }) {
  return (
    <span className={`monogram t${hash(id) % 4}`} aria-hidden>
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
      <span className="dot yellow" aria-hidden /> {label}
    </span>
  );
}
