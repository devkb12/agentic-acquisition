"use client";

// Pipeline, Outcomes and Profile views.
import Link from "next/link";
import { ACTIVE_STAGES, STAGE_HINT } from "@/lib/fit";
import { plural } from "@/lib/format";
import { stateLabels } from "@/lib/profile";
import type { Profile } from "@/lib/api";
import type { FirmSummary, Stage } from "@/lib/types";
import { Label, Monogram, PathLabel, stageClass } from "../ui";

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

export function ViewHead({ path, title, desc }: { path: string; title: string; desc: string }) {
  return (
    <div className="view-head">
      <div>
        <PathLabel parts={["Workspace", path]} />
        <h1>{title}</h1>
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
        title="Where each review stands today"
        desc="Firms that still need a person, grouped by review stage. Screened-out and ruled-out firms are left off."
      />
      <div className="stage-strip panel" data-tour="panel-pipeline">
        {ACTIVE_STAGES.map((s) => {
          const list = by(s);
          return (
            <section key={s} className="stage-col" aria-label={s}>
              <div className={`stage-name ${stageClass(s)}`}>{s}</div>
              <div className="stage-count">
                {list.length} <span className="muted-note">{list.length === 1 ? "firm" : "firms"}</span>
              </div>
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
        title="What reviewers have decided"
        desc="Decisions saved by reviewers. A firm marked for a closer look is not approved for outreach and is not known to be for sale."
      />
      <div className="outcome-grid panel" data-tour="panel-outcomes">
        <div className="outcome">
          <Label grey>Investigate further</Label>
          <div className="big">{investigate.length}</div>
          <p>Firms a reviewer wants to look at more closely.</p>
          {investigate.length > 0 && <FirmChips firms={investigate} />}
        </div>
        <div className="outcome">
          <Label grey>In review</Label>
          <div className="big">{inReview.length}</div>
          <p>High or moderate fits waiting for a decision, plus firms with corrected data.</p>
          {inReview.length > 0 && <FirmChips firms={inReview} />}
        </div>
        <div className="outcome">
          <Label grey>Not pursued</Label>
          <div className="big">{notFit.length}</div>
          <p>Firms a reviewer ruled out. Low-fit firms screened out automatically are not counted here.</p>
        </div>
        <div className="outcome">
          <Label grey>Decision rate</Label>
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
          <PathLabel parts={["Workspace", "Profile"]} />
          <h1>Your name and focus</h1>
          <p className="desc">
            Saved in this browser only. Your focus changes order and highlights in your view; scores always come from the
            research workflow.
          </p>
        </div>
        <button type="button" className="button button-small button-outline" onClick={onEdit}>
          Edit profile <span aria-hidden>↗</span>
        </button>
      </div>
      <div className="profile-grid panel" data-tour="panel-profile">
        <div className="profile-card">
          <Label grey>01 / Reviewer</Label>
          <div className="value">{profile.name}</div>
          <p className="muted-note">{profile.role || "No team chosen"}</p>
        </div>
        <div className="profile-card">
          <Label grey>02 / States</Label>
          <div className="chips">
            {stateLabels(profile.states).map((s) => (
              <span key={s} className="chip-tag focus">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="profile-card">
          <Label grey>03 / Practice focus</Label>
          <div className="chips">
            {profile.practices.map((p) => (
              <span key={p} className="chip-tag focus">
                {p}
              </span>
            ))}
          </div>
          {profile.focus && <p className="muted-note" style={{ marginTop: 10 }}>“{profile.focus}”</p>}
        </div>
        <div className="profile-card">
          <Label grey>04 / Firm size</Label>
          <div className="value">{profile.size || "Any size"}</div>
          <p className="muted-note">The sponsor screen is 10–400 attorneys.</p>
        </div>
      </div>
      <p style={{ marginTop: 18 }}>
        <Link href="/about#methodology" className="text-link">
          How firms are scored <span aria-hidden>→</span>
        </Link>
      </p>
    </>
  );
}
