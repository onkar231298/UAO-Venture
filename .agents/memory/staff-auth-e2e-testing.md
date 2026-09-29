---
name: Staff auth e2e testing
description: How to test authenticated staff API routes for real in dev — form login semantics, FK cleanup order, ESM script location.
---

# Testing authenticated staff routes end-to-end (dev)

Screenshot tooling can't log in, so authenticated routes need a curl session:

- Seed a temp staff user (bcryptjs hash, cost 10) into `users` with `user_type='staff'`, an allowed `role`, `account_status='active'`, `is_active=true`.
- Login is `POST /admin/login`, **form-encoded** `email` + `password` (passport local). Success = **302 to a role-based dashboard**; failure = 302 to `/login?error=...` — status alone doesn't distinguish, confirm via `GET /api/auth/user`. Use a cookie jar with both `-b` and `-c` (login regenerates the session id).
- Cleanup: a logged-in test user may acquire `activity_heartbeats`, `daily_performance_summary`, `notifications`, `user_access_events`, and `user_login_logs` records. Remove only rows belonging to that temporary user before deleting the user; FKs block deletion otherwise. Log out and stop the browser before deleting its temporary profile.
- Node helper scripts must live in the workspace root, not /tmp — ESM resolves packages relative to the script file.

**Why:** without this recipe the only feasible check on guarded endpoints is an unauthenticated 401, which proves nothing about the real flow. Login and background polling can create extra records even when the test itself is read-only.
