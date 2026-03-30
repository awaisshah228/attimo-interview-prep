# PostgreSQL

## What It Is
PostgreSQL (Postgres) is an open-source relational database. It's the most common database for production web applications, known for reliability, extensibility, and standards compliance.

---

## Data Modelling

### Tables and Relations

```sql
-- Users table
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Posts table (one-to-many: user has many posts)
CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  content     TEXT,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags table (many-to-many via junction table)
CREATE TABLE tags (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
```

### Relationships

| Type | Example | Implementation |
|------|---------|----------------|
| **One-to-One** | User → Profile | Foreign key with UNIQUE constraint |
| **One-to-Many** | User → Posts | Foreign key on the "many" side |
| **Many-to-Many** | Posts ↔ Tags | Junction/join table |

### Normalization Levels

| Normal Form | Rule | Example |
|-------------|------|---------|
| **1NF** | No repeating groups, atomic values | Don't store `"tag1,tag2"` in one column |
| **2NF** | No partial dependencies on composite key | Split into separate tables |
| **3NF** | No transitive dependencies | Don't store `city` and `country` if city determines country |

---

## Migrations

### What They Are
Versioned, incremental changes to your database schema. Applied in order, can be rolled back.

### With Prisma (most popular in Next.js)

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  posts     Post[]
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
}
```

```bash
# Generate migration from schema changes
npx prisma migrate dev --name add_users_table

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### With Drizzle

```tsx
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## Indexing

### What It Does
Indexes are data structures (usually B-trees) that speed up queries at the cost of slower writes and more storage.

### Types of Indexes

```sql
-- B-tree (default) — equality and range queries
CREATE INDEX idx_users_email ON users(email);

-- Composite index — queries on multiple columns
CREATE INDEX idx_posts_tenant_status ON posts(tenant_id, status);

-- Partial index — only index a subset of rows
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- GIN index — for full-text search, JSONB, arrays
CREATE INDEX idx_posts_content_search ON posts USING gin(to_tsvector('english', content));

-- Unique index — enforces uniqueness
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
```

### When to Add Indexes

- Columns in `WHERE` clauses
- Columns in `JOIN` conditions
- Columns in `ORDER BY`
- Foreign key columns
- Columns used in `UNIQUE` constraints

### When NOT to Index

- Small tables (<1000 rows)
- Columns with low cardinality (e.g., boolean)
- Tables with heavy writes and rare reads

---

## Query Optimisation

### EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT * FROM posts
WHERE tenant_id = '123' AND status = 'published'
ORDER BY created_at DESC
LIMIT 20;

-- Output shows:
-- Seq Scan vs Index Scan (index scan is faster)
-- Actual time (in milliseconds)
-- Rows examined vs rows returned
-- Sort method (in-memory vs disk)
```

### Common Optimisations

```sql
-- 1. Use specific columns instead of SELECT *
SELECT id, title, created_at FROM posts WHERE ...;

-- 2. Use LIMIT for pagination
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 0;

-- 3. Avoid N+1 queries — use JOINs
SELECT p.*, u.name as author_name
FROM posts p
JOIN users u ON p.author_id = u.id
WHERE p.tenant_id = '123';

-- 4. Use EXISTS instead of IN for subqueries
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM posts p WHERE p.author_id = u.id);

-- 5. Batch inserts
INSERT INTO tags (name) VALUES ('tag1'), ('tag2'), ('tag3');
```

---

## JSONB (Semi-structured Data)

```sql
-- Store flexible metadata
ALTER TABLE posts ADD COLUMN metadata JSONB DEFAULT '{}';

-- Query JSONB
SELECT * FROM posts WHERE metadata->>'category' = 'tech';
SELECT * FROM posts WHERE metadata @> '{"featured": true}';

-- Index JSONB
CREATE INDEX idx_posts_metadata ON posts USING gin(metadata);
```

---

## Key Terms

- **Primary Key**: Unique identifier for each row
- **Foreign Key**: Reference to another table's primary key
- **Index**: Data structure that speeds up queries (B-tree, GIN, etc.)
- **Migration**: Versioned schema change (up + down)
- **Normalization**: Organizing data to reduce redundancy
- **N+1 problem**: Fetching related data in a loop instead of joining
- **EXPLAIN ANALYZE**: Shows query execution plan and actual performance
- **B-tree index**: Default index type, good for equality and range queries
- **GIN index**: For full-text search, JSONB, and array columns
- **Partial index**: Index only rows matching a condition
- **JSONB**: Binary JSON column type for semi-structured data
- **UUID**: Universally Unique Identifier — better than auto-increment for distributed systems
- **CASCADE**: Automatically delete/update related rows
- **Transaction**: Group of operations that succeed or fail together (ACID)

---

## Common Interview Questions

1. **When would you denormalize data?**
   - For read-heavy workloads where JOINs are expensive, caching results, or aggregated data

2. **How do you handle the N+1 query problem?**
   - Use JOINs, batch loading (DataLoader in GraphQL), or eager loading in ORMs

3. **How do you decide which indexes to create?**
   - Run `EXPLAIN ANALYZE` on slow queries, index columns in WHERE/JOIN/ORDER BY

4. **UUID vs auto-increment ID?**
   - UUID: no collisions, safe for distributed systems, doesn't leak sequence info
   - Auto-increment: smaller, faster, sortable by creation time
