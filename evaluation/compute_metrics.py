"""Compute evaluation metrics for the TrueGrit research workflow from the committed data snapshots.

    python3 evaluation/compute_metrics.py   -> evaluation/results/metrics.json and evaluation/results/metrics.md

Inputs (evaluation/data/):
  firm_results_snapshot_2026-11-11.csv  89 live firms (sample/fictional firms excluded) as served by the dashboard feed
  run_log_snapshot_2026-11-11.json      Run_Log tab: per-run discovery / classification counts
  n8n_executions.csv                    n8n execution list for the research workflow (status, start, stop)
No numbers in the report are typed in by hand; they come from this script.
"""
import csv, json, os, statistics as st
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, 'data'); R = os.path.join(HERE, 'results')
os.makedirs(R, exist_ok=True)

firms = list(csv.DictReader(open(os.path.join(D, 'firm_results_snapshot_2026-11-11.csv'))))
runs = json.load(open(os.path.join(D, 'run_log_snapshot_2026-11-11.json')))['runs']
execs = list(csv.DictReader(open(os.path.join(D, 'n8n_executions.csv'))))

def num(v):
    try: return float(v)
    except (TypeError, ValueError): return None
def pct(a, b): return round(100.0 * a / b, 1) if b else None
def count(rows, key, val): return sum(1 for r in rows if r[key] == val)
def ts(s): return datetime.fromisoformat(s.replace('Z', '+00:00'))

N = len(firms)
M = {'n_firms': N}

# ---------------- Outcome distribution ----------------
M['fit_distribution'] = {k: count(firms, 'fit', k) for k in ['High', 'Moderate', 'Low', 'Insufficient']}
targets = [f for f in firms if f['fit'] in ('High', 'Moderate')]
M['target_rate_pct'] = pct(len(targets), N)
low = [f for f in firms if f['fit'] == 'Low']
M['low_fit_reasons'] = {g: sum(1 for f in low if f['gate'] == g) for g in ['plaintiff', 'criminal', 'not_ins_defense', '']}
M['gate_catches_high_scores'] = [f['domain'] + ' (score ' + f['score'] + ')' for f in low if f['gate'] and num(f['score']) and num(f['score']) >= 50]
M['by_state'] = {s: {k: sum(1 for f in firms if f['state'] == s and f['fit'] == k) for k in ['High', 'Moderate', 'Low', 'Insufficient']} for s in ['FL', 'GA']}

# ---------------- Tool / pipeline reliability (per firm) ----------------
M['ai_classification_failed'] = {'n': sum(int(f['class_failed']) for f in firms), 'pct': pct(sum(int(f['class_failed']) for f in firms), N)}
unread = [f for f in firms if f['pages'] in ('0', '')]
M['website_unreadable'] = {'n': len(unread), 'pct': pct(len(unread), N)}
M['website_pages_scraped_mean'] = round(st.mean(num(f['pages']) or 0 for f in firms), 2)
M['keyword_scorecard_ran'] = {'n': sum(1 for f in firms if f['ins_score'] != ''), 'pct': pct(sum(1 for f in firms if f['ins_score'] != ''), N)}
M['registry_entity_found'] = {'n': sum(1 for f in firms if f['entity'] in ('Active', 'Inactive')), 'pct': pct(sum(1 for f in firms if f['entity'] in ('Active', 'Inactive')), N),
                              'inactive_entities': [f['domain'] for f in firms if f['entity'] == 'Inactive']}
M['evidence_rows_per_firm'] = {'mean': round(st.mean(num(f['n_evidence']) for f in firms), 1), 'min': min(int(f['n_evidence']) for f in firms), 'max': max(int(f['n_evidence']) for f in firms)}
M['data_confidence'] = {k: count(firms, 'confidence', k) for k in ['High', 'Medium', 'Low']}

# ---------------- Attorney count (size) completeness ----------------
M['attorney_count_status'] = {k: count(firms, 'att_status', k) for k in ['verified', 'estimated', 'missing']}
M['attorney_count_known_pct'] = pct(M['attorney_count_status']['verified'] + M['attorney_count_status']['estimated'], N)

# ---------------- Run-level metrics ----------------
full_live = [r for r in runs if r['dataMode'] == 'LIVE' and r['processed'] == 16]
M['full_live_runs'] = len(full_live)
M['funnel_mean_per_run'] = {k: round(st.mean(r[k] for r in full_live), 1) for k in ['discovered', 'duplicates', 'rejected', 'droppedOverLimit', 'processed']}
M['funnel_research_yield_pct'] = pct(M['funnel_mean_per_run']['processed'], M['funnel_mean_per_run']['discovered'])
M['source_mix_mean_per_run'] = {k: round(st.mean(r[k] for r in full_live), 1) for k in ['serpapi', 'apifyMaps', 'sunbiz', 'usaspending', 'registryMatches']}
M['ai_failures_per_run'] = {'sum': sum(r['aiFailures'] for r in full_live), 'firms': sum(r['processed'] for r in full_live)}
M['ai_failures_per_run']['pct'] = pct(M['ai_failures_per_run']['sum'], M['ai_failures_per_run']['firms'])
M['runs_completed_with_errors'] = {'n': sum(1 for r in full_live if r['status'] == 'completed_with_errors'), 'of': len(full_live)}

ex = {e['execution_id']: e for e in execs}
M['n8n_executions'] = {'total': len(execs), 'success': sum(1 for e in execs if e['status'] == 'success'), 'scheduled': sum(1 for e in execs if e['mode'] == 'trigger')}
durs = []
for r in full_live:
    e = ex.get(r['id'])
    if e: durs.append((ts(e['stopped_at']) - ts(e['started_at'])).total_seconds())
M['latency_full_run_minutes'] = {'mean': round(st.mean(durs) / 60, 1), 'min': round(min(durs) / 60, 1), 'max': round(max(durs) / 60, 1), 'n': len(durs)}
M['latency_seconds_per_researched_firm'] = round(st.mean(durs) / 16, 1)

# ---------------- Baselines ----------------
# B0  Current-state starting point: a Google Maps search list taken at face value (every result treated as a lead).
M['baseline_B0_maps_list'] = {'leads': N, 'true_targets_by_system': len(targets), 'precision_pct': pct(len(targets), N),
                              'plaintiff_or_criminal_pct': pct(sum(1 for f in firms if f['gate'] in ('plaintiff', 'criminal')), N)}
# B1  Simpler automated baseline without the LLM: keyword scorecard only (lead if score >= 5, the 'Moderate' band).
kw_leads = [f for f in firms if num(f['ins_score']) is not None and num(f['ins_score']) >= 5]
kw_fp = [f['domain'] for f in kw_leads if f['gate'] in ('plaintiff', 'criminal', 'not_ins_defense')]
kw_missed = [f['domain'] for f in targets if not (num(f['ins_score']) is not None and num(f['ins_score']) >= 5)]
M['baseline_B1_keyword_only'] = {'leads': len(kw_leads), 'leads_the_llm_gated_out': len(kw_fp), 'examples_gated': kw_fp[:8],
                                 'system_targets_missed_by_keywords': kw_missed, 'agreement_with_system_pct': pct(len(kw_leads) - len(kw_fp), len(kw_leads))}

# ---------------- Iteration evidence from the Run_Log ----------------
by = {r['id']: r for r in runs}
pre_fb, post_fb = [by['184'], by['185']], [by[i] for i in ['186', '207', '269', '341', '392']]
M['iter_fallback_fetch'] = {'change': 'Oct 29 03:02 - direct homepage fetch fallback + retry unreadable firms',
                            'insufficient_rate_before_pct': pct(sum(r['insufficient'] for r in pre_fb), sum(r['processed'] for r in pre_fb)),
                            'insufficient_rate_after_pct': pct(sum(r['insufficient'] for r in post_fb), sum(r['processed'] for r in post_fb)),
                            'runs_before': [r['id'] for r in pre_fb], 'runs_after': [r['id'] for r in post_fb]}
pre_fx, post_fx = [by[i] for i in ['184', '185', '186']], [by[i] for i in ['207', '269', '341', '392']]
M['iter_json_fixer'] = {'change': 'Oct 29 03:17 - dedicated auto-fix models for the AI JSON output parsers',
                        'ai_failure_rate_before_pct': pct(sum(r['aiFailures'] for r in pre_fx), sum(r['processed'] for r in pre_fx)),
                        'ai_failure_rate_after_pct': pct(sum(r['aiFailures'] for r in post_fx), sum(r['processed'] for r in post_fx))}

# ---------------- Iteration v3 replay: High-Fit cap (applied to the 89 live firms) ----------------
def ins_factor(f):
    ai = {'Strong': 1.0, 'Partial': 0.5, 'None': 0.0}.get(f['ai_fit'])
    s = num(f['ins_score'])
    sc = None if s is None else (1.0 if s >= 15 else 0.6 if s >= 5 else 0.2 if s >= 0 else 0.0)
    if ai is None: return sc
    if sc is None: return ai
    return (ai + sc) / 2
replay = []
for f in firms:
    new = f['fit']
    reason = ''
    if f['fit'] == 'High':
        insf = ins_factor(f)
        if f['def_vs_pl'] == 'Both': new, reason = 'Moderate', 'mixed plaintiff/defense'
        elif insf is None or insf < 0.6: new, reason = 'Moderate', 'partial insurance-defense evidence (%.0f%%)' % (100 * (insf or 0))
    disp = num(f['score'])
    if num(f['coverage']) is not None and num(f['coverage']) < 40 and disp is not None:
        disp = round(disp * num(f['coverage']) / 100)   # unscaled = observed / 100; observed = normalized x coverage
    replay.append({'domain': f['domain'], 'fit_before': f['fit'], 'fit_after': new, 'reason': reason, 'score_before': f['score'], 'score_after': disp})
changed = [x for x in replay if x['fit_before'] != x['fit_after']]
unambig = lambda dom: next(f for f in firms if f['domain'] == dom)
def clean_target(f): return f['def_vs_pl'] == 'Defense' and f['ai_fit'] == 'Strong'
hb = [f for f in firms if f['fit'] == 'High']; ha = [unambig(x['domain']) for x in replay if x['fit_after'] == 'High']
M['iter_v3_high_fit_cap'] = {
    'change': 'Nov 11 - High Fit requires insurance-defense factor >= 60% and not a mixed plaintiff/defense practice; low-coverage scores shown unscaled',
    'high_before': len(hb), 'high_after': len(ha), 'moved_to_moderate': [(x['domain'], x['reason']) for x in changed],
    'high_precision_proxy_before_pct': pct(sum(1 for f in hb if clean_target(f)), len(hb)),
    'high_precision_proxy_after_pct': pct(sum(1 for f in ha if clean_target(f)), len(ha)),
    'clean_targets_lost': [f['domain'] for f in hb if clean_target(f) and f not in ha],
    'insufficient_display_score_mean_before': round(st.mean(num(x['score_before']) for x in replay if x['fit_before'] == 'Insufficient' and num(next(f for f in firms if f['domain'] == x['domain'])['coverage']) < 40), 1),
    'insufficient_display_score_mean_after': round(st.mean(num(x['score_after']) for x in replay if x['fit_before'] == 'Insufficient' and num(next(f for f in firms if f['domain'] == x['domain'])['coverage']) < 40), 1),
    'precision_proxy_definition': 'share of High Fit firms the AI rated both Defense-side and Strong insurance-defense fit (unambiguous targets)'}
with open(os.path.join(R, 'v3_replay.csv'), 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(replay[0].keys())); w.writeheader(); w.writerows(replay)

# ---------------- HITL ----------------
M['hitl'] = {'routed_to_review_needs_review': len(targets), 'routed_needs_more_evidence': M['fit_distribution']['Insufficient'],
             'auto_screened_out': M['fit_distribution']['Low'], 'review_decisions_recorded': 0,
             'review_load_pct_of_processed': pct(len(targets), N)}

json.dump(M, open(os.path.join(R, 'metrics.json'), 'w'), indent=2)

# ---------------- Markdown summary ----------------
L = ['# Metrics (generated by compute_metrics.py)', '', 'Snapshot: 89 live firms, %d full live runs, %d n8n executions.' % (M['full_live_runs'], M['n8n_executions']['total']), '',
     '| Metric | Value |', '|---|---|']
def row(k, v): L.append('| %s | %s |' % (k, v))
fd = M['fit_distribution']
row('Fit distribution (High / Moderate / Low / Insufficient)', '%d / %d / %d / %d' % (fd['High'], fd['Moderate'], fd['Low'], fd['Insufficient']))
row('Target rate (High+Moderate of researched)', '%s%%' % M['target_rate_pct'])
row('Low Fit reasons (plaintiff / criminal / not insurance-defense / score)', '%d / %d / %d / %d' % tuple(M['low_fit_reasons'][k] for k in ['plaintiff', 'criminal', 'not_ins_defense', '']))
row('Hard gate caught firms scoring >= 50', len(M['gate_catches_high_scores']))
row('AI classification failed', '%d (%s%%)' % (M['ai_classification_failed']['n'], M['ai_classification_failed']['pct']))
row('Website unreadable (0 pages)', '%d (%s%%)' % (M['website_unreadable']['n'], M['website_unreadable']['pct']))
row('Keyword scorecard ran', '%s%%' % M['keyword_scorecard_ran']['pct'])
row('Sunbiz/registry entity found', '%d (%s%%)' % (M['registry_entity_found']['n'], M['registry_entity_found']['pct']))
row('Evidence rows per firm (mean, min-max)', '%s (%s-%s)' % (M['evidence_rows_per_firm']['mean'], M['evidence_rows_per_firm']['min'], M['evidence_rows_per_firm']['max']))
ac = M['attorney_count_status']
row('Attorney count verified / estimated / missing', '%d / %d / %d (known %s%%)' % (ac['verified'], ac['estimated'], ac['missing'], M['attorney_count_known_pct']))
fm = M['funnel_mean_per_run']
row('Funnel per full run (discovered > duplicates > over cap > researched)', '%s > %s > %s > %s (yield %s%%)' % (fm['discovered'], fm['duplicates'], fm['droppedOverLimit'], fm['processed'], M['funnel_research_yield_pct']))
row('AI failures per researched firm (full runs)', '%s%%' % M['ai_failures_per_run']['pct'])
row('n8n executions succeeded', '%d / %d (%d scheduled)' % (M['n8n_executions']['success'], M['n8n_executions']['total'], M['n8n_executions']['scheduled']))
lt = M['latency_full_run_minutes']
row('Latency per full run (16 firms)', '%s min mean (%s-%s), ~%s s per firm' % (lt['mean'], lt['min'], lt['max'], M['latency_seconds_per_researched_firm']))
b0 = M['baseline_B0_maps_list']; b1 = M['baseline_B1_keyword_only']
row('Baseline B0 Maps list precision', '%s%% (plaintiff/criminal %s%%)' % (b0['precision_pct'], b0['plaintiff_or_criminal_pct']))
row('Baseline B1 keyword-only leads / gated out by LLM / targets missed', '%d / %d / %d' % (b1['leads'], b1['leads_the_llm_gated_out'], len(b1['system_targets_missed_by_keywords'])))
i1 = M['iter_fallback_fetch']; i2 = M['iter_json_fixer']; i3 = M['iter_v3_high_fit_cap']
row('Iteration: fallback fetch, Insufficient rate', '%s%% -> %s%%' % (i1['insufficient_rate_before_pct'], i1['insufficient_rate_after_pct']))
row('Iteration: JSON fixer, AI failure rate', '%s%% -> %s%%' % (i2['ai_failure_rate_before_pct'], i2['ai_failure_rate_after_pct']))
row('Iteration v3: High Fit count / precision proxy', '%d -> %d / %s%% -> %s%%' % (i3['high_before'], i3['high_after'], i3['high_precision_proxy_before_pct'], i3['high_precision_proxy_after_pct']))
row('Iteration v3: displayed score, unreadable-site firms', '%s -> %s' % (i3['insufficient_display_score_mean_before'], i3['insufficient_display_score_mean_after']))
row('Human review decisions recorded', M['hitl']['review_decisions_recorded'])
open(os.path.join(R, 'metrics.md'), 'w').write('\n'.join(L) + '\n')
print('\n'.join(L))
