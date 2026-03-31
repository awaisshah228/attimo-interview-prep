"use client";

import { useRef } from "react";
import { addTodo } from "./actions";

export function AddForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addTodo(formData);
        formRef.current?.reset();
      }}
      className="flex gap-2"
    >
      <input
        name="title"
        placeholder="What needs to be done?"
        required
        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Add
      </button>
    </form>
  );
}
