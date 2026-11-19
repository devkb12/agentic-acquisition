// Theme preference: stored per browser, applied to <html> before first paint.
// The two theme-color values below are the only raw colors outside tokens.css
// (browser chrome reads them from <meta>, not from CSS).
export const THEME_COLOR = { light: "#fdfdfc", dark: "#11151b" } as const;

export type ThemeChoice = "light" | "dark" | "system";
export const THEME_KEY = "lodestar-theme";

/** Runs inline in <head>: marks scripting on, sets the theme class with no flash, and follows system changes while the choice is System. */
export const THEME_SCRIPT = `(function(){var d=document.documentElement;d.classList.add("js");function pref(){try{return localStorage.getItem("${THEME_KEY}")}catch(e){return null}}var mq=window.matchMedia("(prefers-color-scheme: dark)");function apply(){var t=pref();d.classList.toggle("dark",t==="dark"||(t!=="light"&&mq.matches))}apply();mq.addEventListener("change",apply)})();`;

export function readTheme(): ThemeChoice {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(choice: ThemeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    /* storage blocked: still apply for this page */
  }
  const dark = choice === "dark" || (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}
