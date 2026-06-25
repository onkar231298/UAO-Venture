---
name: Dev vs prod database data sync
description: Why workspace data changes don't appear on the published site, and the supported way to push DATA changes to production.
---

# Dev vs prod database — data does NOT auto-sync

On this project (Replit-managed Postgres), the **development** database and the
**production** (published/live) database are SEPARATE databases with independently
diverging data. Confirmed concretely: at one point dev had ~99 companies assigned
while prod still had ~1,793 assigned, same total row count.

**Why this matters:** Any SQL/data change the agent makes (e.g. via `executeSql`
in the code-execution sandbox) hits the DEVELOPMENT database only. The live site
reads from production, so those changes never appear there. Publishing only diffs
and migrates the **schema** to production — it does NOT copy row data.

**How to apply DATA changes to production:**
- The agent CANNOT write to production directly. `executeSql({environment:"production"})`
  is READ-ONLY (SELECT only). Use it to verify/compare, not to write.
- The supported path is to make the change **through the deployed app itself**.
  For a one-time bulk data change, add a `super_admin`-guarded endpoint that performs
  the operation against whatever DB the app is connected to (production when running
  on the live site), plus a temporary admin button to trigger it. The user must
  PUBLISH first, then click the button while logged in on the LIVE site.
- For destructive bulk writes (e.g. "unassign all then reassign"), wrap everything in
  a single `db.transaction` and run a **preflight inside the transaction** that aborts
  (throws → rollback) BEFORE the destructive step if inputs don't resolve cleanly
  (e.g. a name matching 0 or >1 rows). This prevents a half-applied destructive change.
- Match rows by a stable natural key (e.g. company name, case-insensitive/trimmed)
  rather than dev row IDs, because IDs can differ between the dev and prod databases.
- Remove the temporary endpoint/button after a successful one-time run (it re-inserts
  audit rows and is destructive on repeat clicks), then republish to clean up.

**Note:** The `database` skill's publish guidance ("agent must not write scripts to
migrate the production database") is specifically about SCHEMA migrations. One-time
DATA changes via a guarded in-app endpoint are a different, acceptable path.
