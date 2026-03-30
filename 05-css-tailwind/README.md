# CSS3, CSS Modules & Tailwind CSS

## CSS3 Key Concepts

### Flexbox
One-dimensional layout (row OR column).

```css
.container {
  display: flex;
  justify-content: space-between;  /* main axis */
  align-items: center;             /* cross axis */
  gap: 1rem;
  flex-wrap: wrap;
}

.item {
  flex: 1;          /* grow equally */
  flex-shrink: 0;   /* don't shrink */
}
```

### Grid
Two-dimensional layout (rows AND columns).

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* 3 equal columns */
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
}

.span-two {
  grid-column: span 2;  /* span 2 columns */
}
```

### Responsive Design (Mobile-First)

```css
/* Base: mobile */
.card { padding: 1rem; }

/* Tablet (768px+) */
@media (min-width: 768px) {
  .card { padding: 2rem; }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .card { padding: 3rem; display: flex; }
}
```

### CSS Custom Properties (Variables)

```css
:root {
  --color-primary: #3b82f6;
  --spacing-md: 1rem;
  --radius: 0.5rem;
}

.button {
  background: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius);
}

/* Override in dark mode */
.dark {
  --color-primary: #60a5fa;
}
```

---

## CSS Modules

Scoped CSS files that prevent class name collisions. Each class name is automatically made unique at build time.

```css
/* Button.module.css */
.button {
  background: blue;
  color: white;
}

.primary {
  background: var(--color-primary);
}
```

```tsx
// Button.tsx
import styles from './Button.module.css';

export function Button({ variant = 'primary' }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      Click me
    </button>
  );
}
```

**Output**: `.Button_button_a1b2c` — unique class, no conflicts.

---

## CSS-in-JS

Writing CSS inside JavaScript. Common libraries: styled-components, Emotion.

```tsx
// styled-components example
import styled from 'styled-components';

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  background: ${props => props.variant === 'primary' ? '#3b82f6' : '#6b7280'};
  color: white;
`;

<Button variant="primary">Click</Button>
```

**Trade-off**: Runtime cost (generates CSS at runtime) vs developer experience.

---

## Tailwind CSS

Utility-first CSS framework. Instead of writing custom CSS, compose utility classes.

### Core Concept

```html
<!-- Traditional CSS -->
<button class="custom-button">Click</button>
<!-- .custom-button { padding: 8px 16px; background: blue; color: white; border-radius: 4px; } -->

<!-- Tailwind -->
<button class="px-4 py-2 bg-blue-500 text-white rounded">Click</button>
```

### Common Utilities

| Category | Examples |
|----------|---------|
| Spacing | `p-4`, `px-2`, `m-auto`, `gap-3` |
| Sizing | `w-full`, `h-screen`, `max-w-md`, `min-h-0` |
| Flex/Grid | `flex`, `items-center`, `justify-between`, `grid`, `grid-cols-3` |
| Typography | `text-lg`, `font-bold`, `leading-tight`, `tracking-wide` |
| Colors | `bg-blue-500`, `text-gray-900`, `border-red-300` |
| Borders | `border`, `rounded-lg`, `border-b-2` |
| Effects | `shadow-md`, `opacity-50`, `blur-sm` |
| Transitions | `transition-all`, `duration-300`, `ease-in-out` |

### Responsive (Mobile-First)

```html
<!-- Mobile: stack, Tablet: 2 cols, Desktop: 3 cols -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

| Prefix | Min-width |
|--------|-----------|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
| `2xl:` | 1536px |

### State Variants

```html
<button class="bg-blue-500 hover:bg-blue-700 focus:ring-2 active:bg-blue-800 disabled:opacity-50">
```

### Dark Mode

```html
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">
```

### Tailwind Configuration

```js
// tailwind.config.ts
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a5f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
      }
    }
  },
  plugins: [],
};
```

### `cn()` Utility Pattern

Combines `clsx` (conditional classes) + `tailwind-merge` (resolves conflicts).

```tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  "px-4 py-2 rounded",
  variant === "primary" && "bg-blue-500 text-white",
  variant === "secondary" && "bg-gray-200 text-black",
  className  // allow overrides from parent
)} />
```

---

## Key Terms

- **Utility-first**: Compose styles from small, single-purpose classes
- **Mobile-first**: Base styles for mobile, then add for larger screens
- **CSS Modules**: Scoped CSS with automatic unique class names
- **CSS-in-JS**: CSS written in JavaScript (styled-components, Emotion)
- **Design tokens**: Named values for colors, spacing, fonts shared across the system
- **`cn()` utility**: Helper to merge Tailwind classes without conflicts
- **PurgeCSS**: Removes unused CSS classes from production builds (built into Tailwind)

---

## Common Interview Questions

1. **Why Tailwind over traditional CSS?**
   - No naming fatigue, co-located styles, smaller bundles (purged), consistent design tokens

2. **What's the downside of CSS-in-JS?**
   - Runtime performance cost, larger bundle, incompatible with Server Components

3. **How do you handle responsive design?**
   - Mobile-first: start with base styles, add breakpoint prefixes for larger screens

4. **How do CSS Modules prevent conflicts?**
   - Class names are hashed at build time to be unique per file
