"use client";

import { useRouter } from "next/navigation";
import type { Photo } from "@/lib/types";

export function PhotoModal({ photo }: { photo: Photo }) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => router.back()}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => router.back()}
          className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
        >
          ✕
        </button>

        <div
          className="aspect-square w-full rounded-lg"
          style={{ backgroundColor: photo.color }}
        />

        <h2 className="mt-4 text-lg font-semibold">{photo.title}</h2>
        <p className="mt-1 text-sm text-zinc-400">
          This is an intercepted modal. Press Escape, click outside, or hit the
          X to close. Direct URL visit shows the full page instead.
        </p>
      </div>
    </div>
  );
}
