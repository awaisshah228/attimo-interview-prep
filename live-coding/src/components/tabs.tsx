"use client";

import { useState } from "react";

export function Tabs({
  items,
}: {
  items: { label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex gap-1 border-b border-zinc-800">
        {items.map((item, i) => (
          <button
            key={item.label}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              i === active
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-6">{items[active].content}</div>
    </div>
  );
}
