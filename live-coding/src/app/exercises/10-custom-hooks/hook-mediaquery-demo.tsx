"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

export function HookMediaQueryDemo() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
  const isDesktop = useMediaQuery("(min-width: 1025px)");
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  const queries = [
    { label: "Mobile (≤640px)", active: isMobile },
    { label: "Tablet (641-1024px)", active: isTablet },
    { label: "Desktop (≥1025px)", active: isDesktop },
    { label: "Prefers dark mode", active: prefersDark },
  ];

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <h3 className="font-mono text-sm text-blue-400">useMediaQuery</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Reacts to CSS media queries. Resize your browser to see changes.
      </p>
      <div className="mt-3 space-y-1">
        {queries.map((q) => (
          <div key={q.label} className="flex items-center gap-2 text-sm">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                q.active ? "bg-green-400" : "bg-zinc-700"
              }`}
            />
            <span className={q.active ? "text-zinc-200" : "text-zinc-500"}>
              {q.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
