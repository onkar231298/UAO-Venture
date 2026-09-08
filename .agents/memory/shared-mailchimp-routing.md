---
name: Shared Mailchimp routing
description: Mailchimp-only bulk setup, strict Titan separation, and the unverified independent-header capability boundary.
---

The requested CRM bulk workflow uses one shared Mailchimp audience and verified sales sender, with admin-managed per-agent access. The intended reply destination is the authenticated agent's existing assigned company email, falling back to a validated stored staff email. Titan is a separate service: bulk eligibility must not depend on mailbox connection, activity, or passwords, and this work must not change Titan behavior or configuration.

**Why:** The owner explicitly rejected switching back to SendGrid and clarified that bulk-email simplification must leave Titan untouched. A reply destination needs an address, not SMTP credentials.

**How to apply:** Read only address data and derive replies server-side; never accept arbitrary browser Reply-To input. Preserve company-assignment checks, exact recipient segments, opt-outs, and deliberate access toggles. Expose divergent legacy shared settings instead of silently choosing them.

Separate shared From and per-agent Reply-To delivery remains unverified. Mailchimp audience defaults plus a campaign `reply_to` field are not proof of independent delivered headers.

**Why:** Outbound request fields do not establish delivered-header behavior; separate identities need independent evidence.

**How to apply:** Fail clearly when the requested independent identities cannot be verified; do not silently replace From, route replies to shared sales, add forwarding, or switch providers. Real header testing requires explicit approval and consenting internal recipients. Shared setup does not lift Mailchimp's campaign-policy restrictions.