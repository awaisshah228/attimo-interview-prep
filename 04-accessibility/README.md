# HTML5 Semantic Markup & Accessibility

## What It Is
Accessibility (a11y) means making web applications usable by everyone, including people with disabilities. WCAG (Web Content Accessibility Guidelines) is the standard, and AA is the conformance level most companies target.

---

## HTML5 Semantic Elements

Use semantic elements instead of generic `<div>` and `<span>`:

| Element | Purpose |
|---------|---------|
| `<header>` | Page or section header |
| `<nav>` | Navigation links |
| `<main>` | Primary page content (one per page) |
| `<article>` | Self-contained content (blog post, comment) |
| `<section>` | Thematic grouping of content |
| `<aside>` | Side content (sidebar, related links) |
| `<footer>` | Page or section footer |
| `<figure>` / `<figcaption>` | Image with caption |
| `<time>` | Date/time value |
| `<details>` / `<summary>` | Expandable content |

**Why it matters**: Screen readers use semantic elements to navigate. A `<nav>` is announced as "navigation", a `<div>` is nothing.

---

## WCAG 2.1 AA — The Four Principles (POUR)

### 1. Perceivable
Users must be able to perceive the information.

- **Text alternatives**: All images need `alt` text
- **Captions**: Videos need captions/subtitles
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Don't use color alone** to convey information

### 2. Operable
Users must be able to operate the interface.

- **Keyboard accessible**: Everything works with keyboard only
- **No keyboard traps**: User can always navigate away
- **Enough time**: Users can extend time limits
- **No seizure triggers**: No flashing content >3 times/second

### 3. Understandable
Content and UI must be understandable.

- **Readable**: Language declared (`<html lang="en">`)
- **Predictable**: Consistent navigation, no unexpected context changes
- **Input assistance**: Error messages are clear, labels are visible

### 4. Robust
Content must work with assistive technologies.

- **Valid HTML**: Proper nesting, unique IDs
- **ARIA when needed**: Enhance semantics where HTML falls short

---

## ARIA (Accessible Rich Internet Applications)

ARIA attributes add semantics to HTML for assistive technologies.

### Key ARIA Attributes

```html
<!-- Roles: define what an element IS -->
<div role="alert">Error: invalid email</div>
<div role="dialog" aria-modal="true">Modal content</div>
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>

<!-- States: dynamic properties -->
<button aria-expanded="false">Menu</button>
<input aria-invalid="true" aria-describedby="error-msg" />
<span id="error-msg">Email is required</span>

<!-- Properties: static descriptions -->
<button aria-label="Close dialog">×</button>
<input aria-labelledby="name-label" />
<div aria-live="polite">3 new messages</div>
```

### ARIA Rules

1. **Don't use ARIA if native HTML works**: `<button>` is better than `<div role="button">`
2. **Don't change native semantics**: Don't add `role="button"` to `<a>`
3. **All interactive ARIA elements must be keyboard accessible**
4. **Don't use `role="presentation"` or `aria-hidden="true"` on focusable elements**

---

## Keyboard Navigation Patterns

| Key | Expected Behavior |
|-----|------------------|
| `Tab` | Move to next focusable element |
| `Shift+Tab` | Move to previous focusable element |
| `Enter` / `Space` | Activate buttons, links |
| `Escape` | Close modals, dropdowns |
| `Arrow keys` | Navigate within menus, tabs, radio groups |
| `Home` / `End` | Jump to first/last item in a list |

### Focus Management in React

```tsx
// Focus trap in a modal
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  return isOpen ? (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {children}
    </div>
  ) : null;
}
```

---

## Common Patterns

### Skip Navigation Link
```html
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Visually Hidden (screen-reader only)
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

### Form Accessibility
```html
<label for="email">Email address</label>
<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">Please enter a valid email</span>
```

---

## Common Interview Questions

1. **What is WCAG 2.1 AA?**
   - Web Content Accessibility Guidelines, level AA — the standard most companies are legally required to meet

2. **What's the difference between `aria-label`, `aria-labelledby`, and `aria-describedby`?**
   - `aria-label`: directly provides a text label
   - `aria-labelledby`: points to another element's ID that serves as the label
   - `aria-describedby`: points to an element providing additional description

3. **How do you test accessibility?**
   - Automated: axe-core, jest-axe, Lighthouse
   - Manual: keyboard-only testing, screen reader testing (VoiceOver, NVDA)
   - Color contrast checkers

4. **When should you use ARIA?**
   - Only when native HTML semantics are insufficient (custom widgets, dynamic content)
