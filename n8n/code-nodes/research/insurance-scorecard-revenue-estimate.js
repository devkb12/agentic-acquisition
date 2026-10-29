// n8n Code node: Insurance Scorecard + Revenue Estimate
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// Sponsor scorecard (Additional Criteria v2.3): keyword scoring of website language + revenue estimate from attorney count.
// Each unique term counts once. Longer phrases are matched first and masked so overlapping shorter terms are not double-counted.
const cfg = $('Run Configuration').first().json;
const bands = cfg.scorecard_bands || { strong: 15, moderate: 5 };
const rpa = cfg.revenue_per_attorney || { low: 300000, high: 500000 };
const r = Object.assign({}, $json);
const T = {
  5: ['insurance defense', 'insurer representation', 'insurance carrier', 'insurance carriers', 'panel counsel', 'approved panel counsel', 'coverage counsel', 'insurance coverage', 'first-party coverage', 'third-party coverage', 'duty to defend', 'duty to indemnify', 'reservation of rights', 'bad faith defense', 'extra-contractual liability', 'reinsurance', "Lloyd's", 'London Market', 'excess carrier', 'excess insurance', 'self-insured', 'self-insured retention', 'TPA', 'third-party administrator', 'claims administrator', 'claims professional', 'claims professionals', 'claims litigation', 'subrogation'],
  3: ['casualty defense', 'general liability', 'complex casualty', 'excess casualty', 'commercial auto', 'trucking defense', 'transportation liability', 'construction defect', 'construction liability', 'premises liability', 'professional liability', 'errors and omissions', 'E&O', 'medical malpractice defense', 'healthcare liability', 'product liability defense', 'products liability defense', 'toxic tort', 'environmental liability', "workers' compensation defense", 'workers compensation defense', 'employment practices liability', 'EPLI', 'D&O liability', 'cyber liability', 'property damage', 'first-party property', 'maritime liability', 'admiralty liability', 'aviation liability', 'fidelity', 'surety'],
  1: ['commercial litigation', 'employment defense', 'construction litigation', 'healthcare litigation', 'real estate litigation', 'class action defense', 'appellate litigation', 'regulatory defense', 'business torts'],
  '-3': ['M&A', 'mergers and acquisitions', 'corporate transactions', 'private equity', 'venture capital', 'securities offerings', 'tax', 'bankruptcy', 'restructuring', 'patent litigation', 'IP litigation', 'intellectual property litigation', 'trademark', 'antitrust', 'white collar', 'investigations', 'trusts and estates', 'estate planning', 'immigration', 'family law', 'public finance', 'banking and finance', 'fund formation'],
  '-5': ['plaintiff personal injury', 'plaintiff medical malpractice', 'plaintiff product liability', 'plaintiff mass tort', 'contingency fee', 'no fee unless we win', 'accident victims', 'injured plaintiffs', 'policyholder representation', 'insurance recovery for policyholders', 'suing insurance companies', 'coverage recovery', 'bad-faith claims against insurers', 'bad faith claims against insurers'],
};
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function rx(term) {
  let p = esc(term.toLowerCase()).replace(/\\-/g, '-').replace(/[ -]+/g, '[\\s\\-]+').replace(/&|\band\b/g, '(?:&|and|&amp;)').replace(/'/g, "['’]?");
  return new RegExp('(^|[^a-z0-9])' + p + '(?=$|[^a-z0-9])', 'i');
}
const all = [];
Object.keys(T).forEach(function (w) { T[w].forEach(function (t) { all.push({ term: t, weight: Number(w) }); }); });
all.sort(function (a, b) { return b.term.length - a.term.length; });
let text = ' ' + String(r.website_text || '').toLowerCase().replace(/\s+/g, ' ') + ' ';
const matched = [];
const seenTerm = {};
all.forEach(function (t) {
  const key = t.term.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (seenTerm[key]) return;
  const re = rx(t.term);
  const m = text.match(re);
  if (!m) return;
  seenTerm[key] = true;
  matched.push(t);
  const g = new RegExp(re.source, 'gi');
  text = text.replace(g, function (s, pre) { return pre + ' '.repeat(s.length - pre.length); });
});
const score = matched.reduce(function (s, t) { return s + t.weight; }, 0);
const hasText = !!(r.website_text && r.website_text.length > 200);
const band = !hasText ? 'No website text' : score >= bands.strong ? 'Strong insurance focus' : score >= bands.moderate ? 'Moderate insurance focus' : score >= 0 ? 'Weak / unclear' : 'Likely non-insurance or plaintiff';
r.insurance_score = hasText ? score : null;
r.insurance_band = band;
r.insurance_terms_matched = matched.sort(function (a, b) { return b.weight - a.weight; }).map(function (t) { return t.term + ' (' + (t.weight > 0 ? '+' : '') + t.weight + ')'; });
r.plaintiff_terms = matched.filter(function (t) { return t.weight === -5; }).map(function (t) { return t.term; });

const risks = (r.potential_risks || []).slice();
if (hasText) {
  if (r.insurance_defense_fit === 'Strong' && score < bands.moderate) risks.push('Keyword scorecard (' + score + ') does not corroborate the AI "Strong" insurance-defense rating - verify practice mix');
  if ((r.insurance_defense_fit === 'None' || r.insurance_defense_fit === 'Unknown') && score >= bands.strong) risks.push('Keyword scorecard (' + score + ') suggests insurance focus but AI rated fit ' + r.insurance_defense_fit + ' - verify');
  if (r.plaintiff_terms.length) risks.push('Plaintiff-side language on website: ' + r.plaintiff_terms.join(', '));
}
if (r.defense_vs_plaintiff === 'Plaintiff') risks.push('AI assessment: primarily plaintiff-side');
if (r.civil_vs_criminal === 'Criminal') risks.push('AI assessment: primarily criminal practice');
r.potential_risks = risks;

const att = r.attorney_count;
const prov = (r.provenance || []).slice();
const now = new Date().toISOString();
if (att !== null && att !== undefined && att > 0) {
  const lo = att * rpa.low, hi = att * rpa.high;
  const fmt = function (n) { return '$' + (n / 1e6).toFixed(1) + 'M'; };
  r.revenue_estimate_low = lo; r.revenue_estimate_high = hi;
  r.revenue_estimate = fmt(lo) + '-' + fmt(hi) + ' (est.)';
  r.in_size_band = att >= 10 && att <= 400;
  if (!r.revenue) {
    r.revenue = r.revenue_estimate; r.revenue_status = r.data_mode === 'LIVE' ? 'estimated' : 'sample_demo';
    prov.push({ field: 'revenue', value: r.revenue_estimate, source: 'Formula: attorney_count x $300k-$500k (sponsor rule of thumb)', url: '', evidence_quote: att + ' attorneys', status: 'estimated', extracted_at: now });
  }
} else { r.revenue_estimate = null; r.in_size_band = null; }
if (hasText) prov.push({ field: 'insurance_score', value: String(score), source: 'Sponsor keyword scorecard v2.3', url: r.website || '', evidence_quote: r.insurance_terms_matched.join('; ').slice(0, 480), status: 'estimated', extracted_at: now });
r.provenance = prov;

// Names used by the public-record lookups that follow
const base = String(r.company_name || '').replace(/^(the )?law offices? of /i, '').replace(/,?\s+(llp|l\.l\.p\.|llc|l\.l\.c\.|pllc|p\.l\.l\.c\.|p\.a\.|pa|p\.c\.|pc|p\.l\.|pl|chartered|attorneys at law|attorneys|lawyers)\.?$/i, '').replace(/,\s*$/, '').trim();
r.registry_name = base;
r.sunbiz_search_url = 'https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquiryType=EntityName&searchTerm=' + encodeURIComponent(base.toUpperCase());
r.ga_sos_search_url = 'https://ecorp.sos.ga.gov/BusinessSearch';
return { json: r };
