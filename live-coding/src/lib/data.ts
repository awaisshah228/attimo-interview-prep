import type { Post, User, Suggestion, Photo } from "./types";

// ── Suggestions (Autocomplete) ──
const ALL_SUGGESTIONS: Suggestion[] = [
  "React", "Next.js", "TypeScript", "Tailwind CSS", "Zustand",
  "TanStack Query", "Prisma", "PostgreSQL", "Redis", "Docker",
  "GraphQL", "REST API", "WebSocket", "Server Components", "Server Actions",
  "Suspense", "Streaming", "ISR", "SSR", "SSG",
  "Middleware", "Route Handlers", "Edge Functions", "Vercel", "Turbopack",
  "Framer Motion", "Radix UI", "shadcn/ui", "Playwright", "Vitest",
].map((label, i) => ({ id: String(i + 1), label }));

export function searchSuggestions(query: string): Suggestion[] {
  const q = query.toLowerCase();
  return ALL_SUGGESTIONS.filter((s) => s.label.toLowerCase().includes(q));
}

// ── Posts (Infinite Scroll) ──
const POSTS: Post[] = Array.from({ length: 100 }, (_, i) => ({
  id: String(i + 1),
  title: `Post #${i + 1}: ${["Building with Next.js", "React Performance Tips", "TypeScript Best Practices", "CSS Grid Mastery", "API Design Patterns"][i % 5]}`,
  body: `This is the content of post ${i + 1}. It covers important topics about modern web development, including best practices, patterns, and real-world examples that you can apply to your projects.`,
  author: ["Alice Chen", "Bob Smith", "Carol Wu", "Dan Lee", "Eve Park"][i % 5],
  createdAt: new Date(2024, 0, 1 + i).toISOString(),
}));

export function getPosts(page: number, limit: number): Post[] {
  const start = (page - 1) * limit;
  return POSTS.slice(start, start + limit);
}

// ── Users (Data Table) ──
const USERS: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  name: [
    "Alice Chen", "Bob Smith", "Carol Wu", "Dan Lee", "Eve Park",
    "Frank Zhao", "Grace Kim", "Hank Brown", "Iris Liu", "Jake Ross",
  ][i % 10],
  email: `user${i + 1}@example.com`,
  role: (["admin", "editor", "viewer"] as const)[i % 3],
  createdAt: new Date(2024, 0, 1 + i * 3).toISOString(),
}));

export function getUsers(opts: {
  page: number;
  limit: number;
  sort: string;
  dir: "asc" | "desc";
  search: string;
}): { users: User[]; total: number } {
  let filtered = USERS;

  if (opts.search) {
    const q = opts.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }

  const sorted = [...filtered].sort((a, b) => {
    const field = opts.sort as keyof User;
    const av = a[field] ?? "";
    const bv = b[field] ?? "";
    const cmp = String(av).localeCompare(String(bv));
    return opts.dir === "asc" ? cmp : -cmp;
  });

  const start = (opts.page - 1) * opts.limit;
  return {
    users: sorted.slice(start, start + opts.limit),
    total: filtered.length,
  };
}

// ── Photos (Modal) ──
const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6",
  "#a855f7", "#6366f1",
];

export const PHOTOS: Photo[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  title: `Photo ${i + 1}`,
  color: COLORS[i % COLORS.length],
}));

export function getPhoto(id: string): Photo | undefined {
  return PHOTOS.find((p) => p.id === id);
}
