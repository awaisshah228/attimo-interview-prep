"use client";

import { useState } from "react";
import { useFetch } from "@/lib/hooks";
import type { Suggestion } from "@/lib/types";

export function HookFetchDemo() {
  const [query, setQuery] = useState("");
  const url = query ? `/api/search?q=${encodeURIComponent(query)}` : null;
  const { data, error, isLoading } = useFetch<Suggestion[]>(url);

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <h3 className="font-mono text-sm text-blue-400">useFetch</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Generic fetch hook with loading, error, and AbortController cleanup.
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search to trigger fetch..."
        className="mt-3 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
      />
      <div className="mt-2 text-xs">
        {isLoading && <span className="text-zinc-500">Loading...</span>}
        {error && <span className="text-red-400">Error: {error.message}</span>}
        {data && (
          <span className="text-zinc-400">
            Found {data.length} result{data.length !== 1 && "s"}
            {data.length > 0 && (
              <span className="text-zinc-300">
                {" "}— {data.slice(0, 3).map((d) => d.label).join(", ")}
                {data.length > 3 && "..."}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
