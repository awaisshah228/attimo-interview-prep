"use client";

import { useRef, useEffect } from "react";

/**
 * Returns the previous value of a variable (from the last render).
 *
 * Useful for comparing current vs previous props/state.
 *
 * @example
 * const prevCount = usePrevious(count);
 * // On first render: undefined. After that: the previous count value.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
