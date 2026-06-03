---
name: Clerk auth in Replit preview iframe
description: Why API calls 401 inside the Replit preview and how the dashboard authenticates against the API server with Clerk
---

# Clerk auth inside the Replit preview iframe

The app runs inside the Replit preview iframe. Clerk's `__session` cookie is
treated as a third-party cookie there and is blocked, so cookie-based auth does
NOT reach the API server — requests arrive with no session and the backend
`requireAuth` returns 401.

**Fix:** send the Clerk session JWT as an `Authorization: Bearer <token>` header
instead of relying on the cookie.

**How to apply:**
- The shared fetch mutator exposes `setAuthTokenGetter(getter)`; when a getter is
  registered it attaches the bearer header (only if no auth header is already
  set). The dashboard registers it inside `<ClerkProvider>` via Clerk
  `useAuth().getToken`, with a cleanup that resets the getter to null on unmount.
- `clerkMiddleware()` on the backend reads the `Authorization` header, so
  `getAuth(req)` resolves the user from the bearer token.

## @clerk/express clerkClient is an object, not a function
In `@clerk/express` v2.x, `clerkClient` is an instance object — call
`clerkClient.users.getUser(userId)` directly. Calling it as `clerkClient()`
throws `TypeError: clerkClient is not a function`.

**Why it mattered:** the session JWT often lacks an email claim, so
`requireAuth` falls back to `clerkClient.users.getUser` to read the email for the
@alkami.com / @alkamitech.com domain check. When that call threw, the domain
restriction was silently skipped.

## requireAuth must fail closed
If no email can be determined (no email claim AND the Clerk lookup fails),
`requireAuth` must return 403 — never fall through to `next()`. Failing open
defeats the domain allowlist. The Clerk lookup reliably returns the email for
real users, so failing closed does not lock out legitimate accounts.
