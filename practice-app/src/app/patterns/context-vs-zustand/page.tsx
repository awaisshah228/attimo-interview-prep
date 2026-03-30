"use client";

import { createContext, useContext, useState, memo, type ReactNode } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════
// CONTEXT VERSION — shows the re-render problem
// ═══════════════════════════════════════════

interface AppState {
  count: number;
  theme: "light" | "dark";
  setCount: (n: number) => void;
  setTheme: (t: "light" | "dark") => void;
}

const AppContext = createContext<AppState | null>(null);

function AppProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  return (
    <AppContext.Provider value={{ count, theme, setCount, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}

// These components consume context
const ContextCounter = memo(function ContextCounter() {
  const { count, setCount } = useApp();
  const renderTime = new Date().toLocaleTimeString();
  return (
    <div className="bg-zinc-900 rounded p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">Counter</span>
        <span className="text-xs text-red-400">rendered: {renderTime}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setCount(count - 1)} className="px-2 py-1 bg-zinc-700 rounded text-xs">-</button>
        <span className="font-mono text-lg w-8 text-center">{count}</span>
        <button onClick={() => setCount(count + 1)} className="px-2 py-1 bg-blue-600 rounded text-xs">+</button>
      </div>
    </div>
  );
});

const ContextThemeToggle = memo(function ContextThemeToggle() {
  const { theme, setTheme } = useApp();
  const renderTime = new Date().toLocaleTimeString();
  return (
    <div className="bg-zinc-900 rounded p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">Theme Toggle</span>
        <span className="text-xs text-red-400">rendered: {renderTime}</span>
      </div>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="px-3 py-1 bg-zinc-700 rounded text-xs"
      >
        Theme: {theme}
      </button>
    </div>
  );
});

const ContextUnrelated = memo(function ContextUnrelated() {
  const renderTime = new Date().toLocaleTimeString();
  // This component doesn't use context but is still inside the provider
  return (
    <div className="bg-zinc-900 rounded p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm">Unrelated component</span>
        <span className="text-xs text-zinc-500">rendered: {renderTime}</span>
      </div>
      <p className="text-xs text-zinc-500 mt-1">
        Doesn&apos;t use context — won&apos;t re-render
      </p>
    </div>
  );
});

function ContextDemo() {
  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">Context Version</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Change count → theme toggle re-renders too (both consume same context).
        Every consumer re-renders when ANY value in the context changes.
      </p>
      <AppProvider>
        <div className="space-y-2">
          <ContextCounter />
          <ContextThemeToggle />
          <ContextUnrelated />
        </div>
      </AppProvider>
      <div className="mt-3 bg-red-600/10 border border-red-600/20 rounded p-3 text-xs text-red-400">
        Problem: Clicking +/- updates count, but theme toggle also re-renders
        because both subscribe to the same context object.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ZUSTAND-LIKE VERSION — shows selective subscriptions
// (Using a simple store pattern to demonstrate without installing zustand)
// ═══════════════════════════════════════════

// Simple external store (mimics Zustand's behavior)
import { useSyncExternalStore, useCallback } from "react";

type StoreState = { count: number; theme: "light" | "dark" };
type Listener = () => void;

let storeState: StoreState = { count: 0, theme: "dark" };
const listeners = new Set<Listener>();

function setStoreState(partial: Partial<StoreState>) {
  storeState = { ...storeState, ...partial };
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Selector hook — only re-renders when the selected value changes
function useStore<T>(selector: (state: StoreState) => T): T {
  const getSnapshot = useCallback(() => selector(storeState), [selector]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const ZustandCounter = memo(function ZustandCounter() {
  const count = useStore((s) => s.count);
  const renderTime = new Date().toLocaleTimeString();
  return (
    <div className="bg-zinc-900 rounded p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">Counter</span>
        <span className="text-xs text-green-400">rendered: {renderTime}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setStoreState({ count: count - 1 })} className="px-2 py-1 bg-zinc-700 rounded text-xs">-</button>
        <span className="font-mono text-lg w-8 text-center">{count}</span>
        <button onClick={() => setStoreState({ count: count + 1 })} className="px-2 py-1 bg-blue-600 rounded text-xs">+</button>
      </div>
    </div>
  );
});

const ZustandThemeToggle = memo(function ZustandThemeToggle() {
  const theme = useStore((s) => s.theme);
  const renderTime = new Date().toLocaleTimeString();
  return (
    <div className="bg-zinc-900 rounded p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">Theme Toggle</span>
        <span className="text-xs text-green-400">rendered: {renderTime}</span>
      </div>
      <button
        onClick={() => setStoreState({ theme: theme === "dark" ? "light" : "dark" })}
        className="px-3 py-1 bg-zinc-700 rounded text-xs"
      >
        Theme: {theme}
      </button>
    </div>
  );
});

function ZustandDemo() {
  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">Zustand-like Version (Selectors)</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Change count → only counter re-renders. Theme toggle stays unchanged.
        Each component subscribes to just the slice it needs.
      </p>
      <div className="space-y-2">
        <ZustandCounter />
        <ZustandThemeToggle />
      </div>
      <div className="mt-3 bg-green-600/10 border border-green-600/20 rounded p-3 text-xs text-green-400">
        Solution: Selectors subscribe to specific state slices. Changing count
        does NOT re-render theme toggle.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// DECISION GUIDE
// ═══════════════════════════════════════════

function DecisionGuide() {
  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">When to Use What</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-zinc-800">
              <th className="pb-2 text-zinc-400 font-medium">State Type</th>
              <th className="pb-2 text-zinc-400 font-medium">Use</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            <tr className="border-b border-zinc-800/50">
              <td className="py-2">Server data (API)</td>
              <td className="py-2 text-blue-400">TanStack Query</td>
            </tr>
            <tr className="border-b border-zinc-800/50">
              <td className="py-2">Global UI (sidebar, modals)</td>
              <td className="py-2 text-blue-400">Zustand</td>
            </tr>
            <tr className="border-b border-zinc-800/50">
              <td className="py-2">Theme / locale</td>
              <td className="py-2 text-blue-400">Context (changes rarely)</td>
            </tr>
            <tr className="border-b border-zinc-800/50">
              <td className="py-2">Auth (current user)</td>
              <td className="py-2 text-blue-400">Zustand + persist</td>
            </tr>
            <tr className="border-b border-zinc-800/50">
              <td className="py-2">Form state</td>
              <td className="py-2 text-blue-400">useState or React Hook Form</td>
            </tr>
            <tr>
              <td className="py-2">Component-local</td>
              <td className="py-2 text-blue-400">useState / useReducer</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ContextVsZustandPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">Context vs Zustand</h1>
      <p className="text-zinc-400 mb-8">
        Context re-renders ALL consumers on any change. Zustand uses selectors
        to only re-render components that use the changed value.
      </p>
      <div className="grid gap-6">
        <ContextDemo />
        <ZustandDemo />
        <DecisionGuide />
      </div>
    </main>
  );
}
