// n8n Code node: Merge Classification
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

const bases = $('Clean and Deduplicate').all();
const now = new Date().toISOString();
const year = new Date().getFullYear();
function num(s) {
  if (s === null || s === undefined) return null;
  const m = String(s).match(/[0-9][0-9,]*/);
  if (!m) return null;
  const n = parseInt(m[0].split(',').join(''), 10);
  return isNaN(n) ? null : n;
}
function yr(s) {
  const m = String(s || '').match(/(1[89][0-9]{2}|20[0-9]{2})/);
  const y = m ? parseInt(m[1], 10) : null;
  return (y && y <= year) ? y : null;
}
function known(v) { return v !== null && v !== undefined && String(v).trim() !== '' && String(v).toLowerCase() !== 'unknown'; }
function mergeOne(base, row) {
const ai = row.output;
const isLive = base.data_mode === 'LIVE';
const rec = Object.assign({}, base);
if (!ai || typeof ai !== 'object') {
  Object.assign(rec, {
    classification_error: true, classification_error_detail: String(row.error || 'AI classification returned no valid structured output'),
    insurance_defense_fit: 'Unknown', b2b_focus: 'Unknown', practice_areas: [], target_classification: 'Insufficient Information',
    reason: 'AI classification failed; no judgment made.', potential_opportunity: '', potential_risks: [], confidence_score: 0,
    missing_information: ['AI classification failed - rerun'], ai_source_urls: base.source_urls || [],
    year_founded: null, years_in_operation: null, attorney_count: null, employee_count: null, revenue: null, revenue_status: 'unknown',
    organization_type: null, offices: [], leadership: [], hiring_signals: [], description: '', provenance: base.sources || [], enrichment: null, enrichment_status: 'not_applicable',
  });
  return { json: rec };
}
const f = ai.extracted_facts || {};
const evid = Array.isArray(ai.field_evidence) ? ai.field_evidence : [];
const prov = (base.sources || []).slice();
evid.forEach(function (e) {
  let status = e.status;
  if (!isLive) status = known(e.value) ? 'sample_demo' : 'unknown';
  else if (status === 'verified' && !(e.source_url && e.evidence_quote)) status = 'estimated';
  prov.push({ field: e.field, value: e.value, source: 'AI extraction from retrieved text', url: e.source_url || '', evidence_quote: e.evidence_quote || '', status: status, extracted_at: now });
});
const yf = yr(f.year_founded);
const revenue = known(f.revenue) ? String(f.revenue) : null;
const revEv = evid.filter(function (e) { return e.field === 'revenue'; })[0];
Object.assign(rec, {
  classification_error: false,
  insurance_defense_fit: ai.insurance_defense_fit, b2b_focus: ai.b2b_focus, practice_areas: ai.practice_areas || [],
  target_classification: ai.target_classification, reason: ai.reason, potential_opportunity: ai.potential_opportunity,
  potential_risks: ai.potential_risks || [], confidence_score: Math.max(0, Math.min(1, Number(ai.confidence_score) || 0)),
  missing_information: ai.missing_information || [], ai_source_urls: ai.source_urls || base.source_urls || [],
  year_founded: yf, years_in_operation: yf ? year - yf : null,
  attorney_count: num(f.attorney_count), employee_count: num(f.employee_count),
  revenue: revenue, revenue_status: revenue ? (!isLive ? 'sample_demo' : (revEv && revEv.status === 'verified' ? 'verified' : 'estimated')) : 'unknown',
  organization_type: known(f.organization_type) ? f.organization_type : null,
  offices: f.offices || [], leadership: f.leadership || [], hiring_signals: f.hiring_expansion_signals || [], description: f.description || '',
  defense_vs_plaintiff: ai.defense_vs_plaintiff || 'Unknown', civil_vs_criminal: ai.civil_vs_criminal || 'Unknown', carrier_relationships: ai.carrier_relationships || [], office_count: num(f.office_count),
  provenance: prov, enrichment: null, enrichment_status: 'not_applicable',
});
return { json: rec };
}
return $input.all().map(function (it, idx) { return mergeOne(bases[idx].json, it.json); });