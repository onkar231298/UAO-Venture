---
name: Authorization middleware gotchas
description: Read guard bodies before trusting them; role enforcement in this codebase is inconsistent across routes
---

**Rule:** never trust an Express guard by its name — read its body. Some named role guards only verified login, and many staff routes are registered with `isAuthenticated` alone.

**Why:** a guard whose name promised admin/website-manager enforcement was a login-only no-op, leaving website-content writes open to any signed-in account (including customers) until an unrelated feature task surfaced it.

**How to apply:**
- Established allowlist for website-content writes: `role.includes('admin')` (intentionally covers super_admin) plus `website_manager` and the quality roles; GETs allow any non-customer staff.
- The real guard stashes the DB user on `req.staffUser` — reuse it in handlers instead of a second lookup; narrower rules (e.g. delete = admin/website_manager only) check it inline.
- When auditing, grep for routes whose only middleware is `isAuthenticated`, then decide per route which allowlist applies — website content vs shared CRM infrastructure (e.g. generic object-upload presign is used by sales and quality; don't gate it with website roles).
- Public site reads product data via unauthenticated `/api/products/*` routes; tightening `/api/admin/*` and staff-only upload routes doesn't affect visitors.
