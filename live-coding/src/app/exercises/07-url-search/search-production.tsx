"use client";

import { useQueryState, parseAsString } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import type { Post } from "@/lib/types";

/*
 * Production: nuqs + TanStack Query + shadcn/ui
 *
 * - nuqs: type-safe URL state with built-in throttle, shallow routing
 * - TanStack Query: cached search with stale-while-revalidate
 * - shadcn: Input, Card for consistent design
 */
export function SearchProduction() {
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      throttleMs: 300,
    })
  );

  const { data: results = [], isLoading } = useQuery<Post[]>({
    queryKey: ["search-posts", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      await new Promise((r) => setTimeout(r, 400));
      const res = await fetch(`/api/posts?page=1&limit=100`);
      const posts: Post[] = await res.json();
      const q = query.toLowerCase();
      return posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q)
      );
    },
    enabled: query.trim().length > 0,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value || null)}
          placeholder="Search posts..."
        />
        {isLoading && (
          <div className="absolute right-3 top-2 text-xs text-muted-foreground">
            ...
          </div>
        )}
      </div>

      {!query.trim() && (
        <p className="py-8 text-center text-muted-foreground">
          Type to search posts...
        </p>
      )}

      {query.trim() && !isLoading && results.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No results for &quot;{query}&quot;
        </p>
      )}

      {results.length > 0 && (
        <ul className="space-y-3">
          {results.slice(0, 20).map((post) => (
            <li key={post.id}>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>by {post.author}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
          {results.length > 20 && (
            <p className="text-center text-sm text-muted-foreground">
              Showing 20 of {results.length} results
            </p>
          )}
        </ul>
      )}

      <Card size="sm">
        <CardFooter className="flex-col items-start gap-1">
          <p className="text-xs font-medium text-foreground">Libraries</p>
          <p className="text-xs text-muted-foreground">
            <strong>nuqs</strong> — type-safe URL state with built-in throttle
            &bull; <strong>TanStack Query</strong> — cached search &bull;{" "}
            <strong>shadcn/ui</strong> — Input, Card
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
