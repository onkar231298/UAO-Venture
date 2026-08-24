---
name: Schema publishing workflow
description: The project-specific process for applying database schema changes in development and production.
---

Treat `shared/schema.ts` as the database schema source of truth. Apply required schema changes directly to the development database for testing, then use Replit Publish's development-versus-production schema diff for production. Do not add startup, deployment, or ad hoc migration scripts.

**Why:** This is the project's established publishing process. Runtime migration code would duplicate Publish's schema management and could apply production changes at the wrong time.

**How to apply:** For schema work, update `shared/schema.ts`, apply and verify the matching columns/indexes in development, and leave production application to the Publish schema-diff step.