// n8n Code node: Normalize – Company Discovery Results
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// Turn every discovery API's response into one common record shape.
// Place sources (SerpApi, Apify Maps) supply firms with websites; registry sources (Sunbiz Daily, USAspending)
// supply entity / federal-contract records that are cross-referenced onto those firms in the next step.
const ST = { florida: 'FL', georgia: 'GA', 'north carolina': 'NC', 'south carolina': 'SC', virginia: 'VA' };
function stateFrom(addr, st) {
  if (st) { const k = String(st).trim(); if (k.length === 2) return k.toUpperCase(); if (ST[k.toLowerCase()]) return ST[k.toLowerCase()]; }
  const m = String(addr || '').match(/,\s*([A-Z]{2})\s+\d{5}/); return m ? m[1] : '';
}
function cityFrom(addr) { const p = String(addr || '').split(','); return p.length >= 3 ? p[p.length - 2].trim() : ''; }
const out = [];
const counts = { serpapi: 0, apify: 0, sunbiz: 0, usaspending: 0, errors: 0 };
for (const item of $input.all()) {
  const d = item.json || {};
  if (d.error && !d.local_results && !d.filings && !d.results && !d.title) { counts.errors++; continue; }
  if (Array.isArray(d.local_results)) {
    const q = (d.search_parameters && d.search_parameters.q) || '';
    for (const r of d.local_results) {
      counts.serpapi++;
      out.push({ kind: 'place', source: 'SerpApi (Google Maps)', company_name: r.title || '', address: r.address || '', city: cityFrom(r.address), state: stateFrom(r.address),
        phone: r.phone || '', website: r.website || '', types: [r.type || ''].concat(r.types || []).filter(Boolean), rating: r.rating ?? null, reviews: r.reviews ?? null,
        place_id: r.place_id || '', open_state: r.open_state || '', query: q });
    }
  } else if (Array.isArray(d.filings)) {
    for (const r of d.filings) {
      counts.sunbiz++;
      out.push({ kind: 'registry', source: 'Sunbiz Daily', company_name: r.corporation_name || '', city: r.city || '', state: 'FL', zip: r.zip || '',
        entity_number: r.corporation_number || '', entity_status: r.status === 'A' ? 'Active' : (r.status || ''), entity_type: r.filing_type_display || '', file_date: r.file_date || '' });
    }
  } else if (Array.isArray(d.results)) {
    for (const r of d.results) {
      counts.usaspending++;
      out.push({ kind: 'registry', source: 'USAspending', company_name: r['Recipient Name'] || '', award_amount: Number(r['Award Amount']) || 0,
        agency: r['Awarding Agency'] || '', award_start: r['Start Date'] || '', recipient_id: r.recipient_id || '' });
    }
  } else if (d.title) {
    counts.apify++;
    out.push({ kind: 'place', source: 'Apify (Google Maps)', company_name: d.title, address: d.address || '', city: d.city || cityFrom(d.address), state: stateFrom(d.address, d.state),
      phone: d.phone || '', website: d.website || '', types: (d.categories && d.categories.length ? d.categories : [d.categoryName || '']).filter(Boolean),
      rating: d.totalScore ?? null, reviews: d.reviewsCount ?? null, place_id: d.placeId || '', open_state: d.permanentlyClosed ? 'Permanently closed' : '', query: d.searchString || '' });
  }
}
out.forEach(function (r) { r._source_counts = counts; });
return out.map(function (j) { return { json: j }; });
