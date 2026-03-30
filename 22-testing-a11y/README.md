# Accessibility Testing

## What It Is
Automated tools that check your UI for accessibility violations — missing alt text, low contrast, wrong ARIA usage, missing labels, keyboard traps, etc.

---

## axe-core

The most widely used accessibility testing engine. Checks ~100 rules based on WCAG 2.1.

### With Playwright

```tsx
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage has no a11y violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});

// Test specific section
test('navigation is accessible', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .include('nav')           // Only check nav element
    .withTags(['wcag2a', 'wcag2aa'])  // WCAG 2.1 AA rules
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### With Cypress

```tsx
// Install: npm install cypress-axe axe-core
import 'cypress-axe';

describe('Accessibility', () => {
  it('homepage has no a11y violations', () => {
    cy.visit('/');
    cy.injectAxe();
    cy.checkA11y();
  });

  // Check specific element
  it('form is accessible', () => {
    cy.visit('/contact');
    cy.injectAxe();
    cy.checkA11y('form');
  });
});
```

---

## jest-axe

Unit-level accessibility testing for rendered components.

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('Button is accessible', async () => {
  const { container } = render(
    <button aria-label="Close">×</button>
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it('Form is accessible', async () => {
  const { container } = render(
    <form>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" aria-required="true" />
      <button type="submit">Submit</button>
    </form>
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## What axe-core Catches

| Category | Examples |
|----------|---------|
| **Color contrast** | Text too light on background |
| **Missing alt text** | `<img>` without `alt` attribute |
| **Missing labels** | `<input>` without `<label>` |
| **Invalid ARIA** | Wrong role, invalid aria-* attributes |
| **Heading order** | `<h1>` → `<h3>` (skipped h2) |
| **Link text** | "Click here" (not descriptive) |
| **Form errors** | Missing error descriptions |
| **Duplicate IDs** | Two elements with same ID |
| **Keyboard** | Focusable elements without visible focus |

## What axe-core CANNOT Catch

| Issue | Why | Solution |
|-------|-----|----------|
| Logical tab order | Can't judge what's "logical" | Manual keyboard testing |
| Meaningful alt text | Can't judge if alt text is accurate | Human review |
| Screen reader experience | Can't simulate full SR behavior | Test with VoiceOver/NVDA |
| Custom widget behavior | Can't test keyboard interactions | Manual + E2E tests |

---

## Testing Strategy

```
Automated (CI)                           Manual
├── jest-axe (unit tests)                ├── Keyboard navigation walkthrough
├── axe-core/playwright (E2E)           ├── Screen reader testing (VoiceOver)
├── ESLint a11y plugin                   ├── Color contrast spot-check
└── Lighthouse CI                        └── User testing with assistive tech
```

### ESLint Plugin

```json
// .eslintrc.json
{
  "plugins": ["jsx-a11y"],
  "extends": ["plugin:jsx-a11y/recommended"]
}
```

Catches at dev time:
- `<img>` without `alt`
- Click handlers on non-interactive elements
- Missing `htmlFor` on `<label>`
- Invalid ARIA attributes

---

## Key Terms

- **axe-core**: Accessibility testing engine (100+ WCAG rules)
- **jest-axe**: Jest matcher for axe-core (`toHaveNoViolations`)
- **WCAG 2.1 AA**: Target conformance level (Level A + AA rules)
- **Violation**: An accessibility rule that is broken
- **Impact**: Severity of violation (critical, serious, moderate, minor)
- **Lighthouse**: Google's tool that includes accessibility audit
- **Screen reader**: Assistive tech that reads the page aloud (VoiceOver, NVDA, JAWS)

---

## Common Interview Questions

1. **How do you test accessibility?**
   - Automated: axe-core in unit + E2E tests, ESLint plugin. Manual: keyboard testing, screen reader testing.

2. **What can't automated tools catch?**
   - Logical content order, meaningful alt text, full keyboard flow, screen reader experience

3. **When should you add accessibility tests?**
   - Every new component gets a jest-axe test. Every critical page gets an E2E axe scan. Run in CI on every PR.
