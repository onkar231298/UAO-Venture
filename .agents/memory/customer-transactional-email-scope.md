---
name: Customer transactional email scope
description: Agreed behavior for account lifecycle emails and future quote/order templates.
---

Customer registration should send a welcome email after the account is created, while leaving the account active immediately; email verification was not selected. Password-reset emails must preserve the generic public response and existing one-hour reset-link expiry. Keep these account messages separate from bulk marketing templates. Quote-ready and Sales Order templates remain drafts with no send trigger until their email flows are approved; quotation delivery must follow the assigned-salesperson sender policy.

**Why:** The owner chose a welcome email instead of requiring verification, and separately deferred quotation email delivery.

**How to apply:** Preserve immediate registration and reset protections in future account-email changes. Do not connect quote/order drafts to sending until the existing quotation email policy is deliberately changed.
