---
name: Quotation acceptance and Sales Orders
description: Customer acceptance channels, staff review, Sales Order gating, and deferred quotation email delivery.
---

Do not send quotation emails yet. Publishing a quote should make it available in the customer dashboard and as a downloadable PDF. A disabled “Email customer (soon)” option may be shown while integration is deferred. When transactional email is implemented later, send from the assigned salesperson's G Suite account.

**Why:** The owner explicitly deferred quotation email delivery and specified the salesperson's own G Suite address as the future sender.

**How to apply:** Keep quote creation and dashboard publishing separate from email. Email controls remain disabled until the integration is requested and implemented.

## Acceptance and Sales Order conversion

Acceptance in the customer dashboard marks the quotation accepted. A customer-uploaded signed quotation remains pending until an authorized staff member reviews it. Staff can also record a confirmed acceptance received by email, phone, WhatsApp, or another channel, including its date and supporting evidence.

An assigned sales representative or an admin can deliberately create a linked draft Sales Order from a draft, sent, expired, or accepted quotation; creating one does not claim customer acceptance. Keep an unaccepted quotation's status unchanged, keep the accepted quotation's existing converted status, record the original status in order activity, and prevent duplicate orders. Quotation email delivery remains deferred.

**Why:** The owner explicitly said staff should be able to prepare an SO even before formal acceptance, including when the customer confirms by email or another channel.

**How to apply:** Keep customer acceptance and staff-recorded acceptance as separate evidence from SO creation. Preserve quotation status at creation, enforce enquiry assignment for sales users, and prevent duplicate orders.

Use **Create SO**, not direct **Generate SO**. The owner requires all order details to be entered manually before the order is saved; the quotation is a linked reference, not a source to silently copy buyer information, product lines, pricing, or terms.

**Why:** The owner explicitly rejected one-click SO generation and supplied a Sales Contract / Proforma Invoice example for the desired PDF structure.

**How to apply:** Open a manual-entry form for contract/proforma references, parties, items, payment and shipping terms, bank information, and signatory details. Calculate totals from entered lines. Use the sample's grid structure with Atlas branding, not its sample company/bank information or signature.
