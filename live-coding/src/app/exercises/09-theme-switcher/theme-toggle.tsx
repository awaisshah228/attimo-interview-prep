"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("scratch-theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initial = stored ?? preferred;
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    // shadcn uses .dark class on <html> for dark mode
    // When .dark is absent, it falls back to :root (light)
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("scratch-theme", next);
    applyTheme(next);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-800"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
      <span>Switch to {theme === "dark" ? "light" : "dark"} mode</span>
    </button>
  );
}
