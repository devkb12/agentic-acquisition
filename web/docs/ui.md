# Lodestar UI

How the web app looks, reads and moves, and the rules that keep it that way. `npm run check` enforces the parts a machine can check.

## The look in one paragraph

A near-white page (`--paper`), or a deep blue-black one in dark mode. Serif headings at weight 400, never bold, usually two lines ending with a period. Small sans-serif text: 14px body, 12px labels and links. One blue (`--accent`) carries every interactive signal. Sections are separated by 1px hairlines and space, not boxes or colored bands. Actions are blue text links with a glyph. Each page has at most one filled button.

## Files

| File | What it holds |
|---|---|
| `app/tokens.css` | Every color, radius, shadow, spacing, layout and motion value, for light (`:root`) and dark (`.dark`). The only file allowed to hold raw colors. |
| `app/globals.css` | All component and page styles, reading tokens only. Sections are listed at the top of the file. |
| `lib/theme.ts` | Theme preference (Light, Dark or System) and the inline `<head>` script that sets it before first paint. Also the two `theme-color` values. |
| `components/ui.tsx` | Shared pieces: `Label`, `PathLabel`, `StarMark`, `Wordmark`, `FitPill`, `StatusTag`, `ScoreBar`, `ScoreRing`, `Monogram`, `DataBadge`, `Reveal` and `useReveal`. |
| `components/site-chrome.tsx` | `SiteHeader`, `SiteFooter`, `Menu` (44px trigger and popover) and `ThemeSwitch`. |
| `components/home/demo.tsx` | `useDemo` and `PlaybackControls` for the self-playing demos. |
| `scripts/ui-check.mjs` | The token, copy, style and contrast checks. |

## Type

| Role | Font | Size | Notes |
|---|---|---|---|
| Display (`.display`) | Newsreader | 62px (49px ≤ 860px, 43px ≤ 370px) | Weight 400, tracking −0.045em |
| Section heading (`.h2`) | Newsreader | 34px (29px ≤ 860px) | |
| Sub heading (`.h3`, index titles) | Newsreader | 25px (22px ≤ 860px) | |
| App page title (`.view-head h1`) | Newsreader | 32px | |
| Panel title (`.panel-head h2`) | Newsreader | 22px | |
| Metric numerals | Newsreader | 40px | `tabular-nums` |
| Body, lead | Geist | 14px | Line height 1.7 to 1.85 |
| Label (`.label`) | Geist | 12px | Sentence case, never uppercase |
| Nav, links, buttons | Geist | 12px | |
| Index numbers, IDs | Geist Mono | 11px | |

Weights in use: 400 for almost everything, 450 for diagram labels, 500 for values and mockup headings, 550 for the wordmark only. Nothing goes below 12px except mono indices and mockup captions (11px).

## Color

Use the token, never the value. Status colors appear only to mean status:

| Meaning | Text | Dot, bar or outline |
|---|---|---|
| High fit, verified, investigate further | `--success` | `--success-fill` |
| Moderate fit, needs review, links, active | `--accent` | `--accent` |
| Insufficient information, estimated, needs more evidence | `--warning` | `--warning-fill` |
| Conflicting, not a fit, negative keyword tiers | `--danger` | `--danger-fill` |
| Low fit, missing, screened out | `--muted` | `--muted` |

The `*-fill` tokens fail text contrast on purpose. Use them for dots, bars and outlines only.

## Components: do and don't

| Component | Do | Don't |
|---|---|---|
| Primary action in a hero or header | `.text-link` with → (go to) or ↗ (leaves the page or opens a dialog) | A filled button |
| Filled button (`.button`) | The closing call to action, a page's main create action (Find a firm, Save decision), or a dialog's final confirm | Two on one page |
| Secondary button (`.button-outline`) | Save, Export brief, Back, Try again ↻ | Colored fills |
| Filter chip (`.chip`) | `aria-pressed`; pressed state is `--blue-paper` | Pills (radius ≥ 999px) |
| Section start | `Label` + serif heading, 16 to 19px apart | Uppercase eyebrow, icon above the heading |
| Lists of steps, principles, layers | `.ledger` rows (85px key + text) with hairlines | Three icon cards in a row |
| Product proof | `.mock` window with fictional but specific data | Screenshots with fake browser chrome |
| Fit rating | `FitPill`: a dot plus words | A colored badge |
| Evidence status | `StatusTag`: a glyph plus a word (✓ Verified, ◦ Estimated, – Missing, ✕ Conflicting) | Uppercase mono badges |
| Emphasis | A line break | Italics, highlight color, `<em>` in headings |
| Icons | Unicode glyphs (↗ → ▷ Ⅱ ↻ ✓ ◦ ✕ +), or lucide at `strokeWidth={1.5}` where words are clumsy | Filled or colored icons, emoji |

## Motion

- Durations and easing come from tokens (`--dur-*`, `--ease-*`). Only `transform`, `translate`, `scale` and `opacity` animate.
- Sections wrapped in `Reveal` rise once when they enter the viewport and never replay.
- Firm table rows arrive on the first load only. Sorting and filtering never replay it.
- Demos use `useDemo`: they play only while on screen, pause when the tab is hidden, and always show Pause/Play and Replay with a polite live region.
- Under `prefers-reduced-motion`, nothing moves and demos open paused on their final frame. Replay still works.

## Themes

The theme follows the system by default. Light, Dark or System can be chosen from the menu popover (marketing pages, firm page, data explorer) or the sidebar (workspace), and is saved per browser under `lodestar-theme`. The inline script in `app/layout.tsx` applies it before first paint. Print always uses the light palette.

## Responsive

Breakpoints: 1100px (metric grid 2×2), 960px (two-column grids stack), 860px (type steps down), 700px (mobile layout: compact header, workspace sidebar becomes a top bar, dialogs become bottom sheets), 420px, 370px. Wide tables scroll inside their own panel; the page never scrolls sideways.

## Accessibility

WCAG 2.2 AA. A skip link is the first focusable element. Every focusable element shows a 2px accent outline on `:focus-visible`. Targets are at least 44px on marketing pages and at least 36px for dense app controls (above the 24px AA minimum). FAQ rows use native `<details>`. Demos and diagrams have text captions. Color is never the only signal: fit ratings carry words, evidence statuses carry glyphs, and negative keyword bars are outlined rather than filled.

## Checks

`npm run check` fails when:

1. a hex, `rgb()` or `hsl()` color appears outside `app/tokens.css` (the two `theme-color` values in `lib/theme.ts` and SVG files are exempt);
2. any string in `tests/fixtures/forbidden-copy.txt` appears in source, public files or the build output;
3. CSS uses a font other than the three font tokens, uppercase text, a pill radius, a gradient other than the dot grid, `backdrop-filter`, or a weight above 550;
4. a text/background token pair in use falls below 4.5:1, or a control edge or meaningful graphic below 3:1, in either theme.

Add a pair to `PAIRS` in `scripts/ui-check.mjs` whenever a component puts a new text token on a new surface.
