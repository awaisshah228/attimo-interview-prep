import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { Tabs } from "@/components/tabs";
import { getTodos } from "./actions";
import { AddForm } from "./add-form";
import { TodoList } from "./todo-list";
import { TodoProduction } from "./todo-production";

export default async function TodoPage() {
  const todos = await getTodos();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">02 — Todo App</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Full CRUD with optimistic UI. Scratch uses Server Actions +
        useOptimistic. Production uses Zustand + react-hook-form + Zod.
      </p>

      <div className="mt-8">
        <Tabs
          items={[
            {
              label: "From Scratch",
              content: (
                <div className="space-y-6">
                  <AddForm />
                  <TodoList todos={todos} />
                </div>
              ),
            },
            {
              label: "With Zustand + RHF + Zod",
              content: <TodoProduction />,
            },
          ]}
        />
      </div>

      <Concepts
        items={[
          "Scratch: Server Actions, useOptimistic, revalidatePath, progressive enhancement",
          "Production: Zustand (global state), react-hook-form (perf), Zod (validation)",
          "Zustand — no Context boilerplate, selector-based re-renders",
          "react-hook-form — uncontrolled inputs = fewer re-renders",
        ]}
      />
    </main>
  );
}
