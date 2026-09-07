---
name: Shared Mailchimp routing
description: Confirmed audience, visible sender, per-salesperson reply, and recipient-isolation rules for CRM bulk campaigns.
---

All enabled CRM bulk-email users must use one shared Mailchimp audience and the same verified sales address as the visible sender. Customer replies go to the individual salesperson who submitted the campaign, using that authenticated user's connected, active Titan mailbox. Each salesperson may still target only recipients from CRM companies assigned to them, and each campaign must use an exact static segment.

**Why:** The owner clarified that the shared sales address is only the customer-visible sender identity; replies need to return to the salesperson handling those assigned CRM companies.

**How to apply:** Reject or fail closed on divergent enabled audience/sender settings. Synchronize and revalidate Mailchimp's audience sender defaults, derive each campaign Reply-To server-side from the authenticated user's valid Titan configuration, and store it in campaign history. Never trust a browser-supplied reply address, weaken company-assignment checks, or send to the full audience.