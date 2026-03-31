"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { create } from "zustand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/*
 * Production: Zustand + react-hook-form + Zod + shadcn/ui
 *
 * - Zustand: global state without Context boilerplate, selector re-renders
 * - react-hook-form: uncontrolled inputs, minimal re-renders
 * - Zod: declarative schema validation with TS inference
 * - shadcn: Button, Input, Card for consistent design tokens
 */

const todoSchema = z.object({
  title: z.string().min(1, "Required").max(100, "Too long"),
});

type TodoInput = z.infer<typeof todoSchema>;
type Todo = { id: string; title: string; completed: boolean };

type TodoStore = {
  todos: Todo[];
  add: (title: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
};

const useTodoStore = create<TodoStore>((set) => ({
  todos: [
    { id: "1", title: "Learn Zustand for state management", completed: true },
    { id: "2", title: "Use react-hook-form + zod", completed: false },
    { id: "3", title: "Compare with scratch version", completed: false },
  ],
  add: (title) =>
    set((s) => ({
      todos: [...s.todos, { id: crypto.randomUUID(), title, completed: false }],
    })),
  toggle: (id) =>
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    })),
  remove: (id) =>
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
}));

function AddForm() {
  const add = useTodoStore((s) => s.add);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoInput>({ resolver: zodResolver(todoSchema) });

  return (
    <form onSubmit={handleSubmit((d) => { add(d.title); reset(); })} className="space-y-2">
      <div className="flex gap-2">
        <Input {...register("title")} placeholder="What needs to be done?" />
        <Button type="submit">Add</Button>
      </div>
      {errors.title && (
        <p className="text-sm text-destructive">{errors.title.message}</p>
      )}
    </form>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  const toggle = useTodoStore((s) => s.toggle);
  const remove = useTodoStore((s) => s.remove);

  return (
    <li className="flex items-center justify-between rounded-lg border bg-card p-3">
      <button
        onClick={() => toggle(todo.id)}
        className="flex items-center gap-3 text-left"
      >
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded border text-xs",
            todo.completed
              ? "border-primary bg-primary/10 text-primary"
              : "border-input"
          )}
        >
          {todo.completed && "✓"}
        </span>
        <span
          className={cn(
            "text-sm",
            todo.completed
              ? "text-muted-foreground line-through"
              : "text-foreground"
          )}
        >
          {todo.title}
        </span>
      </button>
      <Button variant="destructive" size="sm" onClick={() => remove(todo.id)}>
        Delete
      </Button>
    </li>
  );
}

export function TodoProduction() {
  const todos = useTodoStore((s) => s.todos);

  return (
    <div className="space-y-6">
      <AddForm />

      {todos.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No todos yet. Add one above!
        </p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      )}

      <Card size="sm">
        <CardFooter className="flex-col items-start gap-1">
          <p className="text-xs font-medium text-foreground">Libraries</p>
          <p className="text-xs text-muted-foreground">
            <strong>Zustand</strong> — global state, selector re-renders &bull;{" "}
            <strong>react-hook-form</strong> — uncontrolled inputs &bull;{" "}
            <strong>Zod</strong> — schema validation &bull;{" "}
            <strong>shadcn/ui</strong> — Button, Input, Card
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
