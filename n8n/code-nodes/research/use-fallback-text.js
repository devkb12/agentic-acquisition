// n8n Code node: Use Fallback Text
// Workflow: Agentic Acquisition Intelligence - TrueGrit copy 2

// Fallback: if Apify could not scrape a firm's site (busy / blocked), use the homepage fetched directly by n8n.
const cands = $('Extract Website Text').all().map(function (i) { return i.json; });
const now = new Date().toISOString();
const NL = String.fromCharCode(10), CR = String.fromCharCode(13), TAB = String.fromCharCode(9);
return $input.all().map(function (item, idx) {
  const c = Object.assign({}, cands[idx] || {});
  if (c.pages_scraped > 0 || !c.website) return { json: c };
  const html = (item.json && typeof item.json.data === 'string') ? item.json.data : '';
  let text = html.replace(/<script[^>]*>[^]*?<[/]script>/gi, ' ').replace(/<style[^>]*>[^]*?<[/]style>/gi, ' ').replace(/<[^>]*>/g, ' ');
  text = text.split(NL).join(' ').split(CR).join(' ').split(TAB).join(' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/ +/g, ' ').trim().slice(0, 8000);
  if (text.length > 200) {
    c.website_text = '=== PAGE: ' + c.website + ' (homepage, direct fetch) ===' + NL + text;
    c.pages_scraped = 1; c.scraped_page_urls = [c.website]; c.scrape_method = 'direct_fetch_fallback'; delete c.scrape_note;
    c.sources = (c.sources || []).concat([{ field: 'website_page', value: '(homepage text, direct fetch fallback)', source: 'Firm website (direct fetch)', url: c.website, status: 'verified', extracted_at: now }]);
    c.source_urls = Array.from(new Set((c.source_urls || []).concat([c.website])));
  }
  return { json: c };
});
