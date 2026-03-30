# Performance & Core Web Vitals

## What It Is
Web performance measures how fast your application loads and responds to user interactions. Google's Core Web Vitals are the key metrics that affect SEO ranking and user experience.

---

## Core Web Vitals

### LCP — Largest Contentful Paint
**What**: Time until the largest visible element (image, heading, video) finishes rendering.
**Target**: < 2.5 seconds
**Common causes of bad LCP**:
- Slow server response (TTFB)
- Render-blocking CSS/JS
- Unoptimized images
- Client-side rendering delays

**Fixes**:
```tsx
// 1. Use next/image for automatic optimization
import Image from 'next/image';
<Image src="/hero.jpg" width={1200} height={600} priority alt="Hero" />

// 2. Preload critical resources
<link rel="preload" href="/fonts/inter.woff2" as="font" crossOrigin="" />

// 3. Use Server Components (no client JS blocking render)
// 4. Stream HTML with Suspense boundaries
```

### INP — Interaction to Next Paint
**What**: Time from user interaction (click, tap, keypress) to the next visual update.
**Target**: < 200ms
**Common causes of bad INP**:
- Long JavaScript tasks blocking the main thread
- Heavy re-renders
- Synchronous state updates

**Fixes**:
```tsx
// 1. Use useTransition for non-urgent updates
const [isPending, startTransition] = useTransition();
function handleFilter(value) {
  startTransition(() => {
    setFilter(value);  // Non-urgent — won't block input
  });
}

// 2. Debounce expensive operations
// 3. Use Web Workers for heavy computation
// 4. Virtualize long lists (don't render 10k DOM nodes)
```

### CLS — Cumulative Layout Shift
**What**: How much the page layout shifts unexpectedly during loading.
**Target**: < 0.1
**Common causes of bad CLS**:
- Images without dimensions
- Dynamically injected content above existing content
- Web fonts causing text reflow (FOUT)

**Fixes**:
```tsx
// 1. Always set width/height on images
<Image src="/photo.jpg" width={800} height={600} alt="..." />

// 2. Use next/font to eliminate font swap layout shift
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

// 3. Reserve space for dynamic content
<div style={{ minHeight: '200px' }}>
  {isLoaded ? <Content /> : <Skeleton />}
</div>
```

---

## Other Performance Metrics

| Metric | What | Target |
|--------|------|--------|
| **TTFB** | Time to First Byte — server response time | < 800ms |
| **FCP** | First Contentful Paint — first text/image painted | < 1.8s |
| **TTI** | Time to Interactive — page fully interactive | < 3.8s |
| **TBT** | Total Blocking Time — main thread blocked time between FCP and TTI | < 200ms |

---

## Optimization Techniques

### Code Splitting & Lazy Loading

```tsx
// Dynamic import — loads component only when needed
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,  // Don't render on server (browser-only lib)
});

// React.lazy
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Spinner />}>
  <LazyComponent />
</Suspense>
```

### Bundle Analysis

```bash
# Analyze what's in your bundle
npm install @next/bundle-analyzer
# or
npx next build && npx @next/bundle-analyzer
```

**What to look for**:
- Large dependencies (lodash, moment.js — replace with smaller alternatives)
- Duplicate packages
- Code that could be lazy-loaded

### Image Optimization

```tsx
// next/image handles: format conversion (WebP/AVIF), resizing, lazy loading
import Image from 'next/image';

<Image
  src="/hero.jpg"
  width={1200}
  height={600}
  alt="Hero image"
  priority          // Preload for above-the-fold images
  sizes="(max-width: 768px) 100vw, 50vw"  // Responsive sizing
  placeholder="blur" // Show blurred version while loading
  blurDataURL="data:image/..."
/>
```

### Caching Strategies

| Level | How | TTL |
|-------|-----|-----|
| **Browser cache** | `Cache-Control` headers | Varies |
| **CDN cache** | Vercel Edge Network | ISR revalidation |
| **Application cache** | TanStack Query `staleTime` | Custom |
| **Data cache** | Next.js `fetch` cache | `revalidate: N` |

```tsx
// HTTP caching headers
export async function GET() {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

// TanStack Query caching
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000,  // 5 minutes before refetch
  gcTime: 30 * 60 * 1000,    // 30 minutes in cache
});
```

### Font Optimization

```tsx
// next/font — zero layout shift, self-hosted
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.className} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Measuring Performance

| Tool | What It Measures |
|------|-----------------|
| **Lighthouse** (Chrome DevTools) | Lab data — simulated performance score |
| **Chrome DevTools Performance tab** | Flame chart, main thread activity |
| **Web Vitals Extension** | Real-time CWV in browser |
| **Vercel Analytics / Speed Insights** | Real user data (field data) |
| **PageSpeed Insights** | Lab + field data combined |
| **`web-vitals` library** | Report CWV from your app |

```tsx
// Report Web Vitals
import { onCLS, onINP, onLCP } from 'web-vitals';

onCLS(console.log);
onINP(console.log);
onLCP(console.log);
```

---

## Key Terms

- **Core Web Vitals**: LCP, INP, CLS — Google's key UX metrics
- **TTFB**: Time to First Byte — server response speed
- **Code splitting**: Breaking the bundle into smaller chunks loaded on demand
- **Lazy loading**: Loading resources only when needed
- **Tree shaking**: Removing unused code from the bundle
- **Bundle analysis**: Inspecting what's in your JavaScript bundle
- **Hydration**: Attaching interactivity to server-rendered HTML
- **Stale-while-revalidate**: Serve cached data while fetching fresh data in background
- **FOUT/FOIT**: Flash of Unstyled/Invisible Text (font loading issues)

---

## Common Interview Questions

1. **How do you measure and improve LCP?**
   - Measure with Lighthouse/Web Vitals. Improve with: `priority` on hero images, server-side rendering, preloading critical resources, reducing TTFB.

2. **What causes poor INP and how do you fix it?**
   - Long main thread tasks. Fix with: `useTransition`, code splitting, Web Workers, virtualization.

3. **How do you prevent CLS?**
   - Set explicit dimensions on images/videos, use `next/font`, reserve space for dynamic content.

4. **What's the difference between lab data and field data?**
   - Lab: simulated (Lighthouse) — consistent but not real. Field: real users (CrUX, Vercel Analytics) — actual experience.
