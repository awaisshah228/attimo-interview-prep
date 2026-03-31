"use client";

import { useState, useEffect } from "react";

/**
 * Debounces a value by the given delay.
 *
 * Returns the debounced value — updates only after `delay` ms of inactivity.
 * Common uses: search inputs, API query params, resize handlers.
 *
 * @example
 * const debouncedQuery = useDebounce(query, 300);
 * // debouncedQuery updates 300ms after the last `query` change
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
