---
name: AI email generation providers
description: Which AI providers/models work for the bulk-email "Generate with AI" feature and why the fallback exists
---

# AI email generation (bulk email composer)

- The user's OPENAI_API_KEY is on an account with **no remaining quota** (429 on every call, July 2026). Do not assume OpenAI works here.
- The user's GEMINI_API_KEY is a **new-user free-tier key**: `gemini-2.5-flash*` models return 404 ("no longer available to new users"), `gemini-2.0-flash*` return 429 (quota), but **`gemini-flash-latest` works**.
- **Why:** the email generation service tries OpenAI first, then falls back to Gemini (`gemini-flash-latest` first in the model list). If generation breaks, check provider quotas before touching code.
- **How to apply:** any new AI feature in this project should reuse this OpenAI→Gemini fallback pattern and prefer `gemini-flash-latest`; verify with a direct `tsx -e` call to the service rather than through the authed route.
- Generated HTML is sanitized server-side (email-safe allowlist) — keep that in place; the composer preview renders raw HTML.
