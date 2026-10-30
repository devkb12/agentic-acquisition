import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="phase" style={{ minHeight: "100vh" }}>
      <div className="phase-box">
        <div className="eyebrow">404</div>
        <h2>
          This page <em>isn&apos;t here</em>
        </h2>
        <p>The link may be old, or the firm may not have been researched.</p>
        <Link href="/app" className="button button-small">
          <ArrowLeft size={14} /> Back to the workspace
        </Link>
      </div>
    </main>
  );
}
