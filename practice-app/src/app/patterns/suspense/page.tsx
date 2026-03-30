import { Suspense } from "react";
import Link from "next/link";

// ─── Slow component (simulates data fetching) ───
async function SlowComponent({ delay, label }: { delay: number; label: string }) {
  await new Promise((resolve) => setTimeout(resolve, delay));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-xs text-zinc-500">loaded after {delay}ms</span>
      </div>
      <div className="text-xs text-green-400 font-mono mt-1">
        Data: {Math.random().toFixed(6)}
      </div>
    </div>
  );
}

// ─── Loading skeleton ───
function Skeleton({ height = "h-16" }: { height?: string }) {
  return (
    <div className={`${height} bg-zinc-800 rounded-lg animate-pulse`} />
  );
}

function CardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2" />
      <div className="h-3 bg-zinc-800 rounded w-2/3" />
    </div>
  );
}

export default function SuspensePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">Suspense</h1>
      <p className="text-zinc-400 mb-8">
        Declarative loading states. Wrap async components in Suspense with a fallback.
        Components stream in as they resolve — no waterfall.
      </p>

      <div className="grid gap-6">
        {/* Demo 1: Basic Suspense */}
        <div className="border border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">1. Basic Suspense</h3>
          <p className="text-zinc-400 text-sm mb-3">
            This component takes 2 seconds to load. The skeleton shows while waiting.
          </p>
          <Suspense fallback={<Skeleton />}>
            <SlowComponent delay={2000} label="Basic async component" />
          </Suspense>
        </div>

        {/* Demo 2: Parallel streaming */}
        <div className="border border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">2. Parallel Streaming</h3>
          <p className="text-zinc-400 text-sm mb-3">
            Three components with different load times. Each has its own Suspense boundary,
            so they stream in independently (no waterfall).
          </p>
          <div className="grid gap-3">
            <Suspense fallback={<CardSkeleton />}>
              <SlowComponent delay={1000} label="Fast component (1s)" />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
              <SlowComponent delay={2500} label="Medium component (2.5s)" />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
              <SlowComponent delay={4000} label="Slow component (4s)" />
            </Suspense>
          </div>
        </div>

        {/* Demo 3: Shared boundary */}
        <div className="border border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">3. Shared Boundary (All-or-Nothing)</h3>
          <p className="text-zinc-400 text-sm mb-3">
            All three components share ONE Suspense boundary. The skeleton shows until
            the SLOWEST component resolves. They all appear together.
          </p>
          <Suspense
            fallback={
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            }
          >
            <div className="grid gap-3">
              <SlowComponent delay={1000} label="Ready in 1s (waits for others)" />
              <SlowComponent delay={2000} label="Ready in 2s (waits for slowest)" />
              <SlowComponent delay={3000} label="Ready in 3s (the bottleneck)" />
            </div>
          </Suspense>
        </div>

        {/* Explanation */}
        <div className="border border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Key Takeaways</h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <div className="flex gap-2">
              <span className="text-green-400">1.</span>
              <span>
                <strong className="text-zinc-300">Separate Suspense = independent loading</strong> — each component streams in when ready
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-400">2.</span>
              <span>
                <strong className="text-zinc-300">Shared Suspense = all-or-nothing</strong> — everything waits for the slowest
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-400">3.</span>
              <span>
                <strong className="text-zinc-300">Nest for granularity</strong> — loading.tsx is the page-level boundary, Suspense gives you component-level control
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-400">4.</span>
              <span>
                <strong className="text-zinc-300">No waterfall</strong> — parallel fetches start simultaneously, resolve independently
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
