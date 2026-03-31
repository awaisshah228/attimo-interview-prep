import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { Tabs } from "@/components/tabs";
import { getTodos } from "./actions";
import { AddForm } from "./add-form";
import { TodoList } from "./todo-list";
import { TodoProduction } from "./todo-production";
import { TodoFormik } from "./todo-formik";

export default async function TodoPage() {
  const todos = await getTodos();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">02 — Todo App</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Full CRUD with optimistic UI. Three versions: from scratch, RHF + Zod,
        and Formik + Yup.
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
              label: "RHF + Zod",
              content: <TodoProduction />,
            },
            {
              label: "Formik + Yup",
              content: <TodoFormik />,
            },
          ]}
        />
      </div>

      <Concepts
        items={[
          "Scratch: Server Actions, useOptimistic, revalidatePath",
          "RHF + Zod: uncontrolled inputs (fewer re-renders), schema inference",
          "Formik + Yup: controlled inputs, declarative <Field>/<ErrorMessage>",
          "Formik re-renders on every keystroke — RHF doesn't",
          "Yup is the traditional Formik validator, Zod pairs with RHF",
        ]}
      />
    </main>
  );
}
