# Visual Regression Testing

## What It Is
Visual regression testing catches unintended UI changes by comparing screenshots of components/pages before and after code changes. It answers: "Does my UI still look the same?"

---

## How It Works

```
1. Component renders → screenshot captured (baseline)
2. Code changes made
3. Component renders again → new screenshot captured
4. Tool compares old vs new screenshot pixel-by-pixel
5. Differences highlighted → developer reviews
6. Accept (update baseline) or reject (fix the bug)
```

---

## Tools

### Chromatic (by Storybook team)

- Captures screenshots of every Storybook story
- Cloud-based comparison and review
- Integrates with CI/CD (GitHub checks)
- Team collaboration (approve/reject changes)

```bash
# Install
npm install --save-dev chromatic

# Run (captures all stories)
npx chromatic --project-token=YOUR_TOKEN
```

### Percy (by BrowserStack)

- Captures screenshots from any testing framework
- Cross-browser rendering comparison
- Responsive breakpoint testing

```tsx
// With Playwright
import percySnapshot from '@percy/playwright';

test('homepage', async ({ page }) => {
  await page.goto('/');
  await percySnapshot(page, 'Homepage');
});

// With Cypress
cy.visit('/');
cy.percySnapshot('Homepage');
```

### Playwright Built-in Screenshots

```tsx
// Compare against stored snapshots
test('button looks correct', async ({ page }) => {
  await page.goto('/components/button');
  await expect(page.locator('.button-primary')).toHaveScreenshot('button-primary.png');
});

// First run: creates the baseline snapshot
// Subsequent runs: compares against baseline
// To update: npx playwright test --update-snapshots
```

---

## Storybook + Chromatic Workflow

```tsx
// 1. Write a story
// Button.stories.tsx
export const Primary: Story = {
  args: { variant: 'primary', children: 'Click me' },
};

export const Disabled: Story = {
  args: { variant: 'primary', children: 'Click me', disabled: true },
};

// 2. Chromatic captures screenshots of all stories
// 3. On PR: Chromatic shows visual diffs
// 4. Team reviews and approves/rejects
```

### CI Integration (GitHub Actions)

```yaml
# .github/workflows/chromatic.yml
name: Chromatic
on: push

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
      - run: npm ci
      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

---

## What to Test Visually

| Test | Why |
|------|-----|
| Design system components (all variants) | Catch style regressions |
| Critical pages (homepage, dashboard) | Layout doesn't break |
| Dark mode | Colors, contrast |
| Responsive breakpoints | Mobile, tablet, desktop |
| Loading/error/empty states | All states look correct |

## What NOT to Test Visually

- Dynamic data (timestamps, user-generated content)
- Animations (use interaction tests instead)
- Third-party widgets (outside your control)

---

## Key Terms

- **Visual regression**: Unintended change in how the UI looks
- **Baseline**: The reference screenshot that new screenshots are compared against
- **Diff**: The highlighted differences between baseline and new screenshot
- **Chromatic**: Cloud-based visual testing for Storybook stories
- **Percy**: Cross-browser visual testing platform
- **Snapshot**: A captured screenshot at a point in time
- **Threshold**: How much pixel difference is tolerated before flagging

---

## Common Interview Questions

1. **Why visual regression testing?**
   - CSS changes can break UI in unexpected places. Unit tests don't catch visual bugs. Screenshots catch what the eye sees.

2. **How do you handle dynamic content in visual tests?**
   - Mock dates/times, use fixed test data, mask dynamic regions

3. **Chromatic vs Percy?**
   - Chromatic: Storybook-native, captures every story automatically
   - Percy: Framework-agnostic, works with Playwright/Cypress/any framework
