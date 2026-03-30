"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// Generate a large dataset
function generateItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    category: ["electronics", "books", "clothing", "food"][i % 4],
    price: Math.round(Math.random() * 10000) / 100,
  }));
}

const ITEMS = generateItems(10000);

// ─── Demo 1: Expensive computation ───
function ExpensiveFilterDemo() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [theme, setTheme] = useState("dark");

  // WITHOUT useMemo: this would run on EVERY render, including theme changes
  // WITH useMemo: only re-runs when query or category changes
  const filtered = useMemo(() => {
    console.log("Filtering 10,000 items...");
    const start = performance.now();

    const result = ITEMS.filter((item) => {
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || item.category === category;
      return matchesQuery && matchesCategory;
    }).sort((a, b) => a.price - b.price);

    const elapsed = performance.now() - start;
    console.log(`Filter took ${elapsed.toFixed(2)}ms`);

    return result;
  }, [query, category]); // NOT theme — theme changes don't recompute

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">1. Expensive Computation</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Filters + sorts 10,000 items. useMemo ensures this only runs when query/category changes.
        Toggling theme does NOT re-run the filter (check console).
      </p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items..."
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
        >
          <option value="all">All categories</option>
          <option value="electronics">Electronics</option>
          <option value="books">Books</option>
          <option value="clothing">Clothing</option>
          <option value="food">Food</option>
        </select>
      </div>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="px-3 py-1.5 bg-zinc-700 rounded text-sm mb-3"
      >
        Toggle theme: {theme} (no recompute)
      </button>
      <div className="text-sm text-zinc-400 mb-2">
        Showing {Math.min(filtered.length, 20)} of {filtered.length} results
      </div>
      <div className="bg-zinc-900 rounded p-3 max-h-48 overflow-auto text-xs font-mono">
        {filtered.slice(0, 20).map((item) => (
          <div key={item.id} className="flex justify-between py-0.5">
            <span>{item.name}</span>
            <span className="text-zinc-500">
              {item.category} — ${item.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Demo 2: When NOT to use useMemo ───
function UnnecessaryMemoDemo() {
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");

  // UNNECESSARY: string concatenation is cheap
  // const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);

  // JUST DO THIS:
  const fullName = `${firstName} ${lastName}`;

  // ALSO UNNECESSARY: simple arithmetic
  // const double = useMemo(() => count * 2, [count]);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">2. When NOT to Use useMemo</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Simple computations (string concat, arithmetic) don&apos;t need useMemo.
        The overhead of memoization is worse than just computing it.
      </p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
        />
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
        />
      </div>
      <div className="bg-zinc-900 rounded p-3 font-mono text-sm">
        Full name: <span className="text-green-400">{fullName}</span>
      </div>
      <div className="mt-3 bg-zinc-900/50 rounded p-3 text-xs text-zinc-500">
        <div className="text-yellow-400 mb-1">Rule of thumb:</div>
        <div>• Sorting/filtering arrays → useMemo ✓</div>
        <div>• String concatenation → just compute it ✗</div>
        <div>• Creating objects passed to children → useMemo ✓</div>
        <div>• Simple math → just compute it ✗</div>
      </div>
    </div>
  );
}

export default function UseMemoPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">useMemo</h1>
      <p className="text-zinc-400 mb-8">
        Cache expensive computations. Only recomputes when dependencies change.
      </p>
      <div className="grid gap-6">
        <ExpensiveFilterDemo />
        <UnnecessaryMemoDemo />
      </div>
    </main>
  );
}
