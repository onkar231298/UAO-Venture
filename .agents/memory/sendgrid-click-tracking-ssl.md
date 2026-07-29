---
name: SendGrid click tracking breaks links (no branded-link SSL)
description: Why click tracking is disabled per-message in the SendGrid send path, and what must happen before re-enabling it.
---

**Rule:** Keep `trackingSettings.clickTracking = disabled` on all SendGrid sends until branded-link SSL is provisioned for the account's link-branding subdomain.

**Why:** SendGrid's account-level click tracking is ON and rewrites every email link through the branded subdomain `url8668.bright-organic.com` (CNAME → sendgrid.net, DNS valid per `/v3/whitelabel/links`). But that subdomain serves SendGrid's `*.sendgrid.net` certificate — hostname mismatch — so every HTTPS click gets a browser security block and "links not opening" reports from recipients (July 2026). Plain HTTP redirects fine, proving it's purely missing branded-link SSL.

**How to apply:** The per-message `trackingSettings` override in the central send function covers all app sends (bulk + single; Gmail path unaffected). If the user later wants click stats in campaign reports (`clicked` status via the SendGrid webhook only fires with click tracking on), the account owner must first enable SSL for branded links (SendGrid-managed SSL or a Cloudflare-proxied CNAME), verify `https://url8668.bright-organic.com` serves a matching cert, then remove the per-message override.

**Note:** The account also has two stale, invalid link-branding entries (url3371, url9864); url8668 is the valid one.
