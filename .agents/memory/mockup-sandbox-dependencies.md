---
name: Mockup sandbox dependency readiness
description: A newly created preview artifact can start before its local dependency tree is complete.
---

Treat a newly created mockup sandbox as provisioned, not verified, until its nested dependencies and rendered previews work.

**Why:** Artifact creation reported success and its Vite route returned HTTP 200, but the page showed a missing Tailwind dependency overlay. Type-checking also resolved incompatible root packages until the sandbox's own dependencies were installed.

**How to apply:** After creating a mockup sandbox, check its local dependency installation, run its type-check, and inspect an actual rendered preview. If dependencies are missing, install them within the sandbox according to its package instructions and restart its managed preview workflow before presenting frames.