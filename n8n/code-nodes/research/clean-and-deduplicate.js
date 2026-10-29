// n8n Code node: Clean and Deduplicate
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

const cfg = $('Run Configuration').first().json;
const limit = cfg.demo_mode ? cfg.demo_limit_per_state : cfg.limit_per_state;
const STATES = { florida: 'FL', fl: 'FL', georgia: 'GA', ga: 'GA' };
const LEGAL = ['llp', 'llc', 'pllc', 'pa', 'pc', 'plc', 'chartered', 'lc'];
const NON_TARGET = /(personal injury|criminal|divorce|family law|immigration|bankruptcy|estate planning)/i;

function normName(n) {
  let s = String(n || '').toLowerCase().split('&').join(' and ').replace(/[^a-z0-9 ]/g, ' ').replace(/ +/g, ' ').trim();
  return s.split(' ').filter(function (t) { return LEGAL.indexOf(t) === -1; }).join(' ');
}
function normDomain(u) {
  let s = String(u || '').toLowerCase().trim().replace(/^[a-z]+:[/][/]/, '').replace(/^www[.]/, '');
  return s.split('/')[0].split('?')[0].split(':')[0];
}
function normPhone(p) {
  let d = String(p || '').replace(/[^0-9]/g, '');
  if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
  return d.length === 10 ? '+1' + d : '';
}
function normState(s, addr) {
  const k = String(s || '').toLowerCase().trim();
  if (STATES[k]) return STATES[k];
  const m = String(addr || '').match(/, (FL|GA)( |,|$)/);
  return m ? m[1] : '';
}
function slug(s) { return s.replace(/ /g, '-'); }

const stats = { discovered: 0, rejected: 0, duplicates_removed: 0, over_limit_dropped: 0 };
const rejected = [];
const byDomain = {}, byNameLoc = {}, list = [];

$input.all().forEach(function (it) {
  stats.discovered++;
  const r = it.json;
  const nn = normName(r.company_name);
  const st = normState(r.state, r.address);
  const dom = normDomain(r.website);
  let reason = '';
  if (!nn) reason = 'missing company name';
  else if (!st) reason = 'state not Florida or Georgia';
  else if (NON_TARGET.test(r.company_name)) reason = 'name indicates non-target practice area';
  else if (String(r.business_status || '').indexOf('CLOSED') === 0) reason = 'business closed';
  if (reason) { stats.rejected++; rejected.push({ name: r.company_name, reason: reason }); return; }

  const rec = Object.assign({}, r, { state: st, normalized_name: nn, domain: dom, phone: normPhone(r.phone) || '' });
  const k2 = nn + '|' + String(r.city || st).toLowerCase();
  const existing = (dom && byDomain[dom]) || byNameLoc[k2];
  if (existing) {
    stats.duplicates_removed++;
    ['website', 'phone', 'address', 'city', 'place_id', 'maps_uri'].forEach(function (f) { if (!existing[f] && rec[f]) existing[f] = rec[f]; });
    if ((rec.website_text || '').length > (existing.website_text || '').length) existing.website_text = rec.website_text;
    existing.source_urls = Array.from(new Set((existing.source_urls || []).concat(rec.source_urls || [])));
    existing.sources = (existing.sources || []).concat(rec.sources || []);
    if (!existing.domain && rec.domain) { existing.domain = rec.domain; byDomain[rec.domain] = existing; }
    return;
  }
  if (dom) byDomain[dom] = rec;
  byNameLoc[k2] = rec;
  list.push(rec);
});

const perState = {};
const out = [];
list.forEach(function (rec) {
  perState[rec.state] = (perState[rec.state] || 0) + 1;
  if (perState[rec.state] > limit) { stats.over_limit_dropped++; return; }
  rec.company_id = rec.domain ? rec.domain : slug(rec.normalized_name) + '-' + rec.state.toLowerCase();
  rec._stats = stats;
  rec._rejected = rejected;
  out.push({ json: rec });
});
return out;