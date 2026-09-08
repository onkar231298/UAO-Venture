---
name: Shared Mailchimp routing
description: Mailchimp-only bulk setup, strict service separation, and the Marketing API's independent-reply limitation.
---

The requested CRM bulk workflow uses one shared Mailchimp audience and verified sales sender, with admin-managed per-agent access. The intended reply destination is the authenticated agent's existing assigned company email, falling back to a validated stored staff email. Titan is a separate service: bulk eligibility must not depend on mailbox connection, activity, or passwords, and this work must not change Titan behavior or configuration.

**Why:** The owner explicitly rejected switching back to SendGrid and clarified that bulk-email simplification must leave Titan untouched. A reply destination needs an address, not SMTP credentials.

**How to apply:** Read only address data and derive replies server-side; never accept arbitrary browser Reply-To input. Preserve company-assignment checks, exact recipient segments, opt-outs, and deliberate access toggles. Expose divergent legacy shared settings instead of silently choosing them.

Mailchimp Marketing's documented regular-campaign workflow uses one campaign address for the visible sender and direct replies. It exposes no arbitrary independent agent Reply-To field; Mailchimp Inbox instead supplies an uneditable Mailchimp-generated address. Do not present this as a setup checkbox or promise that approving a header test alone will make the required routing possible.

**Why:** Official Create a Regular Email, Tips for Sending Emails, and Mailchimp Inbox documentation together describe these restrictions. Audience defaults plus the API `reply_to` field do not establish independent delivered identities.

**How to apply:** Keep the provider limitation explicit. Do not silently replace From, route replies to shared sales, add forwarding, or switch providers. The owner explicitly reconfirmed keeping Mailchimp. Any different routing approach requires agreement; real email tests require explicit approval and consenting internal recipients. Shared setup does not lift Mailchimp's campaign-policy restrictions.

References:
- https://mailchimp.com/help/create-and-send-regular-email/
- https://mailchimp.com/help/tips-for-sending-campaigns/
- https://mailchimp.com/help/set-up-your-mailchimp-inbox/