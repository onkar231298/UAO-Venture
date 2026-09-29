---
name: Copied-site tag reconciliation
description: Why a seemingly empty destination still needs taxonomy matching during an old-site product transfer.
---

**Rule:** Treat existing taxonomy as independently populated even when products and other classification tables are empty. Match tags by both slug and name, preserve destination identity, reject conflicting slug/name pairs, and remap relationship IDs; never insert source numeric IDs verbatim.

**Why:** A copied app had no destination products but already contained seeded tags. A blanket "all product tables must be empty" assumption stopped the first import safely, and source IDs did not match the destination tag IDs.

**How to apply:** Before any snapshot import, inspect every destination classification table separately and build explicit identity maps. Preserve destination-only entries rather than replacing them.