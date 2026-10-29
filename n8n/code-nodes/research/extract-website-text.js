// n8n Code node: Extract Website Text
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// Combine the pages Apify scraped for each firm into one evidence text block (with page URLs so the AI can cite them).
const cands = $('Parse Places Results').all().map(function (i) { return i.json; });
const now = new Date().toISOString();
const PER_PAGE = 3500, TOTAL = 14000;
const PRI = [/practice|service|industr/i, /attorney|lawyer|people|professional|team/i, /about|history|firm/i, /office|location/i];
function host(u) { return String(u || '').toLowerCase().trim().replace(/^[a-z]+:[/][/]/, '').replace(/^www[.]/, '').split('/')[0].split('?')[0].split(':')[0]; }
function rank(u, home) { if (host(u) === host(home) && /^https?:[/][/][^/]+[/]?$/.test(u)) return -1; for (let i = 0; i < PRI.length; i++) if (PRI[i].test(u)) return i; return 9; }
const byDom = {};
cands.forEach(function (c, i) { if (c.domain) byDom[c.domain] = i; });
const pages = cands.map(function () { return []; });
let scrapeErrors = 0;
$input.all().forEach(function (it) {
  const j = it.json || {};
  if (!j.url || j.error) { scrapeErrors++; return; }
  let idx = byDom[host(j.url)];
  if (idx === undefined) { const lu = host((j.crawl && j.crawl.loadedUrl) || j.loadedUrl || ''); idx = byDom[lu]; }
  if (idx === undefined && it.pairedItem && typeof it.pairedItem.item === 'number') idx = it.pairedItem.item;
  if (idx === undefined || !pages[idx]) return;
  const text = String(j.text || j.markdown || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (text) pages[idx].push({ url: j.url, title: (j.metadata && j.metadata.title) || '', text: text });
});
return cands.map(function (c, i) {
  const ps = pages[i].sort(function (a, b) { return rank(a.url, c.website) - rank(b.url, c.website); });
  let combined = '';
  const used = [];
  ps.forEach(function (p) {
    if (combined.length >= TOTAL) return;
    const chunk = '\n\n=== PAGE: ' + p.url + (p.title ? ' (' + p.title + ')' : '') + ' ===\n' + p.text.slice(0, PER_PAGE);
    combined += chunk.slice(0, TOTAL - combined.length);
    used.push(p.url);
  });
  const sources = (c.sources || []).slice();
  used.forEach(function (u) { sources.push({ field: 'website_page', value: '(page text scraped by Apify Website Content Crawler)', source: 'Firm website via Apify', url: u, status: 'verified', extracted_at: now }); });
  const rec = Object.assign({}, c, { website_text: combined.trim(), pages_scraped: used.length, scraped_page_urls: used,
    source_urls: Array.from(new Set((c.source_urls || []).concat(used))), sources: sources });
  delete rec.scrape_input;
  if (!used.length) rec.scrape_note = 'Website could not be scraped (blocked, timed out, or empty) - research agent may retry';
  return { json: rec };
});
