# Full Glossary

Every technical term from the Attimo Full Stack Engineer job description.

---

## A

| Term | Definition |
|------|-----------|
| **a11y** | Abbreviation for "accessibility" (a + 11 letters + y) |
| **ADR** | Architecture Decision Record — documents why a technical decision was made |
| **AEC** | Architecture, Engineering, Construction industry |
| **AnimatePresence** | Framer Motion component for enter/exit animations |
| **App Router** | Next.js routing system using the `app/` directory (modern) |
| **ARIA** | Accessible Rich Internet Applications — HTML attributes for assistive technology |
| **at-least-once delivery** | Message may be delivered multiple times; consumer must be idempotent |
| **Audit log** | Immutable, append-only record of actions in a system |
| **AuthN** | Authentication — proving identity ("who are you?") |
| **AuthZ** | Authorization — checking permissions ("can you do this?") |
| **axe-core** | Accessibility testing engine with 100+ WCAG rules |

## B

| Term | Definition |
|------|-----------|
| **Background job** | Task processed asynchronously outside the request-response cycle |
| **Backpressure** | When a producer sends faster than consumers can process |
| **BIM** | Building Information Modeling — 3D digital model of a building |
| **B-tree index** | Default database index type, good for equality and range queries |
| **Bundle analysis** | Inspecting JavaScript bundle contents to find bloat |

## C

| Term | Definition |
|------|-----------|
| **Cache invalidation** | Marking cached data as stale to trigger refresh |
| **Chunked upload** | Splitting large files into pieces for resumable upload |
| **CI/CD** | Continuous Integration / Continuous Deployment — automated build/test/deploy |
| **Client Component** | React component that runs in the browser (`'use client'`) |
| **CLS** | Cumulative Layout Shift — visual stability metric (target: < 0.1) |
| **cn()** | Utility combining clsx + tailwind-merge for class name composition |
| **Concurrent rendering** | React 18 feature allowing interruptible rendering |
| **Context API** | React mechanism for passing data without prop drilling |
| **Core Web Vitals** | Google's key UX metrics: LCP, INP, CLS |
| **Correlation ID** | Unique ID following a request across services for tracing |
| **CSRF** | Cross-Site Request Forgery — tricking browsers into unwanted requests |
| **CSS Modules** | Scoped CSS files with auto-generated unique class names |
| **CSS-in-JS** | Writing CSS inside JavaScript (styled-components, Emotion) |
| **Cursor-based pagination** | Using opaque cursors instead of page numbers |
| **cva** | Class Variance Authority — type-safe Tailwind variant system |
| **Cypress** | E2E browser testing framework with interactive runner |

## D

| Term | Definition |
|------|-----------|
| **Dead Letter Queue** | Storage for messages/jobs that failed all retry attempts |
| **Design system** | Reusable components + tokens + guidelines for consistent UI |
| **Design tokens** | Named values (colors, spacing, fonts) shared across the system |
| **Discriminated union** | TypeScript pattern using a tag field to distinguish type variants |
| **dnd-kit** | Modern drag-and-drop library for React |
| **DLQ** | Dead Letter Queue |

## E

| Term | Definition |
|------|-----------|
| **E2E testing** | End-to-end testing — verifying complete user flows in a real browser |
| **Embedding** | Vector representation of text capturing semantic meaning |
| **Error semantics** | Structured, meaningful error response format |
| **Event sourcing** | Storing events instead of current state |
| **EventSource** | Browser API for Server-Sent Events connections |
| **Exponential backoff** | Retry with increasing delay: 1s → 2s → 4s → 8s |

## F

| Term | Definition |
|------|-----------|
| **Fiber** | React's internal reconciliation engine enabling concurrent rendering |
| **Flexbox** | CSS one-dimensional layout (row OR column) |
| **Framer Motion** | React animation library (declarative, spring-based) |
| **Full-text search** | Searching document content, not just metadata |

## G

| Term | Definition |
|------|-----------|
| **Gauge** | Metric type that goes up and down (current value) |
| **Generics** | TypeScript feature for reusable typed functions/interfaces |
| **GIN index** | PostgreSQL index for full-text search, JSONB, and arrays |
| **GraphQL** | Query language where client specifies exact data shape |
| **Grid** | CSS two-dimensional layout (rows AND columns) |
| **Grounding** | Constraining LLM to answer only from provided context |

## H

| Term | Definition |
|------|-----------|
| **Hallucination** | When an LLM generates plausible but false information |
| **Histogram** | Metric type for value distribution (p50, p95, p99) |
| **Hooks** | React functions for state and lifecycle in function components |
| **httpOnly cookie** | Cookie that JavaScript cannot read (XSS protection) |
| **Hydration** | Attaching event handlers to server-rendered HTML on the client |

## I

| Term | Definition |
|------|-----------|
| **Idempotency** | Same operation produces same result regardless of repetitions |
| **Idempotency key** | Client-generated ID to prevent duplicate operations |
| **Immutable** | Cannot be modified after creation |
| **INP** | Interaction to Next Paint — responsiveness metric (target: < 200ms) |
| **ISR** | Incremental Static Regeneration — static pages that revalidate |

## J

| Term | Definition |
|------|-----------|
| **Jest** | JavaScript testing framework (runner + assertions + mocking) |
| **jest-axe** | Jest matcher for accessibility testing (`toHaveNoViolations`) |
| **Jitter** | Random delay added to backoff to prevent thundering herd |
| **JWT** | JSON Web Token — signed, stateless authentication token |

## K-L

| Term | Definition |
|------|-----------|
| **Keyboard navigation** | Full app usability using only keyboard |
| **Layout animation** | Automatically animating position/size changes |
| **LCP** | Largest Contentful Paint — loading speed metric (target: < 2.5s) |
| **Lazy loading** | Loading resources only when needed |
| **Least privilege** | Minimum permissions necessary to perform a task |

## M

| Term | Definition |
|------|-----------|
| **Mapped types** | TypeScript: transform properties of an existing type |
| **MEP** | Mechanical, Electrical, Plumbing engineering |
| **Micro-interaction** | Small, purposeful animation tied to a user action |
| **Middleware** | Code that runs before request reaches the route handler |
| **Migration** | Versioned database schema change |
| **Mobile-first** | Base styles for mobile, then add for larger screens |
| **MSW** | Mock Service Worker — mock APIs at the network level |
| **Multi-tenant** | One application serving multiple isolated customers |

## N-O

| Term | Definition |
|------|-----------|
| **N+1 problem** | Fetching related data in a loop instead of batch/join |
| **Normalization** | Organizing database data to reduce redundancy |
| **OAuth 2.0** | Protocol for third-party authentication (social login) |
| **OpenTelemetry** | Open standard for traces, metrics, and logs |
| **Optimistic update** | Update UI before server confirms, rollback on failure |
| **Over-fetching** | Getting more data than needed (common REST problem) |

## P

| Term | Definition |
|------|-----------|
| **p50/p95/p99** | Percentile metrics — e.g., p99 = 99% of requests are faster |
| **Page Object Model** | E2E test pattern encapsulating page interactions in a class |
| **Pagination** | Breaking data into pages (cursor or offset based) |
| **Partial index** | Database index on a subset of rows matching a condition |
| **Percy** | Visual regression testing platform |
| **Playwright** | Browser automation framework by Microsoft |
| **Prompt injection** | Malicious input attempting to override AI instructions |
| **Prop drilling** | Passing props through many component layers |
| **Provenance** | Tracking the source/origin of AI-generated content |

## Q-R

| Term | Definition |
|------|-----------|
| **Queue** | Ordered list of jobs/messages to be processed |
| **RAG** | Retrieval-Augmented Generation — grounding LLM in real data |
| **RBAC** | Role-Based Access Control — permissions mapped to roles |
| **React Testing Library** | Testing components via user behavior, not implementation |
| **Reconciliation** | React's algorithm for diffing and updating the DOM |
| **Refresh token** | Long-lived token used to get new access tokens |
| **REST** | Representational State Transfer — HTTP-based API style |
| **RFI** | Request for Information (AEC industry) |
| **RLS** | Row-Level Security — Postgres auto-filtering by policy |
| **Route Handler** | Next.js API endpoint in `route.ts` files |
| **RSC** | React Server Components |

## S

| Term | Definition |
|------|-----------|
| **satisfies** | TypeScript keyword that validates type without widening |
| **Schema-per-tenant** | Each tenant gets their own database schema |
| **Selector** | Function that picks specific state from a store |
| **Sentry** | Error tracking and performance monitoring tool |
| **Server Action** | Next.js server function callable from components (`'use server'`) |
| **Server Component** | React component rendered only on the server (zero client JS) |
| **Signed URL** | Time-limited, pre-authenticated URL for storage upload |
| **Slice** | Portion of a Zustand store focused on one domain |
| **Spring animation** | Physics-based easing (more natural than linear) |
| **SSE** | Server-Sent Events — server-to-client streaming over HTTP |
| **SSG** | Static Site Generation — pages built at build time |
| **SSR** | Server-Side Rendering — pages rendered on each request |
| **Stale-while-revalidate** | Serve cached data while fetching fresh data |
| **Storybook** | Tool for building and documenting components in isolation |
| **Streaming** | Progressive rendering via React Suspense |
| **Structured logging** | JSON-formatted logs with consistent fields |
| **Submittal** | Material/product submission for approval (AEC) |
| **Suspense** | React feature for declarative loading states |

## T

| Term | Definition |
|------|-----------|
| **Tailwind CSS** | Utility-first CSS framework |
| **TanStack Query** | Server-state management (fetching, caching, invalidation) |
| **Template literal type** | TypeScript type from string template patterns |
| **Tenant** | A customer/organization in a multi-tenant system |
| **Thundering herd** | Many retries/requests hitting simultaneously |
| **Tiptap** | Rich text editor built on ProseMirror |
| **Token (AI)** | Unit of text an LLM processes (~4 characters) |
| **Trace** | End-to-end journey of a request across services |
| **Tree shaking** | Removing unused code from the bundle |

## U-V

| Term | Definition |
|------|-----------|
| **Under-fetching** | Needing multiple requests to get all data |
| **useCallback** | React hook that caches a function reference |
| **useEffect** | React hook for side effects |
| **useMemo** | React hook that caches computed values |
| **useTransition** | React 18 hook for non-urgent state updates |
| **UUID** | Universally Unique Identifier |
| **Vector database** | DB optimized for storing and searching embeddings |
| **Virtual DOM** | In-memory UI representation React diffs against |
| **Virtualisation** | Rendering only visible items in large lists/tables |
| **Visual regression** | Unintended change in UI appearance |

## W-Z

| Term | Definition |
|------|-----------|
| **WCAG 2.1 AA** | Web Content Accessibility Guidelines, level AA |
| **WebSocket** | Persistent bidirectional connection protocol |
| **XSS** | Cross-Site Scripting — injecting malicious scripts |
| **Zustand** | Lightweight React state management library |
