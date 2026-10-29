// n8n Code node: Merge Enrichment
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

const bases = $('High or Moderate Fit?').all(0);
const now = new Date().toISOString();
function mergeOne(base, row) {
const e = row.output;
const rec = Object.assign({}, base);
if (!e || typeof e !== 'object') {
  rec.enrichment = null;
  rec.enrichment_status = 'failed';
  rec.missing_information = (base.missing_information || []).concat(['Research agent failed - rerun enrichment']);
  return { json: rec };
}
const isLive = base.data_mode === 'LIVE';
const prov = (base.provenance || []).slice();
(e.evidence_backed_signals || []).forEach(function (s) {
  prov.push({ field: 'signal:' + s.type, value: s.signal, source: 'Research Agent', url: s.source_url || '', evidence_quote: s.evidence_quote || '',
              status: isLive ? ((s.source_url && s.evidence_quote) ? 'verified' : 'estimated') : 'sample_demo', extracted_at: now });
});
function known(v) { return v && String(v).toLowerCase() !== 'unknown'; }
rec.provenance = prov;
rec.enrichment = e;
rec.enrichment_status = 'completed';
if (e.office_locations && e.office_locations.length) rec.offices = Array.from(new Set((rec.offices || []).concat(e.office_locations)));
if (e.leadership && e.leadership.length) rec.leadership = Array.from(new Set((rec.leadership || []).concat(e.leadership)));
if (!rec.revenue && known(e.size_and_revenue_notes) && e.revenue_status !== 'unknown') {
  rec.revenue = e.size_and_revenue_notes;
  rec.revenue_status = isLive ? e.revenue_status : 'sample_demo';
}
rec.ai_source_urls = Array.from(new Set((rec.ai_source_urls || []).concat(e.sources_consulted || [])));
return { json: rec };
}
return $input.all().map(function (it, idx) { return mergeOne(bases[idx].json, it.json); });