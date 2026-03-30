# Next.js 14+ (App Router)

## What It Is
Next.js is a React framework that provides file-system routing, server-side rendering, static generation, and a full-stack development experience out of the box.

---

## App Router (Next.js 13+)

The modern routing system based on the file system inside the `app/` directory.

### File Conventions

```
app/
├── layout.tsx          → Root layout (wraps all pages)
├── page.tsx            → Home page (/)
├── loading.tsx         → Loading UI (automatic Suspense boundary)
├── error.tsx           → Error boundary
├── not-found.tsx       → 404 page
├── dashboard/
│   ├── layout.tsx      → Dashboard layout (nested)
│   ├── page.tsx        → /dashboard
│   └── settings/
│       └── page.tsx    → /dashboard/settings
├── blog/
│   └── [slug]/
│       └── page.tsx    → /blog/hello-world (dynamic segment)
├── docs/
│   └── [...slug]/
│       └── page.tsx    → /docs/a/b/c (catch-all)
└── api/
    └── users/
        └── route.ts    → API route handler (GET, POST, etc.)
```

### Dynamic Segments

| Pattern | Example URL | Params |
|---------|-------------|--------|
| `[id]` | `/blog/123` | `{ id: '123' }` |
| `[...slug]` | `/docs/a/b/c` | `{ slug: ['a','b','c'] }` |
| `[[...slug]]` | `/docs` or `/docs/a/b` | `{ slug: undefined }` or `{ slug: ['a','b'] }` |

### Layouts
Shared UI that wraps child routes. They persist across navigation (don't re-render).

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

---

## Rendering Strategies

### SSR (Server-Side Rendering)
Page rendered on every request. Default for dynamic Server Components.

```tsx
// Server Component — fetches on every request
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store'  // opt out of caching
  });
  return <div>{data}</div>;
}
```

### SSG (Static Site Generation)
Page pre-rendered at build time.

```tsx
// Generate static pages for known params
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map(post => ({ slug: post.slug }));
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  return <article>{post.content}</article>;
}
```

### ISR (Incremental Static Regeneration)
Static pages that revalidate after a time period.

```tsx
// Revalidate every 60 seconds
export const revalidate = 60;

export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}
```

### Streaming
Progressive rendering using Suspense boundaries.

```tsx
export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />  {/* Streams in when ready */}
      </Suspense>
    </div>
  );
}
```

---

## Server Actions

Functions that run on the server, callable directly from client components. Used for **data mutations**.

```tsx
// app/actions.ts
'use server';

export async function createTodo(formData: FormData) {
  const title = formData.get('title') as string;
  await db.todo.create({ data: { title } });
  revalidatePath('/todos');
}
```

```tsx
// app/todos/page.tsx
import { createTodo } from '../actions';

export default function TodoPage() {
  return (
    <form action={createTodo}>
      <input name="title" />
      <button type="submit">Add</button>
    </form>
  );
}
```

---

## Route Handlers (API Routes)

For building REST APIs, webhooks, and public endpoints.

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

---

## Middleware

Runs **before** a request is processed. Used for auth checks, redirects, rewrites.

```tsx
// middleware.ts (at project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session');
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

---

## Data Fetching Patterns

| Pattern | When to Use |
|---------|------------|
| Server Component `fetch()` | Default — data needed at render time |
| Server Action | Mutations (create, update, delete) |
| Route Handler | Public APIs, webhooks, non-React clients |
| Client-side (TanStack Query) | Polling, real-time, user-triggered fetches |

### Cache & Revalidation

```tsx
// Cache indefinitely (default for GET)
fetch('https://api.example.com/data');

// Revalidate every 60 seconds
fetch('https://api.example.com/data', { next: { revalidate: 60 } });

// No caching
fetch('https://api.example.com/data', { cache: 'no-store' });

// On-demand revalidation
import { revalidatePath, revalidateTag } from 'next/cache';
revalidatePath('/blog');
revalidateTag('posts');
```

---

## Key Terms

- **App Router**: File-system routing in the `app/` directory (modern)
- **Pages Router**: Older routing in `pages/` directory (legacy)
- **RSC**: React Server Components
- **Streaming**: Progressive rendering via Suspense
- **ISR**: Incremental Static Regeneration — static pages that update
- **SSR**: Server-Side Rendering — rendered on each request
- **SSG**: Static Site Generation — rendered at build time
- **Middleware**: Code that runs before request handling
- **Server Actions**: Server functions callable from components (`'use server'`)
- **Route Handlers**: API endpoints defined in `route.ts` files
- **`revalidatePath`**: Invalidate cached data for a specific path
- **`revalidateTag`**: Invalidate cached data by tag
- **Parallel Routes**: Render multiple pages in the same layout simultaneously
- **Intercepting Routes**: Show a route in a modal/overlay while keeping URL context

---

## Common Interview Questions

1. **When would you use a Server Action vs a Route Handler?**
   - Server Action: form submissions, in-app mutations (tighter integration with React)
   - Route Handler: public API, webhooks, consumed by non-React clients

2. **What's the difference between SSR, SSG, and ISR?**
   - SSG: built once at build time
   - ISR: built once, then revalidates on a schedule
   - SSR: built on every request

3. **How does the App Router differ from the Pages Router?**
   - App Router: layouts, Server Components by default, streaming, nested routing
   - Pages Router: `getServerSideProps`/`getStaticProps`, client components by default

4. **How do you handle loading and error states?**
   - `loading.tsx` for automatic Suspense boundaries
   - `error.tsx` for error boundaries
   - Both are file conventions in the App Router
