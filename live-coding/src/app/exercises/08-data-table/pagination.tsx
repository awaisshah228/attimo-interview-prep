"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function Pagination({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const searchParams = useSearchParams();

  const pageLink = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/exercises/08-data-table?${params.toString()}`;
  };

  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-zinc-500">
        Page {current} of {total}
      </p>
      <div className="flex gap-2">
        {current > 1 && (
          <Link
            href={pageLink(current - 1)}
            className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Prev
          </Link>
        )}
        {current < total && (
          <Link
            href={pageLink(current + 1)}
            className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
