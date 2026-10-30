"use client";

// Pipeline, Outcomes and Profile views.
import { ArrowRight, CircleCheck, Hourglass, Pencil, Percent, Ban } from "lucide-react";
import Link from "next/link";
import { ACTIVE_STAGES, STAGE_HINT } from "@/lib/fit";
import { plural } from "@/lib/format";
import { stateLabels } from "@/lib/profile";
import type { Profile } from "@/lib/api";
import type { FirmSummary, Stage } from "@/lib/types";
import { Monogram, PathEyebrow, stageClass } from "../ui";

const LIST_MAX = 8;

function FirmLinks({ firms }: { firms: FirmSummary[] }) {
  return (
    <ul>
      {firms.slice(0, LIST_MAX).map((f) => (
        <li key={f.id}>
          <Link href={`/firms/${encodeURIComponent(f.id)}`}>
            <Monogram name={f.name} id={f.id} />
            <span>{f.name}</span>
          </Link>
        </li>
      ))}
      {firms.length > LIST_MAX && <li className="muted-note">+ {firms.length - LIST_MAX} more in Overview</li>}
    </ul>
  );
}

export function ViewHead({ path, title, accent, desc }: { path: string; title: string; accent: string; desc: string }) {
  return (
    <div className="view-head">
      <div>
        <PathEyebrow parts={["Workspace", path]} />
        <h1>
          {title} <em>{accent}</em>
        </h1>
        <p className="desc">{desc}</p>
      </div>
    </div>
  );
}

export function PipelineView({ firms }: { firms: FirmSummary[] }) {
  const by = (s: Stage) => firms.filter((f) => f.stage === s);
  return (
    <>
      <ViewHead
        path="Pipeline"
        title="Where each review"
        accent="stands today"
        desc="Firms that still need a person, grouped by review stage. Screened-out and ruled-out firms are left off."
      />
      <div className="stage-strip" data-tour="panel-pipeline">
        {ACTIVE_STAGES.map((s) => {
          const list = by(s);
          return (
            <section key={s} className="stage-col" aria-label={s}>
              <div className={`stage-name ${stageClass(s)}`} style={{ border: 0 }}>
                <span className="dot cyan" aria-hidden /> {s}
              </div>
              <div className="stage-count">{plural(list.length, "firm")}</div>
              <p className="hint">{STAGE_HINT[s]}</p>
              {list.length ? <FirmLinks firms={list} /> : <p className="muted-note">None right now.</p>}
            </section>
          );
        })}
      </div>
    </>
  );
}

export function OutcomesView({ firms }: { firms: FirmSummary[] }) {
  const investigate = firms.filter((f) => f.stage === "Investigate further");
  const inReview = firms.filter((f) => f.stage === "Needs review" || f.stage === "Data corrected");
  const notFit = firms.filter((f) => f.stage === "Not a fit");
  const decided = firms.filter((f) => f.decision);
  const queued = firms.filter((f) => f.decision || f.stage === "Needs review");
  const rate = queued.length ? Math.round((decided.length / queued.length) * 100) : null;
  return (
    <>
      <ViewHead
        path="Outcomes"
        title="What reviewers"
        accent="have decided"
        desc="Decisions saved by reviewers. A firm marked for a closer look is not approved for outreach and is not known to be for sale."
      />
      <div className="outcome-grid" data-tour="panel-outcomes">
        <div className="card outcome">
          <div className="eyebrow">
            <CircleCheck size={13} /> Investigate further
          </div>
          <div className="big">{investigate.length}</div>
          <p>Firms a reviewer wants to look at more closely.</p>
          {investigate.length > 0 && <FirmChips firms={investigate} />}
        </div>
        <div className="card outcome">
          <div className="eyebrow">
            <Hourglass size={13} /> In review
          </div>
          <div className="big">{inReview.length}</div>
          <p>High or moderate fits waiting for a decision, plus firms with corrected data.</p>
          {inReview.length > 0 && <FirmChips firms={inReview} />}
        </div>
        <div className="card outcome">
          <div className="eyebrow">
            <Ban size={13} /> Not pursued
          </div>
          <div className="big">{notFit.length}</div>
          <p>Firms a reviewer ruled out. Low-fit firms screened out automatically are not counted here.</p>
        </div>
        <div className="card outcome">
          <div className="eyebrow">
            <Percent size={13} /> Decision rate
          </div>
          <div className="big">{rate === null ? "—" : `${rate}%`}</div>
          <p>
            {decided.length} of {plural(queued.length, "queued firm")} have a saved decision.
          </p>
        </div>
      </div>
    </>
  );
}

function FirmChips({ firms }: { firms: FirmSummary[] }) {
  return (
    <ul>
      {firms.slice(0, 6).map((f) => (
        <li key={f.id}>
          <Link className="chip-tag" href={`/firms/${encodeURIComponent(f.id)}`}>
            {f.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ProfileView({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  return (
    <>
      <div className="view-head">
        <div>
          <PathEyebrow parts={["Workspace", "Profile"]} />
          <h1>
            Your name <em>and focus</em>
          </h1>
          <p className="desc">
            Saved in this browser only. Your focus changes order and highlights in your view; scores always come from the
            research workflow.
          </p>
        </div>
        <button type="button" className="button button-small" onClick={onEdit}>
          <Pencil size={14} /> Edit profile
        </button>
      </div>
      <div className="profile-grid" data-tour="panel-profile">
        <div className="card profile-card">
          <div className="eyebrow">01 · Reviewer</div>
          <div className="value">{profile.name}</div>
          <p className="muted-note">{profile.role || "No team chosen"}</p>
        </div>
        <div className="card profile-card">
          <div className="eyebrow">02 · States</div>
          <div className="chips">
            {stateLabels(profile.states).map((s) => (
              <span key={s} className="chip-tag focus">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="card profile-card">
          <div className="eyebrow">03 · Practice focus</div>
          <div className="chips">
            {profile.practices.map((p) => (
              <span key={p} className="chip-tag focus">
                {p}
              </span>
            ))}
          </div>
          {profile.focus && <p className="muted-note" style={{ marginTop: 10 }}>“{profile.focus}”</p>}
        </div>
        <div className="card profile-card">
          <div className="eyebrow">04 · Firm size</div>
          <div className="value">{profile.size || "Any size"}</div>
          <p className="muted-note">The sponsor screen is 10–400 attorneys.</p>
        </div>
      </div>
      <p style={{ marginTop: 18 }}>
        <Link href="/about#methodology" className="text-link small muted">
          How firms are scored <ArrowRight size={13} />
        </Link>
      </p>
    </>
  );
}
