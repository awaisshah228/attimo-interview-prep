# Background Jobs & Queues

## What It Is
Background jobs are tasks that run outside the request-response cycle. Instead of making the user wait for slow operations (sending emails, processing images, syncing data), you queue the work and process it asynchronously.

---

## Why Background Jobs?

| Without (synchronous) | With (background job) |
|----------------------|----------------------|
| User clicks "Export" → waits 30s → gets CSV | User clicks "Export" → instant "We'll email you" → CSV generated in background |
| API timeout on heavy computation | Heavy work processed at its own pace |
| One failure blocks everything | Failures retry automatically |

---

## Queue Architecture

```
┌──────────┐     enqueue     ┌──────────┐     dequeue     ┌──────────┐
│ Producer  │ ──────────────→ │  Queue    │ ──────────────→ │ Consumer  │
│ (API)     │                 │ (Redis)   │                 │ (Worker)  │
└──────────┘                 └──────────┘                 └──────────┘
                                  │
                              ┌───┴───┐
                              │ Dead   │  (failed after max retries)
                              │ Letter │
                              │ Queue  │
                              └───────┘
```

### Key Concepts

| Term | Meaning |
|------|---------|
| **Producer** | Code that adds jobs to the queue |
| **Consumer/Worker** | Code that processes jobs from the queue |
| **Queue** | Ordered list of jobs waiting to be processed |
| **Dead Letter Queue (DLQ)** | Where jobs go after exhausting all retries |
| **Job** | A unit of work with a payload |
| **Concurrency** | How many jobs a worker processes simultaneously |

---

## BullMQ (Most Popular for Node.js)

### Setup

```tsx
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

// Create a queue
const emailQueue = new Queue('email', { connection });

// Producer: add a job
await emailQueue.add('welcome-email', {
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome',
});

// Consumer: process jobs
const worker = new Worker('email', async (job) => {
  console.log(`Processing ${job.name} for ${job.data.to}`);
  await sendEmail(job.data);
}, {
  connection,
  concurrency: 5,  // Process 5 jobs simultaneously
});
```

### Job Options

```tsx
await emailQueue.add('reminder', payload, {
  delay: 60 * 60 * 1000,        // Delay 1 hour before processing
  attempts: 3,                    // Retry up to 3 times
  backoff: {
    type: 'exponential',          // Exponential backoff
    delay: 1000,                  // Starting delay: 1s → 2s → 4s
  },
  removeOnComplete: true,         // Clean up completed jobs
  removeOnFail: 1000,             // Keep last 1000 failed jobs
  priority: 1,                    // Lower number = higher priority
});
```

---

## Retry Policies

### Exponential Backoff
Increasing delay between retries: 1s → 2s → 4s → 8s → 16s

```tsx
// BullMQ
{ attempts: 5, backoff: { type: 'exponential', delay: 1000 } }

// Manual implementation
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000;  // 1s, 2s, 4s
      const jitter = Math.random() * 1000;         // Random 0-1s
      await new Promise(r => setTimeout(r, delay + jitter));
    }
  }
  throw new Error('Unreachable');
}
```

### Why Jitter?
Without jitter, if 1000 jobs fail at the same time, they ALL retry at the same time → thundering herd. Jitter spreads retries randomly.

### Retry Strategy Table

| Strategy | Pattern | Use When |
|----------|---------|----------|
| **Fixed** | 5s, 5s, 5s | Simple, known recovery time |
| **Exponential** | 1s, 2s, 4s, 8s | Unknown recovery time, rate limiting |
| **Exponential + jitter** | 1.2s, 2.7s, 4.1s | Multiple workers/consumers |
| **No retry** | Fail immediately | Validation errors, auth failures |

---

## Failure Recovery

### Dead Letter Queue

```tsx
// When all retries are exhausted, job goes to DLQ
const worker = new Worker('email', processEmail, {
  connection,
});

worker.on('failed', (job, error) => {
  if (job.attemptsMade >= job.opts.attempts) {
    // Job is now in the failed set (DLQ)
    console.error(`Job ${job.id} permanently failed:`, error);
    // Alert the team, log for investigation
    alertOps(`Email job failed after ${job.attemptsMade} attempts`, { jobId: job.id, error });
  }
});
```

### Idempotent Workers
Jobs may be delivered more than once (at-least-once delivery). Workers must handle duplicates.

```tsx
async function processPayment(job) {
  const { paymentId, amount } = job.data;

  // Check if already processed (idempotency)
  const existing = await db.payment.findUnique({ where: { id: paymentId } });
  if (existing?.status === 'completed') {
    return; // Already done, skip
  }

  await chargeCard(amount);
  await db.payment.update({
    where: { id: paymentId },
    data: { status: 'completed' },
  });
}
```

---

## Common Job Types

| Job Type | Example | Priority |
|----------|---------|----------|
| **Notifications** | Send email, push notification, SMS | Medium |
| **Data processing** | Generate report, export CSV, process image | Low |
| **Webhooks** | Deliver webhook to external service | High |
| **Cleanup** | Delete expired data, archive old records | Low |
| **Sync** | Sync data between systems | Medium |
| **Scheduled** | Daily digest, weekly report | Low (cron-triggered) |

---

## Scheduled/Cron Jobs

```tsx
// BullMQ repeatable jobs
await emailQueue.add('daily-digest', {}, {
  repeat: {
    pattern: '0 9 * * *',  // Every day at 9 AM
  },
});

// Vercel Cron Jobs (vercel.json)
{
  "crons": [
    { "path": "/api/cron/daily-digest", "schedule": "0 9 * * *" },
    { "path": "/api/cron/cleanup", "schedule": "0 0 * * 0" }
  ]
}
```

---

## Key Terms

- **Queue**: Ordered list of jobs to be processed
- **Producer**: Code that adds jobs to a queue
- **Consumer/Worker**: Code that processes jobs
- **Dead Letter Queue (DLQ)**: Storage for permanently failed jobs
- **Exponential backoff**: Increasing delay between retries (2^n)
- **Jitter**: Random delay added to backoff to prevent thundering herd
- **At-least-once delivery**: Job may be delivered multiple times (worker must be idempotent)
- **Idempotent**: Processing the same job twice produces the same result
- **Concurrency**: Number of jobs processed simultaneously by one worker
- **Thundering herd**: Many retries/requests hitting at the same time
- **Cron job**: Task triggered on a schedule (cron expression)
- **Backpressure**: When producers add jobs faster than consumers process them

---

## Common Interview Questions

1. **When would you use a background job vs doing it in the request?**
   - Background: slow operations (>1s), unreliable external services, non-user-facing work
   - In-request: fast, user needs the result immediately

2. **What happens when a job fails?**
   - Retry with exponential backoff → after max retries → dead letter queue → alert ops

3. **How do you ensure a job isn't processed twice?**
   - Idempotent workers: check if already processed before executing. Use unique job IDs.

4. **What's the difference between at-least-once and exactly-once delivery?**
   - At-least-once: job may be delivered multiple times (need idempotent workers)
   - Exactly-once: theoretical ideal, very hard to achieve. Most systems use at-least-once + idempotency.
