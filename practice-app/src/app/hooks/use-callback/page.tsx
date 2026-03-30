"use client";

import { useState, useCallback, memo } from "react";
import Link from "next/link";

// ─── Child that shows when it re-renders ───
const ExpensiveChild = memo(function ExpensiveChild({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  const renderTime = new Date().toLocaleTimeString();

  return (
    <div className="bg-zinc-900 rounded p-3 flex items-center justify-between">
      <div>
        <span className="text-sm">{label}</span>
        <span className="text-xs text-zinc-500 ml-2">rendered at {renderTime}</span>
      </div>
      <button
        onClick={onClick}
        className="px-3 py-1 bg-blue-600 rounded text-xs"
      >
        Click
      </button>
    </div>
  );
});

// ─── Demo 1: Without vs with useCallback ───
function CallbackComparisonDemo() {
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);

  // WITHOUT useCallback: new function every render → child re-renders
  const handleClickUnstable = () => {
    setCount((c) => c + 1);
  };

  // WITH useCallback: same function reference → child skips re-render
  const handleClickStable = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">1. useCallback + React.memo</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Click &quot;Update other state&quot; — the unstable child re-renders (new timestamp),
        but the stable child keeps its old timestamp because useCallback + memo prevents it.
      </p>
      <div className="flex gap-3 mb-4">
        <div className="bg-zinc-900 rounded p-3 text-center flex-1">
          <div className="text-2xl font-mono">{count}</div>
          <div className="text-xs text-zinc-500">count</div>
        </div>
        <div className="bg-zinc-900 rounded p-3 text-center flex-1">
          <div className="text-2xl font-mono">{other}</div>
          <div className="text-xs text-zinc-500">other</div>
        </div>
      </div>
      <button
        onClick={() => setOther((o) => o + 1)}
        className="px-3 py-1.5 bg-yellow-600 rounded text-sm mb-4 w-full"
      >
        Update other state (watch which children re-render)
      </button>
      <div className="grid gap-2">
        <div className="text-xs text-red-400 font-mono">Without useCallback:</div>
        <ExpensiveChild onClick={handleClickUnstable} label="Unstable handler" />
        <div className="text-xs text-green-400 font-mono mt-2">With useCallback:</div>
        <ExpensiveChild onClick={handleClickStable} label="Stable handler" />
      </div>
    </div>
  );
}

// ─── Demo 2: useCallback with dependencies ───
function CallbackDepsDemo() {
  const [multiplier, setMultiplier] = useState(1);
  const [results, setResults] = useState<string[]>([]);

  // Recreated only when multiplier changes
  const calculate = useCallback(
    (value: number) => {
      const result = `${value} × ${multiplier} = ${value * multiplier}`;
      setResults((prev) => [result, ...prev.slice(0, 9)]);
    },
    [multiplier]
  );

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">2. useCallback with Dependencies</h3>
      <p className="text-zinc-400 text-sm mb-3">
        The callback uses <code className="text-blue-400">multiplier</code> — so it must be in
        the dependency array. Changing multiplier creates a new function.
      </p>
      <div className="flex gap-3 mb-3 items-center">
        <span className="text-sm text-zinc-400">Multiplier:</span>
        {[1, 2, 5, 10].map((m) => (
          <button
            key={m}
            onClick={() => setMultiplier(m)}
            className={`px-3 py-1 rounded text-sm ${
              multiplier === m ? "bg-blue-600" : "bg-zinc-800"
            }`}
          >
            ×{m}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {[1, 2, 3, 5, 7, 10, 42, 100].map((v) => (
          <button
            key={v}
            onClick={() => calculate(v)}
            className="px-3 py-1 bg-zinc-800 rounded text-sm hover:bg-zinc-700"
          >
            Calc {v}
          </button>
        ))}
      </div>
      <div className="bg-zinc-900 rounded p-3 max-h-40 overflow-auto">
        {results.length === 0 ? (
          <span className="text-zinc-600 text-sm">Click a number to calculate</span>
        ) : (
          results.map((r, i) => (
            <div key={i} className="text-sm font-mono text-green-400">
              {r}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function UseCallbackPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">useCallback</h1>
      <p className="text-zinc-400 mb-8">
        Cache function references. Useful with React.memo to prevent unnecessary child re-renders.
      </p>
      <div className="grid gap-6">
        <CallbackComparisonDemo />
        <CallbackDepsDemo />
      </div>
    </main>
  );
}
