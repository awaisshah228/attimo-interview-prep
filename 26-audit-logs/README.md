# Audit Logs & Immutable Event History

## What It Is
An audit log is an append-only record of every significant action in your system: who did what, when, and to which resource. It's critical for compliance, debugging, and accountability.

---

## Why Audit Logs?

| Need | Example |
|------|---------|
| **Compliance** | SOC 2, HIPAA, GDPR require action tracking |
| **Security** | Detect unauthorized access, track data changes |
| **Debugging** | "What happened to this record?" |
| **Accountability** | "Who deleted this project?" |
| **Undo/History** | Show change history, enable rollback |

---

## Schema Design

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,               -- multi-tenant isolation
  actor_id    UUID NOT NULL,               -- who performed the action
  actor_type  TEXT NOT NULL,               -- 'user', 'system', 'api_key'
  action      TEXT NOT NULL,               -- 'created', 'updated', 'deleted', 'viewed'
  resource_type TEXT NOT NULL,             -- 'project', 'document', 'user'
  resource_id UUID NOT NULL,               -- ID of the affected resource
  changes     JSONB,                       -- what changed (before/after)
  metadata    JSONB DEFAULT '{}',          -- extra context (IP, user agent, etc.)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRITICAL: This table is append-only. No UPDATE or DELETE allowed.
-- Enforce with RLS or application-level controls.

-- Indexes for common queries
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
```

---

## Recording Changes

### Middleware Pattern

```tsx
// lib/audit.ts
interface AuditEntry {
  actorId: string;
  actorType: 'user' | 'system' | 'api_key';
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'exported';
  resourceType: string;
  resourceId: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

async function logAudit(tenantId: string, entry: AuditEntry) {
  await db.auditLog.create({
    data: {
      tenantId,
      ...entry,
      metadata: {
        ...entry.metadata,
        timestamp: new Date().toISOString(),
      },
    },
  });
}
```

### Usage in Server Actions

```tsx
'use server';

export async function updateProject(projectId: string, data: UpdateProjectInput) {
  const session = await auth();
  const tenantId = session.user.tenantId;

  // Get current state (for "before" snapshot)
  const before = await db.project.findUnique({ where: { id: projectId } });

  // Perform the update
  const after = await db.project.update({
    where: { id: projectId },
    data,
  });

  // Log the change
  await logAudit(tenantId, {
    actorId: session.user.id,
    actorType: 'user',
    action: 'updated',
    resourceType: 'project',
    resourceId: projectId,
    changes: {
      before: { name: before.name, status: before.status },
      after: { name: after.name, status: after.status },
    },
  });

  revalidatePath(`/projects/${projectId}`);
}
```

---

## Immutability

The core principle: audit logs can **never** be modified or deleted.

### Enforcement Strategies

```sql
-- 1. PostgreSQL: revoke UPDATE/DELETE
REVOKE UPDATE, DELETE ON audit_logs FROM app_user;

-- 2. RLS policy: deny all updates
CREATE POLICY no_modify ON audit_logs
  FOR ALL
  USING (false)   -- can't update/delete
  WITH CHECK (true);  -- can insert

-- 3. Trigger: prevent updates
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs cannot be modified';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();
```

### Application-Level

```tsx
// Prisma middleware to block modifications
prisma.$use(async (params, next) => {
  if (params.model === 'AuditLog' && ['update', 'delete', 'updateMany', 'deleteMany'].includes(params.action)) {
    throw new Error('Audit logs are immutable');
  }
  return next(params);
});
```

---

## Event Sourcing (Advanced)

Instead of storing current state, store every event that led to the current state.

```
Traditional: UPDATE projects SET status = 'completed' WHERE id = 1
Event Sourcing: INSERT INTO events (type, data) VALUES ('ProjectCompleted', {id: 1})

To get current state: replay all events for project 1
```

| Pros | Cons |
|------|------|
| Complete history by default | More complex to query current state |
| Can rebuild state at any point | Storage grows continuously |
| Perfect audit trail | Requires careful event design |
| Supports undo/replay | Higher learning curve |

---

## Querying Audit Logs

```tsx
// Activity feed for a resource
async function getResourceHistory(resourceType: string, resourceId: string) {
  return db.auditLog.findMany({
    where: { resourceType, resourceId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      actor: { select: { name: true, email: true, avatar: true } },
    },
  });
}

// User activity
async function getUserActivity(userId: string, from: Date, to: Date) {
  return db.auditLog.findMany({
    where: {
      actorId: userId,
      createdAt: { gte: from, lte: to },
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

---

## Data Retention

```tsx
// Archive old audit logs (compliance may require keeping for years)
// Move to cold storage (S3) after retention period

async function archiveOldLogs(olderThan: Date) {
  const logs = await db.auditLog.findMany({
    where: { createdAt: { lt: olderThan } },
  });

  // Write to S3/cold storage
  await s3.putObject({
    Bucket: 'audit-archive',
    Key: `audit/${olderThan.toISOString()}.jsonl`,
    Body: logs.map(l => JSON.stringify(l)).join('\n'),
  });

  // Only delete from primary DB after confirmed archive
  // (and only if compliance allows)
}
```

---

## Key Terms

- **Audit log**: Append-only record of actions (who, what, when, to what)
- **Immutable**: Cannot be modified or deleted after creation
- **Append-only**: Data can only be added, never changed
- **Event sourcing**: Storing events instead of current state
- **Change capture**: Recording before/after values of modified fields
- **Compliance**: Legal requirement to track and retain action history
- **Data retention**: How long audit data must be kept (often years)
- **Cold storage**: Cheap, slow storage for archived data (S3)
- **Actor**: The entity that performed the action (user, system, API key)

---

## Common Interview Questions

1. **Why are audit logs immutable?**
   - Tamper-proof evidence for compliance, security investigations, and legal requirements. If logs can be edited, they can't be trusted.

2. **How do you handle audit log storage growing large?**
   - Partition by date, archive to cold storage (S3), index for common queries, set retention policies.

3. **Event sourcing vs audit logs?**
   - Audit logs: bolted on, record actions alongside normal CRUD. Event sourcing: events ARE the data model, current state is derived.

4. **What should you audit?**
   - All data mutations, authentication events, permission changes, data exports, admin actions. NOT routine reads (too noisy).
