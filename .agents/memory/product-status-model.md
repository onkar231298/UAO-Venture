---
name: Product status model
description: products.isActive vs products.status varchar — which is the truth and how they stay in sync
---

**Rule:** `products.isActive` (boolean) is the operational truth — the public site, admin badge/toggle, and active-count stats all filter on it. The `status` varchar (draft/active/inactive) is display metadata that must stay derived: `isActive=true ⟺ status='active'`; `isActive=false ⟺ status ∈ {'inactive','draft'}` (draft = never published). Effective display rule everywhere (badge, CSV export, filter): `isActive ? Active : status==='draft' ? Draft : Inactive`.

**Why:** The two fields drifted for years (1,348 rows said 'active' while not live; live rows said 'draft'), making the admin list and the CSV export contradict each other. A boot-time idempotent reconciliation in server/index.ts fixed the data (runs on prod automatically at republish), and storage.createProduct/updateProduct/bulkUploadProducts now enforce the sync, dropping junk status values.

**How to apply:** Any NEW code path that inserts or updates product rows must go through storage.createProduct/updateProduct or replicate the sync — never write `status` or `isActive` independently. Direct `db.insert(products)`/`db.update(products)` calls are the failure mode (bulk upload had exactly this bug: hardcoded `isActive: true` while copying CSV status).
