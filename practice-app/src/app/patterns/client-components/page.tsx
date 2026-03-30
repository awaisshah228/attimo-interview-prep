"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Interactive component that NEEDS "use client" ───
function InteractiveCounter() {
  const [count, setCount] = useState(0);

  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <div className="text-xs text-yellow-400 font-mono mb-2">&quot;use client&quot; component</div>
      <p className="text-sm text-zinc-400 mb-3">
        This component uses useState and onClick — it MUST be a Client Component.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCount((c) => c - 1)}
          className="px-3 py-1.5 bg-zinc-700 rounded text-sm"
        >
          -
        </button>
        <span className="text-2xl font-mono w-12 text-center">{count}</span>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-3 py-1.5 bg-blue-600 rounded text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Component using browser APIs ───
function BrowserApiDemo() {
  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });

    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <div className="text-xs text-yellow-400 font-mono mb-2">Browser APIs (window, document)</div>
      <p className="text-sm text-zinc-400 mb-3">
        Accessing <code className="text-blue-400">window</code> requires a Client Component.
        These APIs don&apos;t exist on the server.
      </p>
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="bg-zinc-800 rounded p-2">
          <div className="font-mono">{windowSize.w}px</div>
          <div className="text-xs text-zinc-500">Width</div>
        </div>
        <div className="bg-zinc-800 rounded p-2">
          <div className="font-mono">{windowSize.h}px</div>
          <div className="text-xs text-zinc-500">Height</div>
        </div>
        <div className="bg-zinc-800 rounded p-2">
          <div className="font-mono">{scrollY}px</div>
          <div className="text-xs text-zinc-500">Scroll Y</div>
        </div>
      </div>
    </div>
  );
}

// ─── Form with event handlers ───
function FormDemo() {
  const [values, setValues] = useState({ name: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <div className="text-xs text-yellow-400 font-mono mb-2">Event handlers (onChange, onSubmit)</div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          placeholder="Your name"
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm w-full"
        />
        <textarea
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          placeholder="Your message"
          rows={3}
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm w-full"
        />
        <button
          type="submit"
          className={`px-4 py-2 rounded text-sm ${
            submitted ? "bg-green-600" : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {submitted ? "Sent!" : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default function ClientComponentsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">Client Components</h1>
      <p className="text-zinc-400 mb-8">
        Add <code className="text-blue-400">&quot;use client&quot;</code> at the top when you need
        interactivity, hooks, event handlers, or browser APIs.
      </p>

      <div className="grid gap-6">
        <div className="border border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">When You Need &quot;use client&quot;</h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <div className="flex gap-2"><span className="text-yellow-400">→</span> useState, useEffect, useRef, or any React hooks</div>
            <div className="flex gap-2"><span className="text-yellow-400">→</span> onClick, onChange, onSubmit event handlers</div>
            <div className="flex gap-2"><span className="text-yellow-400">→</span> Browser APIs: window, document, localStorage</div>
            <div className="flex gap-2"><span className="text-yellow-400">→</span> Third-party libs that use browser features</div>
          </div>
        </div>

        <div className="border border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">The &quot;use client&quot; Boundary Rule</h3>
          <p className="text-zinc-400 text-sm mb-3">
            Push <code className="text-blue-400">&quot;use client&quot;</code> as far down the tree as possible.
            Only the interactive leaf components need it.
          </p>
          <div className="bg-zinc-900 rounded p-3 font-mono text-xs space-y-1">
            <div className="text-green-400">page.tsx (Server) — fetches data, renders layout</div>
            <div className="text-green-400 pl-4">├── Header (Server) — static, no JS</div>
            <div className="text-green-400 pl-4">├── ArticleContent (Server) — static text</div>
            <div className="text-yellow-400 pl-4">├── LikeButton (Client) — needs onClick</div>
            <div className="text-yellow-400 pl-4">├── CommentForm (Client) — needs form state</div>
            <div className="text-green-400 pl-4">└── Footer (Server) — static, no JS</div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Only LikeButton and CommentForm ship JavaScript. Everything else is zero-JS.
          </p>
        </div>

        <div className="border border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Interactive Examples</h3>
          <div className="space-y-4">
            <InteractiveCounter />
            <BrowserApiDemo />
            <FormDemo />
          </div>
        </div>
      </div>
    </main>
  );
}
