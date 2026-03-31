# Frontend Live Coding Test — Next.js Focus

A practical guide to the most common live coding challenges in frontend interviews, with Next.js App Router patterns, React 19 hooks, and real code you can build in 30-45 minutes.

---

## Table of Contents

1. [Autocomplete / Typeahead](#1-autocomplete--typeahead)
2. [Todo App with Server Actions](#2-todo-app-with-server-actions)
3. [Infinite Scroll Feed](#3-infinite-scroll-feed)
4. [Multi-Step Form](#4-multi-step-form)
5. [Drag-and-Drop Sortable List](#5-drag-and-drop-sortable-list)
6. [Modal with Intercepting Routes](#6-modal-with-intercepting-routes)
7. [Real-Time Search with URL State](#7-real-time-search-with-url-state)
8. [Data Table with Sort, Filter, Paginate](#8-data-table-with-sort-filter-paginate)
9. [Theme Switcher (Dark/Light)](#9-theme-switcher-darklight)
10. [Implement Custom Hooks from Scratch](#10-implement-custom-hooks-from-scratch)
11. [JavaScript Fundamentals (Warmup Round)](#11-javascript-fundamentals-warmup-round)
12. [What Interviewers Actually Evaluate](#12-what-interviewers-actually-evaluate)
13. [Common Gotchas & Quick Answers](#13-common-gotchas--quick-answers)

---

## 1. Autocomplete / Typeahead

**Why it's asked:** Tests debouncing, API integration, keyboard navigation, accessibility, and state management all in one component.

**Time target:** 30-40 min

### Requirements
- Text input that fetches suggestions as user types
- Debounce API calls (300ms)
- Keyboard navigation (Arrow Up/Down, Enter, Escape)
- Loading and empty states
- Accessible (ARIA roles: `combobox`, `listbox`, `option`)

### Key Code

```tsx
// components/autocomplete.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type Suggestion = { id: string; label: string };

export function Autocomplete({ onSelect }: { onSelect: (item: Suggestion) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setResults(data);
        setIsOpen(data.length > 0);
        setActiveIndex(-1);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          if (activeIndex >= 0 && results[activeIndex]) {
            onSelect(results[activeIndex]);
            setQuery(results[activeIndex].label);
            setIsOpen(false);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [activeIndex, results, onSelect]
  );

  return (
    <div className="relative w-full max-w-md">
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="suggestion-list"
        aria-activedescendant={activeIndex >= 0 ? `option-${activeIndex}` : undefined}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder="Search..."
        className="w-full rounded border px-3 py-2"
      />

      {isLoading && <div className="absolute right-3 top-2.5 text-sm text-gray-400">Loading...</div>}

      {isOpen && (
        <ul
          ref={listRef}
          id="suggestion-list"
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded border bg-white shadow-lg"
        >
          {results.map((item, index) => (
            <li
              key={item.id}
              id={`option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`cursor-pointer px-3 py-2 ${
                index === activeIndex ? 'bg-blue-100' : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                onSelect(item);
                setQuery(item.label);
                setIsOpen(false);
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### What to explain
- **AbortController** cancels in-flight requests when query changes — prevents race conditions
- **Debounce** avoids firing API on every keystroke
- **ARIA** roles make it screen-reader accessible
- **activeIndex** tracks keyboard focus separate from mouse hover

---

## 2. Todo App with Server Actions

**Why it's asked:** Tests full CRUD, form handling, optimistic UI, and the Server Action pattern — the bread-and-butter of Next.js App Router.

**Time target:** 25-35 min

### Key Code

```tsx
// app/todos/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

// In-memory store (replace with DB in real app)
let todos: { id: string; title: string; completed: boolean }[] = [];

export async function getTodos() {
  return todos;
}

export async function addTodo(formData: FormData) {
  const title = formData.get('title') as string;
  if (!title?.trim()) return;

  todos.push({ id: crypto.randomUUID(), title: title.trim(), completed: false });
  revalidatePath('/todos');
}

export async function toggleTodo(id: string) {
  const todo = todos.find((t) => t.id === id);
  if (todo) todo.completed = !todo.completed;
  revalidatePath('/todos');
}

export async function deleteTodo(id: string) {
  todos = todos.filter((t) => t.id !== id);
  revalidatePath('/todos');
}
```

```tsx
// app/todos/page.tsx
import { getTodos, addTodo } from './actions';
import { TodoList } from './todo-list';

export default async function TodoPage() {
  const todos = await getTodos();

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-2xl font-bold">Todos</h1>

      <form action={addTodo} className="mb-6 flex gap-2">
        <input
          name="title"
          placeholder="What needs to be done?"
          className="flex-1 rounded border px-3 py-2"
          required
        />
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Add
        </button>
      </form>

      <TodoList todos={todos} />
    </div>
  );
}
```

```tsx
// app/todos/todo-list.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { toggleTodo, deleteTodo } from './actions';

type Todo = { id: string; title: string; completed: boolean };

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state: Todo[], update: { id: string; action: 'toggle' | 'delete' }) => {
      if (update.action === 'delete') return state.filter((t) => t.id !== update.id);
      return state.map((t) =>
        t.id === update.id ? { ...t, completed: !t.completed } : t
      );
    }
  );

  const [, startTransition] = useTransition();

  const handleToggle = (id: string) => {
    startTransition(() => {
      addOptimistic({ id, action: 'toggle' });
      toggleTodo(id);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      addOptimistic({ id, action: 'delete' });
      deleteTodo(id);
    });
  };

  if (optimisticTodos.length === 0) {
    return <p className="text-gray-500">No todos yet. Add one above!</p>;
  }

  return (
    <ul className="space-y-2">
      {optimisticTodos.map((todo) => (
        <li key={todo.id} className="flex items-center justify-between rounded border p-3">
          <button onClick={() => handleToggle(todo.id)} className="flex items-center gap-2">
            <span className={todo.completed ? 'line-through text-gray-400' : ''}>
              {todo.title}
            </span>
          </button>
          <button onClick={() => handleDelete(todo.id)} className="text-red-500 text-sm">
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### What to explain
- **Server Actions** handle mutations without API routes
- **`useOptimistic`** gives instant UI feedback before server confirms
- **`revalidatePath`** refreshes the Server Component data after mutation
- Form works even with JS disabled (progressive enhancement)

---

## 3. Infinite Scroll Feed

**Why it's asked:** Tests Intersection Observer, pagination, performance, and Server/Client component boundary.

**Time target:** 30-40 min

### Key Code

```tsx
// app/feed/page.tsx (Server Component — initial load)
import { getPosts } from '@/lib/data';
import { Feed } from './feed';

export default async function FeedPage() {
  const initialPosts = await getPosts({ page: 1, limit: 10 });
  return <Feed initialPosts={initialPosts} />;
}
```

```tsx
// app/feed/feed.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type Post = { id: string; title: string; body: string; author: string };

export function Feed({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    const nextPage = page + 1;
    const res = await fetch(`/api/posts?page=${nextPage}&limit=10`);
    const newPosts: Post[] = await res.json();

    if (newPosts.length === 0) {
      setHasMore(false);
    } else {
      setPosts((prev) => [...prev, ...newPosts]);
      setPage(nextPage);
    }
    setIsLoading(false);
  }, [page, isLoading, hasMore]);

  // Intersection Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' } // trigger 200px before reaching bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      {posts.map((post) => (
        <article key={post.id} className="rounded border p-4">
          <h2 className="text-lg font-semibold">{post.title}</h2>
          <p className="text-sm text-gray-500">by {post.author}</p>
          <p className="mt-2">{post.body}</p>
        </article>
      ))}

      {/* Sentinel element — triggers loadMore when visible */}
      <div ref={sentinelRef} className="h-4" />

      {isLoading && <p className="text-center text-gray-400">Loading more...</p>}
      {!hasMore && <p className="text-center text-gray-400">No more posts</p>}
    </div>
  );
}
```

### What to explain
- **Server Component** fetches initial data (SEO-friendly, fast first paint)
- **Intersection Observer** with `rootMargin` prefetches before user reaches bottom
- Guard `isLoading` prevents duplicate fetches
- Could add **virtualization** (`@tanstack/react-virtual`) for 10k+ items

---

## 4. Multi-Step Form

**Why it's asked:** Tests complex state management, validation, and form UX patterns.

**Time target:** 30-40 min

### Key Code

```tsx
'use client';

import { useState } from 'react';

type FormData = {
  name: string;
  email: string;
  company: string;
  role: string;
  plan: 'free' | 'pro' | 'enterprise';
};

const INITIAL: FormData = { name: '', email: '', company: '', role: '', plan: 'free' };

export function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const update = (fields: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...fields }));
    // Clear errors for changed fields
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(fields).forEach((k) => delete next[k as keyof FormData]);
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (step === 0) {
      if (!data.name.trim()) newErrors.name = 'Name is required';
      if (!data.email.includes('@')) newErrors.email = 'Valid email required';
    }
    if (step === 1) {
      if (!data.company.trim()) newErrors.company = 'Company is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (validate()) setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validate()) return;
    // Submit data to server action or API
    console.log('Submitting:', data);
  };

  const steps = [
    // Step 0: Personal Info
    <div key="personal" className="space-y-4">
      <h2 className="text-lg font-semibold">Personal Info</h2>
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          className="w-full rounded border px-3 py-2"
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => update({ email: e.target.value })}
          className="w-full rounded border px-3 py-2"
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>
    </div>,

    // Step 1: Company Info
    <div key="company" className="space-y-4">
      <h2 className="text-lg font-semibold">Company Info</h2>
      <div>
        <label className="block text-sm font-medium">Company</label>
        <input
          value={data.company}
          onChange={(e) => update({ company: e.target.value })}
          className="w-full rounded border px-3 py-2"
        />
        {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Role</label>
        <input
          value={data.role}
          onChange={(e) => update({ role: e.target.value })}
          className="w-full rounded border px-3 py-2"
        />
      </div>
    </div>,

    // Step 2: Plan Selection
    <div key="plan" className="space-y-4">
      <h2 className="text-lg font-semibold">Choose Plan</h2>
      {(['free', 'pro', 'enterprise'] as const).map((plan) => (
        <label key={plan} className={`block cursor-pointer rounded border p-4 ${
          data.plan === plan ? 'border-blue-500 bg-blue-50' : ''
        }`}>
          <input
            type="radio"
            name="plan"
            value={plan}
            checked={data.plan === plan}
            onChange={() => update({ plan })}
            className="mr-2"
          />
          {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </label>
      ))}
    </div>,

    // Step 3: Review
    <div key="review" className="space-y-2">
      <h2 className="text-lg font-semibold">Review</h2>
      <p><strong>Name:</strong> {data.name}</p>
      <p><strong>Email:</strong> {data.email}</p>
      <p><strong>Company:</strong> {data.company}</p>
      <p><strong>Role:</strong> {data.role || 'N/A'}</p>
      <p><strong>Plan:</strong> {data.plan}</p>
    </div>,
  ];

  return (
    <div className="mx-auto max-w-md p-6">
      {/* Progress bar */}
      <div className="mb-6 flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {steps[step]}

      <div className="mt-6 flex justify-between">
        <button
          onClick={back}
          disabled={step === 0}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button onClick={next} className="rounded bg-blue-600 px-4 py-2 text-white">
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} className="rounded bg-green-600 px-4 py-2 text-white">
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
```

### What to explain
- Per-step validation avoids overwhelming the user
- State lifted to parent — each step is just UI
- Progress bar gives visual feedback
- Could persist to `sessionStorage` to survive refreshes

---

## 5. Drag-and-Drop Sortable List

**Why it's asked:** Tests pointer event handling, DOM manipulation, and smooth UX.

**Time target:** 35-45 min (hard — often bonus points for attempt)

### Key Code (Vanilla — no library)

```tsx
'use client';

import { useState, useRef } from 'react';

type Item = { id: string; label: string };

export function SortableList({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const updated = [...items];
    const [dragged] = updated.splice(dragItem.current, 1);
    updated.splice(dragOverItem.current, 0, dragged);
    setItems(updated);

    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <ul className="mx-auto max-w-sm space-y-2 p-6">
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          className="cursor-grab rounded border bg-white p-3 shadow-sm active:cursor-grabbing"
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

### What to explain
- Uses native HTML Drag and Drop API — no dependencies
- `useRef` for drag indices avoids re-renders during drag
- Production apps use `@dnd-kit/core` for accessibility & touch support
- Could add visual indicator (gap/line) during drag

---

## 6. Modal with Intercepting Routes

**Why it's asked:** Tests understanding of Next.js parallel + intercepting routes — a unique App Router concept.

**Time target:** 20-25 min

### File Structure

```
app/
├── @modal/
│   └── (.)photos/[id]/
│       └── page.tsx          → Modal overlay (intercepted)
├── photos/[id]/
│   └── page.tsx              → Full page (direct visit)
├── layout.tsx                → Renders {children} + {modal}
└── page.tsx                  → Photo grid
```

### Key Code

```tsx
// app/layout.tsx
export default function Layout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
```

```tsx
// app/@modal/(.)photos/[id]/page.tsx — intercepted modal
'use client';

import { useRouter } from 'next/navigation';

export default function PhotoModal({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params); // Next.js 16: params is async

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => router.back()}>
      <div className="rounded-lg bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2>Photo {id}</h2>
        <img src={`/photos/${id}.jpg`} alt={`Photo ${id}`} className="max-h-96" />
        <button onClick={() => router.back()} className="mt-4 text-blue-600">
          Close
        </button>
      </div>
    </div>
  );
}
```

```tsx
// app/photos/[id]/page.tsx — full page (direct URL visit or refresh)
export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h1>Photo {id}</h1>
      <img src={`/photos/${id}.jpg`} alt={`Photo ${id}`} className="max-w-2xl" />
    </div>
  );
}
```

### What to explain
- `(.)` intercepts same-level routes — clicking a photo opens modal
- Direct URL or refresh loads the full page version
- `@modal` is a parallel route slot rendered alongside `children`
- `router.back()` dismisses the modal and restores previous URL

---

## 7. Real-Time Search with URL State

**Why it's asked:** Tests URL-driven state, debouncing, and Suspense boundaries.

**Time target:** 20-30 min

### Key Code

```tsx
// app/search/page.tsx
import { Suspense } from 'react';
import { SearchInput } from './search-input';
import { SearchResults } from './search-results';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <SearchInput defaultValue={q} />

      <Suspense key={q} fallback={<div className="mt-4 text-gray-400">Searching...</div>}>
        <SearchResults query={q} />
      </Suspense>
    </div>
  );
}
```

```tsx
// app/search/search-input.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

export function SearchInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultValue ?? '');
  const [, startTransition] = useTransition();

  // Debounced URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (query) params.set('q', query);
        else params.delete('q');
        router.push(`/search?${params.toString()}`);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, router, searchParams, startTransition]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
      className="w-full rounded border px-3 py-2 text-lg"
    />
  );
}
```

```tsx
// app/search/search-results.tsx (Server Component — streams in)
export async function SearchResults({ query }: { query?: string }) {
  if (!query) return <p className="mt-4 text-gray-400">Type to search</p>;

  const results = await fetch(`https://api.example.com/search?q=${query}`).then(r => r.json());

  if (results.length === 0) return <p className="mt-4 text-gray-400">No results found</p>;

  return (
    <ul className="mt-4 space-y-2">
      {results.map((r: { id: string; title: string }) => (
        <li key={r.id} className="rounded border p-3">{r.title}</li>
      ))}
    </ul>
  );
}
```

### What to explain
- **URL is the source of truth** — shareable, back-button works
- **`Suspense key={q}`** — changing key triggers new Suspense boundary (shows loading)
- **`useTransition`** — keeps input responsive while navigation is pending
- **Server Component** for results — data fetching happens on server

---

## 8. Data Table with Sort, Filter, Paginate

**Why it's asked:** Tests common dashboard patterns and URL-driven state.

**Time target:** 35-45 min

### Key Code

```tsx
// app/users/page.tsx
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; dir?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const sort = params.sort || 'name';
  const dir = (params.dir || 'asc') as 'asc' | 'desc';
  const search = params.search || '';

  // Fetch sorted, filtered, paginated data from server
  const { users, total } = await getUsers({ page, sort, dir, search, limit: 10 });
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="p-6">
      <SearchFilter defaultValue={search} />

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr>
            <SortableHeader field="name" current={sort} dir={dir} label="Name" />
            <SortableHeader field="email" current={sort} dir={dir} label="Email" />
            <SortableHeader field="role" current={sort} dir={dir} label="Role" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination current={page} total={totalPages} />
    </div>
  );
}
```

```tsx
// SortableHeader — client component
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function SortableHeader({ field, current, dir, label }: {
  field: string; current: string; dir: string; label: string;
}) {
  const searchParams = useSearchParams();
  const nextDir = field === current && dir === 'asc' ? 'desc' : 'asc';

  const params = new URLSearchParams(searchParams.toString());
  params.set('sort', field);
  params.set('dir', nextDir);
  params.delete('page'); // reset to page 1

  const arrow = field === current ? (dir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <th className="cursor-pointer p-2 text-left">
      <Link href={`?${params.toString()}`}>{label}{arrow}</Link>
    </th>
  );
}
```

### What to explain
- All state lives in URL — refresh, share, bookmark all work
- Server Component does the data fetching — no client-side data library needed
- Sort toggles direction on same column, resets on new column
- Pagination component builds `?page=N` links

---

## 9. Theme Switcher (Dark/Light)

**Why it's asked:** Quick exercise, tests CSS variables, `localStorage`, and hydration awareness.

**Time target:** 10-15 min

### Key Code

```tsx
'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Read from localStorage on mount (avoids hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initial = stored ?? preferred;
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <button onClick={toggle} className="rounded border px-3 py-1">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### What to explain
- Use `useEffect` to read `localStorage` — avoids hydration mismatch
- `classList.toggle('dark')` works with Tailwind's `dark:` variant
- Respects system preference as fallback (`prefers-color-scheme`)
- To prevent flash: use a `<script>` in `<head>` (blocking) to set class before paint

---

## 10. Implement Custom Hooks from Scratch

**Why it's asked:** Tests deep understanding of React primitives. Very common warmup or standalone challenge.

### useDebounce

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

### useLocalStorage

```tsx
function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch {
      return initial;
    }
  });

  const setValue = (value: T) => {
    setStored(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [stored, setValue];
}
```

### useClickOutside

```tsx
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
```

### useFetch

```tsx
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, error, isLoading };
}
```

### useMediaQuery

```tsx
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
```

### useIntersectionObserver

```tsx
function useIntersectionObserver(
  ref: React.RefObject<HTMLElement | null>,
  options?: IntersectionObserverInit
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      options
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
}
```

---

## 11. JavaScript Fundamentals (Warmup Round)

Often asked before the main coding challenge. Implement these from scratch.

### Debounce

```ts
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
```

### Throttle

```ts
function throttle<T extends (...args: any[]) => void>(fn: T, limit: number): T {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}
```

### Deep Clone

```ts
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone) as T;
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, deepClone(v)])
  ) as T;
}
```

### Flatten Array

```ts
function flatten<T>(arr: (T | T[])[]): T[] {
  const result: T[] = [];
  for (const item of arr) {
    if (Array.isArray(item)) result.push(...flatten(item));
    else result.push(item);
  }
  return result;
}
```

### Event Emitter

```ts
class EventEmitter {
  private listeners = new Map<string, Set<Function>>();

  on(event: string, fn: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.off(event, fn);
  }

  off(event: string, fn: Function) {
    this.listeners.get(event)?.delete(fn);
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((fn) => fn(...args));
  }
}
```

### Promise.all

```ts
function promiseAll<T>(promises: Promise<T>[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = new Array(promises.length);
    let remaining = promises.length;
    if (remaining === 0) return resolve([]);

    promises.forEach((p, i) => {
      Promise.resolve(p)
        .then((value) => {
          results[i] = value;
          if (--remaining === 0) resolve(results);
        })
        .catch(reject);
    });
  });
}
```

### Curry

```ts
function curry(fn: Function): Function {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) return fn(...args);
    return (...more: any[]) => curried(...args, ...more);
  };
}
```

---

## 12. What Interviewers Actually Evaluate

| Criteria | What they watch for |
|----------|-------------------|
| **Component decomposition** | Do you break into logical pieces early, or build a monolith? |
| **Server vs Client** | Do you know when to add `'use client'`? Do you default to Server Components? |
| **State placement** | URL state vs component state vs context — correct choice for the use case |
| **Edge cases** | Empty states, loading, errors, rapid user input, race conditions |
| **Accessibility** | Keyboard navigation, ARIA roles, focus management |
| **Performance awareness** | Debouncing, memoization, avoiding unnecessary re-renders |
| **TypeScript** | Are types clean and useful, not just `any` everywhere? |
| **Communication** | Do you explain your approach before coding? Do you ask clarifying questions? |
| **Trade-off awareness** | Can you explain why you chose approach A over B? |
| **Finishing** | Do you get to a working solution, even if rough, vs a perfect half-solution? |

### Pro Tips

1. **Talk through your plan first** — 2 minutes of planning > jumping straight in
2. **Start with the data model** — define your types/interfaces before UI
3. **Get it working ugly, then refine** — interviewers value working code over perfect code
4. **Name the trade-offs** — "I'd use a library in production but let me show the concept"
5. **Handle the empty state** — it shows attention to detail
6. **Ask about requirements** — "Should this work without JS?" → shows you know progressive enhancement

---

## 13. Common Gotchas & Quick Answers

### Next.js Specific

| Question | Answer |
|----------|--------|
| `params` and `searchParams` type? | They're `Promise` in Next.js 16 — must `await` them |
| When to use `'use client'`? | Only for hooks (`useState`, `useEffect`), event handlers, browser APIs |
| `'use client'` = client-only? | No — it still SSRs on the server, then hydrates on client |
| `redirect()` in try/catch? | Don't — `redirect()` throws internally, catch will swallow it |
| `cookies()` and `headers()`? | Async in Next.js 16 — must `await` |
| Server Action vs Route Handler? | Action for in-app mutations; Route Handler for public APIs, webhooks |
| What's `revalidatePath` do? | Purges cached data for that path so next request fetches fresh |
| What's `revalidateTag` do? | Purges all cached fetches tagged with that string |

### React Specific

| Question | Answer |
|----------|--------|
| Why `useRef` over `useState` for drag index? | Ref doesn't cause re-render on update |
| Why `useCallback` for event handlers? | Stable reference avoids child re-renders when passed as prop |
| When to `useMemo`? | Expensive computations; don't memoize everything |
| `useEffect` cleanup? | Return a function — runs before next effect and on unmount |
| Hydration mismatch? | Server and client render must match — use `useEffect` for browser-only values |
| `key` prop on lists? | Stable, unique ID — never use array index if list can reorder |

### Performance

| Question | Answer |
|----------|--------|
| How to prevent re-renders? | `React.memo`, `useCallback`, `useMemo`, move state down |
| What's React.lazy? | Code-split a component — loads JS only when rendered |
| What's `startTransition`? | Marks state update as non-urgent — keeps UI responsive |
| Virtual scrolling? | Render only visible items — use `@tanstack/react-virtual` for large lists |
| Image optimization? | `next/image` — auto lazy-loads, resizes, serves WebP/AVIF |
