"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ─── Demo 1: DOM Access ───
function DomRefDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">1. DOM Access</h3>
      <p className="text-zinc-400 text-sm mb-3">
        useRef gives direct access to DOM elements. Click the buttons to interact with the input.
      </p>
      <input
        ref={inputRef}
        placeholder="Click a button below..."
        className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm w-full mb-3"
      />
      <div className="flex gap-2 flex-wrap mb-3">
        <button
          onClick={() => inputRef.current?.focus()}
          className="px-3 py-1.5 bg-blue-600 rounded text-sm"
        >
          Focus input
        </button>
        <button
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "Hello from ref!";
          }}
          className="px-3 py-1.5 bg-green-600 rounded text-sm"
        >
          Set value directly
        </button>
        <button
          onClick={() => inputRef.current?.select()}
          className="px-3 py-1.5 bg-purple-600 rounded text-sm"
        >
          Select all text
        </button>
      </div>
      <div
        ref={divRef}
        className="bg-zinc-900 rounded p-3 text-sm text-zinc-400"
      >
        <button
          onClick={() => {
            if (divRef.current) {
              const rect = divRef.current.getBoundingClientRect();
              alert(
                `This div is at:\ntop: ${rect.top.toFixed(0)}px\nleft: ${rect.left.toFixed(0)}px\nwidth: ${rect.width.toFixed(0)}px`
              );
            }
          }}
          className="text-blue-400 text-sm hover:underline"
        >
          Measure this div →
        </button>
      </div>
    </div>
  );
}

// ─── Demo 2: Render counter (ref doesn't cause re-render) ───
function RenderCounterDemo() {
  const [count, setCount] = useState(0);
  const renderCount = useRef(0);

  // This increments every render but does NOT cause another render
  renderCount.current += 1;

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">2. Render Counter (No Re-render)</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Changing a ref does NOT trigger re-render. The render count updates silently.
        It only shows the new value when something else causes a re-render.
      </p>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="bg-zinc-900 rounded p-3 text-center">
          <div className="text-3xl font-mono">{count}</div>
          <div className="text-xs text-zinc-500 mt-1">State (triggers render)</div>
        </div>
        <div className="bg-zinc-900 rounded p-3 text-center">
          <div className="text-3xl font-mono">{renderCount.current}</div>
          <div className="text-xs text-zinc-500 mt-1">Renders (ref, silent)</div>
        </div>
      </div>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="px-3 py-1.5 bg-blue-600 rounded text-sm"
      >
        Increment state (+1 render)
      </button>
    </div>
  );
}

// ─── Demo 3: Previous value pattern ───
function PreviousValueDemo() {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    prevCountRef.current = count;
  }); // No deps = runs after every render

  const prevCount = prevCountRef.current;

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">3. Previous Value Pattern</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Store the previous state value using a ref + useEffect. The ref updates AFTER render,
        so during render it still holds the old value.
      </p>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="bg-zinc-900 rounded p-3 text-center">
          <div className="text-3xl font-mono">{count}</div>
          <div className="text-xs text-zinc-500 mt-1">Current</div>
        </div>
        <div className="bg-zinc-900 rounded p-3 text-center">
          <div className="text-3xl font-mono text-zinc-500">
            {prevCount ?? "–"}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Previous</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-3 py-1.5 bg-blue-600 rounded text-sm"
        >
          +1
        </button>
        <button
          onClick={() => setCount((c) => c - 1)}
          className="px-3 py-1.5 bg-zinc-700 rounded text-sm"
        >
          -1
        </button>
      </div>
    </div>
  );
}

// ─── Demo 4: Stopwatch (mutable ref for interval ID) ───
function StopwatchDemo() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    if (intervalRef.current) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setTime((t) => t + 10);
    }, 10);
  }

  function stop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }

  function reset() {
    stop();
    setTime(0);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const ms = Math.floor((time % 1000) / 10);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">4. Stopwatch (Mutable Ref for Interval)</h3>
      <p className="text-zinc-400 text-sm mb-3">
        The interval ID is stored in a ref — we need to access it in start/stop/cleanup
        without causing re-renders.
      </p>
      <div className="text-4xl font-mono mb-4 tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}.
        {String(ms).padStart(2, "0")}
      </div>
      <div className="flex gap-2">
        {!running ? (
          <button onClick={start} className="px-3 py-1.5 bg-green-600 rounded text-sm">
            Start
          </button>
        ) : (
          <button onClick={stop} className="px-3 py-1.5 bg-red-600 rounded text-sm">
            Stop
          </button>
        )}
        <button onClick={reset} className="px-3 py-1.5 bg-zinc-700 rounded text-sm">
          Reset
        </button>
      </div>
    </div>
  );
}

export default function UseRefPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">useRef</h1>
      <p className="text-zinc-400 mb-8">
        Mutable container that persists across renders without causing re-renders. Used for DOM access and storing values.
      </p>
      <div className="grid gap-6">
        <DomRefDemo />
        <RenderCounterDemo />
        <PreviousValueDemo />
        <StopwatchDemo />
      </div>
    </main>
  );
}
