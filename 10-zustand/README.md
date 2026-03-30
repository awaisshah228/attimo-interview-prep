# Zustand

## What It Is
Zustand is a small, fast, and scalable state management library for React. It's simpler than Redux, has no boilerplate, and works outside React components too.

---

## Basic Usage

```tsx
import { create } from 'zustand';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// Usage in component
function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  return <button onClick={increment}>{count}</button>;
}
```

---

## Selectors (Preventing Re-renders)

```tsx
// BAD: re-renders on ANY store change
const { count, name } = useCounterStore();

// GOOD: only re-renders when count changes
const count = useCounterStore((state) => state.count);

// Multiple values: use shallow comparison
import { useShallow } from 'zustand/react/shallow';

const { count, name } = useCounterStore(
  useShallow((state) => ({ count: state.count, name: state.name }))
);
```

---

## Slices Pattern (Scalable Architecture)

Split a large store into slices.

```tsx
// slices/authSlice.ts
interface AuthSlice {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const createAuthSlice = (set): AuthSlice => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
});

// slices/uiSlice.ts
interface UISlice {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const createUISlice = (set): UISlice => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
});

// store.ts — combine slices
const useStore = create<AuthSlice & UISlice>()((...args) => ({
  ...createAuthSlice(...args),
  ...createUISlice(...args),
}));
```

---

## Middleware

### Persist (localStorage/sessionStorage)

```tsx
import { persist } from 'zustand/middleware';

const useStore = create(
  persist<StoreState>(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'app-settings',           // localStorage key
      partialize: (state) => ({       // Only persist specific fields
        theme: state.theme,
      }),
    }
  )
);
```

### Devtools

```tsx
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 }), false, 'increment'),
    }),
    { name: 'MyStore' }
  )
);
```

### Combining Middleware

```tsx
const useStore = create<StoreState>()(
  devtools(
    persist(
      (set) => ({ /* store */ }),
      { name: 'storage-key' }
    ),
    { name: 'DevTools' }
  )
);
```

---

## Async Actions

```tsx
const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await api.getProducts();
      set({ products, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Access current state with get()
  addProduct: async (product) => {
    const result = await api.createProduct(product);
    set({ products: [...get().products, result] });
  },
}));
```

---

## When to Use Zustand vs Other Options

| State Type | Use |
|-----------|-----|
| **Server state** (API data) | TanStack Query — NOT Zustand |
| **Global UI state** (sidebar, theme, modals) | Zustand |
| **Form state** | React Hook Form or local useState |
| **Auth state** (current user, tokens) | Zustand with persist |
| **Component-local state** | useState/useReducer |
| **Shared between few components** | Zustand or lift state up |

---

## Key Terms

- **Store**: A hook that holds state and actions
- **Selector**: A function that picks specific state from the store (prevents unnecessary re-renders)
- **Slice**: A portion of the store focused on one domain
- **Middleware**: Plugins that enhance the store (persist, devtools, immer)
- **`set`**: Function to update state (merges by default)
- **`get`**: Function to read current state inside actions
- **Shallow comparison**: Compare object properties one level deep (not reference equality)

---

## Common Interview Questions

1. **Why Zustand over Redux?**
   - Less boilerplate, no providers/reducers/actions, simpler API, smaller bundle, works outside React

2. **How do you prevent unnecessary re-renders with Zustand?**
   - Use selectors to subscribe to specific state slices, use `useShallow` for multiple values

3. **When would you NOT use Zustand?**
   - For server state (use TanStack Query), for form state (use React Hook Form), for simple component-local state (use useState)

4. **How does persist middleware work?**
   - Serializes state to localStorage/sessionStorage, rehydrates on mount, supports partial persistence
