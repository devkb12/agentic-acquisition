// n8n Code node: Parse Places Results
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// Combine the normalized discovery records into candidate firms:
// keep in-scope law firms with a website, merge the same firm found by SerpApi and Apify, cross-reference
// Sunbiz Daily / USAspending records by name, rank defense-leaning listings first, cap per state,
// and prepare the Apify website-scraper input.
const cfg = $('Run Configuration').first().json;
const limit = cfg.demo_mode ? cfg.demo_limit_per_state : cfg.limit_per_state;
const maxPages = cfg.scrape_max_pages || 8;
const states = cfg.states || ['FL', 'GA'];
const now = new Date().toISOString();
const LAWY = /(attorney|lawyer|law firm|legal)/i;
const DEFENSE = /(insurance defense|defense|insurance attorney|insurance)/i;
const OFF = /(personal injury|criminal|family law|immigration|divorce|bankruptcy|estate planning|wrongful death|accident)/i;
const KW = ['practice', 'attorney', 'lawyer', 'people', 'professional', 'team', 'about', 'service', 'industr', 'location', 'office', 'firm', 'history', 'client'];
const SUFFIX = /\b(llp|llc|pllc|pa|pc|pl|chartered|inc|corp|corporation|law firm|law group|law offices?|attorneys at law|the|of)\b/g;
function host(u) { return String(u || '').toLowerCase().trim().replace(/^[a-z]+:[/][/]/, '').replace(/^www[.]/, '').split('/')[0].split('?')[0].split('#')[0].split(':')[0]; }
function core(n) { return String(n || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]/g, ' ').replace(SUFFIX, ' ').replace(/ +/g, ' ').trim(); }
function cleanUrl(u) { const m = String(u || '').trim().match(/^(https?):[/][/]([^/?#]+)/i); return m ? m[1].toLowerCase() + '://' + m[2].toLowerCase() + '/' : ''; }
function mapsUrl(pid) { return pid ? 'https://www.google.com/maps/place/?q=place_id:' + pid : ''; }

const all = $('Normalize – Company Discovery Results').all().map(function (i) { return i.json; });
// Firms already in Company_Leads are skipped so each run researches new firms (set skip_researched = false to re-research).
const skipOld = cfg.skip_researched !== false;
const seenBefore = {};
// ...except firms that ended 'Insufficient Information' because their website could not be read - those are retried.
if (skipOld) $input.all().forEach(function (i) {
  const j = i.json || {};
  const retry = j.final_fit === 'Insufficient Information' && !(Number(j.pages_scraped) > 0);
  if (retry) return;
  if (j.domain) seenBefore[String(j.domain).toLowerCase()] = true;
  if (j.company_id) seenBefore[String(j.company_id).toLowerCase()] = true;
});
const places = all.filter(function (r) { return r.kind === 'place'; });
const registry = all.filter(function (r) { return r.kind === 'registry'; });
const stats = Object.assign({ place_results: places.length, registry_records: registry.length, out_of_scope_state: 0, not_law: 0, no_website: 0, closed: 0, merged_duplicates: 0, over_limit: 0, registry_matched: 0, already_researched: 0 }, (all[0] && all[0]._source_counts) || {});

const byKey = {}, firms = [];
places.forEach(function (r) {
  if (states.indexOf(r.state) === -1) { stats.out_of_scope_state++; return; }
  const types = (r.types || []).join(' | ');
  if (!LAWY.test(types) && !LAWY.test(r.company_name)) { stats.not_law++; return; }
  if (/permanently closed/i.test(r.open_state || '')) { stats.closed++; return; }
  const site = cleanUrl(r.website);
  if (!site) { stats.no_website++; return; }
  const dom = host(site), nk = core(r.company_name) + '|' + r.state;
  if (seenBefore[dom]) { stats.already_researched++; return; }
  const existing = byKey[dom] || byKey[nk];
  if (existing) {
    stats.merged_duplicates++;
    if (existing.found_by.indexOf(r.source) === -1) existing.found_by.push(r.source);
    ['phone', 'address', 'city', 'place_id'].forEach(function (f) { if (!existing[f] && r[f]) existing[f] = r[f]; });
    existing.types = Array.from(new Set(existing.types.concat(r.types || [])));
    return;
  }
  const f = { company_name: r.company_name, website: site, domain: dom, phone: r.phone, address: r.address, city: r.city, state: r.state, place_id: r.place_id,
    types: (r.types || []).slice(), rating: r.rating, reviews: r.reviews, query: r.query, found_by: [r.source] };
  byKey[dom] = byKey[nk] = f; firms.push(f);
});
firms.forEach(function (f) {
  const hay = f.company_name + ' ' + f.types.join(' ');
  f.prio = (OFF.test(f.types[0] || '') || OFF.test(f.company_name)) ? 2 : DEFENSE.test(hay) ? 0 : 1;
  if (f.found_by.length > 1) f.prio -= 0.5;   // found by both map sources
});
firms.sort(function (a, b) { return a.prio - b.prio; });

const perState = {}, out = [];
firms.forEach(function (f) {
  perState[f.state] = (perState[f.state] || 0) + 1;
  if (perState[f.state] > limit) { stats.over_limit++; return; }
  const target = core(f.company_name);
  const regHits = registry.filter(function (g) { const c = core(g.company_name); return target.length > 4 && (c === target || (target.length > 8 && (c.indexOf(target) === 0 || target.indexOf(c) === 0))); });
  if (regHits.length) stats.registry_matched++;
  const m = mapsUrl(f.place_id);
  const sources = [
    { field: 'company_name', value: f.company_name, source: f.found_by.join(' + '), url: m, status: 'verified', extracted_at: now },
    { field: 'address', value: f.address || null, source: f.found_by[0], url: m, status: f.address ? 'verified' : 'unknown', extracted_at: now },
    { field: 'phone', value: f.phone || null, source: f.found_by[0], url: m, status: f.phone ? 'verified' : 'unknown', extracted_at: now },
    { field: 'website', value: f.website, source: f.found_by[0], url: m, status: 'verified', extracted_at: now },
  ];
  regHits.forEach(function (g) {
    if (g.source === 'Sunbiz Daily') sources.push({ field: 'entity_status', value: g.entity_status + ' - ' + g.company_name + ' (' + g.entity_number + ', filed ' + g.file_date + ')', source: 'Sunbiz Daily (discovery feed)', url: 'https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquiryType=DocumentNumber&searchTerm=' + encodeURIComponent(g.entity_number), status: 'verified', extracted_at: now });
    else sources.push({ field: 'federal_awards', value: g.company_name + ': $' + Math.round(g.award_amount).toLocaleString('en-US') + ' (' + g.agency + ')', source: 'USAspending (discovery feed)', url: g.recipient_id ? 'https://www.usaspending.gov/recipient/' + g.recipient_id + '/latest' : 'https://www.usaspending.gov/search', status: 'verified', extracted_at: now });
  });
  const globs = [];
  [f.domain, 'www.' + f.domain].forEach(function (h) { KW.forEach(function (k) { globs.push({ glob: 'https://' + h + '/*' + k + '*' }, { glob: 'https://' + h + '/*' + k + '*/**' }, { glob: 'https://' + h + '/**/*' + k + '*' }); }); });
  out.push({ json: {
    company_name: f.company_name, website: f.website, domain: f.domain, phone: f.phone || '', address: f.address || '', city: f.city || '', state: f.state,
    place_id: f.place_id || '', maps_uri: m, business_status: 'OPERATIONAL', google_category: f.types.join(' | '), google_rating: f.rating, google_reviews: f.reviews,
    found_by: f.found_by.join(' + '), registry_matches: regHits.map(function (g) { return g.source + ': ' + g.company_name; }),
    source_urls: [m || 'https://serpapi.com/search.json'], data_mode: 'LIVE', collected_at: now, discovery_query: f.query, sources: sources, _discovery_stats: stats,
    scrape_input: { startUrls: [{ url: f.website }], crawlerType: 'cheerio', maxCrawlDepth: 1, maxCrawlPages: maxPages, maxResults: maxPages,
      includeUrlGlobs: globs, proxyConfiguration: { useApifyProxy: true }, removeCookieWarnings: true, saveMarkdown: false },
  } });
});
return out;
