"use client";

import type { Post } from "@/lib/types";

export function FeedCard({ post }: { post: Post }) {
  return (
    <article className="rounded-lg border border-zinc-800 p-5">
      <h2 className="text-lg font-semibold text-zinc-100">{post.title}</h2>
      <p className="mt-1 text-xs text-zinc-500">by {post.author}</p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{post.body}</p>
    </article>
  );
}
