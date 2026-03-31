"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function SortableHeader({
  field,
  current,
  dir,
  label,
}: {
  field: string;
  current: string;
  dir: string;
  label: string;
}) {
  const searchParams = useSearchParams();
  const nextDir = field === current && dir === "asc" ? "desc" : "asc";

  const params = new URLSearchParams(searchParams.toString());
  params.set("sort", field);
  params.set("dir", nextDir);
  params.delete("page");

  const arrow = field === current ? (dir === "asc" ? " ↑" : " ↓") : "";

  return (
    <th className="p-3 text-left text-sm font-medium text-zinc-400">
      <Link
        href={`/exercises/08-data-table?${params.toString()}`}
        className="hover:text-zinc-200"
      >
        {label}
        {arrow}
      </Link>
    </th>
  );
}
