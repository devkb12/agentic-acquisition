// n8n Code node: Build Justia Page List
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// Justia Lawyer Directory discovery (sponsor ask, Nov 2026): page through the public practice-area listing for each state.
// Justia lists individual attorneys with their firm website, so it surfaces small (<10 lawyer) insurance-defense firms
// that Google Maps misses, and the listings per firm give a lower-bound attorney count.
const cfg = $('Run Configuration').first().json;
const SLUG = { FL: 'florida', GA: 'georgia', NC: 'north-carolina', SC: 'south-carolina', VA: 'virginia' };
const areas = cfg.directory_practice_areas || ['insurance-defense'];
const maxPages = cfg.demo_mode ? 1 : (cfg.justia_max_pages || 15);
const out = [];
for (const st of (cfg.states || ['FL', 'GA'])) {
  const s = SLUG[st];
  if (!s) continue;
  for (const a of areas) {
    for (let p = 1; p <= maxPages; p++) {
      out.push({ json: { state: st, practice_area: a, page: p, url: 'https://www.justia.com/lawyers/' + a + '/' + s + (p > 1 ? '?page=' + p : '') } });
    }
  }
}
return out;
