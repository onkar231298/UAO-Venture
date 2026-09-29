---
name: Company snapshot reconciliation
description: How to compare independently exported company and contact data safely before any import.
---

Company and contact snapshots can describe the same business entities despite different row IDs and staff-reference IDs. Equal row counts do not prove equality, and raw row or ID comparisons can falsely label matched records as missing. Compare unique company business identities (such as GST when present, otherwise corroborated name, country, and primary contact details), then compare all contacts under their matched parent company, including non-primary email, phone, and WhatsApp details. Treat differing mutable company fields as conflicts, not new companies, and never overwrite them implicitly.

**Why:** A full snapshot and its destination had equivalent company identities and parent-linked contacts, while numeric IDs and staff references differed widely; one matched company also had different mutable details.

**How to apply:** For future imports, establish an unambiguous source-to-destination company map before evaluating contacts or writing; report matched, missing, ambiguous, and conflicting records separately. If nothing is genuinely missing, do not back up or import merely because raw IDs differ.

When a company/contact-only archive comes from another app environment, treat user-account references as unverified even if an ID string happens to exist in the destination. Map staff and customer accounts by verified identity or leave those references blank with the owner's approval; never reuse them by ID coincidence. Also remap internal company references through the company identity map, and flag source references that point outside the archive rather than retaining stale numeric IDs.

**Why:** Source and destination account identifiers can refer to different people, and company-only exports cannot prove who owned or was assigned each record. Unmapped numeric company references can later point at unrelated records after new IDs are allocated.

**How to apply:** Before a cross-environment restore, disclose which links cannot be verified and get a decision about leaving them blank versus supplying an identity map; preserve contact rows and their per-row fields independently of account mapping.