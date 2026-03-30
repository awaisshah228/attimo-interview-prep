# Animation & Micro-interactions

## What It Is
Animations provide visual feedback, guide attention, and make interfaces feel alive. Micro-interactions are small, purposeful animations tied to specific user actions (hovering a button, toggling a switch, submitting a form).

---

## CSS Transitions & Animations

### Transitions
Smooth property changes over time.

```css
.button {
  background: #3b82f6;
  transform: scale(1);
  transition: all 200ms ease-in-out;
}

.button:hover {
  background: #2563eb;
  transform: scale(1.05);
}
```

### Keyframe Animations

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.card {
  animation: fadeIn 300ms ease-out;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

---

## Framer Motion

The standard React animation library. Declarative, spring-based, gesture-aware.

### Basic Animation

```tsx
import { motion } from 'framer-motion';

function FadeIn({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### Common Props

| Prop | Purpose |
|------|---------|
| `initial` | Starting state |
| `animate` | Target state |
| `exit` | State when removed from DOM |
| `transition` | Duration, easing, spring config |
| `whileHover` | Hover state |
| `whileTap` | Active/pressed state |
| `whileFocus` | Focus state |
| `layout` | Animate layout changes automatically |

### Hover & Tap Micro-interactions

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

### AnimatePresence (Enter/Exit)

Animates components when they mount/unmount.

```tsx
import { AnimatePresence, motion } from 'framer-motion';

function Notifications({ items }) {
  return (
    <AnimatePresence>
      {items.map(item => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {item.message}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

### Layout Animations

Automatically animate when an element's position or size changes.

```tsx
function List({ items }) {
  return (
    <div>
      {items.map(item => (
        <motion.div key={item.id} layout>
          {item.name}
        </motion.div>
      ))}
    </div>
  );
}
```

### Variants (Orchestrated Animations)

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

function StaggeredList({ items }) {
  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      {items.map(i => (
        <motion.li key={i.id} variants={item}>
          {i.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

---

## Common Micro-interaction Patterns

| Pattern | Use Case | Implementation |
|---------|----------|---------------|
| **Fade in** | Page/section entry | `opacity: 0 → 1` |
| **Slide in** | Sidebars, drawers, notifications | `translateX(-100%) → 0` |
| **Scale on hover** | Buttons, cards | `whileHover={{ scale: 1.05 }}` |
| **Press feedback** | Buttons | `whileTap={{ scale: 0.95 }}` |
| **Skeleton loading** | Content placeholders | Pulsing gray shapes |
| **Progress bar** | Uploads, steps | Width animation |
| **Stagger list** | Search results, feeds | Children animate sequentially |
| **Layout shift** | Filtering, reordering | `layout` prop |
| **Toast enter/exit** | Notifications | `AnimatePresence` + slide |
| **Spinner** | Loading states | CSS `rotate` keyframes |

---

## Performance Considerations

- **Animate only `transform` and `opacity`** — these don't trigger layout recalculation
- **Avoid animating `width`, `height`, `top`, `left`** — these cause layout thrashing
- **Use `will-change`** sparingly for GPU-accelerated properties
- **`prefers-reduced-motion`**: Respect user OS settings

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={{ opacity: 1, y: prefersReducedMotion ? 0 : 20 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
/>
```

---

## Key Terms

- **Micro-interaction**: Small, purposeful animation tied to a user action
- **Spring animation**: Physics-based easing (more natural than linear/ease)
- **Stagger**: Children animate one after another with a delay
- **Layout animation**: Automatically animating position/size changes
- **AnimatePresence**: Framer Motion component for enter/exit animations
- **`prefers-reduced-motion`**: OS-level accessibility setting to minimize animations
- **GPU-accelerated**: `transform` and `opacity` are composited on the GPU (faster)
