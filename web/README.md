# AAI web app

The dashboard for Agentic Acquisition Intelligence. See the repository README's "The web app" section for routes, local setup and deployment.

```bash
cp .env.example .env.local   # set TRUEGRIT_ACCESS_KEY
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run lint
```

Code map:

- `lib/feed.ts`: server-only. Reads the n8n feed, caches it and joins the six sheet tabs into firm records.
- `lib/api.ts`: the one data facade for components (server routes plus per-browser storage).
- `app/globals.css`: design tokens and every style.
- `components/workspace/`, `components/firm/`, `components/data/`, `components/home/`, `components/about/`: the screens.
