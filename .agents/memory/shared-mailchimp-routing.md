---
name: Shared Mailchimp routing
description: Confirmed audience, sender, reply, and recipient-isolation rules for CRM bulk campaigns.
---

All enabled CRM bulk-email users must use one shared Mailchimp audience and the same verified sales address for both sender and replies. Customer replies go to the shared Sales Titan inbox, not individual salesperson mailboxes. Each salesperson may still target only recipients from CRM companies assigned to them, and each campaign must use an exact static segment.

**Why:** Mailchimp Marketing campaigns expose one email identity rather than independent From-email and Reply-To-email addresses. The owner chose the shared sales address for both, while retaining salesperson-specific CRM recipient authorization.

**How to apply:** Any bulk-email configuration or readiness change must reject or fail closed on divergent enabled settings. Synchronize and revalidate the audience's Mailchimp `campaign_defaults.from_email`/`from_name`; setting campaign `reply_to` alone is insufficient. Do not weaken company-assignment checks or send to the full audience.