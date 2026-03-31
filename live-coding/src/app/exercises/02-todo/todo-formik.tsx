"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { create } from "zustand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/*
 * Formik + Yup + Zustand + shadcn/ui
 *
 * Formik vs react-hook-form:
 * - Formik uses controlled inputs (re-renders on every keystroke)
 * - RHF uses uncontrolled inputs (fewer re-renders, better perf)
 * - Formik has simpler mental model: values/errors/touched in one object
 * - Formik <Field> auto-connects to form state by name
 * - Yup is the traditional Formik validator (vs Zod for RHF)
 *
 * When to pick Formik:
 * - Team already knows Formik
 * - Simple forms where re-render perf doesn't matter
 * - You prefer declarative <Field>/<ErrorMessage> components
 */

const todoSchema = Yup.object({
  title: Yup.string()
    .required("Title is required")
    .max(100, "Too long (max 100 chars)"),
});

type Todo = { id: string; title: string; completed: boolean };

type TodoStore = {
  todos: Todo[];
  add: (title: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
};

const useTodoStore = create<TodoStore>((set) => ({
  todos: [
    { id: "1", title: "Learn Formik for form management", completed: true },
    { id: "2", title: "Compare Formik vs react-hook-form", completed: false },
    { id: "3", title: "Use Yup for schema validation", completed: false },
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

function AddFormFormik() {
  const add = useTodoStore((s) => s.add);

  return (
    <Formik
      initialValues={{ title: "" }}
      validationSchema={todoSchema}
      onSubmit={(values, { resetForm }) => {
        add(values.title);
        resetForm();
      }}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-2">
          <div className="flex gap-2">
            <Field
              name="title"
              as={Input}
              placeholder="What needs to be done?"
            />
            <Button type="submit" disabled={isSubmitting}>
              Add
            </Button>
          </div>
          <ErrorMessage
            name="title"
            component="p"
            className="text-sm text-destructive"
          />
        </Form>
      )}
    </Formik>
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

export function TodoFormik() {
  const todos = useTodoStore((s) => s.todos);

  return (
    <div className="space-y-6">
      <AddFormFormik />

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
            <strong>Formik</strong> — controlled inputs, declarative
            Field/ErrorMessage &bull; <strong>Yup</strong> — schema validation
            (traditional Formik pair) &bull; <strong>Zustand</strong> — state
            &bull; <strong>shadcn/ui</strong> — Button, Input, Card
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
