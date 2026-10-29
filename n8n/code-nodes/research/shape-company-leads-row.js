// n8n Code node: Shape Company_Leads Row
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

const r = $json;
function j(a) { return Array.isArray(a) ? a.join('; ') : (a || ''); }
function v(x) { return (x === null || x === undefined || x === '') ? 'Unknown' : x; }
return { json: {
  company_id: r.company_id, company_name: r.company_name, state: r.state, city: r.city || '', address: r.address || '', website: r.website || '', domain: r.domain || '',
  phone: r.phone || '', organization_type: v(r.organization_type), practice_areas: j(r.practice_areas), description: r.description || '',
  year_founded: v(r.year_founded), years_in_operation: v(r.years_in_operation), attorney_count: v(r.attorney_count), employee_count: v(r.employee_count),
  revenue: v(r.revenue), revenue_status: r.revenue_status, revenue_estimate: v(r.revenue_estimate), in_size_band: r.in_size_band === null || r.in_size_band === undefined ? 'Unknown' : (r.in_size_band ? 'Yes' : 'No'),
  office_count: v(r.office_count), leadership: j(r.leadership), offices: j(r.offices), hiring_signals: j(r.hiring_signals),
  defense_vs_plaintiff: v(r.defense_vs_plaintiff), civil_vs_criminal: v(r.civil_vs_criminal), carrier_relationships: j(r.carrier_relationships),
  insurance_score: r.insurance_score === null || r.insurance_score === undefined ? 'n/a' : r.insurance_score, insurance_band: r.insurance_band || '', insurance_terms_matched: j(r.insurance_terms_matched),
  entity_status: v(r.entity_status), entity_status_label: r.entity_status_label || '', entity_name: r.entity_name || '', entity_file_date: r.entity_file_date || '', entity_source_url: r.entity_source_url || '',
  federal_awards_count: r.federal_awards_count || 0, federal_awards_total: r.federal_awards_total || 0,
  google_category: r.google_category || '', google_rating: r.google_rating || '', pages_scraped: r.pages_scraped || 0,
  final_fit: r.final_fit, normalized_score: r.normalized_score === null ? 'n/a' : r.normalized_score, review_status: r.review_required ? 'Needs review' : (r.final_fit === 'Low Fit' ? 'Screened out' : 'Needs more evidence'),
  data_mode: r.data_mode, source_urls: j(r.source_urls), last_collected_at: r.collected_at, last_run_id: r.run_id,
} };
