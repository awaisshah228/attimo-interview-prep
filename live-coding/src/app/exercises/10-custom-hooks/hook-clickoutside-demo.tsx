"use client";

import { useState, useRef } from "react";
import { useClickOutside } from "@/lib/hooks";

export function HookClickOutsideDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <h3 className="font-mono text-sm text-blue-400">useClickOutside</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Closes the dropdown when clicking anywhere outside it.
      </p>
      <div className="relative mt-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
        >
          {isOpen ? "Close" : "Open"} Dropdown
        </button>
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-10 mt-2 w-48 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl"
          >
            <p className="text-sm text-zinc-300">
              Click outside this box to close it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
