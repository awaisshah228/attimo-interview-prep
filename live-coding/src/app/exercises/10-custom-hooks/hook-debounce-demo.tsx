"use client";

import { useState } from "react";
import { useDebounce } from "@/lib/hooks";

export function HookDebounceDemo() {
  const [input, setInput] = useState("");
  const debounced = useDebounce(input, 500);

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <h3 className="font-mono text-sm text-blue-400">useDebounce</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Delays updating the value until 500ms after the last change.
      </p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type fast..."
        className="mt-3 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
      />
      <div className="mt-2 flex gap-4 text-xs">
        <span className="text-zinc-400">
          Raw: <span className="text-zinc-200">{input || "—"}</span>
        </span>
        <span className="text-zinc-400">
          Debounced: <span className="text-green-400">{debounced || "—"}</span>
        </span>
      </div>
    </div>
  );
}
