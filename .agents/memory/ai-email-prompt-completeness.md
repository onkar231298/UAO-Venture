---
name: AI email prompt completeness
description: Why the AI email generator's system prompt contains a sentence-by-sentence self-check instruction — do not trim it.
---

# AI email generator — completeness self-check is load-bearing

The bulk-email AI generator (OpenAI gpt-4o) **silently drops trailing brief facts** (shipping terms, ports, timelines) even when the prompt says "include every detail". A generic completeness rule was NOT enough.

**Why:** Tested with a 3-product brief ending in "ship worldwide within 7 days from Mumbai port" — the model omitted the whole shipping sentence (0 mentions of ship/worldwide). Adding an explicit instruction to *re-read the brief sentence by sentence before output and add any missing fact* fixed it (19/19 fact checks passed).

**How to apply:** If the system prompt in the email-generator route is ever rewritten, keep (a) the sentence-by-sentence self-check instruction, (b) the "shipping/logistics facts must appear somewhere (hero, extra row, or closing)" rule. Re-test with a brief whose LAST sentence is a logistics fact — that's the part gpt-4o drops first.

**Image hallucination:** gpt-4o fabricates image URLs (e.g. `https://example.com/chilli-powder-image.jpg`) when a brief asks for product/hero imagery, even with explicit "never invent image URLs" prompt rules. The server-side allowlist filter (only the logo URL or URLs literally present in the submitted brief/currentHtml survive) is the real protection — prompt rules alone failed in testing. Don't remove that filter.

**Brief-first prompts:** Users submit long structured markdown briefs (own sections, multiple CTA buttons with URLs, color directions). The prompt must let the brief override the default template/palette or the model force-fits content into the rigid structure and drops buttons/colors.

Related decisions:
- Logo (dark green on transparent) must sit on a WHITE band, not the green #15803d band, or it's invisible. Served from the production domain so email clients can load it (`EMAIL_LOGO_URL` shared env var).
- `{{contact_name}}`/`{{company_name}}` personalization is opt-in per user request (default OFF); the SendGrid send pipeline substitutes real values at send time, so tokens are safe when enabled.
- `finish_reason === 'length'` returns an explicit 502 rather than delivering truncated HTML.
