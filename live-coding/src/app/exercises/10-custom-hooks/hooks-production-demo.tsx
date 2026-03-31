"use client";

import { useRef, useState } from "react";
import {
  useDebounceValue,
  useLocalStorage,
  useOnClickOutside,
  useMediaQuery,
  useIntersectionObserver,
} from "usehooks-ts";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/*
 * Production: usehooks-ts + TanStack Query + shadcn/ui
 *
 * - usehooks-ts: 40+ battle-tested, typed hooks
 * - TanStack Query: replaces useFetch with caching, retry, dedup
 * - shadcn: consistent Card, Input, Button, Badge
 */

function HookCard({
  title,
  library,
  children,
}: {
  title: string;
  library: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="outline" className="text-[10px] font-normal">
            {library}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ── useDebounceValue ──
export function HookDebounceProd() {
  const [input, setInput] = useState("");
  const [debounced] = useDebounceValue(input, 300);

  return (
    <HookCard title="useDebounceValue" library="usehooks-ts">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type something..."
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Raw: &quot;{input}&quot; | Debounced: &quot;{debounced}&quot;
      </p>
    </HookCard>
  );
}

// ── useLocalStorage ──
export function HookLocalStorageProd() {
  const [count, setCount] = useLocalStorage("prod-counter", 0);

  return (
    <HookCard title="useLocalStorage" library="usehooks-ts">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setCount((c) => c - 1)}>
          -
        </Button>
        <span className="text-lg font-bold tabular-nums">{count}</span>
        <Button variant="outline" size="sm" onClick={() => setCount((c) => c + 1)}>
          +
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Persisted to localStorage. Refresh — value survives.
      </p>
    </HookCard>
  );
}

// ── useOnClickOutside ──
export function HookClickOutsideProd() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref as React.RefObject<HTMLElement>, () => setIsOpen(false));

  return (
    <HookCard title="useOnClickOutside" library="usehooks-ts">
      <Button size="sm" onClick={() => setIsOpen(true)}>
        Open dropdown
      </Button>
      {isOpen && (
        <div ref={ref} className="mt-2 rounded-lg border bg-popover p-3 text-sm">
          Click outside to close.
        </div>
      )}
    </HookCard>
  );
}

// ── useMediaQuery ──
export function HookMediaQueryProd() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  return (
    <HookCard title="useMediaQuery" library="usehooks-ts">
      <div className="space-y-1 text-sm">
        <p>
          Mobile (&lt;640px):{" "}
          <Badge variant={isMobile ? "default" : "secondary"}>
            {String(isMobile)}
          </Badge>
        </p>
        <p>
          Prefers dark:{" "}
          <Badge variant={prefersDark ? "default" : "secondary"}>
            {String(prefersDark)}
          </Badge>
        </p>
      </div>
    </HookCard>
  );
}

// ── useQuery (replaces useFetch) ──
export function HookFetchProd() {
  const [url, setUrl] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["fetch-demo", url],
    queryFn: async ({ signal }) => {
      const res = await fetch(url!, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!url,
  });

  return (
    <HookCard title="useQuery" library="TanStack Query">
      <Button size="sm" onClick={() => setUrl("/api/search?q=react")}>
        Fetch &quot;react&quot; suggestions
      </Button>
      {isLoading && <p className="mt-2 text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="mt-2 text-sm text-destructive">{(error as Error).message}</p>}
      {data && (
        <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-muted p-2 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </HookCard>
  );
}

// ── useIntersectionObserver ──
export function HookIntersectionProd() {
  const { ref, isIntersecting: isVisible } = useIntersectionObserver({
    threshold: 0.5,
  });

  return (
    <HookCard title="useIntersectionObserver" library="usehooks-ts">
      <p className="text-xs text-muted-foreground">Scroll the box into view:</p>
      <div className="mt-2 h-24 overflow-auto rounded border">
        <div className="h-32" />
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn(
            "mx-4 h-12 rounded transition-colors",
            isVisible ? "bg-primary" : "bg-muted"
          )}
        />
        <p className="p-2 text-center text-xs text-muted-foreground">
          {isVisible ? "Visible!" : "Scroll down..."}
        </p>
        <div className="h-32" />
      </div>
    </HookCard>
  );
}
