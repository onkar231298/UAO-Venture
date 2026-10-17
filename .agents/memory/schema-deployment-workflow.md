---
name: Schema publishing workflow
description: The project-specific process for applying database schema changes in development and production.
---

Treat `shared/schema.ts` as the database schema source of truth. Apply required schema changes directly to the development database for testing, then use Replit Publish's development-versus-production schema diff for production. Do not add startup, deployment, or ad hoc migration scripts.

**Why:** This is the project's established publishing process. Runtime migration code would duplicate Publish's schema management and could apply production changes at the wrong time. The development database can lag the app schema; a missing `image_position_x` column caused the hero-slide API to return 500 during responsive preview checks.

**How to apply:** For schema work, update `shared/schema.ts`, apply and verify the matching columns/indexes in development, and leave production application to the Publish schema-diff step. When validating CMS-backed UI, confirm the development API returns its data; use isolated response fixtures if the local schema is not ready, and do not edit live CMS content to work around it.