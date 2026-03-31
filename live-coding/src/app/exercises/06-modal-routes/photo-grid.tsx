"use client";

import Link from "next/link";
import type { Photo } from "@/lib/types";

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {photos.map((photo) => (
        <Link
          key={photo.id}
          href={`/exercises/06-modal-routes/photos/${photo.id}`}
          className="group relative aspect-square overflow-hidden rounded-lg"
        >
          <div
            className="h-full w-full transition-transform group-hover:scale-105"
            style={{ backgroundColor: photo.color }}
          />
          <span className="absolute bottom-2 left-2 text-xs font-medium text-white/80">
            {photo.title}
          </span>
        </Link>
      ))}
    </div>
  );
}
