---
name: SEO strategy rollout safety
description: Guardrails for geographic keyword assignments and bulk metadata changes.
---

Map a geographic search term only to a page whose metadata and visible copy genuinely address that market. A valid canonical URL and a database mapping alone do not establish keyword relevance.

**Why:** An administrative mapping can pass URL-level audits while the destination never mentions the target market, producing a false completion signal.

**How to apply:** Give supported markets dedicated, factual landing content or omit the keyword. Test assignment relevance against rendered metadata, not mapping existence alone.

Bulk SEO metadata rollouts must be preview-first and treat existing copy as generator-owned only when it exactly matches a known output or a sufficiently specific paired legacy signature.

**Why:** Broad single-field regular expressions can misclassify intentionally authored metadata and overwrite it silently.

**How to apply:** Default scripts to a non-writing preview with affected-record samples; require an explicit apply action after review, and preserve ambiguous or partially custom records.

Product organic targeting must follow the catalog's combined classification contract: an explicit organic flag, an organic product type, or an organic product name can identify an organic item.

**Why:** The live catalog contains legitimate products identified only by the product-type field; ignoring it silently removes organic wording from their generated metadata.

**How to apply:** Keep SEO classification aligned with public product filtering, and include a regression case where the explicit organic flag is false but the product type is organic.