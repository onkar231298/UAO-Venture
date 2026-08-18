---
name: Typecheck suppression gotcha
description: tsc "clean" can be an illusion here — how to judge type-cleanliness in this codebase.
---

# Typecheck suppression (tsc looked clean, wasn't)

If any file in the program has parse/syntax errors (e.g. leftover `*_backup.tsx` / `*-broken.tsx` clutter), tsc suppresses **semantic** diagnostics for the whole project — output shows only the syntax errors and everything else looks clean. Once such files are removed, the real baseline appears: hundreds of long-standing errors (largest root cause: `@types/multer` was never installed, so every multer callback is implicit-any and `Express.Multer.File` is unresolvable).

**Rules:**
- A wall of `npm run check` errors is baseline debt, not a regression — judge new work only by whether *changed lines* add errors.
- Full tsc here needs a large Node heap (`--max-old-space-size`); with the default it V8-OOM-aborts mid-run, and an abort is NOT a pass — check the exit, not just quiet output.
- Never claim "type-clean" from filtered/quiet tsc output; runtime behavior in this codebase is proven by live e2e, not tsc.

**Why:** review rounds were repeatedly misled by illusory "tsc clean" claims while semantic checking was silently disabled.
