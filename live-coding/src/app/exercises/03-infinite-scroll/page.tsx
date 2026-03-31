import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { Tabs } from "@/components/tabs";
import { getPosts } from "@/lib/data";
import { Feed } from "./feed";
import { FeedProduction } from "./feed-production";

export default function InfiniteScrollPage() {
  const initialPosts = getPosts(1, 10);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">03 — Infinite Scroll Feed</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Scratch uses IntersectionObserver + manual state. Production uses
        TanStack Query + TanStack Virtual for virtualized scrolling.
      </p>

      <div className="mt-8">
        <Tabs
          items={[
            {
              label: "From Scratch",
              content: <Feed initialPosts={initialPosts} />,
            },
            {
              label: "With TanStack Query + Virtual",
              content: <FeedProduction />,
            },
          ]}
        />
      </div>

      <Concepts
        items={[
          "Scratch: manual useState + fetch + IntersectionObserver",
          "Production: useInfiniteQuery (caching, dedup) + useVirtualizer (DOM virtualization)",
          "Virtualization renders only visible items — handles 10k+ rows",
          "useInfiniteQuery auto-manages getNextPageParam logic",
        ]}
      />
    </main>
  );
}
