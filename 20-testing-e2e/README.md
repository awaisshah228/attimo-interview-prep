# E2E Testing (Playwright & Cypress)

## What It Is
End-to-end (E2E) tests verify complete user workflows by automating a real browser. They test the entire stack: frontend → API → database → response.

---

## Playwright vs Cypress

| Feature | Playwright | Cypress |
|---------|-----------|---------|
| **By** | Microsoft | Cypress.io |
| **Browsers** | Chromium, Firefox, WebKit | Chromium, Firefox, WebKit (limited) |
| **Language** | TypeScript, JavaScript, Python, Java, C# | JavaScript/TypeScript only |
| **Multi-tab** | Yes | No |
| **Parallel** | Built-in | Paid (Cypress Cloud) |
| **Network mocking** | Yes (route interception) | Yes (cy.intercept) |
| **Speed** | Faster | Slower |
| **DX** | Code-first, trace viewer | Interactive test runner GUI |
| **Mobile** | Device emulation | Viewport only |

---

## Playwright

### Basic Test

```tsx
import { test, expect } from '@playwright/test';

test('user can create a todo', async ({ page }) => {
  // Navigate
  await page.goto('/todos');

  // Fill form
  await page.getByPlaceholder('What needs to be done?').fill('Buy groceries');
  await page.getByRole('button', { name: 'Add' }).click();

  // Assert
  await expect(page.getByText('Buy groceries')).toBeVisible();
  await expect(page.getByTestId('todo-count')).toHaveText('1 item');
});
```

### Page Object Pattern

```tsx
// pages/TodoPage.ts
export class TodoPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/todos');
  }

  async addTodo(title: string) {
    await this.page.getByPlaceholder('What needs to be done?').fill(title);
    await this.page.getByRole('button', { name: 'Add' }).click();
  }

  async getTodoCount() {
    return this.page.getByTestId('todo-count').textContent();
  }

  todoItem(title: string) {
    return this.page.getByText(title);
  }
}

// tests/todo.spec.ts
test('create todo', async ({ page }) => {
  const todoPage = new TodoPage(page);
  await todoPage.goto();
  await todoPage.addTodo('Buy groceries');
  await expect(todoPage.todoItem('Buy groceries')).toBeVisible();
});
```

### Network Interception

```tsx
test('handles API error gracefully', async ({ page }) => {
  // Mock API to return error
  await page.route('/api/todos', route =>
    route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) })
  );

  await page.goto('/todos');
  await expect(page.getByText('Something went wrong')).toBeVisible();
});
```

### Authentication Setup

```tsx
// auth.setup.ts — run once, reuse session
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Save auth state
  await page.context().storageState({ path: './auth-state.json' });
});

// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'tests',
      use: { storageState: './auth-state.json' },
      dependencies: ['setup'],
    },
  ],
});
```

---

## Cypress

### Basic Test

```tsx
describe('Todo App', () => {
  beforeEach(() => {
    cy.visit('/todos');
  });

  it('creates a todo', () => {
    cy.get('[placeholder="What needs to be done?"]').type('Buy groceries');
    cy.get('button').contains('Add').click();
    cy.contains('Buy groceries').should('be.visible');
    cy.get('[data-testid="todo-count"]').should('have.text', '1 item');
  });
});
```

### Network Mocking

```tsx
it('handles API error', () => {
  cy.intercept('GET', '/api/todos', { statusCode: 500 }).as('getTodos');
  cy.visit('/todos');
  cy.wait('@getTodos');
  cy.contains('Something went wrong').should('be.visible');
});
```

---

## Best Practices

| Practice | Why |
|----------|-----|
| Test critical user flows, not every edge case | E2E tests are slow and expensive |
| Use data-testid sparingly | Prefer accessible selectors (role, label, text) |
| Don't share state between tests | Each test should be independent |
| Mock external services | Don't depend on third-party APIs |
| Use the Page Object pattern | Maintainable, reusable |
| Run in CI | Catch regressions before merging |
| Test on multiple browsers | Playwright makes this easy |

### Test Pyramid

```
         /  E2E   \        ← Few (10-20): critical user flows
        / Integration\      ← Some (50-100): API + component integration
       /    Unit      \     ← Many (hundreds): functions, hooks, components
```

---

## Key Terms

- **E2E (End-to-End)**: Tests the full user flow through the real application
- **Playwright**: Browser automation by Microsoft (recommended)
- **Cypress**: Browser testing with interactive runner
- **Page Object Model**: Pattern that encapsulates page interactions in a class
- **Network interception**: Mocking API responses in E2E tests
- **Storage state**: Saved browser session (cookies, localStorage) for auth reuse
- **Test isolation**: Each test runs independently, no shared state
- **Trace viewer**: Playwright's debugging tool showing screenshots at each step
- **Headless**: Running browser without visible UI (for CI)

---

## Common Interview Questions

1. **When should you write E2E tests vs unit tests?**
   - E2E: critical user flows (login, checkout, CRUD). Unit: logic, components, utilities.

2. **How do you make E2E tests reliable?**
   - Wait for elements (not arbitrary sleep), mock external APIs, independent test data, retry flaky tests

3. **How do you handle authentication in E2E tests?**
   - Login once in setup, save session state, reuse across tests (avoid logging in every test)
