"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initial = stored ?? preferred;
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    document.documentElement.classList.toggle("light", t === "light");
  };

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  if (!mounted) return null; // avoid hydration mismatch

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
