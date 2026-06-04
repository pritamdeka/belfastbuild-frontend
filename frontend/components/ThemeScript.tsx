"use client";

/**
 * Inline script that runs before React hydrates to set the user's
 * preferred theme on <html data-theme="...">. Avoids the classic
 * "flash of wrong theme" on first paint.
 */

const STORAGE_KEY = "belfastbuild.theme";

const VALID = new Set(["split", "light", "dark"]);

export function ThemeScript() {
  const code = `
    (function() {
      try {
        var stored = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
        var theme = ${JSON.stringify(VALID)}.includes(stored) ? stored : "split";
        document.documentElement.setAttribute("data-theme", theme);
      } catch (e) {
        document.documentElement.setAttribute("data-theme", "split");
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export const THEME_STORAGE_KEY = STORAGE_KEY;
export const THEME_OPTIONS = Array.from(VALID);
