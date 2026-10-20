---
name: Private quotation document storage
description: Confidential handling of signed quotations and purchase orders.
---

Signed quotation and purchase-order files are confidential commercial documents. Store them in private object storage and serve them only through quotation-scoped endpoints that re-check customer ownership or assigned staff access. Do not place them in the public-read AWS image bucket or expose raw storage paths to the client.

**Why:** These files contain customer and commercial signatures, while the project's AWS image bucket is public-read on every prefix.

**How to apply:** Future quotation, PO, and related commercial-document uploads should validate file bytes before storage and use authenticated, ownership-checked download handlers.
