# Lodestar

Lodestar is the dashboard for Agentic Acquisition Intelligence. See the repository README's "The web app" section for routes, local setup and deployment.

```bash
cp .env.example .env.local   # set TRUEGRIT_ACCESS_KEY
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run lint
npm run check                # design-system guards: tokens, copy, style, contrast
```

Code map:

- `lib/feed.ts`: server-only. Reads the n8n feed, caches it and joins the six sheet tabs into firm records.
- `lib/api.ts`: the one data facade for components (server routes plus per-browser storage).
- `app/tokens.css`: every color, radius, shadow, spacing and motion value, light and dark. The only file with raw colors.
- `app/globals.css`: every component and page style, reading tokens only.
- `lib/theme.ts`, `components/site-chrome.tsx`: the Light / Dark / System theme switch, header, footer and menu.
- `docs/ui.md`: the design system, its do and don't rules, and what `npm run check` enforces.
- `components/workspace/`, `components/firm/`, `components/data/`, `components/home/`, `components/about/`: the screens.
