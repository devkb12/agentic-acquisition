// Display helpers. "Not enough data" stands in for anything missing.
import type { Fit } from "./types";

export const NO_DATA = "Not enough data";

export function compact(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return NO_DATA;
  const abs = Math.abs(n);
  if (abs >= 1e9) return trim(n / 1e9) + "B";
  if (abs >= 1e6) return trim(n / 1e6) + "M";
  if (abs >= 1e3) return trim(n / 1e3) + "k";
  return String(Math.round(n));
}

export function money(n: number | null | undefined): string {
  return n === null || n === undefined ? NO_DATA : "$" + compact(n);
}

/** "$1.2M-$2.0M (est.)" → "$1.2M – $2.0M" */
export function range(s: string | null): string {
  if (!s) return NO_DATA;
  return s.replace(/\s*\(est\.\)\s*/i, "").replace(/\s*-\s*/, " – ");
}

function trim(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export function date(s: string | null | undefined, withTime = false): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export function initials(name: string): string {
  const words = name
    .replace(/\b(law|firm|offices?|of|the|and|pllc|llc|llp|pa|pc|p\.a\.|group|&)\b/gi, " ")
    .split(/[\s,.-]+/)
    .filter((w) => /^[A-Za-z]/.test(w));
  const pick = (words.length ? words : name.split(/\s+/)).slice(0, 2);
  return pick.map((w) => w[0]!.toUpperCase()).join("") || "?";
}

export function place(city: string, state: string): string {
  return [city, state].filter(Boolean).join(", ") || NO_DATA;
}

export function scorePhrase(fit: Fit): string {
  switch (fit) {
    case "High Fit":
      return "Strong alignment";
    case "Moderate Fit":
      return "Partial alignment";
    case "Low Fit":
      return "Screened out";
    default:
      return "Too little evidence";
  }
}

export function plural(n: number, one: string, many = one + "s"): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}

/** 13052971018 → (305) 297-1018 */
export function phone(s: string | null): string | null {
  if (!s) return null;
  const d = s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : s;
}
