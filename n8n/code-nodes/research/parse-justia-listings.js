// n8n Code node: Parse Justia Listings
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// Parse Justia listing pages into firm records.
// Each attorney card is anchored by its profile link (lawyers.justia.com/lawyer/<slug>-<id>); the firm's own website
// link, phone and address sit inside the card. Attorneys are grouped into firms by website domain.
const pages = $('Build Justia Page List').all().map(function (i) { return i.json; });
const BAD = /(justia[.]com|google[.]|gstatic|facebook[.]|twitter[.]|[/][/]x[.]com|linkedin[.]|youtube[.]|instagram[.]|avvo[.]|martindale|findlaw|lawyers[.]com|apple[.]com|cornell[.]edu|schema[.]org|w3[.]org|cloudflare|doubleclick|bing[.]com)/i;
const FIRM = /([A-Z][A-Za-z&,.' -]{2,70}?,? (?:LLP|L[.]L[.]P[.]|PLLC|LLC|P[.]A[.]|P[.]C[.]|P[.]L[.]|Chartered|Law Group|Law Firm|Law Offices?|Attorneys at Law))(?![A-Za-z])/;
function host(u) { return String(u || '').toLowerCase().trim().replace(/^[a-z]+:[/][/]/, '').replace(/^www[.]/, '').split('/')[0].split('?')[0].split('#')[0].split(':')[0]; }
function strip(s) { return String(s || '').replace(/<script[^]*?<[/]script>/gi, ' ').replace(/<style[^]*?<[/]style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&rsquo;|&#x27;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); }
function prettyDomain(d) { const b = d.split('.')[0]; return b.charAt(0).toUpperCase() + b.slice(1) + ' (' + d + ')'; }

const lawyers = {};
const stats = { pages_requested: pages.length, pages_ok: 0, pages_failed: 0, cards: 0 };
$input.all().forEach(function (it, idx) {
  const meta = pages[idx] || {};
  const j = it.json || {};
  const html = typeof j.data === 'string' ? j.data : (typeof j.body === 'string' ? j.body : '');
  if (!html || j.error || html.indexOf('lawyers.justia.com/lawyer/') === -1) { stats.pages_failed++; return; }
  stats.pages_ok++;
  const re = /<a[^>]+href=["'](https:[/][/]lawyers[.]justia[.]com[/]lawyer[/][a-z0-9-]+-(\d+))[^"']*["'][^>]*>([^]*?)<[/]a>/gi;
  const hits = []; let m;
  while ((m = re.exec(html))) hits.push({ url: m[1], id: m[2], name: strip(m[3]), at: m.index });
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    if (i > 0 && hits[i - 1].id === h.id) continue;
    let k = i + 1; while (k < hits.length && hits[k].id === h.id) k++;
    const end = k < hits.length ? hits[k].at : Math.min(html.length, h.at + 15000);
    const card = html.slice(h.at, end);
    stats.cards++;
    const name = hits.slice(i, k).map(function (x) { return x.name; }).filter(function (n) { return n && n.length > 3 && n.length < 80 && !/(profile|website|email|call|preview)/i.test(n); })[0] || '';
    let site = ''; const hr = /href=["'](https?:[/][/][^"']+)["']/gi; let s;
    while ((s = hr.exec(card))) { if (!BAD.test(s[1])) { site = s[1]; break; } }
    const tel = ((card.match(/href=["']tel:([^"']+)["']/i) || [])[1] || '').replace(/[^0-9+]/g, '');
    const text = strip(card);
    const addr = (text.match(/(\d{1,6} [^|]{3,120}?, ?[A-Z][A-Za-z .'-]+, ?(?:FL|GA|NC|SC|VA) \d{5})/) || [])[1] || '';
    const cs = addr.match(/, ?([A-Z][A-Za-z .'-]+), ?(FL|GA|NC|SC|VA) \d{5}$/) || text.match(/([A-Z][A-Za-z .'-]{2,30}), ?(FL|GA|NC|SC|VA) \d{5}/);
    const firm = (text.match(FIRM) || [])[1] || '';
    const prev = lawyers[h.id];
    if (prev) { if (!prev.site && site) prev.site = site; continue; }
    lawyers[h.id] = { id: h.id, name: name, profile: h.url, site: site, phone: tel, address: addr, city: cs ? cs[1].trim() : '', state: (cs && cs[2]) || meta.state, firm: firm.trim(), area: meta.practice_area };
  }
});

const firms = {};
Object.keys(lawyers).forEach(function (id) {
  const l = lawyers[id];
  const dom = host(l.site);
  const key = dom || ('phone:' + l.phone + '|' + l.state);
  if (!dom && !l.phone) return;
  let f = firms[key];
  if (!f) {
    f = firms[key] = { directory_source: 'Justia', company_name: l.firm || (dom ? prettyDomain(dom) : (l.name + ' (solo / firm unknown)')), website: dom ? 'https://' + dom + '/' : '',
      domain: dom, phone: l.phone, address: l.address, city: l.city, state: l.state, practice_area: l.area, directory_attorneys: [], directory_profile_urls: [] };
  }
  if (!f.address && l.address) { f.address = l.address; f.city = l.city; }
  if (l.firm && /[(]/.test(f.company_name)) f.company_name = l.firm;
  f.directory_attorneys.push(l.name);
  f.directory_profile_urls.push(l.profile);
});
const out = Object.keys(firms).map(function (k) {
  const f = firms[k];
  f.directory_attorney_count = f.directory_attorneys.length;
  f._justia_stats = Object.assign({ unique_attorneys: Object.keys(lawyers).length, firms: Object.keys(firms).length }, stats);
  return { json: f };
});
// Always emit at least one item so the downstream Merge never waits on an empty branch.
if (!out.length) out.push({ json: { directory_source: 'Justia', _stats_only: true, _justia_stats: stats } });
return out;
