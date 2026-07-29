---
name: TipTap v3 setContent gotcha
description: Why programmatic setContent must pass emitUpdate false in the bulk email composer
---

Rule: any programmatic `editor.commands.setContent(...)` that syncs React state into TipTap must pass `{ emitUpdate: false }`.

**Why:** TipTap v3 (installed here) changed the default to `emitUpdate: true` (v2 was `false`). With the default, the composer's state→editor sync effect fires `onUpdate`, which writes `editor.getHTML()` (TipTap's simplified fragment) back into `htmlContent` — silently destroying full-document HTML emails (AI-generated or pasted: DOCTYPE/head/nested-table styling stripped) before they are previewed or sent.

**How to apply:** When touching the bulk email composer (or any TipTap editor synced from state), keep `{ emitUpdate: false }` on sync calls. User-typed edits still fire `onUpdate` normally (they are ProseMirror transactions, not setContent). Full-document HTML fidelity relies on `htmlContent` state staying pristine; TipTap's visual mode is a lossy approximation of it.
