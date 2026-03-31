"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Post } from "@/lib/types";
import { FeedCard } from "./feed-card";
import { FeedSkeleton } from "./feed-skeleton";

export function Feed({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    const nextPage = page + 1;
    const res = await fetch(`/api/posts?page=${nextPage}&limit=10`);
    const newPosts: Post[] = await res.json();

    if (newPosts.length === 0) {
      setHasMore(false);
    } else {
      setPosts((prev) => [...prev, ...newPosts]);
      setPage(nextPage);
    }
    setIsLoading(false);
  }, [page, isLoading, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}

      {/* Sentinel — triggers loadMore when scrolled into view */}
      <div ref={sentinelRef} className="h-4" />

      {isLoading && <FeedSkeleton />}
      {!hasMore && (
        <p className="py-4 text-center text-sm text-zinc-500">
          No more posts to load
        </p>
      )}
    </div>
  );
}
