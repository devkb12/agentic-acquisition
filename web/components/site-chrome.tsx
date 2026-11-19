"use client";

// Shared chrome: the marketing header and footer, and the menu popover with the
// theme switch that every page uses.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { applyTheme, readTheme, type ThemeChoice } from "@/lib/theme";
import { Wordmark } from "./ui";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about#methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export function ThemeSwitch() {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(readTheme());
  }, []);

  const pick = (c: ThemeChoice) => {
    setChoice(c);
    applyTheme(c);
  };

  return (
    <div className="theme-switch" role="group" aria-label="Theme">
      {(["light", "dark", "system"] as const).map((c) => (
        <button key={c} type="button" aria-pressed={choice === c} onClick={() => pick(c)}>
          {c === "light" ? "Light" : c === "dark" ? "Dark" : "System"}
        </button>
      ))}
    </div>
  );
}

interface MenuLink {
  href: string;
  label: string;
  mobileOnly?: boolean;
}

/** A 44px menu trigger that opens a small popover of links plus the theme switch. */
export function Menu({ links = [], up, framed, label = "Menu" }: { links?: MenuLink[]; up?: boolean; framed?: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button
        ref={trigger}
        type="button"
        className={`menu-trigger${framed ? " framed" : ""}`}
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? `Close ${label.toLowerCase()}` : label}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {open ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /> : <path d="M2.5 5h11M2.5 11h11" />}
        </svg>
      </button>
      {open && (
        <div className={`popover${up ? " up" : ""}`} id={id}>
          {links.map((l) => (
            <Link key={l.href + l.label} href={l.href} className={`row${l.mobileOnly ? " mobile-only" : ""}`} onClick={() => setOpen(false)}>
              {l.label} <span className="glyph" aria-hidden>→</span>
            </Link>
          ))}
          {links.length > 0 && <hr />}
          <div className="label">Theme</div>
          <ThemeSwitch />
        </div>
      )}
    </div>
  );
}

export function Brand() {
  return (
    <Link href="/" aria-label="Lodestar home" className="wordmark-link">
      <Wordmark />
    </Link>
  );
}

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="wrap">
        <Brand />
        <nav className="site-nav" aria-label="Site">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="desktop-only" aria-current={path === n.href ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
          <Link href="/app" className="primary">
            Open workspace <span className="glyph" aria-hidden>→</span>
          </Link>
        </nav>
        <Menu
          links={[
            ...NAV.map((n) => ({ ...n, mobileOnly: true })),
            { href: "/#workspace", label: "Workspace preview" },
            { href: "/app/data", label: "Data explorer" },
          ]}
        />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <Link href="/" aria-label="Lodestar home">
          <Wordmark small />
        </Link>
        <span>AI researches. People decide.</span>
        <span className="push">ASU MSAIB capstone · TrueGrit Capital × VIMANA · 2026</span>
      </div>
    </footer>
  );
}
