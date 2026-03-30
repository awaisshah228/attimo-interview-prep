# Jest + React Testing Library

## What It Is
- **Jest**: JavaScript testing framework (test runner, assertions, mocking)
- **React Testing Library (RTL)**: Testing utility that tests components the way users interact with them — by finding elements via text, role, and label, not implementation details

---

## Philosophy

> "The more your tests resemble the way your software is used, the more confidence they can give you."

**Test behavior, not implementation.**

```tsx
// BAD: testing implementation
expect(component.state.count).toBe(1);

// GOOD: testing behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

---

## Basic Test Structure

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('increments count when button is clicked', async () => {
    const user = userEvent.setup();

    // Arrange
    render(<Counter />);

    // Act
    await user.click(screen.getByRole('button', { name: /increment/i }));

    // Assert
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });
});
```

---

## Queries (Finding Elements)

### Priority Order (use top one that works)

| Priority | Query | When |
|----------|-------|------|
| 1 | `getByRole` | Buttons, links, headings, inputs (accessible) |
| 2 | `getByLabelText` | Form inputs |
| 3 | `getByPlaceholderText` | Inputs without labels |
| 4 | `getByText` | Static text content |
| 5 | `getByDisplayValue` | Filled input values |
| 6 | `getByAltText` | Images |
| 7 | `getByTitle` | Title attribute |
| 8 | `getByTestId` | Last resort (data-testid) |

### Query Variants

| Variant | Returns | When Not Found |
|---------|---------|----------------|
| `getBy...` | Element | Throws error |
| `queryBy...` | Element or null | Returns null |
| `findBy...` | Promise<Element> | Throws (async) |
| `getAllBy...` | Element[] | Throws error |

```tsx
// Element should exist
const button = screen.getByRole('button', { name: /submit/i });

// Element might not exist
const error = screen.queryByText(/error/i);
expect(error).not.toBeInTheDocument();

// Element appears asynchronously
const message = await screen.findByText(/success/i);
```

---

## User Events (Interactions)

```tsx
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();

// Click
await user.click(screen.getByRole('button'));

// Type
await user.type(screen.getByRole('textbox'), 'hello');

// Clear and type
await user.clear(screen.getByRole('textbox'));
await user.type(screen.getByRole('textbox'), 'new value');

// Select option
await user.selectOptions(screen.getByRole('combobox'), 'option1');

// Keyboard
await user.keyboard('{Enter}');
await user.tab();
```

---

## Common Assertions

```tsx
// Presence
expect(screen.getByText('Hello')).toBeInTheDocument();
expect(screen.queryByText('Error')).not.toBeInTheDocument();

// Visibility
expect(element).toBeVisible();

// Disabled state
expect(button).toBeDisabled();
expect(button).toBeEnabled();

// Form values
expect(input).toHaveValue('test@example.com');

// CSS classes
expect(element).toHaveClass('active');

// Attributes
expect(link).toHaveAttribute('href', '/about');

// Text content
expect(element).toHaveTextContent('Hello World');
```

---

## Testing Async Code

```tsx
it('loads and displays users', async () => {
  render(<UserList />);

  // Wait for loading to finish
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for data to appear
  const users = await screen.findAllByRole('listitem');
  expect(users).toHaveLength(3);
});
```

### Mocking API Calls

```tsx
// Using MSW (Mock Service Worker) — recommended
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('displays users from API', async () => {
  render(<UserList />);
  expect(await screen.findByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('Bob')).toBeInTheDocument();
});

// Override for error case
it('shows error on API failure', async () => {
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json({ error: 'Failed' }, { status: 500 });
    })
  );
  render(<UserList />);
  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});
```

---

## Mocking

```tsx
// Mock a module
jest.mock('./api', () => ({
  fetchUsers: jest.fn().mockResolvedValue([{ id: 1, name: 'Alice' }]),
}));

// Mock a function
const onSubmit = jest.fn();
render(<Form onSubmit={onSubmit} />);
await user.click(screen.getByRole('button', { name: /submit/i }));
expect(onSubmit).toHaveBeenCalledWith({ name: 'Alice' });
expect(onSubmit).toHaveBeenCalledTimes(1);

// Mock timers
jest.useFakeTimers();
// ... trigger timeout
jest.advanceTimersByTime(5000);
jest.useRealTimers();
```

---

## Testing Custom Hooks

```tsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

it('increments counter', () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

---

## Key Terms

- **Jest**: Test runner + assertion library + mocking
- **React Testing Library**: Test components via user behavior
- **MSW (Mock Service Worker)**: Mock API calls at the network level
- **`getByRole`**: Find elements by ARIA role (most accessible query)
- **`userEvent`**: Simulates real user interactions (better than `fireEvent`)
- **`screen`**: Global query container for rendered components
- **Test ID**: `data-testid` attribute — last resort for finding elements
- **Arrange-Act-Assert**: Test structure pattern (setup → action → verification)

---

## Common Interview Questions

1. **Why React Testing Library over Enzyme?**
   - RTL tests behavior (what users see), Enzyme tests implementation (component internals). RTL gives more confidence.

2. **When would you use `queryBy` vs `getBy` vs `findBy`?**
   - `getBy`: element must exist now. `queryBy`: element might not exist. `findBy`: element will appear async.

3. **How do you mock API calls in tests?**
   - MSW (Mock Service Worker): intercepts at network level, works with any fetch/axios
