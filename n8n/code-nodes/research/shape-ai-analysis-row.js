// n8n Code node: Shape AI_Analysis Row
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

const r = $json;
function j(a) { return Array.isArray(a) ? a.join('; ') : (a || ''); }
return { json: {
  company_id: r.company_id, company_name: r.company_name, state: r.state,
  final_fit: r.final_fit, acquisition_score: r.acquisition_score, max_supported_points: r.max_supported_points, evidence_coverage_pct: r.evidence_coverage_pct,
  normalized_score: r.normalized_score === null ? 'n/a' : r.normalized_score, data_confidence: r.data_confidence,
  ai_target_classification: r.target_classification, ai_confidence: r.confidence_score, insurance_defense_fit: r.insurance_defense_fit, b2b_focus: r.b2b_focus,
  defense_vs_plaintiff: r.defense_vs_plaintiff || 'Unknown', civil_vs_criminal: r.civil_vs_criminal || 'Unknown',
  insurance_score: r.insurance_score === null || r.insurance_score === undefined ? 'n/a' : r.insurance_score, insurance_band: r.insurance_band || '', insurance_terms_matched: j(r.insurance_terms_matched),
  practice_areas: j(r.practice_areas), ai_reason: r.reason, potential_opportunity: r.potential_opportunity,
  positive_indicators: j(r.positive_indicators), risk_factors: j(r.risk_factors), missing_information: j(r.all_missing_information),
  score_explanation: r.score_explanation, recommended_next_action: r.recommended_next_action, score_breakdown_json: JSON.stringify(r.score_breakdown),
  enrichment_status: r.enrichment_status, data_mode: r.data_mode, analyzed_at: r.scored_at, run_id: r.run_id,
} };
