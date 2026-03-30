"use client";

import { useState, useEffect, useRef, useSyncExternalStore, useCallback } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════

// ─── useLocalStorage ───
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      console.error("Failed to save to localStorage");
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// ─── useDebounce ───
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─── useMediaQuery ───
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    [query]
  );

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ─── useToggle ───
function useToggle(initial = false): [boolean, () => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle];
}

// ─── usePrevious ───
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// ─── useClickOutside ───
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, handler]);
}

// ═══════════════════════════════════════════
// DEMO COMPONENTS
// ═══════════════════════════════════════════

function LocalStorageDemo() {
  const [name, setName] = useLocalStorage("practice-name", "");
  const [count, setCount] = useLocalStorage("practice-count", 0);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">useLocalStorage</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Persists state to localStorage. Refresh the page — your data survives!
      </p>
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name (persisted)..."
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm w-full"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCount((c) => c + 1)}
            className="px-3 py-1.5 bg-blue-600 rounded text-sm"
          >
            Count: {count}
          </button>
          <span className="text-xs text-zinc-500">
            Refresh the page — value persists
          </span>
        </div>
      </div>
    </div>
  );
}

function DebounceDemo() {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 500);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  useEffect(() => {
    if (!debouncedInput) {
      setSearchResults([]);
      return;
    }
    // Simulate API search
    setSearchResults(
      Array.from({ length: 5 }, (_, i) => `Result ${i + 1} for "${debouncedInput}"`)
    );
  }, [debouncedInput]);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">useDebounce</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Delays updating the value until you stop typing (500ms). Prevents excessive API calls.
      </p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type to search (debounced)..."
        className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm w-full mb-3"
      />
      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
        <div className="bg-zinc-900 rounded p-2">
          <span className="text-zinc-500">Instant: </span>
          <span className="text-yellow-400 font-mono">&quot;{input}&quot;</span>
        </div>
        <div className="bg-zinc-900 rounded p-2">
          <span className="text-zinc-500">Debounced: </span>
          <span className="text-green-400 font-mono">&quot;{debouncedInput}&quot;</span>
        </div>
      </div>
      {searchResults.length > 0 && (
        <div className="bg-zinc-900 rounded p-3 text-sm space-y-1">
          {searchResults.map((r, i) => (
            <div key={i} className="text-zinc-300">{r}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function MediaQueryDemo() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
  const isDesktop = useMediaQuery("(min-width: 1025px)");
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">useMediaQuery</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Reactive media queries. Resize your browser to see values change in real-time.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Mobile (<640px)", active: isMobile },
          { label: "Tablet (641-1024px)", active: isTablet },
          { label: "Desktop (>1024px)", active: isDesktop },
          { label: "Prefers dark", active: prefersDark },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded p-2 text-sm ${
              item.active
                ? "bg-green-600/20 text-green-400 border border-green-600/30"
                : "bg-zinc-900 text-zinc-500"
            }`}
          >
            {item.active ? "✓" : "✗"} {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToggleDemo() {
  const [isOpen, toggleOpen] = useToggle(false);
  const [isEnabled, toggleEnabled] = useToggle(true);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">useToggle</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Simple boolean toggle — cleaner than <code className="text-blue-400">useState</code> + manual flip.
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={toggleOpen} className="px-3 py-1.5 bg-zinc-800 rounded text-sm">
            {isOpen ? "Close" : "Open"} panel
          </button>
          {isOpen && (
            <div className="bg-blue-600/20 border border-blue-600/30 rounded px-3 py-1.5 text-sm text-blue-400">
              Panel is open!
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleEnabled}
            className={`px-3 py-1.5 rounded text-sm ${isEnabled ? "bg-green-600" : "bg-red-600"}`}
          >
            Notifications: {isEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviousValueDemo() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">usePrevious</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Tracks the previous value of any state. Uses a ref that updates after render.
      </p>
      <div className="flex items-center gap-4 mb-3">
        <div className="bg-zinc-900 rounded p-3 text-center">
          <div className="text-2xl font-mono">{count}</div>
          <div className="text-xs text-zinc-500">Current</div>
        </div>
        <div className="text-zinc-600">→</div>
        <div className="bg-zinc-900 rounded p-3 text-center">
          <div className="text-2xl font-mono text-zinc-500">{prevCount ?? "–"}</div>
          <div className="text-xs text-zinc-500">Previous</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setCount((c) => c + 1)} className="px-3 py-1.5 bg-blue-600 rounded text-sm">+1</button>
        <button onClick={() => setCount((c) => c + 5)} className="px-3 py-1.5 bg-blue-600 rounded text-sm">+5</button>
        <button onClick={() => setCount(0)} className="px-3 py-1.5 bg-zinc-700 rounded text-sm">Reset</button>
      </div>
    </div>
  );
}

function ClickOutsideDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">useClickOutside</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Detects clicks outside a ref element. Perfect for closing dropdowns and modals.
      </p>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 bg-zinc-800 rounded text-sm"
        >
          {isOpen ? "Dropdown open" : "Open dropdown"}
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg p-2 min-w-48 z-10">
            {["Profile", "Settings", "Help", "Logout"].map((item) => (
              <button
                key={item}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded"
              >
                {item}
              </button>
            ))}
            <div className="text-xs text-zinc-500 mt-2 px-3">Click outside to close</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomHooksPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">Custom Hooks</h1>
      <p className="text-zinc-400 mb-8">
        Extract reusable stateful logic into custom hooks. Each component using the hook gets its own independent state.
      </p>
      <div className="grid gap-6">
        <LocalStorageDemo />
        <DebounceDemo />
        <MediaQueryDemo />
        <ToggleDemo />
        <PreviousValueDemo />
        <ClickOutsideDemo />
      </div>
    </main>
  );
}
