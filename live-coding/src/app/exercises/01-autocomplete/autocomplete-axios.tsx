"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
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
 * Production (Axios): cmdk (via shadcn Command) + TanStack Query + Axios
 *
 * Same as the fetch version, but uses Axios instead:
 * - Axios auto-encodes query params (no manual encodeURIComponent)
 * - Axios auto-parses JSON (no .json() call)
 * - Axios throws on 4xx/5xx (no manual res.ok check)
 * - AbortSignal works the same — TanStack Query passes `signal`, Axios respects it
 */
export function AutocompleteAxios() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Suggestion | null>(null);

  const { data: results = [], isLoading } = useQuery<Suggestion[]>({
    queryKey: ["search", query],
    queryFn: async ({ signal }) => {
      const { data } = await axios.get<Suggestion[]>("/api/search", {
        params: { q: query },
        signal,
      });
      return data;
    },
    enabled: query.trim().length > 0,
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
            auto AbortController &bull; <strong>Axios</strong> — auto JSON
            parsing, param encoding, error handling
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
