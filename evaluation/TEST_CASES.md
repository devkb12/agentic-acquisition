# Test set — Agentic Acquisition Intelligence (TrueGrit × VIMANA)

Three layers of tests. Every result is reproducible from this repository.

| Layer | What it tests | How it runs | Count |
|---|---|---|---|
| **U** Executable unit / integration tests | The real n8n Code-node JavaScript (fit score, keyword scorecard, discovery merge, Justia parser) on controlled inputs | `node evaluation/tests/run_tests.js` | 37 |
| **L** Live-data cases | Real firms from the 7 full live runs (Oct 29 – Nov 8), expected vs actual system output | `evaluation/data/firm_results_snapshot_2026-11-11.csv` | 17 |
| **H** HITL, guardrail and security checks | Review routing, escalation, privacy/security controls | Live dashboard + repository inspection | 8 |

Categories follow the assignment: **normal, boundary, edge, exception, failure, adversarial**.

---

## U — Executable tests (37)

Full expected/actual table: `results/unit_test_results.csv` (current version) and `results/unit_test_results_before_fix.csv` (before the evaluation-driven fix).

| Category | Cases | Before fix (v2) | After fix (v3) |
|---|---|---|---|
| Normal | N01–N05, D01, D07 | 6 / 7 | 7 / 7 |
| Boundary | B01–B09, D04 | 10 / 10 | 10 / 10 |
| Edge | E01–E06, D02, D03, D05, D06 | 10 / 10 | 10 / 10 |
| Exception | X01, X02 | 2 / 2 | 2 / 2 |
| Failure | X03, X04 | 1 / 2 | 2 / 2 |
| Adversarial | A01–A06 | 5 / 6 | 6 / 6 |
| **Total** | | **34 / 37** | **37 / 37** |

Highlights:

| ID | Category | Case | Expected | Result |
|---|---|---|---|---|
| B01–B04 | boundary | 10 / 9 / 400 / 401 attorneys | Full credit at 10 and 400; reduced below/above; 401 screened out when `exclude_outside` is on | PASS |
| B05–B06 | boundary | Score exactly at / one below the High threshold | Inclusive threshold | PASS |
| B07 | boundary | Evidence coverage 30% (< 40% floor) | Insufficient Information, not sent to review | PASS |
| E04 | edge | No attorney count on website; Justia lists 3 | 3 used as a labelled lower bound; revenue $0.9M–$1.5M (est.) | PASS (new in v2 iteration) |
| X01 | exception | AI classification returned no valid JSON | Insufficient Information; never routed as a target | PASS |
| X03 | failure | Every Justia page blocked or timed out | One stats-only item so the workflow does not stall | PASS |
| X04 | failure | Website unreadable | Displayed score should reflect low evidence | **FAIL in v2** (82/100 on 20% coverage) → PASS in v3 |
| N02 | normal | Partial insurance-defense fit, mixed clients | Moderate Fit | **FAIL in v2** (High, 71) → PASS in v3 |
| A01 | adversarial | Plaintiff firm with heavy insurance vocabulary | Low Fit via plaintiff gate | PASS |
| A03 | adversarial | "insurance defense" repeated 50× (keyword stuffing) | Counted once | PASS |
| A04 | adversarial | Prompt-injection text on the website | Deterministic scorecard unaffected; plaintiff terms still caught | PASS |
| A05 | adversarial | Mixed plaintiff/defense firm with strong keywords | Not High Fit without a reviewer flag | **FAIL in v2** → PASS in v3 |

---

## L — Live-data cases (17)

Source: firm records served by the live dashboard feed (`/api/feed`, `/api/firms/:id`), which reads the Google Sheet the n8n workflow writes. "Expected" is the behaviour the sponsor criteria call for, judged from the evidence the system itself captured; it is **not** an independent human label (see Limitations in the report).

| ID | Category | Firm | Evidence | Expected | Actual (v2, live) | Result |
|---|---|---|---|---|---|---|
| L01 | normal | Kirwan Danner & Alvarez, P.A. (FL) | Represents insurance carriers; AI Defense / Strong; keywords 13 | High Fit → review | High Fit, 91, Needs review | PASS |
| L02 | boundary | Brennan Harris & Rominger LLP (GA) | Defense / Strong; **5 attorneys (verified)**, below 10–400 band | Review with size warning | High Fit, 77; risk "five attorneys … limited scale" | PASS |
| L03 | adversarial | Law Offices of Felipe E. Diez (FL) | Insurance coverage language, but site says firm shifted to plaintiffs in 2015 | Low Fit | Low Fit (score 80 overridden by plaintiff gate) | PASS |
| L04 | adversarial | Morgan & Morgan (FL) | 1,100 attorneys (verified); plaintiff PI | Low Fit regardless of size | Low Fit | PASS |
| L05 | adversarial | HD Law Partners (FL) | Strong insurance defense but claimant-side content; AI: Both | Moderate + reviewer flag | **High Fit, ranked #1, no mixed-side flag** | FAIL (v2) → Moderate + flag (v3 replay) |
| L06 | adversarial | Neblett Law Group (FL) | Represents insurers and policyholders; AI: Both | Moderate + flag | High Fit | FAIL (v2) → Moderate (v3 replay) |
| L07 | normal | Jimerson Birr (FL) | Insurance defense "not clearly the core practice"; AI Partial; keywords 0 | Moderate | High Fit, 75 | FAIL (v2) → Moderate (v3 replay) |
| L08 | normal | Murphy & Ellis, PLLC (FL) | Business-law firm; AI Partial; keywords −5 | Moderate or Low | High Fit, 72 | FAIL (v2) → Moderate (v3 replay) |
| L09 | edge | Lawyer & Associates / Albert Lawyer Jr LUTCF (GA) | An **insurance agency**, not a law firm, returned by Google Maps | Screened out | Low Fit ("insurance agency services rather than legal services") | PASS |
| L10 | adversarial | Atlanta's Law Firm (GA) | Criminal defense ("defense" keyword trap) | Low Fit | Low Fit via criminal gate | PASS |
| L11 | failure | Claridge Law Firm (GA) | Website unreadable (0 pages) | Insufficient Information, low displayed score | Insufficient, **displayed 84** | PASS on routing / FAIL on score (v2) → 17 (v3) |
| L12 | exception | Your Insurance Attorney (GA) | AI classification failed; site says "no fee unless we win" | Not shown as a target | Insufficient Information, plaintiff phrase listed in risks | PASS |
| L13 | edge | Johns Law Group (FL) | Sunbiz entity **Inactive**; plaintiff | Low Fit; inactive status visible | Low Fit; entity status shown in firm file | PASS (inactive status is not itself a gate — see limitations) |
| L14 | boundary | Deming Parker (GA) | 52 attorneys (in band) but plaintiff | Low Fit (gate beats size) | Low Fit | PASS |
| L15 | normal | Salomon Smith PLLC (FL) | Policyholder-side claims messaging; 2 attorneys | Moderate at most, with flag | Moderate Fit; risk flags policyholder focus | PASS |
| L16 | failure | 4 fictional SAMPLE firms in the live feed | Leftover demo rows labelled "SAMPLE … (fictional)" | Excluded from live rankings | Shown and ranked at 97 (labelled SAMPLE) | **FAIL — open** |
| L17 | exception | Eagle Rock Defense Group (FL) | "Defense" in name; AI classification failed | Not auto-promoted | Insufficient Information | PASS |

Live-case pass rate: v2 **11 / 17** fully passing (L05–L08, L11 score, L16 failing) → v3 replay **16 / 17** (L16 still open).

---

## H — HITL, guardrail and security checks (8)

| ID | Control | Check | Result |
|---|---|---|---|
| H01 | Human review gate | Every High/Moderate firm has `review_required = true` and appears as "Needs review" with a `whyQueued` reason | PASS — 7/7 targets queued with reasons |
| H02 | No autonomous action | Recommended action for targets says "Do not contact the firm until TrueGrit/VIMANA approves" | PASS (fit-score node, tests N01/N02) |
| H03 | Escalation for weak evidence | Coverage < 40% or AI failure → "Needs more evidence", never a target | PASS — 18/18 Insufficient firms in "Needs more evidence" |
| H04 | Screened-out firms stay auditable | Low Fit firms are kept with the disqualifying reason, not deleted | PASS — 64/64 have a reason |
| H05 | Evidence provenance | Each field tagged Verified / Estimated / Missing with source URL | PASS — 3,345 evidence rows, 8–101 per firm |
| H06 | Reviewer decisions recorded | A decision written from the dashboard lands in Review_Queue | **NOT YET EXERCISED** — 0 decisions recorded |
| H07 | Secrets server-side | Web app keeps the n8n access key in a server env var | PASS (`web/lib/feed.ts`) |
| H08 | Secrets not published | No live keys in the public repository | **FAIL** — legacy `website/index.html` contains the dashboard access key; repository is public |

## Pending tests (need a live run in n8n)

| ID | Test | Why pending |
|---|---|---|
| P01 | Justia discovery live run (demo mode): pages fetched, firms added, Firm Universe rows | Added Nov 11; not yet executed |
| P02 | Prompt injection against the **LLM** classifier (A04 covers only the deterministic scorecard) | Needs a controlled test page |
| P03 | Reviewer decision round-trip (H06) | Needs a teammate to submit a review |
