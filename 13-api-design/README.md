# API Design (REST & GraphQL)

## What It Is
API design is how you structure the interface between your frontend and backend (or between services). Good API design is consistent, predictable, secure, and easy to evolve.

---

## REST API Design

### Resource Naming

```
GET    /api/users              → List users
GET    /api/users/123          → Get user 123
POST   /api/users              → Create a user
PUT    /api/users/123          → Replace user 123 entirely
PATCH  /api/users/123          → Update user 123 partially
DELETE /api/users/123          → Delete user 123

GET    /api/users/123/posts    → List posts by user 123
POST   /api/users/123/posts    → Create a post for user 123
```

**Rules**:
- Use nouns, not verbs (`/users`, not `/getUsers`)
- Use plural (`/users`, not `/user`)
- Use kebab-case (`/user-profiles`, not `/userProfiles`)
- Nest for relationships (`/users/123/posts`)

### HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Read data | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Replace resource entirely | Yes | No |
| PATCH | Partial update | Yes (should be) | No |
| DELETE | Remove resource | Yes | No |

### Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not allowed |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate or state conflict |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Server Error | Server bug |

### Pagination

**Cursor-based** (recommended for real-time data):
```json
GET /api/posts?cursor=abc123&limit=20

{
  "data": [...],
  "nextCursor": "def456",
  "hasMore": true
}
```

**Offset-based** (simpler, good for static data):
```json
GET /api/posts?page=2&limit=20

{
  "data": [...],
  "total": 150,
  "page": 2,
  "totalPages": 8
}
```

### Versioning

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| URL path | `/api/v1/users` | Simple, clear | URL changes |
| Header | `Accept: application/vnd.api+json;version=2` | Clean URLs | Hidden |
| Query param | `/api/users?version=2` | Easy to test | Pollutes URL |

### Idempotency

Same request produces same result regardless of how many times it's sent.

```
POST /api/payments
Headers:
  Idempotency-Key: abc-123-def

Body: { amount: 100, currency: "USD" }
```

If the client retries with the same `Idempotency-Key`, the server returns the previous result instead of creating a duplicate payment.

### Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Must be a valid email address" },
      { "field": "age", "message": "Must be at least 18" }
    ]
  }
}
```

---

## GraphQL

### What It Is
A query language where the **client** specifies exactly what data it needs. One endpoint, flexible queries.

### Query

```graphql
# Client asks for exactly what it needs
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts(first: 5) {
      title
      createdAt
    }
  }
}
```

### Mutation

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    author {
      name
    }
  }
}
```

### Schema Definition

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  createdAt: DateTime!
}

type Query {
  user(id: ID!): User
  users(first: Int, after: String): UserConnection!
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
}
```

### REST vs GraphQL

| Aspect | REST | GraphQL |
|--------|------|---------|
| Endpoints | Multiple (`/users`, `/posts`) | Single (`/graphql`) |
| Data shape | Server decides | Client decides |
| Over-fetching | Common (get entire user object) | None (ask for specific fields) |
| Under-fetching | Common (need multiple requests) | None (one request) |
| Caching | HTTP caching (simple) | More complex (normalized cache) |
| Learning curve | Lower | Higher |
| Best for | Simple CRUD, public APIs | Complex data relationships, mobile |

---

## Key Terms

- **REST**: Representational State Transfer — HTTP-based API architecture
- **GraphQL**: Query language where client specifies data shape
- **Idempotency**: Same request = same result, safe to retry
- **Idempotency key**: Client-generated unique ID to prevent duplicate operations
- **Pagination**: Breaking data into pages (cursor-based or offset-based)
- **Cursor-based pagination**: Use an opaque cursor to fetch next page (better for real-time)
- **Versioning**: Managing API changes without breaking existing clients
- **Over-fetching**: Getting more data than you need (REST problem)
- **Under-fetching**: Needing multiple requests to get all data (REST problem)
- **N+1 problem**: Fetching related data in a loop instead of batching (GraphQL pitfall)
- **Error semantics**: Structured, meaningful error responses

---

## Common Interview Questions

1. **REST vs GraphQL — when would you choose each?**
   - REST: simple CRUD, public API, strong HTTP caching
   - GraphQL: complex relationships, mobile (bandwidth), client-driven queries

2. **What is idempotency and why does it matter?**
   - Same request yields same result. Critical for payments, retries, unreliable networks.

3. **Cursor vs offset pagination?**
   - Cursor: no duplicates/skips when data changes, better performance
   - Offset: simpler, shows total count, allows jumping to specific page

4. **How do you handle breaking API changes?**
   - Version the API, deprecate old versions with timeline, provide migration guides
