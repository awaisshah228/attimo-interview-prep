# TanStack Query (React Query)

## What It Is
TanStack Query is a server-state management library. It handles fetching, caching, synchronizing, and updating data from APIs. It replaces manual `useEffect` + `useState` for data fetching. Works with any data fetching library — Fetch, Axios, GraphQL clients, etc.

---

## Table of Contents
1. [Setup (with Axios)](#setup-with-axios)
2. [Axios API Client](#axios-api-client-the-foundation)
3. [useQuery — Fetching Data](#usequery--fetching-data)
4. [Query Keys](#query-keys)
5. [useMutation — Changing Data](#usemutation--changing-data)
6. [Cache Invalidation](#cache-invalidation)
7. [Optimistic Updates](#optimistic-updates)
8. [Pagination](#pagination)
9. [Infinite Scroll](#infinite-scroll)
10. [Dependent Queries](#dependent-queries)
11. [Parallel Queries](#parallel-queries)
12. [Prefetching](#prefetching)
13. [Polling (refetchInterval)](#polling-refetchinterval)
14. [Select & Transform Data](#select--transform-data)
15. [Error Handling (Axios + React Query)](#error-handling-axios--react-query)
16. [Retry Configuration](#retry-configuration)
17. [Axios Interceptors + React Query](#axios-interceptors--react-query)
18. [Custom Query Hooks Pattern](#custom-query-hooks-pattern)
19. [Full CRUD Example (Axios + React Query)](#full-crud-example)
20. [React Query + Zustand (When to Combine)](#react-query--zustand)
21. [DevTools](#devtools)
22. [Key Terms](#key-terms)
23. [Common Interview Questions](#common-interview-questions)

---

## Setup (with Axios)

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools axios
```

### Provider Setup

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,        // 1 minute — don't refetch if fresh
            gcTime: 5 * 60 * 1000,       // 5 minutes — keep in cache
            retry: 2,                     // Retry failed requests twice
            refetchOnWindowFocus: false,  // Don't refetch when tab regains focus
          },
          mutations: {
            retry: 0,                     // Don't retry mutations
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Axios API Client (The Foundation)

Create a configured Axios instance that all queries use.

```tsx
// lib/api.ts
import axios from 'axios';

// ─── Create configured instance ───
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: attach auth token ───
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle errors globally ───
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Extract error message
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    return Promise.reject(new Error(message));
  }
);
```

### Type-Safe API Functions

```tsx
// lib/api/users.ts
import { api } from '@/lib/api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// ─── API functions (Axios) ───
export const usersApi = {
  list: (params?: { page?: number; search?: string; role?: string }) =>
    api.get<PaginatedResponse<User>>('/users', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: CreateUserInput) =>
    api.post<User>('/users', data).then((r) => r.data),

  update: (id: string, data: UpdateUserInput) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/users/${id}`).then((r) => r.data),

  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<{ url: string }>(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};
```

```tsx
// lib/api/projects.ts
import { api } from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export const projectsApi = {
  list: (params?: { status?: string; search?: string }) =>
    api.get<Project[]>('/projects', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string }) =>
    api.post<Project>('/projects', data).then((r) => r.data),

  update: (id: string, data: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/projects/${id}`),
};
```

---

## useQuery — Fetching Data

### With Axios

```tsx
import { useQuery } from '@tanstack/react-query';
import { usersApi, User } from '@/lib/api/users';

function UserList() {
  const {
    data,          // The resolved data (User[])
    isLoading,     // First load (no cached data)
    isFetching,    // Any fetch (including background refetch)
    isError,       // Request failed
    error,         // The error object
    isSuccess,     // Request succeeded
    refetch,       // Manually trigger refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div>
      {isFetching && <p className="text-sm text-gray-400">Refreshing...</p>}
      <ul>
        {data?.data.map((user) => (
          <li key={user.id}>{user.name} — {user.email}</li>
        ))}
      </ul>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### With Parameters

```tsx
function UsersByRole({ role }: { role: string }) {
  const { data } = useQuery({
    queryKey: ['users', { role }],  // Cache key includes the filter
    queryFn: () => usersApi.list({ role }),
    enabled: !!role,                // Don't fetch if role is empty
  });

  return <div>{data?.data.map(u => <div key={u.id}>{u.name}</div>)}</div>;
}
```

### Single Item

```tsx
function UserDetail({ userId }: { userId: string }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getById(userId),
    enabled: !!userId,  // Don't fetch if no ID
  });

  if (isLoading) return <Spinner />;
  return <div>{user?.name}</div>;
}
```

---

## Query Keys

The cache key uniquely identifies data and determines when to refetch.

```tsx
// Simple — all users
queryKey: ['users']

// With parameters — refetches when role changes
queryKey: ['users', { role: 'admin' }]

// With ID — specific user
queryKey: ['user', userId]

// Nested — user's projects
queryKey: ['users', userId, 'projects']

// With pagination
queryKey: ['users', { page: 1, search: 'alice', role: 'admin' }]
```

**Rule**: If any value in the key changes, React Query fetches fresh data.

### Query Key Factory (Best Practice)

```tsx
// lib/query-keys.ts — centralize all keys
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.projects.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
  },
};

// Usage
useQuery({ queryKey: queryKeys.users.list({ role: 'admin' }), queryFn: ... });
useQuery({ queryKey: queryKeys.users.detail(userId), queryFn: ... });

// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

// Invalidate only user lists (not details)
queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
```

---

## useMutation — Changing Data

### With Axios

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, CreateUserInput } from '@/lib/api/users';

function CreateUserForm() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: (data: CreateUserInput) => usersApi.create(data),

    onSuccess: (newUser) => {
      // Option 1: Invalidate — refetches the list from server
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Option 2: Update cache directly (no extra request)
      // queryClient.setQueryData(['users'], (old) => ({
      //   ...old,
      //   data: [newUser, ...old.data],
      // }));

      toast.success('User created!');
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createUser.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: 'member',
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
      {createUser.isError && (
        <p className="text-red-500">{createUser.error.message}</p>
      )}
    </form>
  );
}
```

### Delete with Confirmation

```tsx
function DeleteButton({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const deleteUser = useMutation({
    mutationFn: () => usersApi.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <button
      onClick={() => {
        if (confirm('Delete this user?')) {
          deleteUser.mutate();
        }
      }}
      disabled={deleteUser.isPending}
      className="text-red-500"
    >
      {deleteUser.isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

---

## Cache Invalidation

```tsx
const queryClient = useQueryClient();

// Invalidate one specific query
queryClient.invalidateQueries({ queryKey: ['users'] });

// Invalidate by prefix (all user-related queries)
queryClient.invalidateQueries({ queryKey: ['users'] }); // Matches ['users'], ['users', {role}], etc.

// Invalidate exact match only
queryClient.invalidateQueries({ queryKey: ['users', { role: 'admin' }], exact: true });

// Invalidate everything
queryClient.invalidateQueries();

// Manually set cache data (no refetch)
queryClient.setQueryData(['user', userId], updatedUser);

// Remove from cache entirely
queryClient.removeQueries({ queryKey: ['user', userId] });
```

---

## Optimistic Updates

Update the UI immediately before the server confirms. Roll back on failure.

```tsx
function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      usersApi.update(id, data),

    onMutate: async ({ id, data }) => {
      // 1. Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['users'] });
      await queryClient.cancelQueries({ queryKey: ['user', id] });

      // 2. Snapshot the previous value
      const previousUsers = queryClient.getQueryData(['users']);
      const previousUser = queryClient.getQueryData(['user', id]);

      // 3. Optimistically update the cache
      queryClient.setQueryData(['users'], (old: any) => ({
        ...old,
        data: old.data.map((u: User) =>
          u.id === id ? { ...u, ...data } : u
        ),
      }));
      queryClient.setQueryData(['user', id], (old: User) => ({
        ...old,
        ...data,
      }));

      // 4. Return context for rollback
      return { previousUsers, previousUser };
    },

    onError: (_err, { id }, context) => {
      // Roll back both caches
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(['user', id], context.previousUser);
      }
      toast.error('Update failed — changes reverted');
    },

    onSettled: (_data, _err, { id }) => {
      // Always refetch after mutation to sync with server
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

// Usage
function UserRow({ user }: { user: User }) {
  const updateUser = useUpdateUser();

  return (
    <button
      onClick={() => updateUser.mutate({ id: user.id, data: { role: 'admin' } })}
      disabled={updateUser.isPending}
    >
      Make Admin
    </button>
  );
}
```

---

## Pagination

```tsx
function UserListPaginated() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['users', { page, search }],
    queryFn: () => usersApi.list({ page, search }),
    placeholderData: keepPreviousData, // Show old data while fetching new page
  });

  return (
    <div>
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search users..."
      />

      <div style={{ opacity: isPlaceholderData ? 0.5 : 1, transition: 'opacity 200ms' }}>
        {isLoading ? (
          <Spinner />
        ) : (
          data?.data.map((user) => <UserRow key={user.id} user={user} />)
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page} of {data?.totalPages}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isPlaceholderData || !data?.hasMore}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## Infinite Scroll

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

function InfiniteUserList() {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam }) =>
      api.get('/users', { params: { cursor: pageParam, limit: 20 } }).then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  // Auto-fetch when scrolled to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <Spinner />;

  return (
    <div>
      {data?.pages.map((page) =>
        page.data.map((user: User) => (
          <UserRow key={user.id} user={user} />
        ))
      )}

      {/* Invisible trigger element */}
      <div ref={ref} className="h-4" />

      {isFetchingNextPage && <Spinner />}
      {!hasNextPage && <p className="text-gray-500">No more users</p>}
    </div>
  );
}
```

---

## Dependent Queries

Fetch data that depends on another query's result.

```tsx
// First: get the current user
const { data: user } = useQuery({
  queryKey: ['me'],
  queryFn: () => api.get('/auth/me').then(r => r.data),
});

// Then: get their projects (only when user is loaded)
const { data: projects } = useQuery({
  queryKey: ['projects', user?.id],
  queryFn: () => projectsApi.list({ userId: user!.id }),
  enabled: !!user?.id,  // Only runs when user is available
});
```

---

## Parallel Queries

Multiple independent queries at once.

```tsx
function Dashboard() {
  // These all fire simultaneously
  const users = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.list() });
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api.get('/stats').then(r => r.data) });

  const isLoading = users.isLoading || projects.isLoading || stats.isLoading;

  if (isLoading) return <Spinner />;

  return (
    <div>
      <StatCard label="Users" value={users.data?.total} />
      <StatCard label="Projects" value={projects.data?.length} />
      <StatCard label="Revenue" value={stats.data?.revenue} />
    </div>
  );
}
```

---

## Prefetching

Load data before the user navigates (on hover, on mount, etc.).

```tsx
function UserList() {
  const queryClient = useQueryClient();

  // Prefetch user detail on hover
  function handleHover(userId: string) {
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => usersApi.getById(userId),
      staleTime: 60 * 1000, // Don't refetch if less than 1 min old
    });
  }

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id} onMouseEnter={() => handleHover(user.id)}>
          <Link href={`/users/${user.id}`}>{user.name}</Link>
        </li>
      ))}
    </ul>
  );
}
```

---

## Polling (refetchInterval)

```tsx
// Poll every 5 seconds
const { data } = useQuery({
  queryKey: ['notifications'],
  queryFn: () => api.get('/notifications').then(r => r.data),
  refetchInterval: 5000,

  // Only poll when the tab is focused
  refetchIntervalInBackground: false,
});

// Conditional polling — stop when condition is met
const { data: jobStatus } = useQuery({
  queryKey: ['job', jobId],
  queryFn: () => api.get(`/jobs/${jobId}`).then(r => r.data),
  refetchInterval: (query) => {
    // Stop polling once the job is done
    return query.state.data?.status === 'completed' ? false : 2000;
  },
});
```

---

## Select & Transform Data

Transform server response before components see it.

```tsx
// Only extract what you need — components won't re-render if untouched fields change
const { data: userNames } = useQuery({
  queryKey: ['users'],
  queryFn: () => usersApi.list(),
  select: (data) => data.data.map((u) => u.name), // string[]
});

// Computed value
const { data: adminCount } = useQuery({
  queryKey: ['users'],
  queryFn: () => usersApi.list(),
  select: (data) => data.data.filter((u) => u.role === 'admin').length,
});
```

---

## Error Handling (Axios + React Query)

### Per-Query Error Handling

```tsx
const { data, error, isError } = useQuery({
  queryKey: ['users'],
  queryFn: () => usersApi.list(),
  // React Query automatically retries — see retry config below
});

if (isError) {
  // error.message is already extracted by the Axios interceptor
  return <ErrorBanner message={error.message} />;
}
```

### Global Error Handler

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry 4xx errors (they'll fail again)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2; // Retry 5xx up to 2 times
      },
    },
    mutations: {
      onError: (error) => {
        // Global toast for all mutation errors
        toast.error(error.message);
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show toast for queries that have already had data
      // (background refetch failures, not first-load failures)
      if (query.state.data !== undefined) {
        toast.error(`Background refresh failed: ${error.message}`);
      }
    },
  }),
});
```

---

## Retry Configuration

```tsx
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: () => usersApi.list(),

  // Retry config
  retry: 3,                     // Retry 3 times
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  // 1s → 2s → 4s → capped at 30s

  // Smart retry: don't retry 404s
  retry: (failureCount, error: any) => {
    if (error?.response?.status === 404) return false;
    return failureCount < 3;
  },
});
```

---

## Axios Interceptors + React Query

### Token Refresh on 401

```tsx
// lib/api.ts
let isRefreshing = false;
let failedQueue: { resolve: Function; reject: Function }[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken: localStorage.getItem('refreshToken'),
        });

        localStorage.setItem('token', data.token);
        api.defaults.headers.common.Authorization = `Bearer ${data.token}`;

        // Retry all queued requests
        failedQueue.forEach(({ resolve }) => resolve(data.token));
        failedQueue = [];

        return api(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

### Request/Response Logging

```tsx
api.interceptors.request.use((config) => {
  console.log(`→ ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`← ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`✗ ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);
```

---

## Custom Query Hooks Pattern

**Best practice**: Wrap every query in a custom hook. Components never call `useQuery` directly.

```tsx
// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, User, CreateUserInput, UpdateUserInput } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';

// ─── List ───
export function useUsers(filters?: { page?: number; search?: string; role?: string }) {
  return useQuery({
    queryKey: queryKeys.users.list(filters || {}),
    queryFn: () => usersApi.list(filters),
  });
}

// ─── Detail ───
export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

// ─── Create ───
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

// ─── Update ───
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      usersApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
}

// ─── Delete ───
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
```

### Usage in Components (Clean!)

```tsx
// app/users/page.tsx
'use client';

import { useUsers, useDeleteUser } from '@/hooks/useUsers';

export default function UsersPage() {
  const { data, isLoading } = useUsers({ page: 1 });
  const deleteUser = useDeleteUser();

  if (isLoading) return <Spinner />;

  return (
    <ul>
      {data?.data.map((user) => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => deleteUser.mutate(user.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

---

## Full CRUD Example

```tsx
// app/projects/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, Project } from '@/lib/api/projects';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  // ─── READ ───
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  // ─── CREATE ───
  const createProject = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  // ─── UPDATE ───
  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingId(null);
    },
  });

  // ─── DELETE (optimistic) ───
  const deleteProject = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previous = queryClient.getQueryData<Project[]>(['projects']);
      queryClient.setQueryData(['projects'], (old: Project[]) =>
        old.filter((p) => p.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['projects'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Projects</h1>

      {/* Create form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          createProject.mutate({ name: fd.get('name') as string });
          e.currentTarget.reset();
        }}
      >
        <input name="name" placeholder="New project name" required />
        <button disabled={createProject.isPending}>
          {createProject.isPending ? 'Creating...' : 'Create'}
        </button>
      </form>

      {/* List */}
      {projects?.map((project) => (
        <div key={project.id} className="flex items-center gap-2 p-2 border-b">
          {editingId === project.id ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                updateProject.mutate({
                  id: project.id,
                  data: { name: fd.get('name') as string },
                });
              }}
              className="flex gap-2"
            >
              <input name="name" defaultValue={project.name} />
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
            </form>
          ) : (
            <>
              <span className="flex-1">{project.name}</span>
              <button onClick={() => setEditingId(project.id)}>Edit</button>
              <button
                onClick={() => deleteProject.mutate(project.id)}
                className="text-red-500"
              >
                Delete
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## React Query + Zustand

### When to Combine

| State Type | Use |
|-----------|-----|
| Server data (API responses) | **TanStack Query** |
| Global UI (sidebar, modals, theme) | **Zustand** |
| Auth state (current user) | **Zustand** (persisted) OR React Query |
| Form state | **useState** or React Hook Form |
| Derived from server data | **TanStack Query `select`** |

### Example: Auth + React Query

```tsx
// Zustand: stores auth tokens
const useAuthStore = create(persist((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  logout: () => set({ token: null }),
}), { name: 'auth' }));

// React Query: fetches current user using the token
function useCurrentUser() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
    enabled: !!token,  // Only fetch when logged in
  });
}
```

---

## DevTools

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In your provider
<ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
```

DevTools show:
- All active queries and their status (fresh/stale/fetching/inactive)
- Cache contents
- Query timelines
- Manual refetch/invalidate/remove

---

## Key Terms

- **Query key**: Array that uniquely identifies cached data
- **staleTime**: How long data is considered fresh (won't refetch)
- **gcTime**: How long unused data stays in cache (garbage collection time)
- **Invalidation**: Marking cached data as stale, triggering refetch
- **Optimistic update**: Update UI before server confirms, rollback on failure
- **Placeholder data**: Show previous page data while loading next page
- **Infinite query**: Paginated data loaded incrementally (infinite scroll)
- **Mutation**: Operation that changes server data (POST, PUT, PATCH, DELETE)
- **`keepPreviousData`**: Show old data during page transitions
- **`enabled`**: Conditionally run a query (dependent queries)
- **`select`**: Transform data before it reaches the component
- **`refetchInterval`**: Poll the server on a timer
- **Prefetching**: Load data before the user navigates to it
- **Query key factory**: Centralized object defining all cache keys
- **Axios interceptor**: Middleware that runs on every request/response
- **Token refresh**: Re-authenticate when access token expires, queue pending requests

---

## Common Interview Questions

1. **When should you use TanStack Query vs Zustand?**
   - TanStack Query: server state (API data, caching, syncing). Zustand: client state (UI state, preferences). Never store API data in Zustand.

2. **How do you handle optimistic updates?**
   - `onMutate`: cancel queries → snapshot cache → update cache optimistically. `onError`: rollback to snapshot. `onSettled`: invalidate to sync with server truth.

3. **What's the difference between staleTime and gcTime?**
   - `staleTime`: data is fresh, don't refetch even if component remounts. `gcTime`: data is in memory, don't garbage collect even if no component uses it.

4. **How do you prevent waterfall requests?**
   - Prefetch with `queryClient.prefetchQuery()`. Use parallel queries (multiple `useQuery` in one component). Avoid unnecessary dependent queries.

5. **Why wrap queries in custom hooks?**
   - Centralizes query keys, cache configuration, and error handling. Components stay clean. Easy to find all places a query is used. Can add business logic (permission checks, transforms).

6. **How does React Query work with Axios?**
   - Axios is just the data fetching library — `queryFn` calls Axios. React Query handles caching, retries, deduplication, background refetches. Axios interceptors handle auth tokens and error transformation.

7. **How do you handle auth token refresh with React Query?**
   - Axios interceptor catches 401 → refreshes token → retries failed request → queues concurrent requests during refresh. React Query's retry mechanism handles the rest.

8. **What's the query key factory pattern?**
   - Centralized object defining all cache keys as arrays. Makes invalidation precise (invalidate all users vs just user lists vs specific user). Prevents typos in keys across the app.

9. **How do you implement infinite scroll?**
   - `useInfiniteQuery` + Intersection Observer. `getNextPageParam` extracts the cursor. Auto-fetch when sentinel element is in view. Data is an array of pages.

10. **How do you test components that use React Query?**
    - Wrap in `QueryClientProvider` with a fresh `QueryClient`. Mock Axios or use MSW to mock API responses. Set `retry: false` in tests to fail fast.
