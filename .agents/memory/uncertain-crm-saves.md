---
name: Uncertain CRM saves
description: Treat failed browser write delivery as unknown, not as proof that the database rejected it.
---

A browser “Failed to fetch” on a save does not prove the write failed. Do not automatically retry it or discard the user's form values; check persisted state first.

**Why:** company updates were reported failing in the owner's browser while authenticated Admin and Sales tests through the development proxy passed. No corresponding owner update appeared in server logs. A method-specific browser/network restriction is only a hypothesis, not an established cause.

**How to apply:** test the actual form through the proxied development address, verify the saved fields directly in the database, and distinguish an HTTP rejection from a transport failure. Compatibility endpoints must share the original authenticated handler rather than duplicate business logic. If the owner still sees failure, capture the affected browser's network error before claiming a root cause.
