"use client";

import type { Todo } from "@/lib/types";

export function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-zinc-800 p-3">
      <button
        onClick={() => onToggle(todo.id)}
        className="flex items-center gap-3 text-left"
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded border ${
            todo.completed
              ? "border-green-500 bg-green-500/20 text-green-400"
              : "border-zinc-600"
          }`}
        >
          {todo.completed && "✓"}
        </span>
        <span
          className={
            todo.completed ? "text-zinc-500 line-through" : "text-zinc-200"
          }
        >
          {todo.title}
        </span>
      </button>
      <button
        onClick={() => onDelete(todo.id)}
        className="text-sm text-red-400 hover:text-red-300"
      >
        Delete
      </button>
    </li>
  );
}
