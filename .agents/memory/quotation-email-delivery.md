---
name: Quotation email delivery
description: The current scope and sender identity for customer quotation emails.
---

Do not send quotation emails yet. Publishing a quote should make it available in the customer dashboard and as a downloadable PDF. A disabled “Email customer (soon)” option may be shown while integration is deferred. When transactional email is implemented later, send from the assigned salesperson's G Suite account.

**Why:** The owner explicitly deferred quotation email delivery and specified the salesperson's own G Suite address as the future sender.

**How to apply:** Keep quote creation and dashboard publishing separate from email. Email controls remain disabled until the integration is requested and implemented.

## Acceptance and Sales Order conversion

Customer acceptance only records the quotation as accepted; it must not create a Sales Order automatically. A sales rep or admin deliberately creates the draft Sales Order after portal acceptance or after confirming approval through email or another channel.

**Why:** The owner chose staff-controlled conversion so external confirmations can be acted on manually while transactional email remains deferred.

**How to apply:** Keep customer accept/reject actions separate from staff conversion. Make conversion available for sent or accepted quotations, enforce sales-rep assignment, and prevent the same quotation from creating multiple orders.
