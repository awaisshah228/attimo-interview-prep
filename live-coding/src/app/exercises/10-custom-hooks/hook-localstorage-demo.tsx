"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";

export function HookLocalStorageDemo() {
  const [count, setCount] = useLocalStorage("hook-demo-count", 0);

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <h3 className="font-mono text-sm text-blue-400">useLocalStorage</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Persists state to localStorage. Refresh the page — the count stays.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => setCount(count - 1)}
          className="rounded border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800"
        >
          -
        </button>
        <span className="font-mono text-lg text-zinc-200">{count}</span>
        <button
          onClick={() => setCount(count + 1)}
          className="rounded border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800"
        >
          +
        </button>
      </div>
    </div>
  );
}
