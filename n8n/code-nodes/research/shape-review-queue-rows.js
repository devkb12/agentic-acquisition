// n8n Code node: Shape Review_Queue Rows
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// Stage 9 human gate: only High/Moderate Fit firms are queued. Reviewer columns (reviewer_decision, reviewer_notes, reviewed_by)
// are intentionally NOT written here so reruns never overwrite a human decision. Blank decision = pending.
function j(a) { return Array.isArray(a) ? a.join('; ') : (a || ''); }
return $input.all().filter(function (it) { return it.json.review_required; }).map(function (it) {
  const r = it.json;
  return { json: {
    company_id: r.company_id, company_name: r.company_name, state: r.state, website: r.website || '', final_fit: r.final_fit, acquisition_score: r.acquisition_score,
    evidence_coverage_pct: r.evidence_coverage_pct, data_confidence: r.data_confidence, why_queued: r.reason,
    verification_needed: j(r.all_missing_information), recommended_next_action: r.recommended_next_action,
    queue_note: 'Research candidate only - awaiting human review. NOT approved for outreach. Not indicated as for sale.',
    data_mode: r.data_mode, queued_at: r.scored_at, run_id: r.run_id,
  } };
});