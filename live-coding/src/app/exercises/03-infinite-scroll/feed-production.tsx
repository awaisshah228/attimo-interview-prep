"use client";

import { useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Post } from "@/lib/types";

/*
 * Production: TanStack Query + TanStack Virtual + shadcn Card
 *
 * - useInfiniteQuery: paginated fetching with caching, dedup, retry
 * - useVirtualizer: renders only visible rows in the DOM
 * - shadcn Card: consistent card design across the app
 */

const PAGE_SIZE = 10;

function PostCard({ post }: { post: Post }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{post.title}</CardTitle>
        <CardDescription>by {post.author}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {post.body}
        </p>
      </CardContent>
    </Card>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} size="sm" className="animate-pulse">
          <CardHeader>
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/4 rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FeedProduction() {
  const parentRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<Post[]>({
      queryKey: ["posts"],
      queryFn: async ({ pageParam, signal }) => {
        const res = await fetch(
          `/api/posts?page=${pageParam}&limit=${PAGE_SIZE}`,
          { signal }
        );
        return res.json();
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    });

  const allPosts = data?.pages.flat() ?? [];

  const virtualizer = useVirtualizer({
    count: hasNextPage ? allPosts.length + 1 : allPosts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Auto-fetch when approaching end
  if (virtualItems.length > 0) {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (
      lastItem &&
      lastItem.index >= allPosts.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }

  if (isLoading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div
        ref={parentRef}
        className="h-150 overflow-auto rounded-lg"
        style={{ contain: "strict" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((row) => {
            const post = allPosts[row.index];
            return (
              <div
                key={row.index}
                ref={virtualizer.measureElement}
                data-index={row.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${row.start}px)`,
                }}
              >
                <div className="pb-4">
                  {post ? <PostCard post={post} /> : <Skeleton />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!hasNextPage && allPosts.length > 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          End of feed
        </p>
      )}

      <Card size="sm">
        <CardFooter className="flex-col items-start gap-1">
          <p className="text-xs font-medium text-foreground">Libraries</p>
          <p className="text-xs text-muted-foreground">
            <strong>TanStack Query</strong> — useInfiniteQuery with caching
            &bull; <strong>TanStack Virtual</strong> — renders only visible DOM
            nodes &bull; <strong>shadcn Card</strong> — consistent post layout
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
