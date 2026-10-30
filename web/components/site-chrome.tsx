"use client";

// Shared marketing chrome: SiteHeader and SiteFooter.
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#intelligence", label: "Workspace" },
  { href: "/#data", label: "Data" },
  { href: "/about#methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Lodestar home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" width={36} height={36} />
      <span>Lodestar</span>
    </Link>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className={`site-header${scrolled || open ? " scrolled" : ""}`}>
        <div className="wrap">
          <Brand />
          <nav className="site-nav" aria-label="Site">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link href="/app/data" className="text-link">
              Data explorer <ArrowRight size={14} />
            </Link>
            <Link href="/app" className="button button-small">
              Open workspace
            </Link>
          </div>
          <button
            type="button"
            className="menu-button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </header>
      {open && (
        <nav className="mobile-menu" id="mobile-menu" aria-label="Site">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="row" onClick={() => setOpen(false)}>
              {n.label} <ArrowRight size={15} />
            </Link>
          ))}
          <Link href="/app/data" className="row" onClick={() => setOpen(false)}>
            Data explorer <ArrowRight size={15} />
          </Link>
          <Link href="/app" className="button" onClick={() => setOpen(false)}>
            Open workspace
          </Link>
        </nav>
      )}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Brand />
            <p className="slogan">
              AI-assisted research.
              <br />
              Human-led decisions.
            </p>
          </div>
          <div className="footer-col">
            <h4>Workspace</h4>
            <Link href="/app">Overview</Link>
            <Link href="/app#pipeline">Review pipeline</Link>
            <Link href="/app/data">Data explorer</Link>
          </div>
          <div className="footer-col">
            <h4>Project</h4>
            <Link href="/about">About</Link>
            <Link href="/about#methodology">Methodology</Link>
            <Link href="/about#limits">Known limits</Link>
          </div>
          <div className="footer-col">
            <h4>Sources</h4>
            <Link href="/#data">Data layers</Link>
            <Link href="/app/data#runs">Workflow runs</Link>
            <Link href="/app/data">Evidence log</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ASU MSAIB capstone · TrueGrit Capital × VIMANA</span>
          <span>AI researches. People decide.</span>
        </div>
      </div>
    </footer>
  );
}
