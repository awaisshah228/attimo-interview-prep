# Multi-Tenant SaaS

## What It Is
Multi-tenancy means a single application serves multiple customers (tenants), with each tenant's data isolated from others. Think Slack (each workspace is a tenant), Notion (each workspace), or Jira (each organization).

---

## Table of Contents
1. [Isolation Strategies](#isolation-strategies)
2. [Architecture Layers](#architecture-layers-how-to-build-it)
3. [Layer 1: Database Schema](#layer-1-database-schema)
4. [Layer 2: Tenant Context Middleware](#layer-2-tenant-context-middleware)
5. [Layer 3: Data Access Layer (DAL)](#layer-3-data-access-layer-dal)
6. [Layer 4: API Layer](#layer-4-api-layer-next-js)
7. [Layer 5: Frontend / UI Layer](#layer-5-frontend--ui-layer)
8. [Layer 6: Tenant Provisioning](#layer-6-tenant-provisioning)
9. [Layer 7: Tenant-Aware Auth (RBAC)](#layer-7-tenant-aware-auth-rbac)
10. [Layer 8: Rate Limiting & Quotas](#layer-8-rate-limiting--quotas)
11. [Layer 9: Billing & Plans](#layer-9-billing--plans)
12. [Layer 10: Testing Multi-Tenancy](#layer-10-testing-multi-tenancy)
13. [Express.js Multi-Tenant Pattern](#expressjs-multi-tenant-pattern)
14. [Common Mistakes](#common-mistakes)
15. [Key Terms](#key-terms)
16. [Common Interview Questions](#common-interview-questions)

---

## Isolation Strategies

### 1. Row-Level Isolation (Shared Database, Shared Schema)

Every table has a `tenant_id` column. All tenants share the same tables.

```sql
CREATE TABLE projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projects_tenant ON projects(tenant_id);

-- EVERY query MUST filter by tenant_id
SELECT * FROM projects WHERE tenant_id = 'tenant-abc' AND status = 'active';
```

**Row-Level Security (RLS) in Postgres** — automatic filtering:
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON projects
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Set tenant context per request, then queries auto-filter
SET app.current_tenant = 'tenant-abc';
SELECT * FROM projects;  -- Only sees tenant-abc's rows!
```

| Pros | Cons |
|------|------|
| Simplest to implement | Must remember `tenant_id` on every query |
| Easy to scale | One bad query can leak data |
| Low cost | Noisy neighbor risk |
| Easy migrations | Harder to do per-tenant backups |

### 2. Schema-Per-Tenant (Shared Database, Separate Schemas)

```sql
CREATE SCHEMA tenant_acme;
CREATE TABLE tenant_acme.projects ( id UUID PRIMARY KEY, name TEXT NOT NULL );

SET search_path = 'tenant_acme';
SELECT * FROM projects;  -- Only acme's data
```

| Pros | Cons |
|------|------|
| Stronger isolation | Migrations run per-schema (slower) |
| No `tenant_id` everywhere | Schema count limit (~10,000) |
| Per-tenant customization | Connection pooling complexity |

### 3. Database-Per-Tenant (Full Isolation)

| Pros | Cons |
|------|------|
| Strongest isolation | Most expensive |
| Independent scaling | Complex connection management |
| Compliance friendly (HIPAA, SOC2) | Slow tenant provisioning |

### Which Strategy to Choose

| Factor | Row-Level | Schema-Per-Tenant | Database-Per-Tenant |
|--------|-----------|-------------------|---------------------|
| **Tenants** | Thousands+ | Hundreds | Tens |
| **Isolation** | Low-Medium | Medium-High | Maximum |
| **Compliance** | Basic | Moderate | Strict (HIPAA, SOC2) |
| **Cost** | Lowest | Medium | Highest |
| **Complexity** | Lowest | Medium | Highest |

**Most SaaS startups**: Row-Level with RLS. You can migrate later.

---

## Architecture Layers (How to Build It)

A multi-tenant system has clear layers. Build from bottom to top:

```
┌──────────────────────────────────────────────────┐
│                  FRONTEND (Layer 5)               │
│   Tenant-aware UI, org switcher, scoped data     │
├──────────────────────────────────────────────────┤
│                  API LAYER (Layer 4)              │
│   Route handlers, Server Actions, validation     │
├──────────────────────────────────────────────────┤
│             DATA ACCESS LAYER (Layer 3)           │
│   All queries auto-filtered by tenant_id         │
├──────────────────────────────────────────────────┤
│           TENANT CONTEXT (Layer 2)                │
│   Extract tenant from auth → inject into request │
├──────────────────────────────────────────────────┤
│              DATABASE (Layer 1)                    │
│   Schema, RLS policies, indexes                   │
└──────────────────────────────────────────────────┘

Side layers:
├── Auth & RBAC (Layer 7) — who can do what within a tenant
├── Provisioning (Layer 6) — creating new tenants
├── Rate Limiting (Layer 8) — per-tenant quotas
├── Billing (Layer 9) — plans, usage tracking
└── Testing (Layer 10) — verifying isolation
```

---

## Layer 1: Database Schema

### Core Tables

```sql
-- ─── Tenants (organizations) ───
CREATE TABLE tenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,          -- URL-friendly: "acme-corp"
  plan         TEXT NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'enterprise'
  settings     JSONB DEFAULT '{}',            -- tenant-specific config
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── Users (belong to a tenant) ───
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, email)  -- same email can exist in different tenants
);

-- ─── Tenant invitations ───
CREATE TABLE invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'member',
  invited_by   UUID NOT NULL REFERENCES users(id),
  token        TEXT UNIQUE NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── Example business table ───
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'active',
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── Audit log (append-only) ───
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  actor_id      UUID REFERENCES users(id),
  action        TEXT NOT NULL,        -- 'created', 'updated', 'deleted'
  resource_type TEXT NOT NULL,        -- 'project', 'user', 'settings'
  resource_id   UUID NOT NULL,
  changes       JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### Indexes (Critical for Performance)

```sql
-- Every table with tenant_id needs a tenant index
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_projects_tenant ON projects(tenant_id);
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_projects_tenant_status ON projects(tenant_id, status);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
```

### Row-Level Security (Full Setup)

```sql
-- Enable RLS on ALL tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY tenant_users ON users
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_projects ON projects
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_audit ON audit_logs
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Insert policy: force tenant_id to match context
CREATE POLICY tenant_insert_projects ON projects
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);
```

### Prisma Schema

```prisma
// prisma/schema.prisma
model Tenant {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  plan      String   @default("free")
  settings  Json     @default("{}")
  users     User[]
  projects  Project[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  email     String
  name      String
  role      String   @default("member")
  projects  Project[]
  createdAt DateTime @default(now())

  @@unique([tenantId, email])
  @@index([tenantId])
}

model Project {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  status      String   @default("active")
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, status])
}
```

---

## Layer 2: Tenant Context Middleware

The most critical layer. Every request must have a tenant context BEFORE any data access.

### Next.js (Middleware / Proxy)

```tsx
// lib/tenant.ts — THE core function everything depends on
import { auth } from '@/lib/auth';
import { cache } from 'react';

// Cached per-request (React cache deduplicates within a single request)
export const getTenantContext = cache(async () => {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!session.user.tenantId) {
    throw new Error('No tenant context — user must belong to an organization');
  }

  return {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    userRole: session.user.role as 'owner' | 'admin' | 'member' | 'viewer',
  };
});

// Shortcut
export async function getTenantId(): Promise<string> {
  const ctx = await getTenantContext();
  return ctx.tenantId;
}
```

### Tenant Resolution Strategies

```tsx
// Strategy 1: From authenticated user (most common)
const tenantId = session.user.tenantId;

// Strategy 2: From subdomain (acme.yourapp.com)
function getTenantFromSubdomain(host: string): string | null {
  const parts = host.split('.');
  if (parts.length >= 3) {
    return parts[0]; // "acme" from "acme.yourapp.com"
  }
  return null;
}

// Strategy 3: From URL path (/org/acme/projects)
function getTenantFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/org\/([^/]+)/);
  return match?.[1] ?? null;
}

// Strategy 4: From custom header (API clients)
function getTenantFromHeader(request: Request): string | null {
  return request.headers.get('X-Tenant-ID');
}

// Resolve in priority order
async function resolveTenant(request: Request): Promise<string> {
  // 1. Try auth session
  const session = await auth();
  if (session?.user?.tenantId) return session.user.tenantId;

  // 2. Try subdomain
  const host = request.headers.get('host') || '';
  const subdomain = getTenantFromSubdomain(host);
  if (subdomain) {
    const tenant = await db.tenant.findUnique({ where: { slug: subdomain } });
    if (tenant) return tenant.id;
  }

  // 3. Try header (for API clients)
  const headerTenant = getTenantFromHeader(request);
  if (headerTenant) return headerTenant;

  throw new Error('Could not resolve tenant');
}
```

---

## Layer 3: Data Access Layer (DAL)

**THE RULE**: No raw Prisma/SQL calls in route handlers. ALL data access goes through tenant-scoped functions.

```tsx
// lib/dal/projects.ts
import { getTenantContext } from '@/lib/tenant';
import { db } from '@/lib/db';

// ─── READ (always filtered) ───
export async function getProjects() {
  const { tenantId } = await getTenantContext();
  return db.project.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProjectById(id: string) {
  const { tenantId } = await getTenantContext();
  const project = await db.project.findUnique({ where: { id } });

  // CRITICAL: verify the project belongs to this tenant
  if (!project || project.tenantId !== tenantId) {
    return null; // Don't reveal it exists to other tenants
  }

  return project;
}

// ─── CREATE (always inject tenantId) ───
export async function createProject(data: { name: string; description?: string }) {
  const { tenantId, userId } = await getTenantContext();
  return db.project.create({
    data: {
      ...data,
      tenantId,         // ALWAYS inject
      createdById: userId,
    },
  });
}

// ─── UPDATE (verify ownership first) ───
export async function updateProject(id: string, data: { name?: string; status?: string }) {
  const { tenantId } = await getTenantContext();

  // Update ONLY if it belongs to this tenant
  const updated = await db.project.updateMany({
    where: { id, tenantId },  // Both conditions!
    data: { ...data, updatedAt: new Date() },
  });

  if (updated.count === 0) {
    throw new Error('Project not found');
  }

  return db.project.findUnique({ where: { id } });
}

// ─── DELETE (verify ownership) ───
export async function deleteProject(id: string) {
  const { tenantId } = await getTenantContext();

  const deleted = await db.project.deleteMany({
    where: { id, tenantId },
  });

  if (deleted.count === 0) {
    throw new Error('Project not found');
  }
}
```

### Prisma Extension (Auto-Filter)

Instead of manually adding `tenantId` everywhere, extend Prisma:

```tsx
// lib/db.ts
import { PrismaClient } from '@prisma/client';
import { getTenantId } from '@/lib/tenant';

const basePrisma = new PrismaClient();

// Auto-inject tenantId on every query
export const db = basePrisma.$extends({
  query: {
    $allModels: {
      async findMany({ args, query }) {
        const tenantId = await getTenantId();
        args.where = { ...args.where, tenantId };
        return query(args);
      },
      async findFirst({ args, query }) {
        const tenantId = await getTenantId();
        args.where = { ...args.where, tenantId };
        return query(args);
      },
      async create({ args, query }) {
        const tenantId = await getTenantId();
        args.data = { ...args.data, tenantId };
        return query(args);
      },
      async update({ args, query }) {
        const tenantId = await getTenantId();
        args.where = { ...args.where, tenantId };
        return query(args);
      },
      async delete({ args, query }) {
        const tenantId = await getTenantId();
        args.where = { ...args.where, tenantId };
        return query(args);
      },
    },
  },
});

// Now ALL queries are auto-scoped:
// db.project.findMany() → automatically adds WHERE tenant_id = ...
// db.project.create({ data: { name: 'X' } }) → auto-injects tenantId
```

---

## Layer 4: API Layer (Next.js)

### Server Actions

```tsx
// app/actions/projects.ts
'use server';

import { createProject, updateProject, deleteProject } from '@/lib/dal/projects';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function createProjectAction(formData: FormData) {
  const parsed = CreateProjectSchema.parse({
    name: formData.get('name'),
    description: formData.get('description'),
  });

  const project = await createProject(parsed);
  revalidatePath('/projects');
  return project;
}

export async function deleteProjectAction(id: string) {
  await deleteProject(id); // DAL handles tenant check
  revalidatePath('/projects');
}
```

### Route Handlers (API)

```tsx
// app/api/projects/route.ts
import { getProjects, createProject } from '@/lib/dal/projects';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const projects = await getProjects(); // Auto-scoped to tenant
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const project = await createProject(body); // Auto-injects tenantId
  return NextResponse.json(project, { status: 201 });
}
```

```tsx
// app/api/projects/[id]/route.ts
import { getProjectById, updateProject, deleteProject } from '@/lib/dal/projects';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const project = await getProjectById(params.id);
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(project);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const project = await updateProject(params.id, body);
  return Response.json(project);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await deleteProject(params.id);
  return new Response(null, { status: 204 });
}
```

---

## Layer 5: Frontend / UI Layer

### Organization Switcher

```tsx
'use client';

import { useState } from 'react';

interface Org { id: string; name: string; slug: string; role: string; }

function OrgSwitcher({ orgs, currentOrg }: { orgs: Org[]; currentOrg: Org }) {
  const [open, setOpen] = useState(false);

  async function switchOrg(orgId: string) {
    // Update session/cookie with new tenantId
    await fetch('/api/auth/switch-org', {
      method: 'POST',
      body: JSON.stringify({ orgId }),
    });
    window.location.href = '/'; // Full reload to reset tenant context
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2">
        <span className="font-semibold">{currentOrg.name}</span>
        <span className="text-xs text-gray-500">{currentOrg.role}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg min-w-48">
          {orgs.map(org => (
            <button
              key={org.id}
              onClick={() => switchOrg(org.id)}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                org.id === currentOrg.id ? 'font-semibold bg-gray-50' : ''
              }`}
            >
              {org.name}
              <span className="text-gray-400 text-xs ml-2">{org.role}</span>
            </button>
          ))}
          <hr />
          <a href="/create-org" className="block px-4 py-2 text-sm text-blue-500">
            + Create organization
          </a>
        </div>
      )}
    </div>
  );
}
```

### Tenant-Scoped Data Fetching

```tsx
// app/projects/page.tsx (Server Component)
import { getProjects } from '@/lib/dal/projects';

export default async function ProjectsPage() {
  const projects = await getProjects(); // Auto-scoped — no tenantId in UI code!

  return (
    <div>
      <h1>Projects</h1>
      {projects.map(p => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
}
```

---

## Layer 6: Tenant Provisioning

What happens when a new organization is created:

```tsx
// lib/dal/tenants.ts
import { db } from '@/lib/db';

export async function provisionTenant(input: {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  plan?: string;
}) {
  return db.$transaction(async (tx) => {
    // 1. Create tenant
    const tenant = await tx.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        plan: input.plan || 'free',
        settings: {
          maxUsers: input.plan === 'enterprise' ? 500 : input.plan === 'pro' ? 50 : 5,
          maxProjects: input.plan === 'enterprise' ? -1 : input.plan === 'pro' ? 100 : 3,
          features: ['basic'],
        },
      },
    });

    // 2. Create owner user
    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: input.ownerEmail,
        name: input.ownerName,
        role: 'owner',
      },
    });

    // 3. Seed default data
    await tx.project.create({
      data: {
        tenantId: tenant.id,
        name: 'Getting Started',
        description: 'Your first project',
        createdById: user.id,
      },
    });

    // 4. Log the event
    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorId: user.id,
        action: 'created',
        resourceType: 'tenant',
        resourceId: tenant.id,
      },
    });

    return { tenant, user };
  });
}

// Validate slug uniqueness
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await db.tenant.findUnique({ where: { slug } });
  return !existing;
}
```

---

## Layer 7: Tenant-Aware Auth (RBAC)

### Role Hierarchy

```
owner    → Can do everything, including deleting the org
admin    → Can manage users, settings, all resources
member   → Can create/edit/delete own resources
viewer   → Read-only access
```

### Permission Check

```tsx
// lib/auth/permissions.ts
const PERMISSIONS = {
  owner:  ['*'],
  admin:  ['users:manage', 'settings:manage', 'projects:create', 'projects:edit', 'projects:delete', 'projects:read'],
  member: ['projects:create', 'projects:edit', 'projects:delete', 'projects:read'],
  viewer: ['projects:read'],
} as const;

export function hasPermission(role: string, permission: string): boolean {
  const perms = PERMISSIONS[role as keyof typeof PERMISSIONS];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(permission as any);
}

// Usage in DAL
export async function deleteProject(id: string) {
  const ctx = await getTenantContext();

  if (!hasPermission(ctx.userRole, 'projects:delete')) {
    throw new Error('Forbidden: insufficient permissions');
  }

  // Also check: is this user the owner of this project? (for member role)
  const project = await db.project.findUnique({ where: { id } });
  if (!project || project.tenantId !== ctx.tenantId) {
    throw new Error('Not found');
  }

  if (ctx.userRole === 'member' && project.createdById !== ctx.userId) {
    throw new Error('Forbidden: members can only delete their own projects');
  }

  await db.project.delete({ where: { id } });
}
```

### Invite System

```tsx
export async function inviteUser(email: string, role: string) {
  const ctx = await getTenantContext();

  if (!hasPermission(ctx.userRole, 'users:manage')) {
    throw new Error('Forbidden');
  }

  // Check plan limits
  const userCount = await db.user.count({ where: { tenantId: ctx.tenantId } });
  const tenant = await db.tenant.findUnique({ where: { id: ctx.tenantId } });
  const maxUsers = (tenant?.settings as any)?.maxUsers || 5;

  if (userCount >= maxUsers) {
    throw new Error(`Plan limit reached (${maxUsers} users). Upgrade to add more.`);
  }

  // Create invitation
  const token = crypto.randomUUID();
  await db.invitation.create({
    data: {
      tenantId: ctx.tenantId,
      email,
      role,
      invitedBy: ctx.userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Send invitation email
  await sendEmail({
    to: email,
    subject: `You're invited to ${tenant?.name}`,
    link: `https://app.yoursite.com/invite/${token}`,
  });
}
```

---

## Layer 8: Rate Limiting & Quotas

Prevent noisy neighbors (one tenant consuming all resources).

```tsx
// lib/rateLimit.ts
import { getTenantContext } from '@/lib/tenant';

interface TenantLimits {
  requestsPerMinute: number;
  maxProjects: number;
  maxStorageMB: number;
}

const PLAN_LIMITS: Record<string, TenantLimits> = {
  free:       { requestsPerMinute: 60,   maxProjects: 3,   maxStorageMB: 100 },
  pro:        { requestsPerMinute: 300,  maxProjects: 100, maxStorageMB: 5000 },
  enterprise: { requestsPerMinute: 1000, maxProjects: -1,  maxStorageMB: 50000 },
};

// Check resource quota before creating
export async function checkProjectQuota() {
  const ctx = await getTenantContext();
  const tenant = await db.tenant.findUnique({ where: { id: ctx.tenantId } });
  const limits = PLAN_LIMITS[tenant?.plan || 'free'];

  if (limits.maxProjects === -1) return; // Unlimited

  const count = await db.project.count({ where: { tenantId: ctx.tenantId } });
  if (count >= limits.maxProjects) {
    throw new Error(`Project limit reached (${limits.maxProjects}). Upgrade your plan.`);
  }
}
```

---

## Layer 9: Billing & Plans

```tsx
// lib/dal/billing.ts
export async function upgradePlan(newPlan: 'pro' | 'enterprise') {
  const ctx = await getTenantContext();

  if (ctx.userRole !== 'owner') {
    throw new Error('Only the owner can change the plan');
  }

  await db.tenant.update({
    where: { id: ctx.tenantId },
    data: {
      plan: newPlan,
      settings: {
        maxUsers: newPlan === 'enterprise' ? 500 : 50,
        maxProjects: newPlan === 'enterprise' ? -1 : 100,
        features: newPlan === 'enterprise'
          ? ['basic', 'advanced', 'audit', 'sso', 'api']
          : ['basic', 'advanced'],
      },
    },
  });

  // Trigger Stripe subscription update, etc.
}

// Feature gating
export async function hasFeature(feature: string): Promise<boolean> {
  const ctx = await getTenantContext();
  const tenant = await db.tenant.findUnique({ where: { id: ctx.tenantId } });
  const features = (tenant?.settings as any)?.features || [];
  return features.includes(feature);
}

// Usage
export async function exportData() {
  if (!(await hasFeature('api'))) {
    throw new Error('Data export requires Enterprise plan');
  }
  // ... export logic
}
```

---

## Layer 10: Testing Multi-Tenancy

### Test: Data Isolation

```tsx
describe('Multi-tenant isolation', () => {
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    // Create two tenants
    const a = await provisionTenant({ name: 'Tenant A', slug: 'tenant-a', ownerEmail: 'a@test.com', ownerName: 'A' });
    const b = await provisionTenant({ name: 'Tenant B', slug: 'tenant-b', ownerEmail: 'b@test.com', ownerName: 'B' });
    tenantA = a.tenant.id;
    tenantB = b.tenant.id;
  });

  it('tenant A cannot see tenant B data', async () => {
    // Create project as tenant A
    mockTenantContext(tenantA);
    const project = await createProject({ name: 'Secret Project' });

    // Try to access as tenant B
    mockTenantContext(tenantB);
    const result = await getProjectById(project.id);

    expect(result).toBeNull(); // MUST be null!
  });

  it('tenant A cannot update tenant B data', async () => {
    mockTenantContext(tenantA);
    const project = await createProject({ name: 'A Project' });

    mockTenantContext(tenantB);
    await expect(updateProject(project.id, { name: 'Hacked' }))
      .rejects.toThrow('not found');
  });

  it('tenant A cannot delete tenant B data', async () => {
    mockTenantContext(tenantA);
    const project = await createProject({ name: 'Protected' });

    mockTenantContext(tenantB);
    await expect(deleteProject(project.id))
      .rejects.toThrow('not found');
  });

  it('listing only returns current tenant data', async () => {
    mockTenantContext(tenantA);
    await createProject({ name: 'A1' });
    await createProject({ name: 'A2' });

    mockTenantContext(tenantB);
    await createProject({ name: 'B1' });

    mockTenantContext(tenantA);
    const projects = await getProjects();
    expect(projects.every(p => p.tenantId === tenantA)).toBe(true);
    expect(projects.some(p => p.name === 'B1')).toBe(false);
  });
});
```

---

## Express.js Multi-Tenant Pattern

```tsx
// middleware/tenant.ts
import { Request, Response, NextFunction } from 'express';

// Attach tenant context to every request
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extract from auth token (JWT)
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(401).json({ error: 'No tenant context' });
  }

  req.tenantId = tenantId;
  req.userRole = req.user.role;
  next();
}

// Auto-scope Prisma queries per request
export function scopedDb(req: Request) {
  // Return a Prisma client that auto-filters by tenantId
  return {
    project: {
      findMany: (args: any = {}) =>
        db.project.findMany({ ...args, where: { ...args.where, tenantId: req.tenantId } }),
      create: (args: any) =>
        db.project.create({ ...args, data: { ...args.data, tenantId: req.tenantId } }),
      update: (args: any) =>
        db.project.update({ ...args, where: { ...args.where, tenantId: req.tenantId } }),
      delete: (args: any) =>
        db.project.delete({ ...args, where: { ...args.where, tenantId: req.tenantId } }),
    },
  };
}

// Routes
app.use('/api', authMiddleware, tenantMiddleware);

app.get('/api/projects', async (req, res) => {
  const projects = await scopedDb(req).project.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(projects);
});

app.post('/api/projects', async (req, res) => {
  const project = await scopedDb(req).project.create({
    data: { name: req.body.name },
  });
  res.status(201).json(project);
});
```

---

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Forgetting `WHERE tenant_id = ...` | **Data leakage** — users see other tenant's data | Use DAL or Prisma extension to auto-inject |
| Not checking tenantId on update/delete | Tenant A can modify Tenant B's data | Always `WHERE id = $1 AND tenant_id = $2` |
| Trusting client-sent tenantId | Users can switch to any tenant | Derive tenantId from server-side auth only |
| Same email = same user across tenants | Users can access wrong tenant | `UNIQUE(tenant_id, email)` not `UNIQUE(email)` |
| No rate limiting per tenant | Noisy neighbor slows everyone | Per-tenant request quotas |
| Testing with only one tenant | Doesn't catch isolation bugs | Always test with 2+ tenants |
| Hardcoding plan limits | Can't upgrade without deploy | Store in tenant settings JSONB |

---

## Key Terms

- **Tenant**: A customer/organization in a multi-tenant system
- **Multi-tenancy**: One app serving multiple isolated customers
- **Row-Level Security (RLS)**: Postgres feature that auto-filters rows by policy
- **Schema-per-tenant**: Each tenant gets their own Postgres schema
- **Database-per-tenant**: Full isolation with separate databases
- **Noisy neighbor**: One tenant's heavy usage affecting others
- **Tenant context**: The current tenant ID derived from the authenticated user
- **Data leakage**: Accidentally exposing one tenant's data to another (critical bug)
- **Tenant provisioning**: Creating all resources when a new tenant signs up
- **DAL (Data Access Layer)**: Functions that auto-scope all queries to a tenant
- **Tenant resolution**: Determining which tenant from auth/subdomain/path/header
- **Organization switcher**: UI to switch between tenants a user belongs to
- **Feature gating**: Restricting features based on tenant's plan
- **Resource quota**: Per-tenant limits (max users, projects, storage)

---

## Common Interview Questions

1. **Which isolation strategy would you choose for a SaaS product?**
   - Start with row-level + RLS (simplest, cheapest). Move to schema-per-tenant if compliance requires it. Most SaaS companies never need database-per-tenant.

2. **How do you prevent data leakage between tenants?**
   - DAL or Prisma extension that auto-injects tenantId. Never use raw queries. Always `WHERE tenant_id AND id`. RLS as a safety net. Test with multiple tenants.

3. **What's the noisy neighbor problem?**
   - One tenant's heavy workload degrades performance for others. Fix with per-tenant rate limiting, query timeouts, resource quotas per plan, and background job isolation.

4. **How do you handle tenant-specific customization?**
   - JSONB `settings` column on tenant table for config. Feature flags per plan. For deep customization (different schema), consider schema-per-tenant.

5. **How do you resolve which tenant a request belongs to?**
   - Auth session (most common), subdomain (`acme.app.com`), URL path (`/org/acme`), or API header (`X-Tenant-ID`). Always verify server-side, never trust client.

6. **How would you architect the data access layer?**
   - All queries go through a DAL that auto-injects tenantId. Or use a Prisma extension. Never let route handlers write raw queries. This is the single most important pattern.

7. **How do you handle a user belonging to multiple organizations?**
   - Many-to-many: `memberships` table (userId, tenantId, role). Session stores the active tenantId. Org switcher in the UI to change active org.

8. **How do you test multi-tenant isolation?**
   - Create 2 tenants in tests. Verify tenant A can't read/update/delete tenant B's data. Verify listings only return current tenant's data. Automate in CI.

9. **How do you handle plan limits and billing?**
   - Store limits in tenant settings. Check quota before creating resources. Stripe for payment processing. Feature gating via plan-level feature arrays.

10. **How would you migrate from single-tenant to multi-tenant?**
    - Add `tenant_id` column to all tables. Create a default tenant. Backfill existing data with that tenant. Add DAL layer. Enable RLS. Deploy. Then support multiple tenants.
