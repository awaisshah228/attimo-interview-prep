"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type { Suggestion } from "@/lib/types";

export function Autocomplete() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions from API
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: Suggestion[]) => {
        setResults(data);
        setIsOpen(data.length > 0);
        setActiveIndex(-1);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const option = listRef.current.children[activeIndex] as HTMLElement;
      option?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const select = useCallback((item: Suggestion) => {
    setSelected(item);
    setQuery(item.label);
    setIsOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          if (activeIndex >= 0 && results[activeIndex]) {
            select(results[activeIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [activeIndex, results, select]
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="suggestion-list"
          aria-activedescendant={
            activeIndex >= 0 ? `option-${activeIndex}` : undefined
          }
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search technologies..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500"
        />

        {isLoading && (
          <div className="absolute right-4 top-3.5 text-sm text-zinc-500">
            ...
          </div>
        )}

        {isOpen && (
          <ul
            ref={listRef}
            id="suggestion-list"
            role="listbox"
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl"
          >
            {results.map((item, index) => (
              <li
                key={item.id}
                id={`option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`cursor-pointer px-4 py-2.5 text-sm ${
                  index === activeIndex
                    ? "bg-blue-600 text-white"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(item)}
              >
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <p className="text-sm text-green-400">
          Selected: <strong>{selected.label}</strong>
        </p>
      )}
    </div>
  );
}
