import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { Tabs } from "@/components/tabs";
import { SearchInput } from "./search-input";
import { SearchResults } from "./search-results";
import { SearchProduction } from "./search-production";

export default async function URLSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">07 — Real-Time Search with URL State</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Scratch uses useRouter + manual debounce. Production uses nuqs
        (type-safe URL state) + TanStack Query. Try &quot;react&quot; or
        &quot;alice&quot;.
      </p>

      <div className="mt-8">
        <Tabs
          items={[
            {
              label: "From Scratch",
              content: (
                <div className="space-y-6">
                  <SearchInput defaultValue={q} />
                  <Suspense
                    key={q}
                    fallback={
                      <div className="py-8 text-center text-zinc-500">
                        Searching...
                      </div>
                    }
                  >
                    <SearchResults query={q} />
                  </Suspense>
                </div>
              ),
            },
            {
              label: "With nuqs + TanStack Query",
              content: <SearchProduction />,
            },
          ]}
        />
      </div>

      <Concepts
        items={[
          "Scratch: useRouter + useSearchParams + manual setTimeout debounce",
          "Production: nuqs useQueryState with built-in throttle + TanStack Query caching",
          "nuqs — type-safe URL params, shallow routing, one-liner debounce",
          "TanStack Query — stale-while-revalidate for cached search results",
        ]}
      />
    </main>
  );
}
