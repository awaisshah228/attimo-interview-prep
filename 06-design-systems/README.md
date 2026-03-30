# Design Systems

## What It Is
A design system is a collection of reusable components, design tokens, guidelines, and documentation that ensures consistent UI across an application. It's the single source of truth for design and development.

---

## Components of a Design System

### 1. Design Tokens
Named values that represent the smallest design decisions.

```ts
// tokens.ts
export const tokens = {
  colors: {
    primary: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a5f' },
    neutral: { 100: '#f5f5f5', 500: '#737373', 900: '#171717' },
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },
  radii: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  typography: {
    fontFamily: { sans: 'Inter, sans-serif', mono: 'JetBrains Mono, monospace' },
    fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem' },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
};
```

### 2. Component Library
Reusable, composable UI components.

**Atomic Design Pattern:**

| Level | Examples | Description |
|-------|---------|-------------|
| **Atoms** | Button, Input, Badge, Avatar | Smallest building blocks |
| **Molecules** | SearchBar (Input + Button), FormField (Label + Input + Error) | Small groups of atoms |
| **Organisms** | Header, Sidebar, DataTable, UserCard | Complex UI sections |
| **Templates** | DashboardLayout, AuthLayout | Page-level structure |
| **Pages** | Dashboard, Settings, UserProfile | Specific instances of templates |

### 3. Variant Pattern (using cva)

Class Variance Authority (cva) creates type-safe component variants.

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:ring-2',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        ghost: 'hover:bg-gray-100',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
```

### 4. Documentation (Storybook)

Storybook provides an isolated environment to develop and document components.

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'destructive', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: 'Button', variant: 'primary' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};
```

---

## Scalable Architecture

```
src/
├── components/
│   ├── ui/                  # Atoms — base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   └── index.ts         # barrel exports
│   ├── forms/               # Molecules
│   │   ├── form-field.tsx
│   │   └── search-bar.tsx
│   ├── data-display/        # Organisms
│   │   ├── data-table.tsx
│   │   └── user-card.tsx
│   └── layout/              # Templates
│       ├── sidebar.tsx
│       └── header.tsx
├── lib/
│   └── utils.ts             # cn() helper
└── styles/
    └── tokens.css           # CSS custom properties
```

---

## Key Principles

1. **Consistency**: Same patterns everywhere — same spacing, colors, interactions
2. **Composability**: Small components compose into larger ones
3. **Accessibility built-in**: Every component is accessible by default
4. **Theming**: Support dark/light mode via tokens (CSS variables)
5. **Documentation**: Every component is documented with examples and usage guidelines

---

## Key Terms

- **Design tokens**: Named values (colors, spacing, fonts) shared between design and code
- **Atomic design**: Component hierarchy from atoms to pages
- **cva**: Class Variance Authority — type-safe Tailwind variant system
- **Storybook**: Tool for building and documenting components in isolation
- **Barrel exports**: `index.ts` that re-exports all components from a folder
- **Theming**: Switching visual appearance (dark/light) via CSS variables
- **Component API**: The props interface that defines how a component is used
- **Composition**: Building complex UI from simple, reusable pieces

---

## Common Interview Questions

1. **How would you build a design system from scratch?**
   - Define tokens → build base components (atoms) → compose molecules/organisms → document in Storybook → publish as a package

2. **How do you handle theming?**
   - CSS custom properties on `:root` and `.dark`, toggled by a class on `<html>`

3. **How do you ensure consistency across a large team?**
   - Shared component library, design tokens, linting rules, Storybook, code reviews

4. **What's the difference between a component library and a design system?**
   - A component library is code. A design system includes tokens, guidelines, patterns, documentation, and governance
