"use client";

import { useOptimistic, useTransition } from "react";
import { toggleTodo, deleteTodo } from "./actions";
import { TodoItem } from "./todo-item";
import type { Todo } from "@/lib/types";

type OptimisticAction = { id: string; action: "toggle" | "delete" };

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state: Todo[], update: OptimisticAction) => {
      if (update.action === "delete") {
        return state.filter((t) => t.id !== update.id);
      }
      return state.map((t) =>
        t.id === update.id ? { ...t, completed: !t.completed } : t
      );
    }
  );

  const [, startTransition] = useTransition();

  const handleToggle = (id: string) => {
    startTransition(() => {
      addOptimistic({ id, action: "toggle" });
      toggleTodo(id);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      addOptimistic({ id, action: "delete" });
      deleteTodo(id);
    });
  };

  if (optimisticTodos.length === 0) {
    return (
      <p className="py-8 text-center text-zinc-500">
        No todos yet. Add one above!
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {optimisticTodos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </ul>
  );
}
