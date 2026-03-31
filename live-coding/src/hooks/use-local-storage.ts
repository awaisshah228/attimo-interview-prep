"use client";

import { useState } from "react";

/**
 * Persists state to localStorage with JSON serialization.
 *
 * Uses a lazy initializer to read from localStorage only on first render.
 * Falls back to `initial` when localStorage is empty or on SSR.
 *
 * @example
 * const [theme, setTheme] = useLocalStorage("theme", "dark");
 */
export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch {
      return initial;
    }
  });

  const setValue = (value: T) => {
    setStored(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [stored, setValue];
}
