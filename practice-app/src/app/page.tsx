import Link from "next/link";

const sections = [
  {
    title: "Hooks",
    items: [
      { name: "useState", href: "/hooks/use-state", desc: "State management, functional updates, stale closures" },
      { name: "useEffect", href: "/hooks/use-effect", desc: "Side effects, cleanup, dependency arrays" },
      { name: "useRef", href: "/hooks/use-ref", desc: "DOM access, mutable values, render counting" },
      { name: "useMemo", href: "/hooks/use-memo", desc: "Expensive computations, referential equality" },
      { name: "useCallback", href: "/hooks/use-callback", desc: "Stable function references, React.memo" },
      { name: "useReducer", href: "/hooks/use-reducer", desc: "Complex state, actions, dispatch" },
      { name: "useTransition", href: "/hooks/use-transition", desc: "Non-urgent updates, isPending" },
      { name: "useContext", href: "/hooks/use-context", desc: "Theme provider, consuming context" },
      { name: "Custom Hooks", href: "/hooks/custom-hooks", desc: "useLocalStorage, useDebounce, useMediaQuery" },
    ],
  },
  {
    title: "Patterns",
    items: [
      { name: "Server Components", href: "/patterns/server-components", desc: "Data fetching on the server" },
      { name: "Client Components", href: "/patterns/client-components", desc: "'use client' boundary" },
      { name: "Suspense", href: "/patterns/suspense", desc: "Loading states, streaming" },
      { name: "Context vs Zustand", href: "/patterns/context-vs-zustand", desc: "When to use which" },
    ],
  },
  {
    title: "Full-Stack",
    items: [
      { name: "File Upload", href: "/practice/file-upload", desc: "XHR vs Fetch vs Axios progress, drag-drop, multi-file, preview" },
    ],
  },
];

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">React & Next.js Practice</h1>
      <p className="text-zinc-400 mb-10">
        Interactive examples for every hook and pattern. Edit the code, break things, learn.
      </p>

      {sections.map((section) => (
        <div key={section.title} className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-zinc-300">{section.title}</h2>
          <div className="grid gap-3">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 hover:bg-zinc-900/50 transition-colors"
              >
                <div className="font-mono text-sm text-blue-400">{item.name}</div>
                <div className="text-sm text-zinc-400 mt-1">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
