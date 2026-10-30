"use client";

// "Find a firm": looks a firm up among the researched records. Adapted from an
// on-demand analyze step, because new research runs in n8n, not in the browser.
import { CircleAlert, Search, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { lookupFirm } from "@/lib/api";
import type { FirmSummary } from "@/lib/types";
import { useFocusTrap } from "../use-focus-trap";

export function LookupModal({
  firms,
  onFound,
  onClose,
}: {
  firms: () => Promise<FirmSummary[]>;
  onFound: (f: FirmSummary) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [miss, setMiss] = useState<string | null>(null);
  useFocusTrap(ref, true, onClose);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setMiss(null);
    try {
      const hit = lookupFirm(await firms(), q);
      if (hit) onFound(hit);
      else setMiss(q.trim());
    } catch {
      setMiss(q.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby="lookup-title">
        <button type="button" className="round-x" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>
        <div className="eyebrow">Workspace / Researched firms</div>
        <h2 id="lookup-title">
          Find a <em>firm</em>
        </h2>
        <p>Look up any firm the research workflow has screened, by name or web address.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="lookup-q">Firm name or website</label>
            <input
              id="lookup-q"
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. salomonsmith.com or Salomon Smith"
              autoComplete="off"
              data-autofocus
            />
          </div>
          {miss && (
            <div className="alert" role="alert">
              <CircleAlert size={15} />
              <span>
                No researched firm matches “{miss}”. Firms appear here once the n8n workflow finds them. To include a firm,
                add its city or a matching search phrase to the workflow&apos;s Run Configuration.
              </span>
            </div>
          )}
          <button type="submit" className="button" disabled={busy || !q.trim()}>
            {busy ? (
              <>
                <span className="spinner small" /> Searching…
              </>
            ) : (
              <>
                <Search size={15} /> Find firm
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
