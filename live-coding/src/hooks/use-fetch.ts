"use client";

import { useState, useEffect } from "react";

/**
 * Fetches JSON data from a URL with AbortController cleanup.
 *
 * Pass `null` as url to skip the fetch. Returns { data, error, isLoading }.
 * Aborts the in-flight request on unmount or when the URL changes.
 *
 * @example
 * const { data, error, isLoading } = useFetch<User[]>("/api/users");
 * const { data } = useFetch<null>(shouldFetch ? "/api/data" : null);
 */
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setIsLoading(true);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, error, isLoading };
}
