import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { Tabs } from "@/components/tabs";
import { HookDebounceDemo } from "./hook-debounce-demo";
import { HookLocalStorageDemo } from "./hook-localstorage-demo";
import { HookClickOutsideDemo } from "./hook-clickoutside-demo";
import { HookMediaQueryDemo } from "./hook-mediaquery-demo";
import { HookFetchDemo } from "./hook-fetch-demo";
import { HookIntersectionDemo } from "./hook-intersection-demo";
import {
  HookDebounceProd,
  HookLocalStorageProd,
  HookClickOutsideProd,
  HookMediaQueryProd,
  HookFetchProd,
  HookIntersectionProd,
} from "./hooks-production-demo";

export default function CustomHooksPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">10 — Custom Hooks</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Scratch: hand-written hooks in <code className="text-zinc-300">lib/hooks.ts</code>.
        Production: usehooks-ts + TanStack Query (battle-tested, maintained).
      </p>

      <div className="mt-8">
        <Tabs
          items={[
            {
              label: "From Scratch",
              content: (
                <div className="space-y-4">
                  <HookDebounceDemo />
                  <HookLocalStorageDemo />
                  <HookClickOutsideDemo />
                  <HookMediaQueryDemo />
                  <HookFetchDemo />
                  <HookIntersectionDemo />
                </div>
              ),
            },
            {
              label: "With usehooks-ts + TanStack Query",
              content: (
                <div className="space-y-4">
                  <HookDebounceProd />
                  <HookLocalStorageProd />
                  <HookClickOutsideProd />
                  <HookMediaQueryProd />
                  <HookFetchProd />
                  <HookIntersectionProd />
                </div>
              ),
            },
          ]}
        />
      </div>

      <Concepts
        items={[
          "Scratch: useDebounce, useLocalStorage, useClickOutside, useMediaQuery, useFetch, useIntersectionObserver",
          "Production: usehooks-ts (40+ typed hooks) + TanStack Query (replaces useFetch)",
          "usehooks-ts — community-maintained, tested, SSR-safe",
          "TanStack Query — replaces manual fetch with caching, retry, dedup",
        ]}
      />
    </main>
  );
}
