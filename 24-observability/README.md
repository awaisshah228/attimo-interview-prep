# Observability (Logs, Metrics, Traces)

## What It Is
Observability is the ability to understand what's happening inside your application by examining its outputs. The three pillars: **Logs**, **Metrics**, and **Traces**.

---

## The Three Pillars

### 1. Logs
Discrete events that describe what happened.

```tsx
// Structured logging (JSON) — preferred
logger.info('User created', {
  userId: user.id,
  email: user.email,
  plan: 'pro',
  duration_ms: 45,
});

// Output:
// {"level":"info","message":"User created","userId":"abc","email":"user@ex.com","plan":"pro","duration_ms":45,"timestamp":"2024-01-15T10:30:00Z"}
```

**Log Levels**:

| Level | When to Use |
|-------|------------|
| `error` | Something failed and needs attention |
| `warn` | Something unexpected but not broken |
| `info` | Normal business events (user created, order placed) |
| `debug` | Detailed technical info (for debugging, not production) |

**Rules**:
- Always use structured logs (JSON), not plain strings
- Include context (userId, requestId, tenantId)
- Don't log sensitive data (passwords, tokens, PII)
- Use correlation IDs to trace requests across services

### 2. Metrics
Numeric measurements over time. Aggregated, not individual events.

| Type | What It Measures | Example |
|------|-----------------|---------|
| **Counter** | Things that only go up | Total requests, errors, signups |
| **Gauge** | Current value (goes up/down) | Active connections, memory usage |
| **Histogram** | Distribution of values | Request latency (p50, p95, p99) |

```tsx
// Conceptual example
metrics.counter('api.requests.total', 1, { method: 'POST', path: '/api/users' });
metrics.gauge('api.active_connections', connectionPool.size);
metrics.histogram('api.request.duration_ms', responseTime, { path: '/api/users' });
```

**Key Metrics to Track**:
- Request rate (requests/second)
- Error rate (errors/total requests)
- Latency (p50, p95, p99)
- CPU / Memory usage
- Queue depth (background jobs)
- Database connection pool utilization

### 3. Traces (Distributed Tracing)
Follow a single request across multiple services/functions.

```
Request → API Gateway → Auth Service → Database → Cache → Response
   |          |              |            |          |
   └──────────┴──────────────┴────────────┴──────────┘
                    One trace, multiple spans
```

**Trace**: The entire journey of a request
**Span**: One step in that journey (e.g., "database query took 12ms")

```tsx
// OpenTelemetry (standard)
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-app');

async function handleRequest(req) {
  const span = tracer.startSpan('handleRequest');
  try {
    span.setAttribute('user.id', req.userId);

    const data = await tracer.startActiveSpan('db.query', async (dbSpan) => {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [req.userId]);
      dbSpan.end();
      return result;
    });

    return data;
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

---

## Error Reporting (Sentry)

Captures, groups, and alerts on application errors with full context.

```tsx
// Setup
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% of transactions
  environment: process.env.NODE_ENV,
});

// Automatic: unhandled errors are captured automatically

// Manual: capture specific errors with context
try {
  await processPayment(order);
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'payments' },
    extra: { orderId: order.id, amount: order.total },
    user: { id: user.id, email: user.email },
  });
  throw error;
}

// Breadcrumbs: track events leading up to an error
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info',
});
```

---

## Alerting

### What to Alert On

| Alert | Condition | Severity |
|-------|-----------|----------|
| Error rate spike | >5% of requests returning 5xx | Critical |
| High latency | p95 > 2 seconds | Warning |
| Service down | Health check failing | Critical |
| Queue backlog | >1000 pending jobs | Warning |
| Disk space | >90% used | Warning |
| Certificate expiry | <7 days until expiry | Warning |

### Alert Principles

- **Alert on symptoms, not causes**: Alert on "users can't checkout" not "Redis CPU is high"
- **Every alert must be actionable**: If you can't do anything about it, don't alert
- **Avoid alert fatigue**: Too many alerts = people ignore them all
- **Escalation**: Warning → Team Slack → On-call page

---

## Observability Stack

| Layer | Tools |
|-------|-------|
| **Logs** | Vercel Logs, Datadog, Grafana Loki |
| **Metrics** | Prometheus, Datadog, Grafana |
| **Traces** | OpenTelemetry → Datadog / Honeycomb / Grafana Tempo |
| **Errors** | Sentry, Datadog Error Tracking |
| **Uptime** | Vercel Monitoring, Datadog Synthetics |
| **Performance** | Vercel Speed Insights, Web Vitals |

---

## Key Terms

- **Observability**: Understanding system behavior from its outputs
- **Structured logging**: JSON-formatted logs with consistent fields
- **Correlation ID**: Unique ID that follows a request across services
- **Counter**: Metric that only goes up (total count)
- **Gauge**: Metric that goes up and down (current value)
- **Histogram**: Distribution metric (percentiles: p50, p95, p99)
- **p50/p95/p99**: 50th/95th/99th percentile — e.g., p99 latency = 99% of requests are faster than this
- **Span**: One step in a distributed trace
- **Trace**: End-to-end journey of a request
- **OpenTelemetry (OTel)**: Open standard for traces, metrics, and logs
- **Sentry**: Error tracking and performance monitoring tool
- **Breadcrumb**: Event recorded before an error to provide context
- **Alert fatigue**: When too many alerts cause people to ignore them

---

## Common Interview Questions

1. **What are the three pillars of observability?**
   - Logs (events), Metrics (numbers over time), Traces (request journey)

2. **How do you debug a production issue?**
   - Check error reports (Sentry) → check logs for the request (correlation ID) → check traces for latency → check metrics for patterns

3. **What's the difference between monitoring and observability?**
   - Monitoring: predefined dashboards for known issues
   - Observability: ability to ask arbitrary questions about system behavior

4. **How do you avoid alert fatigue?**
   - Alert on symptoms not causes, every alert must be actionable, group related alerts, escalation tiers
