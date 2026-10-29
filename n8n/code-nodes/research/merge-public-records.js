// n8n Code node: Merge Public Records
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// Merge Sunbiz Daily (Florida entity filings) and USAspending (federal contract awards) back onto each firm.
// Not finding a firm in either source is NOT treated as negative.
const bases = $('Insurance Scorecard + Revenue Estimate').all();
const sun = $('Sunbiz Entity Lookup').all();
const usa = $input.all();
const now = new Date().toISOString();
const SUFFIX = /\b(llp|llc|pllc|pa|pc|pl|chartered|inc|corp|corporation|law firm|law group|law offices?|attorneys at law|of)\b/g;
function core(n) { return String(n || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]/g, ' ').replace(SUFFIX, ' ').replace(/ +/g, ' ').trim(); }
return bases.map(function (b, i) {
  const r = Object.assign({}, b.json);
  const prov = (r.provenance || []).slice();
  const target = core(r.registry_name || r.company_name);
  // --- Sunbiz Daily
  const sd = (sun[i] && sun[i].json) || {};
  const filings = Array.isArray(sd.filings) ? sd.filings : [];
  const hit = filings.find(function (f) { const c = core(f.corporation_name); return c === target || (target.length > 6 && (c.indexOf(target) === 0 || target.indexOf(c) === 0)); });
  if (hit) {
    r.entity_name = hit.corporation_name; r.entity_number = hit.corporation_number; r.entity_type = hit.filing_type_display;
    r.entity_status = hit.status === 'A' ? 'Active' : hit.status === 'I' ? 'Inactive' : (hit.status || 'Unknown');
    r.entity_file_date = hit.file_date || null; r.entity_status_label = 'Verified';
    r.entity_source_url = 'https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquiryType=DocumentNumber&searchTerm=' + encodeURIComponent(hit.corporation_number || '');
    prov.push({ field: 'entity_status', value: r.entity_status + ' - ' + hit.corporation_name + ' (' + hit.corporation_number + ', filed ' + hit.file_date + ')', source: 'Sunbiz Daily API (Florida Division of Corporations data)', url: r.entity_source_url, evidence_quote: '', status: 'verified', extracted_at: now });
    if (!r.year_founded && hit.file_date) {
      const y = parseInt(String(hit.file_date).slice(0, 4), 10);
      r.year_founded = y; r.years_in_operation = new Date().getFullYear() - y; r.year_founded_status = 'estimated';
      prov.push({ field: 'year_founded', value: String(y), source: 'Sunbiz filing date (entity may post-date firm founding)', url: r.entity_source_url, evidence_quote: '', status: 'estimated', extracted_at: now });
    }
  } else {
    r.entity_status = null; r.entity_status_label = sd.error ? 'Lookup failed' : 'Missing';
    r.entity_source_url = r.state === 'FL' ? r.sunbiz_search_url : r.ga_sos_search_url;
    r.missing_information = (r.missing_information || []).concat(['Entity registration (check ' + (r.state === 'FL' ? 'Sunbiz' : 'GA Secretary of State') + ' manually)']);
  }
  // --- USAspending
  const ud = (usa[i] && usa[i].json) || {};
  const awards = (Array.isArray(ud.results) ? ud.results : []).filter(function (a) { const c = core(a['Recipient Name']); return c === target || (target.length > 6 && c.indexOf(target) === 0); });
  r.federal_awards_count = awards.length;
  r.federal_awards_total = Math.round(awards.reduce(function (s, a) { return s + (Number(a['Award Amount']) || 0); }, 0));
  r.federal_award_agencies = Array.from(new Set(awards.map(function (a) { return a['Awarding Agency']; }))).slice(0, 5);
  if (awards.length) {
    const rid = awards[0].recipient_id;
    r.federal_awards_url = rid ? 'https://www.usaspending.gov/recipient/' + rid + '/latest' : 'https://www.usaspending.gov/search';
    prov.push({ field: 'federal_awards', value: awards.length + ' contract award(s), $' + r.federal_awards_total.toLocaleString('en-US') + ' (' + r.federal_award_agencies.join(', ') + ')', source: 'USAspending.gov API', url: r.federal_awards_url, evidence_quote: '', status: 'verified', extracted_at: now });
  }
  r.provenance = prov;
  return { json: r };
});
