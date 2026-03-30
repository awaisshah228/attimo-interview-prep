"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";

// ─── Step 1: Create typed context ───
interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ─── Step 2: Custom hook for type-safe access ───
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// ─── Step 3: Provider component ───
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Components that consume context ───
function ThemedCard() {
  const { theme } = useTheme();
  return (
    <div
      className={`rounded-lg p-4 border ${
        theme === "dark"
          ? "bg-zinc-900 border-zinc-700 text-white"
          : "bg-white border-zinc-300 text-black"
      }`}
    >
      <h4 className="font-semibold">Themed Card</h4>
      <p className={`text-sm mt-1 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
        This card reacts to the theme context. Current: <strong>{theme}</strong>
      </p>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`px-4 py-2 rounded text-sm font-medium ${
        theme === "dark"
          ? "bg-yellow-500 text-black hover:bg-yellow-400"
          : "bg-zinc-800 text-white hover:bg-zinc-700"
      }`}
    >
      Switch to {theme === "dark" ? "light" : "dark"} mode
    </button>
  );
}

function ThemedBadge({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
        theme === "dark"
          ? "bg-blue-600 text-white"
          : "bg-blue-100 text-blue-800"
      }`}
    >
      {label}
    </span>
  );
}

// ─── Demo showing the pattern ───
function ContextDemo() {
  return (
    <ThemeProvider>
      <div className="border border-zinc-800 rounded-lg p-4">
        <h3 className="font-semibold mb-3">1. Theme Context (Full Pattern)</h3>
        <p className="text-zinc-400 text-sm mb-4">
          createContext → Provider → useContext hook. All children can access the theme
          without prop drilling.
        </p>
        <div className="space-y-3">
          <ThemeToggle />
          <ThemedCard />
          <div className="flex gap-2">
            <ThemedBadge label="React" />
            <ThemedBadge label="Next.js" />
            <ThemedBadge label="TypeScript" />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

// ─── Demo 2: Nested contexts ───
interface UserContextType {
  name: string;
  role: string;
}

const UserContext = createContext<UserContextType>({ name: "Guest", role: "viewer" });

function UserInfo() {
  const user = useContext(UserContext);
  return (
    <div className="bg-zinc-900 rounded p-3 text-sm">
      <span className="text-zinc-400">Logged in as: </span>
      <span className="text-green-400">{user.name}</span>
      <span className="text-zinc-600"> ({user.role})</span>
    </div>
  );
}

function NestedContextDemo() {
  const [role, setRole] = useState<string>("viewer");

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">2. Nested / Multiple Contexts</h3>
      <p className="text-zinc-400 text-sm mb-3">
        You can nest multiple providers. Inner providers override outer ones.
      </p>
      <UserContext.Provider value={{ name: "Alice", role }}>
        <div className="space-y-3">
          <div className="flex gap-2">
            {["viewer", "editor", "admin"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-3 py-1 rounded text-sm capitalize ${
                  role === r ? "bg-blue-600" : "bg-zinc-800"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <UserInfo />

          {/* Override with a nested provider */}
          <div className="border border-zinc-700 rounded p-3">
            <div className="text-xs text-zinc-500 mb-2">
              Nested provider (overrides parent):
            </div>
            <UserContext.Provider value={{ name: "Bob", role: "admin" }}>
              <UserInfo />
            </UserContext.Provider>
          </div>
        </div>
      </UserContext.Provider>
    </div>
  );
}

// ─── When NOT to use Context ───
function ContextWarning() {
  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">When NOT to Use Context</h3>
      <div className="space-y-2 text-sm text-zinc-400">
        <div className="flex items-start gap-2">
          <span className="text-red-400">✗</span>
          <span>
            <strong className="text-zinc-300">Frequently changing values</strong> — every consumer
            re-renders on every change. Use Zustand instead.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-red-400">✗</span>
          <span>
            <strong className="text-zinc-300">Server state (API data)</strong> — use TanStack Query
            for caching, refetching, and invalidation.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-400">✓</span>
          <span>
            <strong className="text-zinc-300">Theme, locale, auth</strong> — values that change
            rarely and are needed everywhere.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-400">✓</span>
          <span>
            <strong className="text-zinc-300">Dependency injection</strong> — providing services
            or configurations to a subtree.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function UseContextPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">useContext</h1>
      <p className="text-zinc-400 mb-8">
        Share data across the component tree without prop drilling. Best for infrequently changing values.
      </p>
      <div className="grid gap-6">
        <ContextDemo />
        <NestedContextDemo />
        <ContextWarning />
      </div>
    </main>
  );
}
