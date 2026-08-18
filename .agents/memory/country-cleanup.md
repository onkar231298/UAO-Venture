---
name: Company country cleanup
description: State of country-name canonicalization for companies + what still needs the owner
---
- Dev DB: both address + factory country columns are fully canonical (zero case/spelling variant groups). ~15 companies intentionally blank (test entries / truly unknown; TLD backfill already done in an earlier pass).
- Normalization is centralized in `shared/countries.ts` and applied on every company write path through storage create/update (plus the inquiry convert-to-lead copy). **How to apply:** never add per-route country munging; extend the alias/city maps in the shared file instead.
- **Prod:** the workspace cannot write the production DB. The owner must click the super-admin "Clean Up Countries" button in Company Management once after the next republish (idempotent; reports per-change counts).
- Users-table country (customer registrations) is intentionally NOT normalized (scope decision) — registration data enters companies canonical only at convert-to-lead copy time.
