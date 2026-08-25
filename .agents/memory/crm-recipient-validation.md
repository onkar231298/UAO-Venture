---
name: CRM recipient validation
description: Recipient validation rules for CRM email composers and Titan delivery.
---

Treat stored CRM email values as untrusted imported data. Normalize and validate one mailbox address before offering it as a recipient, generating a draft, or submitting it to SMTP.

**Why:** Some imported company primary-email fields contain ordinary text with no mailbox address. Matching a submitted value to the stored field proves company membership, not deliverability; Titan then fails with a misleading “No recipients defined” envelope error.

**How to apply:** Exclude malformed company and contact emails from recipient choices, clear invalid initial composer values after context loads, and return a corrective 400 response before opening an SMTP connection.