"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function SearchFilter({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultValue);
  const [, startTransition] = useTransition();

  const handleChange = (value: string) => {
    setQuery(value);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("search", value);
      else params.delete("search");
      params.delete("page"); // reset to page 1
      router.push(`/exercises/08-data-table?${params.toString()}`);
    });
  };

  return (
    <input
      value={query}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Filter by name, email, or role..."
      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500"
    />
  );
}
