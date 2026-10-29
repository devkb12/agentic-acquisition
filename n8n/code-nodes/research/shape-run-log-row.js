// n8n Code node: Shape Run_Log Row
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

const d = $('Build Dashboard Data').first().json;
const failures = d.ai_failures + d.enrichment_failures;
return { json: {
  run_id: d.run_id, finished_at: new Date().toISOString(), run_mode: d.run_mode, data_mode: d.data_mode,
  candidates_discovered: d.discovered, rejected_invalid: d.rejected, duplicates_removed: d.duplicates_removed, dropped_over_limit: d.over_limit_dropped,
  companies_processed: d.total_companies, high_fit: d.high_fit, moderate_fit: d.moderate_fit, low_fit: d.low_fit, insufficient_information: d.insufficient_information,
  ai_classification_failures: d.ai_failures, enrichment_failures: d.enrichment_failures,
  serpapi_results: d.source_counts ? d.source_counts.serpapi : 0, apify_maps_results: d.source_counts ? d.source_counts.apify_maps : 0,
  sunbiz_records: d.source_counts ? d.source_counts.sunbiz : 0, usaspending_records: d.source_counts ? d.source_counts.usaspending : 0, registry_matches: d.source_counts ? d.source_counts.registry_matched : 0,
  status: (failures > 0 || (d.source_counts && d.source_counts.source_errors > 0)) ? 'completed_with_errors' : 'completed',
} };