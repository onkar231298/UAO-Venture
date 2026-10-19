---
name: Quotation deletion policy
description: Deletion boundaries for quotations in the Atlas CRM.
---

Permanently delete only unsent draft quotations. Treat quotations with a sent timestamp, customer acceptance, or sales-order link as protected even if their status is inconsistent. Delete draft line items and the quotation together; do not cascade into the inquiry, customer, sales order, or acceptance audit record.

**Why:** the user confirmed that the Delete option should be limited to draft quotations.

**How to apply:** enforce this rule server-side, in addition to hiding the action for ineligible rows in the CRM. Keep sent and accepted quotation history intact.
