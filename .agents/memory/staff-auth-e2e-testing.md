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

For authenticated browser tests, select Radix tabs with real pointer events after a nested dialog has finished closing and restoring focus. An immediate DOM `.click()` can leave the prior tab active and falsely report that its content is missing.

**Why:** contact-tab tests stalled despite successful company saves; allowing focus restoration and using pointer input made the actual Sales form test pass.

**How to apply:** When a UI test cannot find a tab's content, check the selected tab and focus state before treating it as an application failure.

For a multi-role browser sweep in this workspace, use a fresh browser process per
role instead of retaining many full-page navigations in one renderer.

**Why:** long multi-role runs repeatedly stopped responding to browser evaluation
commands, while the same routes passed in isolated role runs. This is a test
environment constraint, not evidence that an individual route is broken.

**How to apply:** Keep credentials and temporary records isolated per role. If a
browser command times out after many navigations, reproduce in a fresh browser
before changing app behavior or reporting a regression.

Chromium's loopback DevTools discovery can return app-preview HTML through the
workspace's global fetch path even though Chromium is healthy.

**Why:** direct Node HTTP requests reached the debug server when fetch returned
HTML at the same loopback port. Retrying or replacing the application was unnecessary.

**How to apply:** if `/json/list` is unexpectedly HTML, use `node:http` with an explicit
loopback hostname and port for discovery. Await Chromium exit before removing
its profile directory so cleanup errors do not hide the original test failure.
