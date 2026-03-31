"use client";

import { useState, useEffect } from "react";

/**
 * Observes whether an element is intersecting with the viewport.
 *
 * Creates an IntersectionObserver on mount, disconnects on unmount.
 * Returns a boolean indicating visibility.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const isVisible = useIntersectionObserver(ref, { threshold: 0.5 });
 */
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement | null>,
  options?: IntersectionObserverInit
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      options
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
}
