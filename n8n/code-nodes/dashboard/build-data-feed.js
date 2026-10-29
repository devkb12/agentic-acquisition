// n8n Code node: Build Data Feed
// Workflow: TrueGrit Dashboard (front end)

// JSON feed for the standalone dashboard site (same data the n8n-hosted page embeds).
const CONFIG = {"run_mode": "live", "demo_mode": false, "limit_per_state": 8, "demo_limit_per_state": 2, "states": ["FL", "GA"], "search_queries": ["insurance defense law firm", "insurance defense litigation attorneys", "civil defense law firm"], "discovery_locations": {"FL": ["Miami", "Tampa", "Orlando", "Jacksonville", "Fort Lauderdale", "Tallahassee"], "GA": ["Atlanta", "Savannah", "Augusta", "Macon"]}, "weights": {"insurance_defense": 30, "geography": 15, "b2b": 15, "size": 15, "history": 10, "strategic": 10, "completeness": 5}, "thresholds": {"high": 70, "moderate": 45, "min_coverage": 40}, "scorecard_bands": {"strong": 15, "moderate": 5}, "revenue_per_attorney": {"low": 300000, "high": 500000}, "size_band_attorneys": {"min": 10, "max": 400}, "scrape_max_pages": 8};
function rows(n) { try { return $(n).all().map(function (i) { return i.json; }).filter(function (j) { return j && Object.keys(j).length > 0; }); } catch (e) { return []; } }
return [{ json: { generated_at: new Date().toISOString(), config: CONFIG,
  leads: rows('Data: Company_Leads'), analysis: rows('Data: AI_Analysis'), sources: rows('Data: Source_Log'),
  review: rows('Data: Review_Queue'), runs: rows('Data: Run_Log'), dashboard: rows('Data: Dashboard_Summary') } }];
