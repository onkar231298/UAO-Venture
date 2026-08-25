---
name: Development database environment
description: The running app and Replit development schema use DATABASE_URL; other database variables may point at a different Neon database.
---

The running application and development schema tooling use `DATABASE_URL`. Do not assume `NEON_DATABASE_URL` targets the same database; verify the app connection before applying development schema changes.

**Why:** A signature column applied through a separate Neon connection did not fix the app because the server continued querying a database without that column.

**How to apply:** For development schema work, use the project database workflow against the app’s `DATABASE_URL` target. Production schema changes still go through Replit Publish schema diff.