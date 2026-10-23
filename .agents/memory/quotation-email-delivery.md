---
name: Quotation acceptance and Sales Orders
description: Customer acceptance channels, staff review, Sales Order gating, and deferred quotation email delivery.
---

Do not send quotation emails yet. Publishing a quote should make it available in the customer dashboard and as a downloadable PDF. A disabled “Email customer (soon)” option may be shown while integration is deferred. When transactional email is implemented later, send from the assigned salesperson's G Suite account.

**Why:** The owner explicitly deferred quotation email delivery and specified the salesperson's own G Suite address as the future sender.

**How to apply:** Keep quote creation and dashboard publishing separate from email. Email controls remain disabled until the integration is requested and implemented.

## Acceptance and Sales Order conversion

Acceptance in the customer dashboard marks the quotation accepted. A customer-uploaded signed quotation remains pending until an authorized staff member reviews it. Staff can also record a confirmed acceptance received by email, phone, WhatsApp, or another channel, including its date and supporting evidence.

Only accepted quotations can create a linked draft Sales Order. The assigned sales representative or an admin deliberately creates it, at any time after acceptance; creation must never happen automatically or from a sent, unaccepted quotation. Keep the order tied to the enquiry's assigned sales representative. Quotation email delivery remains deferred.

**Why:** The owner requires staff review for uploaded signatures, supports acceptance through multiple channels, and explicitly limits Sales Order creation to accepted quotations while allowing assigned sales staff and admins to do it later.

**How to apply:** Keep dashboard acceptance, staff-recorded acceptance, and Sales Order creation as distinct steps. Audit the acceptance channel and evidence, enforce enquiry assignment for sales users, and prevent duplicate orders.

Use **Create SO**, not direct **Generate SO**. The owner requires all order details to be entered manually before the order is saved; the accepted quotation is a linked reference, not a source to silently copy buyer information, product lines, pricing, or terms.

**Why:** The owner explicitly rejected one-click SO generation and supplied a Sales Contract / Proforma Invoice example for the desired PDF structure.

**How to apply:** Open a manual-entry form for contract/proforma references, parties, items, payment and shipping terms, bank information, and signatory details. Calculate totals from entered lines. Use the sample's grid structure with Atlas branding, not its sample company/bank information or signature.
