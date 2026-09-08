---
name: Shared Mailchimp routing
description: Approved shared-sender/reply routing, automatic sales access, and strict separation from other mail services.
---

The owner approved one shared sales address for BOTH From and Reply-To on 2026-09-08. This supersedes the earlier request for separate per-agent replies. Bulk-email setup must be automatic: no audience selector, administrator configuration tab, or per-agent enable switches. Eligible active sales staff send to their assigned companies.

**Why:** The owner explicitly chose the shared-address option after the Mailchimp Marketing limitation was explained, and rejected further setup screens. Keep Mailchimp; do not reopen the provider-switch or agent-reply question without a new request.

**How to apply:** Treat the shared address as server-owned, never browser-selected. Legacy agent display-name and enable-flag differences must not recreate setup requirements. Resolve the existing common audience automatically; genuinely different audience IDs still need safe handling, not a silent guess. Preserve assignment checks, exact recipient segments, consent and opt-outs. Titan and all other mail services stay separate and unchanged; bulk sending needs no mailbox credentials or staff-mailbox lookup.

Mailchimp Marketing's documented regular-campaign workflow uses one campaign address for the visible sender and direct replies. It exposes no arbitrary independent agent Reply-To field; Mailchimp Inbox instead supplies an uneditable Mailchimp-generated address. Do not present this as a setup checkbox or promise that approving a header test alone will make the required routing possible.

**Why:** Official Create a Regular Email, Tips for Sending Emails, and Mailchimp Inbox documentation together describe these restrictions. Audience defaults plus the API `reply_to` field do not establish independent delivered identities.

**How to apply:** Shared From and shared replies are now authorized; arbitrary separate agent replies are not. Do not add forwarding or switch providers. Real email tests require explicit approval and consenting internal recipients. Shared setup does not lift Mailchimp's campaign-policy restrictions.

References:
- https://mailchimp.com/help/create-and-send-regular-email/
- https://mailchimp.com/help/tips-for-sending-campaigns/
- https://mailchimp.com/help/set-up-your-mailchimp-inbox/