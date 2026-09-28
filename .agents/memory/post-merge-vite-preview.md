---
name: Post-merge Vite preview recovery
description: Recover a preview that returns a stale Vite module-path error after dependencies change.
---

If a running development preview suddenly returns `ERR_MODULE_NOT_FOUND` for a package path inside the old pnpm store after a merge or dependency installation, verify the package resolves in the current installation and restart the existing app workflow once before editing application code or reinstalling packages.

**Why:** The server kept using a cached Vite loader path after the root dependency tree was replaced; the HTTP port remained open but requests returned an error page. A single workflow restart picked up the new installation and restored the preview.

**How to apply:** Compare the missing path to the current package resolution and test a rendered route after the restart. Only repair dependencies if the package truly does not resolve in the current workspace.