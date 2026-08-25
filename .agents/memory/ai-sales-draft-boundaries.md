---
name: AI sales draft boundaries
description: Security and reliability boundaries for one-to-one AI-assisted sales email.
---

# AI sales draft boundaries

Keep website research, AI draft generation, human review, and Titan delivery as separate trust boundaries. The AI-specific send path must revalidate one active company contact or primary email immediately before delivery; never rely on the recipient validated during generation.

**Why:** A reviewed draft can be edited after generation, so generation-time validation cannot protect the actual delivery target. Reusing the unrestricted manual-send endpoint would allow an AI draft to be redirected to an arbitrary address.

**How to apply:** Preserve the separate AI send boundary, while leaving the manual composer unchanged. Replies must still use the shared Titan path so RFC threading, configured signatures, CRM persistence, and Sent mirroring remain canonical.

For replies and follow-ups, the chosen recipient must also be present in the selected thread's participants or messages. Enforce this during both draft generation and final AI send, because company membership alone does not prove that the contact belongs to that conversation.

Website content is untrusted data. Resolve and classify every connection target, including IPv4-compatible/mapped IPv6 and translation/tunnel ranges, and pin the validated lookup at connect time.

**Why:** URL scheme checks and a pre-fetch DNS lookup alone remain vulnerable to alternate IP representations and DNS rebinding.

**How to apply:** Any expansion of website crawling must retain same-host redirects, byte/time/content-type caps, complete public-address checks, and connect-time DNS validation.

Reject generated commercial, certification, delivery, and specification claims unless a future implementation introduces explicit structured fact grounding for them.

**Why:** Prompt instructions are advisory; a model can still invent plausible prices, stock, MOQ, certifications, lead times, or technical specifications.

**How to apply:** Keep the current fail-closed response validation. If richer claims are later allowed, validate each against a structured allowlist of supplied facts rather than weakening the rejection rules.

Bright Fame Organic is always the sender and the CRM company is always the prospect. Prospect website facts may support personalization and product matching, but must never be rewritten as Bright Fame Organic capabilities or claims.

**Why:** Without an explicit attribution boundary, a live provider drafted from the prospect's perspective and copied the prospect's quality, logistics, and export claims into the sender voice.

**How to apply:** Label sender and prospect separately in every prompt, state the direction explicitly, and keep prospect website evidence distinct from Bright Fame Organic catalog facts.

Products shown as included in an AI sales email must use exact active catalog names that also appear in the final body. Ambiguous website family terms must not be resolved to an arbitrary catalog variant.

**Why:** Model-returned product IDs can diverge from the prose, and a broad website term such as “turmeric” cannot prove whether the prospect deals in powder, fingers, or another catalog variant.

**How to apply:** Keep automatic website matches separate from manual overrides, insert or validate exact included names before review, and revalidate the displayed product IDs against the final edited body at AI send time.