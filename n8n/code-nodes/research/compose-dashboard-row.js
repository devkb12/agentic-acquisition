// n8n Code node: Compose Dashboard Row
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

const d = $('Build Dashboard Data').first().json;
const summary = ($json.text && String($json.text).trim()) ? String($json.text).trim() : 'Executive summary generation failed - see dashboard data.';
return { json: {
  run_id: d.run_id, generated_at: d.generated_at, run_mode: d.run_mode, data_mode: d.data_mode,
  total_companies: d.total_companies, florida: d.florida, georgia: d.georgia, high_fit: d.high_fit, moderate_fit: d.moderate_fit, low_fit: d.low_fit,
  insufficient_information: d.insufficient_information, executive_summary: summary,
  top_10_candidates_json: JSON.stringify(d.top_candidates), company_comparison_json: JSON.stringify(d.comparison),
  missing_information_json: JSON.stringify(d.missing_information_summary),
} };