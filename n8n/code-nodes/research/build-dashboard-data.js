// n8n Code node: Build Dashboard Data
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

const items = $input.all().map(function (i) { return i.json; });
const stats = (items[0] && items[0]._stats) || {};
const ds = (items[0] && items[0]._discovery_stats) || {};
const count = function (fn) { return items.filter(fn).length; };
const ranked = items.slice().sort(function (a, b) { return (b.normalized_score === null ? -1 : b.normalized_score) - (a.normalized_score === null ? -1 : a.normalized_score); });
const missingFreq = {};
items.forEach(function (r) { (r.all_missing_information || []).forEach(function (m) { missingFreq[m] = (missingFreq[m] || 0) + 1; }); });
const top = ranked.filter(function (r) { return r.final_fit === 'High Fit' || r.final_fit === 'Moderate Fit'; }).slice(0, 10);
const row = function (r) { return { company: r.company_name, state: r.state, city: r.city, practice_areas: r.practice_areas, attorneys: r.attorney_count, years_in_operation: r.years_in_operation,
  final_fit: r.final_fit, score_observed: r.acquisition_score, max_supported: r.max_supported_points, evidence_coverage_pct: r.evidence_coverage_pct, normalized_score: r.normalized_score,
  data_confidence: r.data_confidence, next_action: r.recommended_next_action, sources: r.ai_source_urls, data_mode: r.data_mode }; };
const dash = {
  run_id: String($execution.id), generated_at: new Date().toISOString(),
  run_mode: $('Run Configuration').first().json.run_mode,
  data_mode: Array.from(new Set(items.map(function (r) { return r.data_mode; }))).join(','),
  total_companies: items.length, florida: count(function (r) { return r.state === 'FL'; }), georgia: count(function (r) { return r.state === 'GA'; }),
  high_fit: count(function (r) { return r.final_fit === 'High Fit'; }), moderate_fit: count(function (r) { return r.final_fit === 'Moderate Fit'; }),
  low_fit: count(function (r) { return r.final_fit === 'Low Fit'; }), insufficient_information: count(function (r) { return r.final_fit === 'Insufficient Information'; }),
  top_candidates: top.map(row), comparison: ranked.map(row),
  missing_information_summary: Object.keys(missingFreq).map(function (k) { return { item: k, companies: missingFreq[k] }; }).sort(function (a, b) { return b.companies - a.companies; }).slice(0, 15),
  ai_failures: count(function (r) { return r.classification_error; }), enrichment_failures: count(function (r) { return r.enrichment_status === 'failed'; }),
  discovered: (ds.place_results !== undefined ? ds.place_results : stats.discovered) || 0, rejected: (stats.rejected || 0) + (ds.out_of_scope_state || 0) + (ds.not_law || 0) + (ds.no_website || 0) + (ds.closed || 0),
  duplicates_removed: (stats.duplicates_removed || 0) + (ds.merged_duplicates || 0), over_limit_dropped: (stats.over_limit_dropped || 0) + (ds.over_limit || 0),
  source_counts: { serpapi: ds.serpapi || 0, apify_maps: ds.apify || 0, sunbiz: ds.sunbiz || 0, usaspending: ds.usaspending || 0, registry_matched: ds.registry_matched || 0, source_errors: ds.errors || 0 },
};
return [{ json: dash }];