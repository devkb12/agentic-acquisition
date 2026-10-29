// n8n Code node: Shape Source_Log Rows
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// One row per (company, field, source) so every important field keeps its provenance, extraction date and verified/estimated/unknown status.
const rows = [];
$input.all().forEach(function (it) {
  const r = it.json;
  (r.provenance || []).forEach(function (p, i) {
    rows.push({ json: {
      log_key: r.company_id + '|' + p.field + '|' + (p.url || '') + '|' + i,
      company_id: r.company_id, company_name: r.company_name, field: p.field,
      value: (p.value === null || p.value === undefined) ? 'Unknown' : String(p.value).slice(0, 500),
      status: p.status, source: p.source || '', source_url: p.url || '', evidence_quote: (p.evidence_quote || '').slice(0, 500),
      extracted_at: p.extracted_at, data_mode: r.data_mode, run_id: r.run_id,
    } });
  });
});
return rows;