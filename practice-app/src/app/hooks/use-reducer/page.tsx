"use client";

import { useReducer } from "react";
import Link from "next/link";

// ─── Types ───
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface State {
  todos: Todo[];
  filter: "all" | "active" | "completed";
  nextId: number;
}

type Action =
  | { type: "ADD_TODO"; text: string }
  | { type: "TOGGLE_TODO"; id: number }
  | { type: "DELETE_TODO"; id: number }
  | { type: "SET_FILTER"; filter: State["filter"] }
  | { type: "CLEAR_COMPLETED" };

// ─── Reducer (pure function, no side effects) ───
function todoReducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TODO":
      return {
        ...state,
        todos: [...state.todos, { id: state.nextId, text: action.text, done: false }],
        nextId: state.nextId + 1,
      };
    case "TOGGLE_TODO":
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t
        ),
      };
    case "DELETE_TODO":
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.id),
      };
    case "SET_FILTER":
      return { ...state, filter: action.filter };
    case "CLEAR_COMPLETED":
      return {
        ...state,
        todos: state.todos.filter((t) => !t.done),
      };
    default:
      return state;
  }
}

const initialState: State = {
  todos: [
    { id: 1, text: "Learn useReducer", done: false },
    { id: 2, text: "Build a todo app", done: false },
    { id: 3, text: "Understand actions & dispatch", done: true },
  ],
  filter: "all",
  nextId: 4,
};

export default function UseReducerPage() {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  const filteredTodos = state.todos.filter((t) => {
    if (state.filter === "active") return !t.done;
    if (state.filter === "completed") return t.done;
    return true;
  });

  const activeCount = state.todos.filter((t) => !t.done).length;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("todo") as HTMLInputElement;
    if (input.value.trim()) {
      dispatch({ type: "ADD_TODO", text: input.value.trim() });
      input.value = "";
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">useReducer</h1>
      <p className="text-zinc-400 mb-8">
        Like useState but for complex state with multiple actions. State transitions are
        centralized in a pure reducer function.
      </p>

      <div className="border border-zinc-800 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Todo App (Full useReducer Example)</h3>

        {/* Add form */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            name="todo"
            placeholder="What needs to be done?"
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm flex-1"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-500"
          >
            Add
          </button>
        </form>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => dispatch({ type: "SET_FILTER", filter: f })}
              className={`px-3 py-1.5 rounded text-sm capitalize ${
                state.filter === f
                  ? "bg-blue-600"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Todo list */}
        <div className="space-y-1 mb-4">
          {filteredTodos.length === 0 ? (
            <div className="text-zinc-500 text-sm text-center py-4">No todos</div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 bg-zinc-900 rounded px-3 py-2"
              >
                <button
                  onClick={() => dispatch({ type: "TOGGLE_TODO", id: todo.id })}
                  className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                    todo.done
                      ? "bg-green-600 border-green-600"
                      : "border-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {todo.done && "✓"}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    todo.done ? "line-through text-zinc-500" : ""
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => dispatch({ type: "DELETE_TODO", id: todo.id })}
                  className="text-red-400 hover:text-red-300 text-xs px-2"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-sm text-zinc-400">
          <span>{activeCount} items left</span>
          <button
            onClick={() => dispatch({ type: "CLEAR_COMPLETED" })}
            className="text-zinc-500 hover:text-zinc-300 text-xs"
          >
            Clear completed
          </button>
        </div>

        {/* Action log */}
        <div className="mt-4 bg-zinc-900/50 rounded p-3">
          <div className="text-xs text-zinc-500 mb-2">Current state:</div>
          <pre className="text-xs font-mono text-green-400 overflow-auto max-h-32">
            {JSON.stringify(state, null, 2)}
          </pre>
        </div>
      </div>

      {/* When to use */}
      <div className="mt-6 border border-zinc-800 rounded-lg p-4">
        <h3 className="font-semibold mb-3">useState vs useReducer</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-blue-400 font-mono mb-2">useState</div>
            <ul className="text-zinc-400 space-y-1 text-xs">
              <li>• Simple values (string, number)</li>
              <li>• 1-3 state variables</li>
              <li>• Independent updates</li>
            </ul>
          </div>
          <div>
            <div className="text-green-400 font-mono mb-2">useReducer</div>
            <ul className="text-zinc-400 space-y-1 text-xs">
              <li>• Complex objects</li>
              <li>• Many related state fields</li>
              <li>• State transitions depend on each other</li>
              <li>• Centralized update logic</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
