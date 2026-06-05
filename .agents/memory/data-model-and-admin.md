---
name: Shared data model and admin-only uploads
description: The dashboard data is global (not per-user), and why data imports are restricted to an admin
---

# Shared data model

The `pages` table has NO per-user scoping — no `user_id` column, and queries do
not filter by the requester. Every authenticated user reads the same global
dataset. A Monthly Refresh / CSV upload overwrites the rows everyone sees.

**Implication:** there is no per-user data isolation or draft/staging state. A
data import is immediately live for the whole team.

# Admin-only data imports

Because imports mutate the shared dataset, the data-mutating endpoints
(`/pages/monthly-refresh`, `/pages/upload-csv`, `/pages/upload-semrush-csv`, and
`/sync/fix-titles`) are restricted to admins via the `requireAdmin` middleware
(runs after `requireAuth`, which sets `req.userEmail`). Apply `requireAdmin`
per-route to any new endpoint that writes to the shared `pages` data.

- Admin allowlist comes from the `ADMIN_EMAILS` env var (comma-separated),
  with a default set in code to the workspace owner's email on both backend and
  frontend.
- The frontend mirrors the same check (`VITE_ADMIN_EMAILS`, same default) only to
  hide the upload UI for non-admins. The backend is the real security boundary.

**Why:** the owner wanted to be the sole person able to run the monthly refresh,
since one upload changes the dashboard for everyone.

**How to apply:** to change who can upload, set `ADMIN_EMAILS` (server) and
`VITE_ADMIN_EMAILS` (client) to the same comma-separated list. Keep them in sync.
