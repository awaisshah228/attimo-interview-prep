"use client";

import { useRef } from "react";
import { useIntersectionObserver } from "@/lib/hooks";

export function HookIntersectionDemo() {
  const boxRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(boxRef, { threshold: 0.5 });

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <h3 className="font-mono text-sm text-blue-400">
        useIntersectionObserver
      </h3>
      <p className="mt-1 text-xs text-zinc-500">
        Detects when an element enters the viewport. Scroll the box below in and
        out of view.
      </p>
      <div className="mt-3 h-24 overflow-auto rounded border border-zinc-700">
        <div className="h-20" />
        <div
          ref={boxRef}
          className={`mx-auto h-12 w-3/4 rounded transition-colors ${
            isVisible ? "bg-green-500" : "bg-zinc-700"
          }`}
        />
        <div className="h-20" />
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        Box is:{" "}
        <span className={isVisible ? "text-green-400" : "text-zinc-500"}>
          {isVisible ? "visible" : "not visible"}
        </span>
      </p>
    </div>
  );
}
