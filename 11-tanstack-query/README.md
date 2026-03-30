# TanStack Query (React Query)

## What It Is
TanStack Query is a server-state management library. It handles fetching, caching, synchronizing, and updating data from APIs. It replaces manual `useEffect` + `useState` for data fetching.

---

## Core Concepts

### useQuery — Fetching Data

```tsx
import { useQuery } from '@tanstack/react-query';

function UserList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users'],              // Cache key (array)
    queryFn: () => fetch('/api/users').then(r => r.json()),
    staleTime: 5 * 60 * 1000,        // Data fresh for 5 minutes
    gcTime: 30 * 60 * 1000,          // Keep in cache for 30 minutes
  });

  if (isLoading) return <Spinner />;
  if (isError) return <Error message={error.message} />;
  return <ul>{data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

### Query Keys
The cache key determines when data is refetched.

```tsx
// Simple key
useQuery({ queryKey: ['todos'] })

// Key with parameters — refetches when id changes
useQuery({ queryKey: ['todo', id] })

// Key with filters
useQuery({ queryKey: ['todos', { status: 'active', page: 1 }] })
```

### useMutation — Changing Data

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateTodo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newTodo) => fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(newTodo),
    }).then(r => r.json()),

    onSuccess: () => {
      // Invalidate and refetch the todos list
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate({ title: 'New Todo' });
    }}>
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Adding...' : 'Add Todo'}
      </button>
    </form>
  );
}
```

---

## Cache Invalidation

```tsx
const queryClient = useQueryClient();

// Invalidate one query
queryClient.invalidateQueries({ queryKey: ['todos'] });

// Invalidate all queries starting with 'todos'
queryClient.invalidateQueries({ queryKey: ['todos'], exact: false });

// Invalidate everything
queryClient.invalidateQueries();

// Manually set cache data
queryClient.setQueryData(['todo', id], updatedTodo);
```

---

## Optimistic Updates

Update the UI immediately, before the server confirms. Roll back if the mutation fails.

```tsx
const mutation = useMutation({
  mutationFn: updateTodo,

  onMutate: async (newTodo) => {
    // 1. Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['todos'] });

    // 2. Snapshot previous value
    const previousTodos = queryClient.getQueryData(['todos']);

    // 3. Optimistically update
    queryClient.setQueryData(['todos'], (old) =>
      old.map(t => t.id === newTodo.id ? { ...t, ...newTodo } : t)
    );

    // 4. Return snapshot for rollback
    return { previousTodos };
  },

  onError: (err, newTodo, context) => {
    // Roll back on error
    queryClient.setQueryData(['todos'], context.previousTodos);
  },

  onSettled: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

---

## Pagination

```tsx
function PaginatedList() {
  const [page, setPage] = useState(1);

  const { data, isPlaceholderData } = useQuery({
    queryKey: ['todos', page],
    queryFn: () => fetchTodos(page),
    placeholderData: keepPreviousData,  // Show old data while fetching new page
  });

  return (
    <div>
      <ul>{data?.items.map(item => <li key={item.id}>{item.title}</li>)}</ul>
      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
        Previous
      </button>
      <button
        onClick={() => setPage(p => p + 1)}
        disabled={isPlaceholderData || !data?.hasMore}
      >
        Next
      </button>
    </div>
  );
}
```

## Infinite Scroll

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['todos'],
    queryFn: ({ pageParam = 1 }) => fetchTodos(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 1,
  });

  return (
    <div>
      {data?.pages.map(page =>
        page.items.map(item => <div key={item.id}>{item.title}</div>)
      )}
      <button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
```

---

## Provider Setup

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,    // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Key Terms

- **Query key**: Array that uniquely identifies cached data
- **staleTime**: How long data is considered fresh (won't refetch)
- **gcTime**: How long unused data stays in cache (garbage collection)
- **Invalidation**: Marking cached data as stale, triggering refetch
- **Optimistic update**: Update UI before server confirms, rollback on failure
- **Placeholder data**: Show previous page data while loading next page
- **Infinite query**: Paginated data loaded incrementally (infinite scroll)
- **Mutation**: Operation that changes data (POST, PUT, DELETE)
- **`keepPreviousData`**: Show old data during page transitions

---

## Common Interview Questions

1. **When should you use TanStack Query vs Zustand?**
   - TanStack Query: server state (API data, caching, refetching)
   - Zustand: client state (UI state, user preferences)

2. **How do you handle optimistic updates?**
   - `onMutate`: cancel queries → snapshot → update cache
   - `onError`: rollback to snapshot
   - `onSettled`: invalidate to sync with server

3. **What's the difference between staleTime and gcTime?**
   - `staleTime`: data is fresh, don't refetch. `gcTime`: data is in memory, don't garbage collect

4. **How do you prevent waterfall requests?**
   - Prefetch with `queryClient.prefetchQuery()`, or use parallel queries with multiple `useQuery` calls
