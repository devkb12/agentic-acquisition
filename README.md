# Agentic Acquisition Intelligence — TrueGrit Capital × VIMANA

ASU MSAIB capstone. An n8n research agent that finds Florida and Georgia insurance-defense law firms, reads their websites, checks public records, scores each firm against the sponsor's acquisition criteria, and writes everything to Google Sheets for a person to review. The output is research for a human reviewer. It does not decide to pursue any firm.

**Live dashboard:** https://truegrit-dashboard-devkb11-1823.vercel.app

## How it works

```
Run Configuration ─► Build Discovery Queries (city × search phrase)
   ├─ SerpApi (Google Maps)       ┐
   ├─ Apify Google Maps scraper   │─► Merge ─► Normalize ─► Parse/dedupe (skip firms already in Company_Leads)
   ├─ Sunbiz Daily (FL registry)  │
   └─ USAspending.gov             ┘
Read firm websites: Apify website-content-crawler (direct homepage fetch as fallback)
   ─► Clean text ─► OpenAI classification (practice, defense vs plaintiff, civil vs criminal, carriers, size)
Score: insurance keyword scorecard (sponsor criteria v2.3) + revenue estimate (attorneys × $300k–$500k)
   ─► Sunbiz entity lookup ─► USAspending award lookup ─► Acquisition Fit Score
   ─► High/Moderate fits get deeper AI research ─► Google Sheets
Sheets: Company_Leads, AI_Analysis, Source_Log, Review_Queue, Run_Log, Dashboard_Summary
```

Hard gates: firms that are mainly plaintiff-side or criminal are rated Low Fit whatever their score. The size screen is 10–400 attorneys. Fit weights are provisional until the sponsors confirm a rubric.

## Repository layout

| Path | What it is |
|---|---|
| `n8n/research-workflow.json` | The main research workflow (56 nodes). Import it into n8n. |
| `n8n/dashboard-workflow.json` | Dashboard back end: serves the page, the JSON data feed (`/webhook/truegrit-data`) and saves review decisions (`/webhook/truegrit-review`). |
| `n8n/code-nodes/` | Every Code node's JavaScript as a separate file, for reading and diffs. The JSON files remain the source of truth. |
| `n8n/dashboard-page-template.html` | The dashboard page template embedded in the n8n "Build Page" node. |
| `web/` | Lodestar, the redesigned dashboard: a Next.js app with a home page, the review workspace, firm files and a data explorer. See [The web app](#the-web-app). |
| `website/index.html` | The previous single-file dashboard, still deployed on Vercel until the web app replaces it. |
| `docs/screenshots/` | Screenshots of the previous dashboard. |

## Setting it up in another n8n account

1. In n8n choose **Import from File** and import both JSON files.
2. Create credentials with these names, or re-link each node to your own: `Serpapi-API-key`, `Apify-API-Key`, `Sunbiz-API-Key`, OpenAI, and Google Sheets OAuth. No API keys are stored in this repository. They live in n8n credentials.
3. Point the Google Sheets nodes at your copy of the TrueGrit sheet, which needs the six tabs listed above.
4. Adjust **Run Configuration** to change states, cities, search phrases, firms per state, and demo or live mode.
5. Publish the dashboard workflow. To use your own instance, change the `FEED` and `REVIEW_URL` addresses in `website/index.html`.

## The web app

`web/` is a Next.js 16 app (React 19, TypeScript, one global stylesheet). Its server routes read the n8n data feed and send review decisions to n8n, so the access key stays on the server and never reaches the browser. The joined feed is cached in memory for five minutes, so most visits load in about a second instead of waiting for n8n to read all six tabs.

| Route | What it does |
|---|---|
| `/` | Home page explaining the research system |
| `/app` | Workspace: ranked firm table, saved firms, review pipeline, outcomes and profile, with a first-visit setup and a guided tour |
| `/firms/[id]` | Firm file: score breakdown, evidence, keyword chart, public records and the review form. Export brief prints it. |
| `/app/data` | Data explorer: the Source_Log evidence rows and the Run_Log runs |
| `/about` | Principles, methodology (read live from the workflow settings) and known limits |
| `/api/feed`, `/api/firms/[id]`, `/api/evidence`, `/api/review` | Server routes backed by the n8n webhooks |

Profile, saved firms and the tour flag are stored in each reviewer's browser. Review decisions go to the Review_Queue tab through `/webhook/truegrit-review`.

Run it locally (Node.js 20.9 or later):

```bash
cd web
cp .env.example .env.local   # then set TRUEGRIT_ACCESS_KEY
npm install
npm run dev
```

To deploy on Vercel, set the project's **Root Directory** to `web`, the **Framework Preset** to Next.js, and add the `N8N_BASE_URL` and `TRUEGRIT_ACCESS_KEY` environment variables.

## Known limits

- Google Maps search returns mostly plaintiff personal-injury firms. The next improvement is to seed discovery from defense-bar directories (FDLA, GDLA, DRI, CLM) or a sponsor benchmark list.
- On Apify's free plan only 5 runs can go at once. Scraper calls are spaced out and retried, and a direct homepage fetch is the fallback.
- Attorney counts, revenue and size are estimates unless a source verifies them. The dashboard labels every field Verified, Estimated or Missing.
- The dashboard access key is in `website/index.html` and the n8n workflow files. The web app keeps it in a server environment variable instead. Keep this repository private and share it only with the team.

## Team

Dev Bhattacharyya, Dareen Alsaeed, Hana Ryu, Madison Schuler. Sponsors: TrueGrit Capital and VIMANA.
