---
name: AI email prompt completeness
description: Why the AI email generator's system prompt contains a sentence-by-sentence self-check instruction — do not trim it.
---

# AI email generator — completeness self-check is load-bearing

The bulk-email AI generator (OpenAI gpt-4o) **silently drops trailing brief facts** (shipping terms, ports, timelines) even when the prompt says "include every detail". A generic completeness rule was NOT enough.

**Why:** Tested with a 3-product brief ending in "ship worldwide within 7 days from Mumbai port" — the model omitted the whole shipping sentence (0 mentions of ship/worldwide). Adding an explicit instruction to *re-read the brief sentence by sentence before output and add any missing fact* fixed it (19/19 fact checks passed).

**How to apply:** If the system prompt in the email-generator route is ever rewritten, keep (a) the sentence-by-sentence self-check instruction, (b) the "shipping/logistics facts must appear somewhere (hero, extra row, or closing)" rule. Re-test with a brief whose LAST sentence is a logistics fact — that's the part gpt-4o drops first.

Related decisions:
- Logo (dark green on transparent) must sit on a WHITE band, not the green #15803d band, or it's invisible. Served from the production domain so email clients can load it (`EMAIL_LOGO_URL` shared env var).
- `{{contact_name}}`/`{{company_name}}` personalization is opt-in per user request (default OFF); the SendGrid send pipeline substitutes real values at send time, so tokens are safe when enabled.
- `finish_reason === 'length'` returns an explicit 502 rather than delivering truncated HTML.
