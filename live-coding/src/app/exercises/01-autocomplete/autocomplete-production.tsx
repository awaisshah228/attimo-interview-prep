"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "usehooks-ts";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter } from "@/components/ui/card";
import type { Suggestion } from "@/lib/types";

/*
 * Production: cmdk (via shadcn Command) + TanStack Query
 *
 * What the libraries handle for you:
 * - cmdk: keyboard nav, ARIA combobox, focus management, item highlighting
 * - shadcn Command: styled wrapper with search icon, empty state, groups
 * - TanStack Query: caching, dedup, stale-while-revalidate, auto abort
 */
export function AutocompleteProduction() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounceValue(query, 300);
  const [selected, setSelected] = useState<Suggestion | null>(null);

  const { data: results = [], isLoading } = useQuery<Suggestion[]>({
    queryKey: ["search", debouncedQuery],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
        signal,
      });
      return res.json();
    },
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-4">
      <Command shouldFilter={false} className="rounded-lg border shadow-sm">
        <CommandInput
          value={query}
          onValueChange={(v) => {
            setQuery(v);
            setSelected(null);
          }}
          placeholder="Search technologies..."
        />

        {query.trim() && (
          <CommandList>
            {isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}

            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup>
              {results.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => {
                    setSelected(item);
                    setQuery(item.label);
                  }}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>

      {selected && (
        <p className="text-sm text-muted-foreground">
          Selected: <Badge variant="secondary">{selected.label}</Badge>
        </p>
      )}

      <Card size="sm">
        <CardFooter className="flex-col items-start gap-1">
          <p className="text-xs font-medium text-foreground">Libraries</p>
          <p className="text-xs text-muted-foreground">
            <strong>shadcn Command</strong> (cmdk) — keyboard nav, ARIA,
            filtering &bull; <strong>TanStack Query</strong> — caching, dedup,
            auto AbortController
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
