---
name: Private files and Vite
description: Workspace-private backups can still be served by Vite's direct-file route in development.
---

**Rule:** Do not assume moving an archive from an Express static directory into a hidden workspace directory prevents public access during development. Vite's `/@fs/` route may still serve it; block private paths and raw archives before Vite middleware or place them outside its file-serving scope. Test the actual response content type, not just the HTTP status.

**Why:** A raw transfer ZIP was moved under `.local/private-backups`, but `/@fs/.../.local/private-backups/...zip` still returned the entire `application/zip` file until a request gate was added before Vite.

**How to apply:** When handling uploaded backups or exports, verify direct-file and encoded-path URLs are denied while intended public media remains readable. Production builds must not package raw transfer archives.