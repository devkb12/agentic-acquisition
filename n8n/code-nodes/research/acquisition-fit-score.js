// n8n Code node: Acquisition Fit Score
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

const cfg = $('Run Configuration').first().json;
const W = cfg.weights, T = cfg.thresholds;
const r = $json;
const ent = r.enrichment || {};
const comps = [];
function round1(x) { return Math.round(x * 10) / 10; }
function add(key, label, max, pts, note) { comps.push({ key: key, label: label, max: max, points: pts === null ? null : round1(pts), scored: pts !== null, note: note }); }

// 1. Insurance-defense practice fit (AI, evidence-grounded)
const idf = r.insurance_defense_fit;
const aiF = idf === 'Strong' ? 1 : idf === 'Partial' ? 0.5 : idf === 'None' ? 0 : null;
const SB = cfg.scorecard_bands || { strong: 15, moderate: 5 };
const sc = r.insurance_score;
const scF = (sc === null || sc === undefined) ? null : sc >= SB.strong ? 1 : sc >= SB.moderate ? 0.6 : sc >= 0 ? 0.2 : 0;
const insF = aiF === null ? scF : scF === null ? aiF : (aiF + scF) / 2;
add('insurance_defense', 'Insurance-defense practice fit', W.insurance_defense, insF === null ? null : W.insurance_defense * insF,
  'AI assessment: ' + idf + '; keyword scorecard: ' + (sc === null || sc === undefined ? 'n/a' : sc + ' (' + r.insurance_band + ')'));
// 2. Geography
const geo = (r.state === 'FL' || r.state === 'GA');
add('geography', 'Florida/Georgia geographic fit', W.geography, geo ? W.geography : 0, 'State: ' + r.state);
// 3. B2B focus
const b = r.b2b_focus;
add('b2b', 'B2B client focus', W.b2b, b === 'Primarily B2B/Insurers' ? W.b2b : b === 'Mixed' ? W.b2b * 0.5 : b === 'Primarily Consumer' ? 0 : null, 'AI assessment: ' + b);
// 4. Size (attorney count; revenue is not required)
const att = r.attorney_count;
let szf = null;
const SZ = cfg.size_band_attorneys || { min: 10, max: 400 };
if (att !== null && att !== undefined) szf = (att >= SZ.min && att <= SZ.max) ? 1 : (att >= 5 && att < SZ.min) ? 0.5 : att > SZ.max ? 0.4 : 0.2;
add('size', 'Firm size and revenue suitability', W.size, szf === null ? null : W.size * szf, att === null || att === undefined ? 'Attorney count unknown' : 'Attorneys: ' + att);
// 5. Operating history
const yrs = r.years_in_operation;
add('history', 'Operating history', W.history, (yrs === null || yrs === undefined) ? null : W.history * (yrs >= 10 ? 1 : yrs >= 5 ? 0.5 : 0.2),
  (yrs === null || yrs === undefined) ? 'Year founded unknown' : 'Years in operation: ' + yrs);
// 6. Evidence-backed strategic / succession signals (only signals that carry a source URL and a quote)
const sigs = (ent.evidence_backed_signals || []).filter(function (s) { return s && s.source_url && s.evidence_quote; });
add('strategic', 'Evidence-backed strategic or succession signals', W.strategic, sigs.length >= 2 ? W.strategic : sigs.length === 1 ? W.strategic * 0.5 : null,
  sigs.length ? sigs.length + ' sourced signal(s)' : 'No sourced signals found (not treated as negative)');
// 7. Data completeness and reliability
const checks = [r.website, r.phone, r.address, r.year_founded, r.attorney_count, r.employee_count, r.revenue,
  (r.leadership || []).length, (r.offices || []).length, (r.practice_areas || []).length, r.organization_type];
const have = checks.filter(function (v) { return v !== null && v !== undefined && v !== '' && v !== 0; }).length;
const share = have / checks.length;
add('completeness', 'Data completeness and reliability', W.completeness, W.completeness * share * (r.data_mode === 'LIVE' ? 1 : 0.5), have + ' of ' + checks.length + ' key fields known');

const totalPossible = comps.reduce(function (s, c) { return s + c.max; }, 0);
const scored = comps.filter(function (c) { return c.scored; });
const observed = round1(scored.reduce(function (s, c) { return s + c.points; }, 0));
const maxSupported = round1(scored.reduce(function (s, c) { return s + c.max; }, 0));
const coveragePct = Math.round(maxSupported / totalPossible * 100);
const normalized = maxSupported > 0 ? Math.round(observed / maxSupported * 100) : null;

// Classification with hard gates
const risks = [];
let fit;
if (r.classification_error) { fit = 'Insufficient Information'; risks.push('AI classification failed'); }
else if (r.defense_vs_plaintiff === 'Plaintiff') { fit = 'Low Fit'; risks.push('Disqualifying: predominantly plaintiff-side per website evidence (sponsor criterion: defense, not plaintiff)'); }
else if (r.civil_vs_criminal === 'Criminal') { fit = 'Low Fit'; risks.push('Disqualifying: predominantly criminal practice (sponsor criterion: civil, not criminal)'); }
else if (idf === 'None' || r.target_classification === 'Low Fit') { fit = 'Low Fit'; risks.push('Disqualifying: not an insurance-defense / B2B practice per evidence'); }
else if (coveragePct < T.min_coverage || normalized === null) { fit = 'Insufficient Information'; }
else if (normalized >= T.high) fit = 'High Fit';
else if (normalized >= T.moderate) fit = 'Moderate Fit';
else fit = 'Low Fit';

const conf = r.confidence_score || 0;
const dataConfidence = (r.data_mode !== 'LIVE') ? 'Low (sample/demo data - not verified)' : (coveragePct >= 75 && conf >= 0.7) ? 'High' : (coveragePct >= 50 && conf >= 0.5) ? 'Medium' : 'Low';

const positives = [];
scored.forEach(function (c) { if (c.points >= c.max * 0.75 && c.max > 0) positives.push(c.label + ' (' + c.points + '/' + c.max + '): ' + c.note); });
sigs.forEach(function (s) { positives.push('Signal (' + s.type + '): ' + s.signal + ' [' + s.source_url + ']'); });
(r.potential_risks || []).forEach(function (x) { risks.push(x); });
if (r.enrichment_status === 'failed') risks.push('Enrichment step failed');

const unscored = comps.filter(function (c) { return !c.scored; }).map(function (c) { return 'Unscored: ' + c.label; });
const missing = Array.from(new Set((r.missing_information || []).concat(unscored)));
if (!r.revenue) missing.push('Revenue (unknown - attorney count needed for estimate)');

let next;
if (fit === 'Insufficient Information') next = 'Collect more evidence (' + (missing.slice(0, 3).join('; ') || 'website and registry data') + ') and rerun classification.';
else if (fit === 'Low Fit') next = 'Deprioritize; archive unless a human reviewer sees a reason to revisit.';
else next = 'Human reviewer: verify practice mix and firm size from primary sources, confirm leadership/ownership structure via public registries, and research revenue range from credible sources. Do not contact the firm until TrueGrit/VIMANA approves.';

const explanation = 'Observed ' + observed + ' of ' + maxSupported + ' scoreable points (evidence coverage ' + coveragePct + '% of the 100-point model; normalized ' + (normalized === null ? 'n/a' : normalized + '/100') + '). ' +
  comps.map(function (c) { return c.label + ': ' + (c.scored ? c.points + '/' + c.max : 'unscored (' + c.note + ')'); }).join(' | ') + '. Weights are provisional pending sponsor confirmation.';

const out = Object.assign({}, r, {
  acquisition_score: observed, max_supported_points: maxSupported, evidence_coverage_pct: coveragePct, normalized_score: normalized,
  final_fit: fit, data_confidence: dataConfidence, score_breakdown: comps, positive_indicators: positives, risk_factors: risks,
  all_missing_information: missing, score_explanation: explanation, recommended_next_action: next,
  review_required: (fit === 'High Fit' || fit === 'Moderate Fit'),
  run_id: String($execution.id), scored_at: new Date().toISOString(),
});
return { json: out };