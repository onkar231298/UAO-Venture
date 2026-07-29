---
name: TipTap destroys designed email HTML
description: Why designed (table-based) email HTML must never enter the TipTap visual editor in the bulk email composer
---

**Rule:** Never load designed, table-based email HTML (branded layouts with inline styles, `role="presentation"` tables, buttons) into the TipTap visual editor — not via `setContent`, and never let its `onUpdate` write back into the html state. TipTap normalizes the DOM to its schema and strips inline styles, colors, backgrounds and button layouts, leaving plain bordered boxes.

**Why:** The "Write with AI" feature repeatedly appeared broken ("plain text", "no design") even though the server generated perfect HTML — the composer's visual editor was silently destroying it after generation. Took several rounds to trace because generation, preview and sending each looked correct in isolation.

**How to apply:**
- Detect designed HTML with the narrow marker `role="presentation"` (TipTap never emits it; broader checks like `<table style=` wrongly flag user-authored tables and block normal editing).
- Designed content: show rendered preview (sanitized with DOMPurify at every `dangerouslySetInnerHTML` sink), hide/disable visual-editor toolbar, keep `htmlContent` state as the source of truth for sending and template saving; edits go through the HTML source tab.
- Guard `onUpdate` with a functional state update (`setX(prev => isDesigned(prev) ? prev : next)`) to avoid stale-closure overwrites.
