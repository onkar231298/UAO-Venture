---
name: Gemini fallback for AI email generation
description: Provider-fallback design and Gemini free-tier quirks for the bulk-email AI generator.
---

**Rule:** The AI email generator uses OpenAI gpt-4o as primary; on 429/5xx it falls back to Gemini via a two-model cascade (`gemini-flash-latest`, then `gemini-3-flash-preview`). Keep the cascade — don't reduce to a single Gemini model.

**Why:** (Aug 2026) The OpenAI account ran out of credits (429 `credit_balance_exhausted`), killing the feature mid-use. The project's `GEMINI_API_KEY` (previously unused) is **free-tier**: flash models have quota, pro models are exhausted, and `gemini-2.5-flash` returns 404 "no longer available to new users" even though it appears in the models list — only the `-latest` aliases and gemini-3 previews are callable. `gemini-flash-latest` also threw a transient 503 "high demand" on first try, which is why one backup model matters.

**Gemini gotchas:** flash models are thinking models — thoughts consume `maxOutputTokens` (seen ~3k thought tokens per email), so the budget must stay generous (16000). Response text lives in `candidates[0].content.parts[].text` (join all parts). Truncation signal is `finishReason === 'MAX_TOKENS'`.

**How to apply:** Quality parity was verified (20/20 content checks on the user's real brief). Once the user tops up OpenAI, gpt-4o automatically becomes primary again — no code change needed. If briefs start failing only on the Gemini path, re-run the check suite against the cascade models before blaming the prompt.
