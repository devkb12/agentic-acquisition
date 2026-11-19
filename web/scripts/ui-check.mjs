#!/usr/bin/env node
// UI guards for the Lodestar design system. Run with `npm run check`.
//   1. Token guard    no raw colors outside app/tokens.css (and lib/theme.ts's two theme-color values)
//   2. Copy guard     no forbidden strings (tests/fixtures/forbidden-copy.txt) in source, public files or build output
//   3. Style guard    only the three font tokens; no uppercase, pills, gradients (except the dot grid),
//                     backdrop blur, or weights above 550
//   4. Contrast       every text/background token pair in use meets WCAG AA in both themes
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const rel = (p) => relative(ROOT, p);
const failures = [];
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);

function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

const SOURCE = [...walk(join(ROOT, "app"), [".css", ".ts", ".tsx"]), ...walk(join(ROOT, "components"), [".ts", ".tsx"]), ...walk(join(ROOT, "lib"), [".ts", ".tsx"])];
const TOKENS = join(ROOT, "app", "tokens.css");
const THEME = join(ROOT, "lib", "theme.ts");

// ---- 1. token guard ----------------------------------------------------------------
const HEX = /(?<![\w&/-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b(?![\w-])/g;
const FN = /\b(?:rgba?|hsla?)\(/g;
for (const file of SOURCE) {
  if (file === TOKENS) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const hex = line.match(HEX);
    if (hex && !(file === THEME && /THEME_COLOR/.test(line))) fail("tokens", `${rel(file)}:${i + 1} raw color ${hex.join(", ")}`);
    if (FN.test(line)) fail("tokens", `${rel(file)}:${i + 1} raw rgb()/hsl() color`);
    FN.lastIndex = 0;
  });
}

// ---- 2. copy guard -----------------------------------------------------------------
const forbidden = readFileSync(join(ROOT, "tests", "fixtures", "forbidden-copy.txt"), "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));
const scanned = [
  ...SOURCE,
  ...walk(join(ROOT, "public"), [".svg", ".txt", ".json", ".html"]),
];
// Build output, when present (walk() skips dot-directories, so read .next with walkAll).
function walkAll(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkAll(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}
scanned.push(...walkAll(join(ROOT, ".next", "static"), [".js", ".css"]), ...walkAll(join(ROOT, ".next", "server", "app"), [".html", ".rsc"]));
for (const file of new Set(scanned)) {
  const text = readFileSync(file, "utf8").toLowerCase();
  for (const f of forbidden) if (text.includes(f.toLowerCase())) fail("copy", `${rel(file)} contains “${f}”`);
}

// ---- 3. style guard ----------------------------------------------------------------
const CSS = walk(join(ROOT, "app"), [".css"]);
for (const file of CSS) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const at = `${rel(file)}:${i + 1}`;
    const code = line.replace(/\/\*.*?\*\//g, "");
    for (const m of code.matchAll(/font-family:\s*([^;}]+)/g)) {
      if (!/^var\(--font-(serif|sans|mono)\)\s*$|^inherit\s*$/.test(m[1].trim())) fail("style", `${at} font-family must be a font token, found “${m[1].trim()}”`);
    }
    if (/text-transform:\s*uppercase/.test(code)) fail("style", `${at} uppercase text`);
    for (const m of code.matchAll(/border-radius:\s*([^;}]+)/g)) {
      if (/(\d{3,})px/.test(m[1]) && Number(m[1].match(/(\d{3,})px/)[1]) >= 999) fail("style", `${at} pill radius`);
    }
    if (/(linear|conic)-gradient\(/.test(code)) fail("style", `${at} gradient`);
    if (/radial-gradient\(/.test(code) && !/radial-gradient\(var\(--dot-grid\)/.test(code)) fail("style", `${at} gradient other than the dot grid`);
    if (/backdrop-filter/.test(code)) fail("style", `${at} backdrop-filter`);
    for (const m of code.matchAll(/font-weight:\s*(\d+|bold|bolder)/g)) {
      if (m[1] === "bold" || m[1] === "bolder" || Number(m[1]) > 550) fail("style", `${at} font-weight ${m[1]}`);
    }
  });
}
for (const file of SOURCE.filter((f) => f.endsWith(".tsx"))) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const w = line.match(/fontWeight:\s*["']?(\d+|bold)/);
    if (w && (w[1] === "bold" || Number(w[1]) > 550)) fail("style", `${rel(file)}:${i + 1} fontWeight ${w[1]}`);
    if (/fontFamily:/.test(line) && !/var\(--font-(serif|sans|mono)\)/.test(line)) fail("style", `${rel(file)}:${i + 1} inline fontFamily`);
    if (/textTransform:\s*["']uppercase/.test(line)) fail("style", `${rel(file)}:${i + 1} uppercase text`);
  });
}

// ---- 4. contrast ---------------------------------------------------------------------
function block(css, selector) {
  // Top-level blocks only (skips anything nested in @media).
  const out = {};
  let depth = 0;
  let i = 0;
  while (i < css.length) {
    if (css.startsWith("/*", i)) {
      i = css.indexOf("*/", i) + 2;
      continue;
    }
    if (depth === 0 && css.startsWith(selector, i) && /\s*\{/.test(css.slice(i + selector.length, i + selector.length + 3))) {
      const start = css.indexOf("{", i) + 1;
      let d = 1;
      let j = start;
      while (d > 0 && j < css.length) {
        if (css[j] === "{") d++;
        if (css[j] === "}") d--;
        j++;
      }
      for (const m of css.slice(start, j - 1).replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
      return out;
    }
    if (css[i] === "{") depth++;
    if (css[i] === "}") depth--;
    i++;
  }
  return out;
}

const tokenCss = readFileSync(TOKENS, "utf8");
const light = block(tokenCss, ":root");
const dark = { ...light, ...block(tokenCss, ".dark") };

function resolve(vars, name, seen = new Set()) {
  const v = vars[name];
  if (!v) throw new Error(`token ${name} is not defined`);
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref) {
    if (seen.has(ref[1])) throw new Error(`token cycle at ${name}`);
    seen.add(ref[1]);
    return resolve(vars, ref[1], seen);
  }
  return v;
}

function rgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  return [0, 2, 4].map((k) => parseInt(full.slice(k, k + 2), 16));
}
function luminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const [l1, l2] = [luminance(rgb(a)), luminance(rgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [foreground, background, minimum] — text pairs need 4.5:1, meaningful graphics and control edges 3:1.
const PAIRS = [
  ["--ink", "--paper", 4.5], ["--ink", "--panel", 4.5], ["--ink", "--panel-sunk", 4.5], ["--ink-strong", "--paper", 4.5],
  ["--muted", "--paper", 4.5], ["--muted", "--panel", 4.5], ["--muted", "--panel-sunk", 4.5],
  ["--lead", "--paper", 4.5], ["--lead", "--panel", 4.5], ["--label", "--paper", 4.5],
  ["--accent", "--paper", 4.5], ["--accent", "--panel", 4.5], ["--accent", "--blue-paper", 4.5],
  ["--accent-ink", "--accent", 4.5], ["--accent-ink", "--accent-hover", 4.5], ["--accent-soft-ink", "--blue-paper", 4.5],
  ["--success", "--paper", 4.5], ["--success", "--panel", 4.5], ["--warning", "--paper", 4.5], ["--warning", "--panel", 4.5],
  ["--danger", "--paper", 4.5], ["--danger", "--panel", 4.5], ["--review", "--panel", 4.5], ["--connected", "--panel", 4.5],
  ["--quiet", "--paper", 4.5], ["--segment-ink", "--segment-bg", 4.5], ["--ink", "--bubble", 4.5],
  ["--bp-ink", "--panel-sunk", 4.5], ["--bp-ink", "--panel", 4.5], ["--bp-text", "--panel-sunk", 4.5], ["--bp-text", "--panel", 4.5],
  ["--bp-muted", "--panel-sunk", 4.5], ["--bp-ink-2", "--panel-sunk", 4.5],
  ["--stage-ink", "--stage-panel", 4.5], ["--stage-muted", "--stage-panel", 4.5], ["--stage-ink", "--stage-raised", 4.5], ["--stage-muted", "--stage", 4.5],
  ["--field-line", "--panel", 3], ["--field-line", "--paper", 3], ["--focus-ring", "--paper", 3], ["--focus-ring", "--panel", 3],
  ["--success-fill", "--panel", 3], ["--warning-fill", "--panel", 3], ["--danger-fill", "--panel", 3], ["--viz-1", "--panel", 3],
];

for (const [theme, vars] of [["light", light], ["dark", dark]]) {
  for (const [fg, bg, min] of PAIRS) {
    try {
      const r = ratio(resolve(vars, fg), resolve(vars, bg));
      if (r < min) fail("contrast", `${theme}: ${fg} on ${bg} is ${r.toFixed(2)}:1 (needs ${min}:1)`);
    } catch (e) {
      fail("contrast", `${theme}: ${e.message}`);
    }
  }
}

// ---- report ---------------------------------------------------------------------------
if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`\n✕ ${failures.length} UI check${failures.length === 1 ? "" : "s"} failed.`);
  process.exit(1);
}
console.log(`✓ UI checks passed: tokens, copy, style and contrast (${PAIRS.length} pairs × 2 themes).`);
