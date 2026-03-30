# Authentication & Authorisation

## What It Is
- **Authentication (AuthN)**: Verifying WHO the user is ("prove your identity")
- **Authorisation (AuthZ)**: Verifying WHAT the user can do ("check your permissions")

---

## Authentication Methods

### Session-Based Auth

```
1. User submits email + password
2. Server verifies credentials, creates a session record in DB
3. Server sends session ID in a httpOnly cookie
4. Browser sends cookie with every request
5. Server looks up session ID → finds the user
```

```tsx
// Set session cookie
response.cookies.set('session', sessionId, {
  httpOnly: true,     // JS can't read it (XSS protection)
  secure: true,       // HTTPS only
  sameSite: 'lax',    // CSRF protection
  maxAge: 60 * 60 * 24 * 7,  // 1 week
  path: '/',
});
```

**Pros**: Simple, server controls session lifecycle, easy to invalidate
**Cons**: Requires server-side storage, harder to scale across servers

### JWT (JSON Web Tokens)

```
1. User submits credentials
2. Server verifies, creates a JWT (signed token containing user data)
3. Client stores JWT (usually in memory or httpOnly cookie)
4. Client sends JWT in Authorization header
5. Server verifies JWT signature (no DB lookup needed)
```

**JWT Structure** (3 parts separated by dots):
```
header.payload.signature

header:    { "alg": "HS256", "typ": "JWT" }
payload:   { "sub": "user123", "role": "admin", "exp": 1700000000 }
signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
```

**Pros**: Stateless (no server-side storage), works across services
**Cons**: Can't revoke until expiry, larger than session ID

### OAuth 2.0 / Social Login
Third-party authentication (Google, GitHub, etc.).

```
1. User clicks "Sign in with Google"
2. App redirects to Google's auth page
3. User authorizes the app
4. Google redirects back with an authorization code
5. App exchanges code for access token + user info
6. App creates/links local account
```

### Refresh Token Pattern

```
Access Token:  Short-lived (15 min), sent with every request
Refresh Token: Long-lived (7 days), stored securely, used to get new access tokens

Flow:
1. Access token expires → 401 response
2. Client sends refresh token to /api/auth/refresh
3. Server validates refresh token, issues new access + refresh tokens
4. Client retries original request with new access token
```

---

## Authorisation

### RBAC (Role-Based Access Control)

Users are assigned **roles**, roles have **permissions**.

```tsx
// Define roles and permissions
const PERMISSIONS = {
  admin:  ['create', 'read', 'update', 'delete', 'manage_users'],
  editor: ['create', 'read', 'update'],
  viewer: ['read'],
} as const;

// Check permission
function hasPermission(userRole: string, permission: string): boolean {
  return PERMISSIONS[userRole]?.includes(permission) ?? false;
}

// Middleware
function requirePermission(permission: string) {
  return async (req, res, next) => {
    const user = req.user;
    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.delete('/api/posts/:id', requirePermission('delete'), deletePost);
```

### Server-Side Enforcement

**CRITICAL**: Always enforce auth on the server. Client-side checks are cosmetic only.

```tsx
// Next.js Server Action
'use server';

import { auth } from '@/lib/auth';

export async function deletePost(postId: string) {
  const session = await auth();

  // AuthN: is the user logged in?
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // AuthZ: does the user have permission?
  const post = await db.post.findUnique({ where: { id: postId } });
  if (post.authorId !== session.user.id && session.user.role !== 'admin') {
    throw new Error('Forbidden');
  }

  await db.post.delete({ where: { id: postId } });
  revalidatePath('/posts');
}
```

### Least Privilege Principle
Give users the **minimum permissions** they need. Default to no access, explicitly grant.

```tsx
// Bad: check if user is NOT blocked
if (!user.isBlocked) { /* allow */ }

// Good: check if user IS explicitly permitted
if (user.permissions.includes('edit_posts')) { /* allow */ }
```

---

## Next.js Auth Pattern (with Middleware)

```tsx
// middleware.ts
import { auth } from './lib/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isPublicRoute = ['/login', '/signup', '/'].includes(req.nextUrl.pathname);

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL('/login', req.nextUrl));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Secure Token/Session Handling

| Practice | Why |
|----------|-----|
| `httpOnly` cookies | Prevents XSS from reading tokens |
| `secure` flag | Only sent over HTTPS |
| `sameSite: 'lax'` | CSRF protection |
| Short expiry for access tokens | Limits damage if stolen |
| Rotate refresh tokens | Detect token theft |
| Hash tokens in DB | If DB is breached, tokens are useless |
| Rate limit login attempts | Prevent brute force |

---

## Key Terms

- **AuthN (Authentication)**: Proving identity (login)
- **AuthZ (Authorisation)**: Checking permissions (access control)
- **RBAC**: Role-Based Access Control — permissions mapped to roles
- **JWT**: JSON Web Token — signed, stateless auth token
- **Session**: Server-side record linking a cookie to a user
- **OAuth 2.0**: Protocol for third-party auth (social login)
- **Access token**: Short-lived token for API access
- **Refresh token**: Long-lived token to get new access tokens
- **CSRF**: Cross-Site Request Forgery — tricking a user's browser into making requests
- **XSS**: Cross-Site Scripting — injecting malicious scripts
- **httpOnly cookie**: Cookie that JavaScript cannot read
- **Least privilege**: Minimum permissions necessary
- **Middleware auth**: Checking auth before the request reaches the route handler

---

## Common Interview Questions

1. **JWT vs Sessions?**
   - JWT: stateless, scalable, can't revoke easily
   - Sessions: server-side control, easy to invalidate, needs storage

2. **How do you implement RBAC?**
   - Define roles → map permissions to roles → check permissions server-side on every request

3. **What's the principle of least privilege?**
   - Users get minimum permissions needed. Default deny, explicitly grant.

4. **How do you protect against CSRF?**
   - `sameSite` cookies, CSRF tokens, verify Origin/Referer headers

5. **Where should you enforce authorization?**
   - Always on the server. Client checks are only for UX (hiding buttons), not security.
