import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-hero" style={{ minHeight: "calc(100svh - 186px)", display: "grid", placeItems: "center" }}>
        <div className="wrap">
          <div className="label grey">Not found</div>
          <h1 className="display">This page has moved on.</h1>
          <p className="lead">The link may be old, or the firm may not have been researched yet.</p>
          <div className="hero-actions">
            <Link href="/app" className="text-link">
              Back to the workspace <span aria-hidden>→</span>
            </Link>
            <Link href="/" className="quiet-link">
              Home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
