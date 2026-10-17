---
name: Post-merge dependency setup
description: Keep automated merge setup aligned with the package manager and current lockfile.
---

For this project, post-merge setup uses `pnpm install --frozen-lockfile` followed by `npm run build`. Do not use `npm install` against the stale npm lockfile.

**Why:** The workspace uses a current pnpm lockfile and pnpm-managed dependencies; the older npm lockfile requests XML parser versions blocked by the package security policy.

**How to apply:** Preserve pnpm as the dependency installer for merge setup. Follow the schema publishing workflow separately for database changes.
