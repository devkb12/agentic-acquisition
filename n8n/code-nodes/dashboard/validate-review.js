// n8n Code node: Validate Review
// Workflow: TrueGrit Dashboard (front end)

// Parse the review sent by the page (sent as text/plain to avoid a CORS preflight) and check the access key.
const KEY = "tg-xIodnjQgfTti";
let b = $json.body;
if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
b = b || {};
function clip(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').slice(0, n).trim(); }
const allowed = ['Investigate further', 'Needs more evidence', 'Not a fit', 'Data corrected'];
let error = '';
if (b.key !== KEY) error = 'Access key not accepted';
else if (!clip(b.company_id, 200)) error = 'Missing firm id';
else if (allowed.indexOf(b.decision) === -1) error = 'Choose a decision';
else if (!clip(b.reviewer, 80)) error = 'Add your name';
return [{ json: { ok: !error, error: error, row: { company_id: clip(b.company_id, 200), company_name: clip(b.company_name, 200),
  reviewer_decision: b.decision, reviewer_notes: clip(b.notes, 2000), reviewer_corrections: clip(b.corrections, 1000),
  reviewed_by: clip(b.reviewer, 80), reviewed_at: new Date().toISOString() } } }];
