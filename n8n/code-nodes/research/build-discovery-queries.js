// n8n Code node: Build Discovery Queries
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// LIVE MODE: one discovery request per (state, city, search phrase), fanned out to SerpApi + Apify Maps.
// Demo mode keeps it tiny: first city per state x first phrase.
const cfg = $input.first().json;
const names = { FL: 'Florida', GA: 'Georgia', NC: 'North Carolina', SC: 'South Carolina', VA: 'Virginia' };
const locs = cfg.discovery_locations || {};
const out = [];
for (const st of cfg.states) {
  let cities = locs[st] && locs[st].length ? locs[st] : [names[st] || st];
  let queries = cfg.search_queries;
  if (cfg.demo_mode) { cities = cities.slice(0, 1); queries = queries.slice(0, 1); }
  for (const city of cities) {
    queries.forEach(function (q, qi) {
      out.push({ json: { state: st, state_name: names[st] || st, city_hint: city, phrase: q, phrase_index: qi, text_query: q + ' ' + city + ', ' + st } });
    });
  }
}
return out;
