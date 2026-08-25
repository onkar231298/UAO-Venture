---
name: Gemini fallback for AI email generation
description: Provider-fallback design and Gemini free-tier quirks for the bulk-email AI generator.
---

**Rule:** AI email generation uses OpenAI gpt-4o as primary and a tested Gemini cascade on 429/5xx or provider timeout. For concise one-to-one drafts, prefer `gemini-3.1-flash-lite` with thinking disabled before a general Flash alias.

**Why:** (Aug 2026) The OpenAI account has returned 429 `credit_balance_exhausted`. Gemini’s model inventory is not proof that a listed model is usable: older Flash aliases have produced long timeouts, 400s, and transient 503s, while `gemini-3.1-flash-lite` returned valid structured output promptly with this key.

**Gemini gotchas:** thinking consumes `maxOutputTokens`; disable it for concise structured drafts when the selected model supports that setting, but keep a larger budget for rich bulk-email HTML. Response text lives in `candidates[0].content.parts[].text` (join all parts). Truncation signal is `finishReason === 'MAX_TOKENS'`.

**How to apply:** Give the full provider cascade one request-level deadline rather than an independent long timeout per model. After any model change, run a live structured-output canary with the configured key; do not trust the models-list response alone. Once OpenAI is funded, gpt-4o becomes primary again without a code change.
