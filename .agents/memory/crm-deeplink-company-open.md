---
name: CRM company deep-links
description: How to open a specific company from elsewhere in the app (follow-up lists, notifications) without breaking on filters or security alerting
---

Deep-links into My Companies use `?openCompany=<id>&tab=<dialogTab>`; an effect in the My Companies page resolves them.

**Rule:** resolve the company with a direct `GET /api/crm/companies/:id`, never by searching the page's companies list query.

**Why:** the list query is filtered (`isIrrelevant=false`, debounced search, assigned-date range), so a legitimate target — e.g. a company marked not-relevant that still has a pending follow-up — is often absent, and a list-based lookup falsely reports "not found" (found by architect review, Aug 2026).

**Access-event subtlety:** `GET /api/crm/companies/:id` already logs a staff access event server-side (same log that `POST /api/crm/track-view` writes, feeding the Security Monitor's rapid-browsing alert: >8 company opens in 5 min). When opening via that GET, do NOT also call track-view / `handleOpenCompany`'s trackView — each open would count twice and trigger false security alerts for normal follow-up work.

**How to apply:** any new "jump to company" entry point should navigate with the query params and let the existing effect resolve; clean the URL via wouter `setLocation(..., { replace: true })` only after a terminal outcome (opened or toast), so retries and back-navigation behave.
