"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Demo 1: Basic counter with functional updates ───
function CounterDemo() {
  const [count, setCount] = useState(0);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">1. Basic Counter</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Click &quot;+3 (buggy)&quot; to see stale closure — it only adds 1.<br />
        Click &quot;+3 (correct)&quot; to see functional update — it adds 3.
      </p>
      <div className="text-4xl font-mono mb-4">{count}</div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCount(count + 1)}
          className="px-3 py-1.5 bg-blue-600 rounded text-sm hover:bg-blue-500"
        >
          +1
        </button>
        <button
          onClick={() => {
            // BUG: all three use the same stale `count` value
            setCount(count + 1);
            setCount(count + 1);
            setCount(count + 1);
          }}
          className="px-3 py-1.5 bg-red-600 rounded text-sm hover:bg-red-500"
        >
          +3 (buggy)
        </button>
        <button
          onClick={() => {
            // CORRECT: functional update always gets latest state
            setCount((prev) => prev + 1);
            setCount((prev) => prev + 1);
            setCount((prev) => prev + 1);
          }}
          className="px-3 py-1.5 bg-green-600 rounded text-sm hover:bg-green-500"
        >
          +3 (correct)
        </button>
        <button
          onClick={() => setCount(0)}
          className="px-3 py-1.5 bg-zinc-700 rounded text-sm hover:bg-zinc-600"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── Demo 2: Object state (must spread) ───
function FormDemo() {
  const [form, setForm] = useState({ name: "", email: "", role: "viewer" });

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">2. Object State (Spread Required)</h3>
      <p className="text-zinc-400 text-sm mb-3">
        setState does NOT merge objects. You must spread the previous state.
      </p>
      <div className="grid gap-3 mb-3">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <pre className="text-xs bg-zinc-900 p-3 rounded font-mono text-green-400">
        {JSON.stringify(form, null, 2)}
      </pre>
    </div>
  );
}

// ─── Demo 3: Array state (immutable patterns) ───
function ArrayDemo() {
  const [items, setItems] = useState<string[]>(["React", "Next.js", "TypeScript"]);
  const [input, setInput] = useState("");

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">3. Array State (Immutable Updates)</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Never mutate arrays directly. Always create new arrays with spread, filter, or map.
      </p>
      <div className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add item..."
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              setItems((prev) => [...prev, input.trim()]); // ADD: spread + new
              setInput("");
            }
          }}
        />
        <button
          onClick={() => {
            if (input.trim()) {
              setItems((prev) => [...prev, input.trim()]);
              setInput("");
            }
          }}
          className="px-3 py-1.5 bg-blue-600 rounded text-sm hover:bg-blue-500"
        >
          Add
        </button>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center justify-between bg-zinc-900 rounded px-3 py-2 text-sm">
            <span>{item}</span>
            <button
              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} // REMOVE: filter
              className="text-red-400 hover:text-red-300 text-xs"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Demo 4: Lazy initialization ───
function LazyInitDemo() {
  // Expensive initial value: only computed ONCE on first render
  const [data] = useState(() => {
    console.log("Lazy init ran (check console — only runs once)");
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      value: Math.random().toFixed(4),
    }));
  });

  const [showAll, setShowAll] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">4. Lazy Initialization</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Pass a function to useState for expensive initial values. It only runs on the first render.
        Check the console — &quot;Lazy init ran&quot; appears only once.
      </p>
      <p className="text-sm mb-2">Generated {data.length} items on mount</p>
      <button
        onClick={() => setShowAll(!showAll)}
        className="px-3 py-1.5 bg-zinc-700 rounded text-sm hover:bg-zinc-600 mb-2"
      >
        {showAll ? "Show less" : "Show all"}
      </button>
      <div className="max-h-40 overflow-auto text-xs font-mono bg-zinc-900 p-2 rounded">
        {(showAll ? data : data.slice(0, 5)).map((d) => (
          <div key={d.id}>
            #{d.id}: {d.value}
          </div>
        ))}
        {!showAll && <div className="text-zinc-500">... and {data.length - 5} more</div>}
      </div>
    </div>
  );
}

export default function UseStatePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">useState</h1>
      <p className="text-zinc-400 mb-8">
        Local component state. When state changes, the component re-renders.
      </p>
      <div className="grid gap-6">
        <CounterDemo />
        <FormDemo />
        <ArrayDemo />
        <LazyInitDemo />
      </div>
    </main>
  );
}
