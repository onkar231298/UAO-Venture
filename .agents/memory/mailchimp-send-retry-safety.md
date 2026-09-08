---
name: Mailchimp send retry safety
description: Durable ordering and retry rules for CRM bulk campaigns sent through Mailchimp.
---

Once a Mailchimp campaign has external identifiers, or its final send/schedule request could have reached Mailchimp, the local attempt is non-retryable until provider reconciliation confirms the outcome. Keep hosted attachment links available during that period.

**Why:** A provider timeout, process crash, or local persistence failure can happen after Mailchimp has accepted work. Treating that as a normal failure can send a duplicate campaign and delete files referenced by the first delivery.

**How to apply:** Any change to bulk-campaign status handling, idempotency, cleanup, or provider-call ordering must preserve exclusive same-key ownership, durably record provider/recipient state before the irreversible delivery action, and route uncertain outcomes through report reconciliation.

Mailchimp acceptance and even a populated send timestamp do not prove completion. A policy-disabled campaign can revert to `save` while retaining a send timestamp or partial send count; never delete and retry that state as an untouched draft.

**Why:** A Mailchimp abuse-prevention notice confirmed disabled introductory outreach while the API returned `save` with a send timestamp and the CRM incorrectly displayed sent.

**How to apply:** Confirm current provider status and counts, keep uncertain attempts non-retryable, and do not infer inbox delivery from sends minus bounces. Mailchimp campaigns require verifiable marketing permission; general business-email eligibility is not equivalent.