# Assignment 3 — Prototype + Test & Evaluation
**Agentic Acquisition Intelligence · TrueGrit Capital × VIMANA · ASU MSAIB capstone**
Team: Dev Bhattacharyya (lead), Dareen Alsaeed, Hana Ryu, Madison Schuler, Jorge Cervantes Franco · Evaluation snapshot: November 11, 2026

> **Bottom line.** The prototype runs end to end on live data: 25 of 25 n8n executions succeeded, including weekly scheduled runs. It has researched **89 real Florida and Georgia law firms**, written **3,345 evidence rows** to Google Sheets, and serves them through a live dashboard. It reliably screens out the wrong firms: 64 of 89 were rejected with a stated reason, including 16 that scored ≥ 50 before a hard gate caught them. Its two biggest weaknesses are **coverage**, since Google Maps discovery is 52% plaintiff/criminal and only 2.4% of discovered firms get researched per run, and **firm size**, with attorney count missing for 91% of firms. Testing also showed that 4 of the 6 "High Fit" firms were mixed-practice or only partly insurance-defense. We changed the scoring rule, re-tested it (34/37 → 37/37 executable tests), and replayed it on the live firms. Unambiguous targets now make up 100% of High Fit firms, up from 33%, and no clear target was lost.

---

## 1. Working prototype — what actually runs

| Component | Evidence | Where |
|---|---|---|
| n8n research workflow (62 nodes) | 25/25 executions `success` Oct 22 – Nov 8; 7 full live runs of 16 firms each; weekly Sunday schedule (executions 269, 392) | `data/n8n_executions.csv`, `n8n/research-workflow.json` |
| Discovery (5 sources) | SerpApi Google Maps (600 results/run), Apify Maps (~62/run), Sunbiz Daily, USAspending, **Justia directory (added Nov 11)** | `data/run_log_snapshot_2026-11-11.json` |
| Website reading | Apify Website Content Crawler + direct-fetch fallback; 4.2 pages read per firm on average | snapshot CSV `pages` |
| AI classification + research | OpenAI structured output (practice areas, defense vs plaintiff, civil vs criminal, B2B focus, carriers, size); research agent with a page-fetch tool for High/Moderate firms | workflow nodes `AI Classify Firm`, `Research Agent` |
| Deterministic scoring | Sponsor keyword scorecard v2.3, 7-factor fit score, hard gates, revenue rule of thumb | `n8n/code-nodes/research/*.js` |
| Public records | Sunbiz entity lookup (entity found for 34.8% of firms), USAspending awards | `merge-public-records.js` |
| Storage | Google Sheets: Company_Leads, AI_Analysis, Source_Log (3,345 rows), Review_Queue, Run_Log, Dashboard_Summary; n8n data table `TrueGrit_Firm_Universe` | live feed |
| Review UI | Lodestar dashboard (Next.js on Vercel): ranked table, firm files with evidence, review form → Review_Queue | https://truegrit-dashboard.vercel.app |

## 2. Test design

See **[TEST_CASES.md](TEST_CASES.md)**. Summary:

- **37 executable tests** run the real Code-node JavaScript with n8n's globals (`node evaluation/tests/run_tests.js`). They cover 7 normal, 10 boundary, 10 edge, 2 exception, 2 failure and 6 adversarial cases. The adversarial cases are plaintiff firms using insurance language, criminal "defense" firms, keyword stuffing, prompt-injection text and mixed-side firms.
- **17 live-data cases**: real firms from the live runs, with expected vs actual results.
- **8 HITL, guardrail and security checks**, plus 3 tests still pending a live run.

## 3. Metrics and baselines

All values come from `compute_metrics.py` → `results/metrics.json`.

### 3.1 Technical metrics

| Metric | Definition | Value |
|---|---|---|
| Execution success | n8n executions with status `success` | **25 / 25** |
| Runs completed cleanly | Full live runs with no per-firm errors | 0 / 7 (all 7 `completed_with_errors`: AI failures are tolerated and logged) |
| AI classification failure rate | Firms whose LLM output could not be parsed | **11.2%** of firms (10/89); 9.8% of researched firms per run |
| Website read success | Firms with ≥ 1 page of text | 93.3% (6 unreadable) |
| Keyword scorecard coverage | Firms with enough text to score | 91.0% |
| Registry match | Sunbiz entity found | 34.8% (3 found **Inactive**) |
| Evidence depth | Source_Log rows per firm | mean 34.3 (8–101) |
| Size data completeness | Attorney count verified / estimated / missing | 7 / 1 / 81 → **9.0% known** |
| Latency | Full run (16 firms) | **8.3 min** mean (7.1–10.5) ≈ 31 s per firm |
| Discovery funnel | Per full run: discovered → duplicates → over the per-state cap → researched | 662 → 279 → 305 → **16 (2.4% yield)** |
| Cost | Per run: 30 SerpApi searches, ~10 Apify Maps runs, 16 site crawls, ~16 classification calls + research-agent calls for targets | API calls are known; **dollar cost not measured** (to be taken from provider billing) |

### 3.2 Business metrics

| Metric | Value |
|---|---|
| Target rate (High + Moderate of researched firms) | **7.9%** (7 / 89) |
| Off-target firms screened out with a reason | 64 / 64 (43 plaintiff, 3 criminal, 18 not insurance-defense) |
| Wrong firms caught by a hard gate despite a score ≥ 50 | **16** (e.g. Felipe E. Diez score 80, Stockham 68, Leader Leader & Zucker 64) |
| Reviewer workload | 7 of 89 firms (7.9%) sent to human review; 18 flagged "needs more evidence" |
| Data confidence (High / Medium / Low) | 42 / 29 / 18 |

### 3.3 Baselines

| Baseline | Description | Result vs system |
|---|---|---|
| **B0 Current state: a Google Maps list** | What an analyst gets by searching "insurance defense law firm" in each city and treating results as leads | Precision **7.9%**; **51.7%** of the list is plaintiff or criminal. The system removes these automatically with a stated reason and evidence |
| **B1 Simpler automation: keyword-only, no LLM** | Lead if sponsor keyword score ≥ 5 | 22 leads, of which **18 (82%) are plaintiff/non-target firms** that use insurance vocabulary. It also misses **4 of 7** system targets whose sites use little of that vocabulary (Brennan Harris, Jimerson Birr, Murphy & Ellis, Neblett). Agreement with the system: 18.2% |

The keyword baseline is why an LLM is used. Defense vs plaintiff is a matter of *who the firm represents*, and the same words ("bad faith", "coverage", "insurance claims") appear on both sides.

## 4. Results

- **Executable tests:** 34/37 passed on the pre-evaluation version and **37/37 after the fix** (`results/unit_test_results*.csv`).
- **Live cases:** 11/17 passed on the version that produced the live data, and 16/17 with the fix replayed (L16, sample rows in the live feed, is still open).
- **What works:** hard gates (all plaintiff and criminal adversarial cases passed, live and synthetic), dedupe and skip-researched logic, boundary handling of size and thresholds, safe handling of AI and scraper failures (always sent to "Needs more evidence", never shown as a target), and evidence provenance.
- **What does not:** see §5. The negative results are reported in full: the High Fit list was 67% contaminated before the fix, the JSON auto-fixer did not reduce AI failures, size data is mostly missing, no human review has been recorded yet, and a secret is exposed.

## 5. Failure-mode analysis

| # | Failure mode | Frequency (evidence) | Root cause | Impact | Mitigation | Status |
|---|---|---|---|---|---|---|
| F1 | **Discovery is off-target** | 51.7% of researched firms plaintiff or criminal | Google Maps ranks consumer PI firms highly for "insurance … lawyer" queries | AI and reviewer effort spent on non-targets; sponsor: "47 FL firms, several plaintiff" | Plaintiff/criminal hard gates; defense-leaning queries ranked first; **Justia insurance-defense directory added** | Gates work; Justia pending live run (P01) |
| F2 | **Universe not captured** | 662 firms discovered per run, 16 researched; 305 dropped by the per-state cap | `limit_per_state = 8` to control API/AI cost | Market coverage too low for sponsor (several hundred FL firms expected) | `TrueGrit_Firm_Universe` table stores every in-scope firm before the cap | Added Nov 11; pending run |
| F3 | **Attorney count missing** | 81/89 (91%) | Small-firm sites rarely state headcount; LLM won't guess | Size factor unscored, revenue estimate unavailable | Justia listing count as a labelled **lower bound** (test E04); Florida Bar firm search next | Partial |
| F4 | **AI output parse failures** | 10/89 firms (11.2%) | Long/odd website text → malformed JSON | Firm can't be judged | Routed to "Needs more evidence" (X01, L12, L17). Auto-fix models added Oct 29 **did not help** (6.2% → 12.5%) | Open: retry with shorter input |
| F5 | **Unreadable websites** | 6 firms with 0 pages; 72% Insufficient before fallback | Bot protection, Apify 5-concurrent-run limit | No evidence → no judgement | Direct-fetch fallback + retry of unreadable firms (72% → 22.5% Insufficient) | Fixed (Oct 29) |
| F6 | **Misleading score on low evidence** | 8 firms displayed 82–84 at 20% coverage | Score normalised over the few factors that could be scored | Reviewer could read a no-evidence firm as top-ranked | Show unscaled score below the coverage floor (mean displayed 82.8 → 16.4) | Fixed (Nov 11, v3) |
| F7 | **Mixed or partial firms rated High** | 4 of 6 High Fit (HD Law Partners #1, Neblett, Jimerson Birr, Murphy & Ellis) | Size/geography/completeness points can push a partial-fit firm over 70 | Reviewer list polluted; mixed-side firms ranked first | High requires practice-fit ≥ 60% and not AI "Both"; capped firms get an explicit flag (tests N02, A05) | Fixed (Nov 11, v3) |
| F8 | **Registry cross-reference at discovery never matches** | 0 matches in 7 runs | Sunbiz Daily feed returns only 10 recent filings named "LAW FIRM" | Discovery-stage registry data adds nothing | Per-firm Sunbiz lookup (34.8% found) is the useful path | Open: remove or re-query |
| F9 | **Sample rows in live feed** | 4 fictional firms ranked at 97 | Demo-run rows never purged from Company_Leads | Could mislead a sponsor demo (labelled SAMPLE) | Purge demo rows / filter `sample` in feed | Open |
| F10 | **Inactive entities not gated** | 3 firms with Sunbiz status Inactive | Entity status displayed but not scored | Possible dissolved firm in pipeline | Add as a risk flag | Open |
| F11 | **HITL loop unexercised** | 0 review decisions recorded | Team has not reviewed yet | Review path unvalidated end to end | Review the 7 queued firms (P03) | Open |
| F12 | **Secret in public repo** | 1 key in `website/index.html` | Legacy single-file dashboard embeds the feed key | Anyone can read feed / post reviews | Rotate key; remove legacy page; make repo private | Open, **highest priority** |

## 6. Iteration and evidence-based improvement

Every change is a saved version in n8n (`data/workflow_version_history.csv`) and can be measured in the Run_Log.

| # | Date | Evidence that triggered it | Change | Measured effect |
|---|---|---|---|---|
| I1 | Oct 29 01:57 | Felipe E. Diez queued as **High Fit** in run 172 although its site says it represents plaintiffs | Plaintiff and criminal **hard gates**; defense-leaning queries | Same firm re-scored **Low Fit** after the gate (run 177); 46 plaintiff/criminal firms gated since. Across all gates, 16 screened-out firms had scores ≥ 50 |
| I2 | Oct 29 03:02 | Runs 184–185: 23 of 32 firms "Insufficient Information" (Apify 5-run limit, blocked sites) | Direct homepage fetch fallback, retry of unreadable firms, one Apify search per city | Insufficient rate **71.9% → 22.5%** (runs 186–392) |
| I3 | Oct 29 03:17 | AI JSON parse failures | Dedicated auto-fix models on output parsers | **No improvement**: AI failure rate 6.2% → 12.5% (small samples). Kept, because failures are still handled safely, but listed as an open problem |
| I4 | Nov 11 | Sponsor feedback: Maps-only coverage too narrow; attorney counts critical | Justia directory discovery (5th source), directory attorney count as a lower bound, Firm Universe table | Unit tests D01, D07, E04, E05, X03 pass; live effect pending run P01 |
| I5 | Nov 11 | Tests N02, A05, X04 failed; live L05–L08, L11 | High Fit requires practice-fit ≥ 60% and not mixed-side, with an explicit flag; unscaled score below coverage floor | Tests **34/37 → 37/37**; replay on 89 live firms: High **6 → 2**, High precision proxy **33% → 100%**, clean targets lost **0**; low-evidence displayed score 82.8 → 16.4 (`results/v3_replay.csv`) |

*Precision proxy* = the share of High Fit firms that the AI rated both **Defense-side** and **Strong** insurance-defense fit. It is not an independent label. Human review of the 7 queued firms (P03) is the planned check.

## 7. HITL, thresholds, escalation and guardrails

| Control | Rule | Tested by |
|---|---|---|
| **Research only, no autonomous action** | Output is research for a reviewer; next action for every target: "Do not contact the firm until TrueGrit/VIMANA approves" | H02, N01 |
| **Review threshold** | High (score ≥ 70, practice-fit ≥ 60%, not mixed-side) and Moderate (≥ 45) → `review_required`, "Needs review" with a reason | H01, B05, B06, N02 |
| **Escalation: weak evidence** | Coverage < 40% of the 100-point model, AI failure, or unreadable site → "Needs more evidence"; never a target | B07, X01, X04, H03 |
| **Hard gates** | Plaintiff-side, criminal, or not insurance-defense → Low Fit regardless of score; optional out-of-range size screen | A01, A02, B04, L03, L04, L10 |
| **Reviewer flags** | Capped-at-Moderate reasons, plaintiff phrases found on site, keyword vs AI disagreement, enrichment failure, lower-bound attorney counts | A05, A06, X02, E04 |
| **Evidence grounding** | Each field labelled Verified / Estimated / Missing with source URL and quote; strategic signals need both URL and quote to count | E03, H05 |
| **Adversarial robustness** | Keyword terms counted once (no stuffing); deterministic scorecard is immune to prompt-injection text; the LLM is pending (P02) | A03, A04 |
| **Auditability** | Screened-out firms kept with their reason; every run in Run_Log; every workflow change versioned | H04 |

## 8. Privacy and security controls

- **Public business data only.** Firm websites, Google Maps listings, state registries, USAspending, and Justia attorney directory listings (a professional directory). No personal or consumer data is collected, and no LinkedIn scraping (sponsor asked; it is a paid / terms-restricted source).
- **Credentials** live in n8n's credential store, never in workflow JSON. The workflow export in this repository was scanned for keys before commit.
- **Web app** keeps the n8n access key in a server environment variable; the browser never sees it (H07).
- **Open issue (F12):** the legacy `website/index.html` still embeds the dashboard access key and the repository is public. Fix: rotate the key in the n8n dashboard workflow, delete the legacy page or replace the key, and make the repository private.
- **Data minimisation:** attorney names from Justia are stored only to count listings per firm (lower-bound size).

## 9. Known limitations

1. **No independent ground truth.** Expected outcomes are judged from evidence the system captured. Precision and recall need human labels; the 7 queued firms plus a random sample of 10 screened-out firms are the planned labelling set.
2. **Small samples** for iteration comparisons (2 runs before vs 5 runs after for I2; 3 vs 4 runs for I3).
3. **Weights are provisional** until the sponsors confirm the rubric; the High threshold (70) and practice-fit floor (60%) are team choices.
4. **Coverage**: 16 firms researched per weekly run; full market coverage depends on raising the cap and the new directory sources.
5. **Cost not measured** in dollars.
6. **Justia changes (I4) are unit-tested but not yet run live**; Justia may block automated requests from n8n's servers. The parser fails safe (X03).

## 10. AI technique selection and critical validation

- **LLM where judgement over unstructured text is needed**: deciding whether a firm represents insurers or claimants from its website. Baseline B1 shows keywords alone get this wrong 82% of the time.
- **Structured outputs and schema parsers**, so every LLM result is typed and checkable; failures are caught and routed rather than guessed.
- **Deterministic code for every decision rule** (gates, thresholds, scoring, revenue formula), so decisions are explainable, testable (37 tests) and not changeable by text on a website.
- **Research agent only for High/Moderate firms**, to control cost and latency.
- **Human makes the final call**; the system ranks and documents.

## 11. Next steps (before the sponsor demo)

1. Rotate the exposed key and make the repository private (F12).
2. Run the workflow in demo mode to validate Justia (P01) and compare FL firm counts against the 47-firm Maps baseline.
3. Team review of the 7 queued firms plus 10 random screened-out firms, to get real precision labels (P03, limitation 1).
4. Purge the 4 SAMPLE rows from Company_Leads (F9).
5. Florida Bar firm search for attorney counts (F3).

## Reproduce

```bash
node evaluation/tests/run_tests.js                     # 37 executable tests -> results/unit_test_results.csv
FIT_FILE=evaluation/tests/previous_versions/acquisition-fit-score.v2-before-eval.js \
  OUT_SUFFIX=_before_fix node evaluation/tests/run_tests.js   # same tests on the pre-fix version
python3 evaluation/compute_metrics.py                  # metrics.json, metrics.md, v3_replay.csv
```
