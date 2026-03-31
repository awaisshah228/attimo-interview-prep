"use client";

import { useState, useRef } from "react";
import { SortableItem } from "./sortable-item";

type Item = { id: string; label: string };

const INITIAL_ITEMS: Item[] = [
  { id: "1", label: "Learn React fundamentals" },
  { id: "2", label: "Build a Next.js app" },
  { id: "3", label: "Add TypeScript" },
  { id: "4", label: "Style with Tailwind" },
  { id: "5", label: "Deploy to Vercel" },
  { id: "6", label: "Write tests" },
];

export function SortableList() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  };

  const handleDrop = () => {
    if (dragIndex === null || dragOverIndex.current === null) return;

    const updated = [...items];
    const [dragged] = updated.splice(dragIndex, 1);
    updated.splice(dragOverIndex.current, 0, dragged);
    setItems(updated);

    setDragIndex(null);
    dragOverIndex.current = null;
  };

  const reset = () => {
    setItems(INITIAL_ITEMS);
    setDragIndex(null);
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.map((item, index) => (
          <SortableItem
            key={item.id}
            label={item.label}
            index={index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragging={dragIndex === index}
          />
        ))}
      </ul>

      <div className="flex items-center justify-between text-sm text-zinc-500">
        <p>Current order: {items.map((i) => i.id).join(", ")}</p>
        <button onClick={reset} className="text-blue-400 hover:underline">
          Reset
        </button>
      </div>
    </div>
  );
}
