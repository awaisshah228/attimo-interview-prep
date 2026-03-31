"use client";

import { useState, useEffect } from "react";

/**
 * Tracks whether a CSS media query matches.
 *
 * Uses `window.matchMedia` and listens to the `change` event.
 * Returns false on SSR (no window).
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 640px)");
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
