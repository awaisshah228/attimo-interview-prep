"use server";

import { revalidatePath } from "next/cache";
import type { Todo } from "@/lib/types";

// In-memory store (replace with DB in real app)
let todos: Todo[] = [
  { id: "1", title: "Learn Server Actions", completed: true },
  { id: "2", title: "Build a todo app in 30 min", completed: false },
  { id: "3", title: "Practice useOptimistic", completed: false },
];

export async function getTodos(): Promise<Todo[]> {
  return todos;
}

export async function addTodo(formData: FormData) {
  const title = formData.get("title") as string;
  if (!title?.trim()) return;

  todos.push({
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
  });
  revalidatePath("/exercises/02-todo");
}

export async function toggleTodo(id: string) {
  const todo = todos.find((t) => t.id === id);
  if (todo) todo.completed = !todo.completed;
  revalidatePath("/exercises/02-todo");
}

export async function deleteTodo(id: string) {
  todos = todos.filter((t) => t.id !== id);
  revalidatePath("/exercises/02-todo");
}
