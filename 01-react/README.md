# React 18+

## What It Is
React is a JavaScript library for building user interfaces using a component-based architecture. Version 18 introduced concurrent features that let React prepare multiple versions of the UI at the same time.

---

## Key Concepts

### Hooks
Functions that let you use state and lifecycle features in function components.

**Rules of Hooks** (must follow or React breaks):
1. Only call hooks at the **top level** — never inside loops, conditions, or nested functions
2. Only call hooks from **React function components** or **custom hooks**

---

#### `useState` — Local Component State

Holds a value that, when changed, causes the component to re-render.

```tsx
const [count, setCount] = useState(0);          // number
const [name, setName] = useState('');             // string
const [user, setUser] = useState<User | null>(null);  // typed, nullable
const [items, setItems] = useState<string[]>([]); // array
```

**Updating state:**

```tsx
// Direct value
setCount(5);

// Functional update (when new state depends on previous state) — PREFERRED
setCount(prev => prev + 1);

// Object state — must spread because setState does NOT merge
const [form, setForm] = useState({ name: '', email: '' });
setForm(prev => ({ ...prev, name: 'Alice' }));  // keeps email intact

// Array state — common patterns
setItems(prev => [...prev, 'new item']);           // add
setItems(prev => prev.filter(i => i !== 'old'));   // remove
setItems(prev => prev.map(i => i === 'old' ? 'new' : i)); // update
```

**Common mistakes:**

```tsx
// BAD: mutating state directly (React won't detect the change)
items.push('new');
setItems(items);  // same reference — no re-render!

// GOOD: create a new array
setItems([...items, 'new']);

// BAD: using stale state in async code
const handleClick = () => {
  setCount(count + 1);  // uses stale closure value
  setCount(count + 1);  // still uses the SAME stale value — only increments by 1
};

// GOOD: functional update always gets latest state
const handleClick = () => {
  setCount(prev => prev + 1);
  setCount(prev => prev + 1);  // correctly increments by 2
};
```

**Lazy initialization** (for expensive initial values):

```tsx
// BAD: runs JSON.parse on every render
const [data, setData] = useState(JSON.parse(localStorage.getItem('data') || '{}'));

// GOOD: function runs only on first render
const [data, setData] = useState(() => JSON.parse(localStorage.getItem('data') || '{}'));
```

---

#### `useEffect` — Side Effects

Runs code after render. Used for: API calls, subscriptions, timers, DOM manipulation, event listeners.

```tsx
// Runs after EVERY render (rare — usually a mistake)
useEffect(() => {
  console.log('rendered');
});

// Runs only on MOUNT (empty dependency array)
useEffect(() => {
  fetchInitialData();
}, []);

// Runs when `userId` changes
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// Cleanup function — runs before next effect and on unmount
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;

  return () => {
    ws.close();  // cleanup: close connection
  };
}, [url]);
```

**Dependency array rules:**
- Every variable from the component scope used inside the effect must be in the array
- If you omit a dependency, the effect uses stale values (bug)
- ESLint `react-hooks/exhaustive-deps` rule catches this

**Common mistakes:**

```tsx
// BAD: infinite loop — object created every render → new reference → effect re-runs
useEffect(() => {
  fetch('/api/data', { headers: options });  // options changes every render
}, [options]);

// GOOD: depend on primitive values, or memoize the object
useEffect(() => {
  fetch('/api/data', { headers: { auth: token } });
}, [token]);  // token is a string — stable reference

// BAD: fetching without cleanup (race condition)
useEffect(() => {
  fetch(`/api/user/${id}`).then(r => r.json()).then(setUser);
}, [id]);
// If id changes quickly: response for id=1 might arrive after id=2

// GOOD: abort controller to cancel stale requests
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/user/${id}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });

  return () => controller.abort();  // cancel on id change
}, [id]);
```

**When NOT to use useEffect:**

```tsx
// BAD: deriving state in an effect
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// GOOD: just compute it during render
const fullName = `${firstName} ${lastName}`;

// BAD: transforming data from props
useEffect(() => {
  setFilteredList(items.filter(i => i.active));
}, [items]);

// GOOD: compute during render (useMemo if expensive)
const filteredList = items.filter(i => i.active);
```

---

#### `useRef` — Mutable Value / DOM Access

Holds a mutable value that persists across renders **without causing re-renders** when changed.

**Two main uses:**

```tsx
// 1. Accessing DOM elements
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.focus();  // directly access DOM node
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleClick}>Focus</button>
    </>
  );
}

// 2. Storing mutable values that don't trigger re-renders
function Timer() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;  // tracks renders without causing more renders

  function start() {
    intervalRef.current = setInterval(() => console.log('tick'), 1000);
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  return (
    <>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
      <p>Rendered {renderCountRef.current} times</p>
    </>
  );
}
```

**useRef vs useState:**

| | `useRef` | `useState` |
|---|---------|-----------|
| Changing it triggers re-render? | No | Yes |
| Access | `ref.current` | `[value, setter]` |
| Use for | DOM refs, timers, previous values, mutable data | UI-visible state |

**Common pattern — storing previous value:**

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Usage
const prevCount = usePrevious(count);
```

---

#### `useMemo` — Cache Expensive Computations

Recomputes only when dependencies change. Prevents re-running expensive calculations on every render.

```tsx
// Without useMemo: sorts on EVERY render (even if items didn't change)
function UserList({ items, query }) {
  const sorted = items.sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(i => i.name.includes(query));
  return <ul>{filtered.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}

// With useMemo: only recomputes when items or query change
function UserList({ items, query }) {
  const filtered = useMemo(() => {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    return sorted.filter(i => i.name.includes(query));
  }, [items, query]);

  return <ul>{filtered.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}
```

**When to use useMemo:**
- Expensive calculations (sorting, filtering large arrays)
- Creating objects/arrays passed to child components (prevents unnecessary re-renders)
- Complex derived state

**When NOT to use useMemo:**
- Simple calculations (adding two numbers, string concatenation)
- Primitive values (they're cheap to compare anyway)
- Premature optimization — don't add useMemo everywhere "just in case"

```tsx
// UNNECESSARY: simple computation
const fullName = useMemo(() => `${first} ${last}`, [first, last]);
// Just do: const fullName = `${first} ${last}`;

// USEFUL: expensive computation
const chart = useMemo(() => processMillionDataPoints(rawData), [rawData]);
```

---

#### `useCallback` — Cache Function References

Returns a memoized function. The function reference stays the same unless dependencies change.

```tsx
// Without useCallback: handleClick is a NEW function every render
// → ChildComponent re-renders even if nothing changed
function Parent() {
  const handleClick = () => {
    console.log('clicked');
  };
  return <ChildComponent onClick={handleClick} />;
}

// With useCallback: handleClick is the SAME reference between renders
function Parent() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);
  return <ChildComponent onClick={handleClick} />;
}

// With dependencies
function SearchForm({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback(() => {
    onSearch(query);
  }, [query, onSearch]);  // recreated only when query or onSearch changes

  return <ExpensiveChild onSubmit={handleSubmit} />;
}
```

**useMemo vs useCallback:**

```tsx
// These are equivalent:
const memoizedFn = useCallback(() => doSomething(a, b), [a, b]);
const memoizedFn = useMemo(() => () => doSomething(a, b), [a, b]);

// useMemo caches a VALUE (any type)
// useCallback caches a FUNCTION (shorthand for useMemo returning a function)
```

**When to use useCallback:**
- Functions passed to memoized child components (`React.memo`)
- Functions in dependency arrays of `useEffect` or other hooks
- Event handlers passed to many list items

**When NOT to use:**
- Functions not passed to children
- Components that are cheap to re-render anyway

---

#### `useReducer` — Complex State Logic

Like useState but for complex state with multiple sub-values or when next state depends on previous state in complex ways.

```tsx
// Define types
interface State {
  items: Todo[];
  loading: boolean;
  error: string | null;
  filter: 'all' | 'active' | 'completed';
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Todo[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'TOGGLE_TODO'; payload: string }
  | { type: 'SET_FILTER'; payload: State['filter'] };

// Reducer function (pure — no side effects)
function todoReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, items: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'ADD_TODO':
      return { ...state, items: [...state.items, action.payload] };
    case 'TOGGLE_TODO':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload ? { ...item, done: !item.done } : item
        ),
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    default:
      return state;
  }
}

// Usage in component
function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, {
    items: [],
    loading: false,
    error: null,
    filter: 'all',
  });

  async function loadTodos() {
    dispatch({ type: 'FETCH_START' });
    try {
      const todos = await fetchTodos();
      dispatch({ type: 'FETCH_SUCCESS', payload: todos });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message });
    }
  }

  return (
    <div>
      <button onClick={() => dispatch({ type: 'ADD_TODO', payload: newTodo })}>
        Add
      </button>
      {state.items.map(item => (
        <TodoItem
          key={item.id}
          item={item}
          onToggle={() => dispatch({ type: 'TOGGLE_TODO', payload: item.id })}
        />
      ))}
    </div>
  );
}
```

**useState vs useReducer:**

| Use `useState` | Use `useReducer` |
|----------------|------------------|
| Simple values (string, number, boolean) | Complex objects with multiple fields |
| Independent state updates | State transitions depend on each other |
| 1-3 state variables | Many related state variables |
| Simple update logic | Complex update logic (add, remove, toggle, filter) |

---

#### `useTransition` — Non-Urgent Updates (React 18)

Marks a state update as non-urgent. React can interrupt it to handle more urgent updates (like typing).

```tsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // URGENT: update the text input immediately
    setQuery(e.target.value);

    // NON-URGENT: update search results (can be interrupted)
    startTransition(() => {
      const filtered = hugeDataset.filter(item =>
        item.name.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setResults(filtered);
    });
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ResultsList results={results} />
    </div>
  );
}
```

**Key points:**
- `isPending` is `true` while the transition is rendering
- React keeps the old UI visible until the new UI is ready
- User input stays responsive even if the transition is slow
- Great for: filtering large lists, tab switching, navigation

---

#### `useDeferredValue` — Defer Re-rendering (React 18)

Like useTransition but for values you receive (props) rather than state you set.

```tsx
function SearchResults({ query }: { query: string }) {
  // deferredQuery lags behind query during rapid typing
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  // Expensive filtering uses the deferred (lagging) value
  const results = useMemo(
    () => hugeList.filter(item => item.includes(deferredQuery)),
    [deferredQuery]
  );

  return (
    <div style={{ opacity: isStale ? 0.7 : 1 }}>
      {results.map(item => <div key={item}>{item}</div>)}
    </div>
  );
}
```

**useTransition vs useDeferredValue:**

| `useTransition` | `useDeferredValue` |
|-----------------|-------------------|
| You control the state update | You receive a prop/value |
| Wraps `setState` calls | Wraps a value |
| Returns `[isPending, startTransition]` | Returns the deferred value |
| Use when YOU set the state | Use when PARENT sets the state |

---

#### `useContext` — Consume Context Values

Reads a value from a React Context.

```tsx
// 1. Create context with default value and type
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 2. Create a provider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const user = await api.login(email, password);
    setUser(user);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Create a custom hook for type-safe access
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// 4. Use in components
function Profile() {
  const { user, logout } = useAuth();
  if (!user) return <p>Not logged in</p>;
  return (
    <div>
      <p>Welcome, {user.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

#### Custom Hooks — Reusable Logic

Extract reusable stateful logic into custom hooks (functions starting with `use`).

```tsx
// useLocalStorage — persist state to localStorage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

// useDebounce — debounce a value
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// useMediaQuery — responsive design hook
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

// Usage
function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchResults(debouncedSearch);
  }, [debouncedSearch]);
}
```

### Context API
Passes data through the component tree without prop drilling.

```tsx
// Create
const ThemeContext = createContext<'light' | 'dark'>('light');

// Provide (wraps a subtree)
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>

// Consume
const theme = useContext(ThemeContext);
```

**When NOT to use Context**: For frequently changing values (causes all consumers to re-render). Use Zustand or TanStack Query instead.

### Suspense
Declaratively handles loading states for async operations.

```tsx
<Suspense fallback={<Spinner />}>
  <LazyComponent />    {/* Loaded via React.lazy() */}
  <DataComponent />    {/* Can suspend while fetching data */}
</Suspense>
```

### Server Components (React 18+ / Next.js)
Components that render **only on the server**. They:
- Have zero client-side JavaScript
- Can directly access databases, file systems, internal APIs
- Cannot use hooks, event handlers, or browser APIs

```tsx
// This is a Server Component by default in Next.js App Router
async function UserProfile({ id }: { id: string }) {
  const user = await db.user.findUnique({ where: { id } }); // Direct DB access
  return <h1>{user.name}</h1>;
}
```

### Client Components
Components that run in the browser. Add `'use client'` directive.

```tsx
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**Rule**: Push `'use client'` as far down the tree as possible. Only the interactive parts need it.

### Concurrent Rendering (React 18)
React can now:
- **Interrupt** rendering to handle more urgent updates
- **Prepare** multiple versions of the UI simultaneously
- **Transition** between states without blocking

```tsx
function SearchResults({ query }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    // Urgent: update the input
    setInput(e.target.value);

    // Non-urgent: update search results
    startTransition(() => {
      setQuery(e.target.value);
    });
  }

  return isPending ? <Spinner /> : <Results query={query} />;
}
```

---

## Common Interview Questions

1. **What's the difference between `useMemo` and `useCallback`?**
   - `useMemo` caches a **computed value** (any type). `useCallback` caches a **function reference** (shorthand for `useMemo(() => fn, deps)`)

2. **When does a component re-render?**
   - When its state changes, when its parent re-renders (unless wrapped in `React.memo`), or when a consumed context value changes

3. **What are the rules of hooks?**
   - Only call at the top level (not in loops, conditions, or nested functions)
   - Only call in function components or custom hooks
   - Must start with `use` (naming convention)

4. **What's the difference between Server and Client Components?**
   - Server: no JS shipped to browser, can access server resources directly, cannot use hooks or event handlers
   - Client: interactive, has access to hooks and browser APIs, adds to bundle size

5. **Why not put everything in Context?**
   - Every consumer re-renders when the context value changes, regardless of whether they use the changed part. For frequently changing values, use Zustand or TanStack Query.

6. **What happens if you call `setState` multiple times in the same function?**
   - React batches state updates within event handlers (and since React 18, also in promises/setTimeout). All updates are applied together, causing one re-render. Use functional updates (`prev => prev + 1`) to chain correctly.

7. **What's a stale closure and how do you fix it?**
   - When a function captures an old value of state. Fix with: functional updates in setState, useRef for mutable values, or correct dependency arrays in useEffect/useCallback.

8. **When would you use `useReducer` over `useState`?**
   - When state is complex (many fields), when updates depend on each other, when you want to centralize update logic, or when state transitions are well-defined.

9. **How do you avoid unnecessary re-renders?**
   - `React.memo()` for components, `useMemo` for values, `useCallback` for functions, selectors in state management, pushing `'use client'` down the tree.

10. **What's the difference between `useTransition` and `useDeferredValue`?**
    - `useTransition`: you wrap your own `setState` calls. `useDeferredValue`: you receive a value from a parent and defer its effect. Both mark updates as non-urgent.

11. **What does the cleanup function in useEffect do?**
    - Runs before the next effect and on unmount. Used to cancel subscriptions, abort fetches, clear timers, remove event listeners. Prevents memory leaks.

12. **How do you share logic between components?**
    - Custom hooks (`useXxx`). Extract stateful logic into a reusable function. Each component using the hook gets its own independent state.

---

## Key Terms
- **Prop drilling**: Passing props through many layers of components
- **Reconciliation**: React's algorithm for diffing the virtual DOM
- **Virtual DOM**: In-memory representation of the UI that React diffs against
- **Hydration**: Attaching event handlers to server-rendered HTML on the client
- **Fiber**: React's internal reconciliation engine (enables concurrent rendering)
