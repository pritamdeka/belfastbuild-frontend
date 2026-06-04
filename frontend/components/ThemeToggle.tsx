"use client";

import { useEffect, useState } from "react";
import { THEME_OPTIONS, THEME_STORAGE_KEY } from "./ThemeScript";

type Theme = (typeof THEME_OPTIONS)[number];

const LABELS: Record<Theme, string> = {
  split: "Split",
  light: "Light",
  dark: "Dark",
};

const NEXT: Record<Theme, Theme> = {
  split: "light",
  light: "dark",
  dark: "split",
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("split");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "split";
    setTheme(current);
  }, []);

  const cycle = () => {
    const next = NEXT[theme];
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore (e.g. sandboxed iframe)
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      aria-label={`Switch theme (current: ${LABELS[theme]})`}
      title={`Theme: ${LABELS[theme]} — click for ${LABELS[NEXT[theme]]}`}
    >
      <span className="swatch" aria-hidden />
      <span>{LABELS[theme]}</span>
    </button>
  );
}
