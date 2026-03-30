"use client";

import { useState, useTransition, useDeferredValue, useMemo } from "react";
import Link from "next/link";

// Generate a large list
const ITEMS = Array.from({ length: 20000 }, (_, i) => `Item ${i + 1} — ${["React", "Next.js", "TypeScript", "Tailwind", "Node.js"][i % 5]}`);

// ─── Demo 1: useTransition ───
function TransitionDemo() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = ITEMS.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">1. useTransition</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Type fast — the input stays responsive because filtering 20,000 items is
        wrapped in <code className="text-blue-400">startTransition</code>. React prioritizes
        the input update over the list update.
      </p>
      <input
        value={input}
        onChange={(e) => {
          // URGENT: update the input value immediately
          setInput(e.target.value);

          // NON-URGENT: filter the list (can be interrupted)
          startTransition(() => {
            setQuery(e.target.value);
          });
        }}
        placeholder="Search 20,000 items..."
        className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm w-full mb-3"
      />
      <div className="text-xs text-zinc-500 mb-2">
        {isPending ? (
          <span className="text-yellow-400">Filtering...</span>
        ) : (
          <span>Showing {filtered.length} of {ITEMS.length} items</span>
        )}
      </div>
      <div
        className="bg-zinc-900 rounded p-3 max-h-48 overflow-auto text-xs font-mono"
        style={{ opacity: isPending ? 0.5 : 1, transition: "opacity 200ms" }}
      >
        {filtered.slice(0, 100).map((item, i) => (
          <div key={i} className="py-0.5">
            {item}
          </div>
        ))}
        {filtered.length > 100 && (
          <div className="text-zinc-500">...and {filtered.length - 100} more</div>
        )}
      </div>
    </div>
  );
}

// ─── Demo 2: useDeferredValue ───
function DeferredDemo() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  const filtered = useMemo(
    () =>
      ITEMS.filter((item) =>
        item.toLowerCase().includes(deferredQuery.toLowerCase())
      ),
    [deferredQuery]
  );

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">2. useDeferredValue</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Same result as useTransition, but used when you receive a value (from props or state)
        rather than wrapping a setState call. The deferred value &quot;lags behind&quot; during typing.
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search with deferred value..."
        className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm w-full mb-3"
      />
      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div className="bg-zinc-900 rounded p-2">
          <span className="text-zinc-500">Current: </span>
          <span className="text-blue-400 font-mono">&quot;{query}&quot;</span>
        </div>
        <div className="bg-zinc-900 rounded p-2">
          <span className="text-zinc-500">Deferred: </span>
          <span className="text-green-400 font-mono">&quot;{deferredQuery}&quot;</span>
        </div>
      </div>
      <div
        className="bg-zinc-900 rounded p-3 max-h-48 overflow-auto text-xs font-mono"
        style={{ opacity: isStale ? 0.5 : 1, transition: "opacity 200ms" }}
      >
        {filtered.slice(0, 100).map((item, i) => (
          <div key={i} className="py-0.5">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Demo 3: Without transition (comparison) ───
function NoTransitionDemo() {
  const [query, setQuery] = useState("");

  // This blocks the input while filtering
  const filtered = ITEMS.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">3. Without Transition (Comparison)</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Same 20,000 items but NO transition. Type fast and notice the input feels
        sluggish — every keystroke synchronously filters the entire list.
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type fast — notice the lag..."
        className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm w-full mb-3"
      />
      <div className="text-xs text-zinc-500 mb-2">
        {filtered.length} results
      </div>
      <div className="bg-zinc-900 rounded p-3 max-h-48 overflow-auto text-xs font-mono">
        {filtered.slice(0, 100).map((item, i) => (
          <div key={i} className="py-0.5">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UseTransitionPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">useTransition & useDeferredValue</h1>
      <p className="text-zinc-400 mb-8">
        React 18 concurrent features. Mark state updates as non-urgent so the UI stays responsive.
      </p>
      <div className="grid gap-6">
        <TransitionDemo />
        <DeferredDemo />
        <NoTransitionDemo />
      </div>
    </main>
  );
}
