"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Demo 1: Dependency array behavior ───
function DependencyDemo() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");
  const [log, setLog] = useState<string[]>([]);

  // Runs when count changes
  useEffect(() => {
    setLog((prev) => [...prev, `Effect ran — count is ${count}`]);
  }, [count]);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">1. Dependency Array</h3>
      <p className="text-zinc-400 text-sm mb-3">
        The effect runs only when <code className="text-blue-400">count</code> changes.
        Typing in the name field does NOT trigger it.
      </p>
      <div className="flex gap-3 mb-3">
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-3 py-1.5 bg-blue-600 rounded text-sm"
        >
          count: {count}
        </button>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type here (no effect)"
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm flex-1"
        />
      </div>
      <div className="bg-zinc-900 rounded p-3 max-h-32 overflow-auto">
        {log.map((entry, i) => (
          <div key={i} className="text-xs font-mono text-green-400">
            {entry}
          </div>
        ))}
      </div>
      <button
        onClick={() => setLog([])}
        className="mt-2 text-xs text-zinc-500 hover:text-zinc-300"
      >
        Clear log
      </button>
    </div>
  );
}

// ─── Demo 2: Cleanup function (timer) ───
function CleanupDemo() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    // CLEANUP: clears interval when running changes or component unmounts
    return () => {
      clearInterval(interval);
    };
  }, [running]);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">2. Cleanup Function (Timer)</h3>
      <p className="text-zinc-400 text-sm mb-3">
        The cleanup function runs before the next effect and on unmount.
        Without it, intervals would stack up.
      </p>
      <div className="text-4xl font-mono mb-4">{seconds}s</div>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning(true)}
          disabled={running}
          className="px-3 py-1.5 bg-green-600 rounded text-sm disabled:opacity-50"
        >
          Start
        </button>
        <button
          onClick={() => setRunning(false)}
          disabled={!running}
          className="px-3 py-1.5 bg-red-600 rounded text-sm disabled:opacity-50"
        >
          Stop
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setSeconds(0);
          }}
          className="px-3 py-1.5 bg-zinc-700 rounded text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── Demo 3: Fetch with abort controller ───
function FetchDemo() {
  const [userId, setUserId] = useState(1);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchCount, setFetchCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(`https://jsonplaceholder.typicode.com/users/${userId}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        setUser({ name: data.name, email: data.email });
        setLoading(false);
        setFetchCount((c) => c + 1);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(err);
          setLoading(false);
        }
      });

    // CLEANUP: abort stale request if userId changes quickly
    return () => controller.abort();
  }, [userId]);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">3. Fetch with AbortController</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Click users rapidly — the abort controller cancels stale requests.
        Only the latest fetch completes.
      </p>
      <div className="flex gap-2 mb-3 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => (
          <button
            key={id}
            onClick={() => setUserId(id)}
            className={`px-3 py-1.5 rounded text-sm ${
              userId === id ? "bg-blue-600" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            User {id}
          </button>
        ))}
      </div>
      <div className="bg-zinc-900 rounded p-3 text-sm font-mono">
        {loading ? (
          <span className="text-yellow-400">Loading...</span>
        ) : user ? (
          <div>
            <div className="text-green-400">{user.name}</div>
            <div className="text-zinc-400">{user.email}</div>
          </div>
        ) : null}
      </div>
      <div className="text-xs text-zinc-500 mt-2">
        Completed fetches: {fetchCount}
      </div>
    </div>
  );
}

// ─── Demo 4: Window resize listener ───
function ResizeDemo() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }

    // Set initial size
    handleResize();

    window.addEventListener("resize", handleResize);

    // CLEANUP: remove event listener
    return () => window.removeEventListener("resize", handleResize);
  }, []); // empty array = mount only

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">4. Event Listener + Cleanup</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Listens to window resize. Cleanup removes the listener on unmount.
        Try resizing your browser.
      </p>
      <div className="font-mono text-lg">
        {size.width} × {size.height}
      </div>
    </div>
  );
}

export default function UseEffectPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">useEffect</h1>
      <p className="text-zinc-400 mb-8">
        Run side effects after render. Always think about: dependencies, cleanup, and race conditions.
      </p>
      <div className="grid gap-6">
        <DependencyDemo />
        <CleanupDemo />
        <FetchDemo />
        <ResizeDemo />
      </div>
    </main>
  );
}
