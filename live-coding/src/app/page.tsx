import Link from "next/link";

const exercises = [
  {
    id: "01",
    name: "Autocomplete / Typeahead",
    href: "/exercises/01-autocomplete",
    desc: "Debounce, AbortController, keyboard nav, ARIA combobox",
    time: "30-40 min",
    difficulty: "Medium",
    library: "cmdk + TanStack Query",
  },
  {
    id: "02",
    name: "Todo App with Server Actions",
    href: "/exercises/02-todo",
    desc: "CRUD, useOptimistic, revalidatePath, progressive enhancement",
    time: "25-35 min",
    difficulty: "Medium",
    library: "Zustand + RHF + Zod",
  },
  {
    id: "03",
    name: "Infinite Scroll Feed",
    href: "/exercises/03-infinite-scroll",
    desc: "IntersectionObserver, Server/Client split, skeleton loading",
    time: "30-40 min",
    difficulty: "Medium",
    library: "TanStack Query + Virtual",
  },
  {
    id: "04",
    name: "Multi-Step Form",
    href: "/exercises/04-multi-step-form",
    desc: "Per-step validation, progress bar, centralized state",
    time: "30-40 min",
    difficulty: "Medium",
    library: "RHF + Zod + Framer Motion",
  },
  {
    id: "05",
    name: "Drag-and-Drop Sortable List",
    href: "/exercises/05-drag-and-drop",
    desc: "Native HTML DnD API, useRef for drag indices, splice reorder",
    time: "35-45 min",
    difficulty: "Hard",
    library: "@dnd-kit",
  },
  {
    id: "06",
    name: "Modal with Intercepting Routes",
    href: "/exercises/06-modal-routes",
    desc: "Parallel routes, (.) interception, @modal slot, full-page fallback",
    time: "20-25 min",
    difficulty: "Medium",
    library: "Radix Dialog",
  },
  {
    id: "07",
    name: "Real-Time Search with URL State",
    href: "/exercises/07-url-search",
    desc: "searchParams as source of truth, Suspense streaming, useTransition",
    time: "20-30 min",
    difficulty: "Easy",
    library: "nuqs + TanStack Query",
  },
  {
    id: "08",
    name: "Data Table (Sort, Filter, Paginate)",
    href: "/exercises/08-data-table",
    desc: "URL-driven state, Server Component data fetching, sortable headers",
    time: "35-45 min",
    difficulty: "Medium",
    library: "TanStack Table",
  },
  {
    id: "09",
    name: "Theme Switcher (Dark/Light)",
    href: "/exercises/09-theme-switcher",
    desc: "CSS variables, localStorage, hydration safety, system preference",
    time: "10-15 min",
    difficulty: "Easy",
    library: "next-themes",
  },
  {
    id: "10",
    name: "Custom Hooks from Scratch",
    href: "/exercises/10-custom-hooks",
    desc: "useDebounce, useLocalStorage, useClickOutside, useFetch, and more",
    time: "20-30 min",
    difficulty: "Easy-Medium",
    library: "usehooks-ts + TanStack Query",
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-green-400",
  "Easy-Medium": "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Live Coding Practice</h1>
      <p className="mt-2 text-zinc-400">
        10 interactive exercises for frontend live coding interviews. Next.js 16,
        React 19, Tailwind 4. Each exercise has{" "}
        <strong className="text-zinc-200">two versions</strong>: from scratch +
        production (with popular libraries).
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
          From Scratch
        </span>
        <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-400">
          + Production Libraries
        </span>
      </div>

      <div className="mt-8 space-y-3">
        {exercises.map((ex) => (
          <Link
            key={ex.id}
            href={ex.href}
            className="group flex items-start gap-4 rounded-lg border border-zinc-800 p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-900/50"
          >
            <span className="font-mono text-sm text-zinc-600 group-hover:text-zinc-400">
              {ex.id}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-200">{ex.name}</span>
                {ex.library && (
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                    + {ex.library}
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-zinc-500">{ex.desc}</div>
            </div>
            <div className="flex flex-col items-end gap-1 text-xs">
              <span className="text-zinc-500">{ex.time}</span>
              <span className={DIFFICULTY_COLORS[ex.difficulty] ?? "text-zinc-400"}>
                {ex.difficulty}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold">How to Practice</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
          <li>Pick an exercise — each has tabs for &quot;From Scratch&quot; and &quot;Production&quot;</li>
          <li>
            Study the scratch version, then delete it and rebuild under a timer
          </li>
          <li>Study the production version to learn the library APIs</li>
          <li>Focus on: component decomposition, edge cases, accessibility</li>
          <li>Target: build each one in the listed time range</li>
        </ol>
      </div>

      <div className="mt-8 rounded-lg border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold">Libraries Used</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
          <div><strong className="text-zinc-300">cmdk</strong> — Command palette</div>
          <div><strong className="text-zinc-300">@tanstack/react-query</strong> — Data fetching</div>
          <div><strong className="text-zinc-300">@tanstack/react-virtual</strong> — Virtualization</div>
          <div><strong className="text-zinc-300">@tanstack/react-table</strong> — Headless tables</div>
          <div><strong className="text-zinc-300">zustand</strong> — State management</div>
          <div><strong className="text-zinc-300">react-hook-form</strong> — Performant forms</div>
          <div><strong className="text-zinc-300">zod</strong> — Schema validation</div>
          <div><strong className="text-zinc-300">framer-motion</strong> — Animations</div>
          <div><strong className="text-zinc-300">@dnd-kit</strong> — Drag and drop</div>
          <div><strong className="text-zinc-300">@radix-ui/react-dialog</strong> — Accessible modal</div>
          <div><strong className="text-zinc-300">nuqs</strong> — Type-safe URL state</div>
          <div><strong className="text-zinc-300">next-themes</strong> — Theme switching</div>
          <div><strong className="text-zinc-300">usehooks-ts</strong> — Custom hooks library</div>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold">Project Structure</h2>
        <pre className="mt-3 overflow-x-auto text-xs text-zinc-400">
{`src/
├── app/
│   ├── exercises/
│   │   ├── 01-autocomplete/     # scratch + cmdk + TanStack Query
│   │   ├── 02-todo/             # scratch + Zustand + RHF + Zod
│   │   ├── 03-infinite-scroll/  # scratch + TanStack Query + Virtual
│   │   ├── 04-multi-step-form/  # scratch + RHF + Zod + Framer Motion
│   │   ├── 05-drag-and-drop/    # scratch + @dnd-kit
│   │   ├── 06-modal-routes/     # scratch + Radix Dialog
│   │   ├── 07-url-search/       # scratch + nuqs + TanStack Query
│   │   ├── 08-data-table/       # scratch + TanStack Table
│   │   ├── 09-theme-switcher/   # scratch + next-themes
│   │   └── 10-custom-hooks/     # scratch + usehooks-ts + TanStack Query
│   ├── api/search/              # mock search endpoint
│   └── api/posts/               # mock posts endpoint
├── components/                  # tabs, back-link, concepts, providers
└── lib/                         # types, data, hooks`}
        </pre>
      </div>
    </main>
  );
}
