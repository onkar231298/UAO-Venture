---
name: Mailchimp send retry safety
description: Durable ordering and retry rules for CRM bulk campaigns sent through Mailchimp.
---

Once a Mailchimp campaign has external identifiers, or its final send/schedule request could have reached Mailchimp, the local attempt is non-retryable until provider reconciliation confirms the outcome. Keep hosted attachment links available during that period.

**Why:** A provider timeout, process crash, or local persistence failure can happen after Mailchimp has accepted work. Treating that as a normal failure can send a duplicate campaign and delete files referenced by the first delivery.

**How to apply:** Any change to bulk-campaign status handling, idempotency, cleanup, or provider-call ordering must preserve exclusive same-key ownership, durably record provider/recipient state before the irreversible delivery action, and route uncertain outcomes through report reconciliation.