import Link from "next/link";

// This is a SERVER COMPONENT — no "use client" directive
// It runs ONLY on the server. Zero JavaScript shipped to the browser.

// You can do things here that are impossible in client components:
// - Direct database access
// - Read files from the filesystem
// - Access environment variables securely
// - Fetch data without useEffect

async function getServerTime() {
  // Simulate a server-side operation
  return new Date().toISOString();
}

async function getRandomFact() {
  // Server-side fetch — no CORS issues, no exposed API keys
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts/" + Math.ceil(Math.random() * 100), {
      cache: "no-store",
    });
    const post = await res.json();
    return post;
  } catch {
    return { title: "Could not fetch", body: "Try again" };
  }
}

// Server component that fetches data
async function ServerDataCard() {
  const post = await getRandomFact();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="text-xs text-green-400 font-mono mb-2">
        Server Component — data fetched on server
      </div>
      <h4 className="font-semibold text-sm mb-1 capitalize">{post.title}</h4>
      <p className="text-sm text-zinc-400">{post.body}</p>
    </div>
  );
}

export default async function ServerComponentsPage() {
  const serverTime = await getServerTime();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">Server Components</h1>
      <p className="text-zinc-400 mb-8">
        Default in Next.js App Router. Run on the server, ship zero JS to the browser.
        Can fetch data, access databases, and read env vars directly.
      </p>

      <div className="grid gap-6">
        <div className="border border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">This Page is a Server Component</h3>
          <p className="text-zinc-400 text-sm mb-3">
            No &quot;use client&quot; directive. This entire page rendered on the server.
            The HTML was sent to your browser with no React JavaScript.
          </p>
          <div className="bg-zinc-900 rounded p-3 font-mono text-sm">
            <div className="text-zinc-500">Server time (rendered once):</div>
            <div className="text-green-400">{serverTime}</div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Refresh the page to see a new timestamp. It does NOT update live
            because there&apos;s no JavaScript running on the client for this component.
          </p>
        </div>

        <div className="border border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Server-Side Data Fetching</h3>
          <p className="text-zinc-400 text-sm mb-3">
            This component used <code className="text-blue-400">await fetch()</code> directly —
            no useEffect, no loading state, no client-side JavaScript.
          </p>
          <ServerDataCard />
        </div>

        <div className="border border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">What You CAN&apos;T Do</h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <div className="flex gap-2">
              <span className="text-red-400">✗</span>
              <span>useState, useEffect, useRef, or any hooks</span>
            </div>
            <div className="flex gap-2">
              <span className="text-red-400">✗</span>
              <span>onClick, onChange, or any event handlers</span>
            </div>
            <div className="flex gap-2">
              <span className="text-red-400">✗</span>
              <span>Browser APIs (window, document, localStorage)</span>
            </div>
            <div className="flex gap-2">
              <span className="text-red-400">✗</span>
              <span>Class components with lifecycle methods</span>
            </div>
          </div>
        </div>

        <div className="border border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">What You CAN Do</h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <div className="flex gap-2">
              <span className="text-green-400">✓</span>
              <span>async/await directly in the component</span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-400">✓</span>
              <span>Fetch data, query databases, read files</span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-400">✓</span>
              <span>Access environment variables (secrets safe on server)</span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-400">✓</span>
              <span>Import server-only modules (node:fs, ORMs)</span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-400">✓</span>
              <span>Render Client Components as children</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
