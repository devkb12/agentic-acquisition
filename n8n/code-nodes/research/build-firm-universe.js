// n8n Code node: Build Firm Universe
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// Firm Universe: every in-scope law firm seen by ANY discovery source this run (before the per-state research cap),
// upserted into the TrueGrit_Firm_Universe data table so the full FL/GA market accumulates run over run.
const cfg = $('Run Configuration').first().json;
const states = cfg.states || ['FL', 'GA'];
const LAWY = /(attorney|lawyer|law firm|legal)/i;
const DEFENSE = /(insurance defense|defense|insurance attorney|insurance)/i;
const OFF = /(personal injury|criminal|family law|immigration|divorce|bankruptcy|estate planning|wrongful death|accident|injury lawyer)/i;
const SUFFIX = /\b(llp|llc|pllc|pa|pc|pl|chartered|inc|corp|corporation|law firm|law group|law offices?|attorneys at law|the|of)\b/g;
function host(u) { return String(u || '').toLowerCase().trim().replace(/^[a-z]+:[/][/]/, '').replace(/^www[.]/, '').split('/')[0].split('?')[0].split('#')[0].split(':')[0]; }
function core(n) { return String(n || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]/g, ' ').replace(SUFFIX, ' ').replace(/ +/g, ' ').trim(); }
const now = new Date().toISOString();
const rows = {};
$input.all().forEach(function (i) {
  const r = i.json || {};
  if (r.kind !== 'place' || states.indexOf(r.state) === -1) return;
  const types = (r.types || []).join(' | ');
  if (!LAWY.test(types) && !LAWY.test(r.company_name)) return;
  if (/permanently closed/i.test(r.open_state || '')) return;
  const dom = host(r.website);
  const key = dom || (core(r.company_name) + '|' + r.state);
  if (!key || key === '|' + r.state) return;
  let x = rows[key];
  if (!x) x = rows[key] = { firm_key: key, company_name: r.company_name, domain: dom, website: dom ? 'https://' + dom + '/' : '', state: r.state, city: r.city || '', phone: r.phone || '', address: r.address || '', found_by: [], attorneys: [], urls: [], types: [] };
  if (x.found_by.indexOf(r.source) === -1) x.found_by.push(r.source);
  if (/[(]/.test(x.company_name) && r.source !== 'Justia Directory') x.company_name = r.company_name;
  ['city', 'phone', 'address'].forEach(function (f) { if (!x[f] && r[f]) x[f] = r[f]; });
  x.attorneys = Array.from(new Set(x.attorneys.concat(r.directory_attorneys || [])));
  x.urls = Array.from(new Set(x.urls.concat(r.directory_profile_urls || [])));
  x.types = Array.from(new Set(x.types.concat(r.types || [])));
});
return Object.keys(rows).map(function (k) {
  const x = rows[k];
  const hay = x.company_name + ' ' + x.types.join(' ');
  return { json: {
    firm_key: x.firm_key, company_name: x.company_name, domain: x.domain, website: x.website, state: x.state, city: x.city, phone: x.phone, address: x.address,
    found_by: x.found_by.join(' + '), directory_attorney_count: x.attorneys.length || null, directory_attorneys: x.attorneys.join('; ').slice(0, 2000),
    directory_profile_urls: x.urls.slice(0, 15).join(' '), practice_signal: OFF.test(x.types[0] || '') || OFF.test(x.company_name) ? 'off-target (PI/criminal/family)' : DEFENSE.test(hay) ? 'defense / insurance leaning' : 'unclear',
    plaintiff_flag: OFF.test(hay), has_website: !!x.domain, last_seen: now,
  } };
});
