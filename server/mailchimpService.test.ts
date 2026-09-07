import assert from "node:assert/strict";
import test from "node:test";
import {
  appendCampaignFooter,
  audienceCampaignDefaultsMatch,
  campaignFooter,
  campaignIdempotencyMarker,
  deliveryOutcomeIsUncertain,
  configureAudienceCampaignDefaults,
  mailchimpMemberHash,
  mailchimpCampaignSettings,
  mapCampaignReport,
  mapEmailActivity,
  mapWebhookEvent,
  request,
  senderDomainIsVerified,
  toMailchimpMergeTags,
  verifyWebhookBasicAuth,
  ProviderError,
} from "./mailchimpService";

test("converts the supported CRM placeholders to Mailchimp merge tags", () => {
  assert.equal(
    toMailchimpMergeTags(
      "Hello {{ contact_name }} at {{company_name}} ({{EMAIL}} / {{ email }})",
    ),
    "Hello *|FNAME|* at *|COMPANY|* (*|EMAIL|* / *|EMAIL|*)",
  );
});

test("computes Mailchimp's normalized MD5 subscriber hash", () => {
  assert.equal(
    mailchimpMemberHash("  TEST@example.com "),
    "55502f40dc8b7c769880b10874abc9d0",
  );
});

test("escapes attachment labels and URLs and inserts the footer inside body", () => {
  const footer = campaignFooter([
    {
      filename: `<Q4 "pricing">&.pdf`,
      url: `https://files.example/x?a=1&b="two"`,
    },
  ]);
  assert.doesNotMatch(footer, /<Q4/);
  assert.doesNotMatch(footer, /b="two"/);
  assert.match(footer, /&lt;Q4 &quot;pricing&quot;&gt;&amp;\.pdf/);
  assert.match(footer, /\*\|UNSUB\|\*/);

  const html = appendCampaignFooter("<html><body><p>Hello</p></body></html>");
  assert.match(html, /Unsubscribe<\/a><\/div><\/body><\/html>$/);
});

test("maps aggregate Mailchimp reports without counting bounces as delivered", () => {
  const summary = mapCampaignReport({
    emails_sent: 100,
    send_time: "2026-09-07T10:00:00Z",
    bounces: { hard_bounces: 2, soft_bounces: 3, syntax_errors: 1 },
    opens: { unique_opens: 40 },
    clicks: { unique_subscriber_clicks: 12 },
    unsubscribed: 4,
  });
  assert.deepEqual(
    {
      ...summary,
      sentAt: summary.sentAt?.toISOString(),
    },
    {
      status: "sent",
      sentAt: "2026-09-07T10:00:00.000Z",
      sentCount: 100,
      deliveredCount: 94,
      openedCount: 40,
      clickedCount: 12,
      bouncedCount: 6,
      unsubscribedCount: 4,
    },
  );
});

test("maps recipient activity with click and bounce precedence", () => {
  const activity = mapEmailActivity({
    email_address: " Buyer@Example.com ",
    activity: [
      { action: "sent", timestamp: "2026-09-07T10:00:00Z" },
      { action: "open", timestamp: "2026-09-07T10:01:00Z" },
      { action: "click", timestamp: "2026-09-07T10:02:00Z" },
      { action: "bounce", type: "hard", timestamp: "2026-09-07T10:03:00Z" },
    ],
  });
  assert.equal(activity?.email, "buyer@example.com");
  assert.equal(activity?.status, "bounced");
  assert.equal(activity?.bounceReason, "hard");
});

test("maps JSON and legacy form-encoded webhook payloads", () => {
  assert.deepEqual(
    mapWebhookEvent({
      type: "unsubscribe",
      data: {
        list_id: "audience-1",
        email: " Buyer@Example.com ",
        campaign_id: "campaign-1",
        reason: "manual",
      },
    }),
    {
      type: "unsubscribe",
      audienceId: "audience-1",
      campaignId: "campaign-1",
      email: "buyer@example.com",
      newEmail: undefined,
      status: undefined,
      reason: "manual",
    },
  );

  assert.deepEqual(
    mapWebhookEvent({
      type: "upemail",
      "data[list_id]": "audience-2",
      "data[old_email]": "OLD@example.com",
      "data[new_email]": "new@example.com",
    }),
    {
      type: "upemail",
      audienceId: "audience-2",
      campaignId: undefined,
      email: "old@example.com",
      newEmail: "new@example.com",
      status: undefined,
      reason: undefined,
    },
  );
});

test("verifies Mailchimp webhook HTTP Basic credentials", () => {
  const secret = "test-signing-secret";
  const valid = `Basic ${Buffer.from(`mailchimp:${secret}`).toString("base64")}`;
  const wrongUser = `Basic ${Buffer.from(`other:${secret}`).toString("base64")}`;
  const wrongSecret = `Basic ${Buffer.from("mailchimp:wrong").toString("base64")}`;
  assert.equal(verifyWebhookBasicAuth(valid, secret), true);
  assert.equal(verifyWebhookBasicAuth(wrongUser, secret), false);
  assert.equal(verifyWebhookBasicAuth(wrongSecret, secret), false);
  assert.equal(verifyWebhookBasicAuth(undefined, secret), false);
});

test("recognizes only verified Mailchimp sender domains", () => {
  const domains = [
    { domain: "bright-organic.com", verified: true, status: "VERIFIED" },
    { domain: "pending.example", verified: false, status: "VERIFICATION_IN_PROGRESS" },
  ];
  assert.equal(senderDomainIsVerified("sales@bright-organic.com", domains), true);
  assert.equal(senderDomainIsVerified("sales@pending.example", domains), false);
});

test("recognizes the shared audience's visible sender defaults", () => {
  assert.equal(
    audienceCampaignDefaultsMatch(
      { from_email: " SALES@bright-organic.com ", from_name: "Sales Team" },
      { fromEmail: "sales@bright-organic.com", fromName: "Sales Team" },
    ),
    true,
  );
  assert.equal(
    audienceCampaignDefaultsMatch(
      { from_email: "other@bright-organic.com", from_name: "Sales Team" },
      { fromEmail: "sales@bright-organic.com", fromName: "Sales Team" },
    ),
    false,
  );
});

test("keeps the shared visible sender separate from the salesperson reply mailbox", () => {
  const settings = mailchimpCampaignSettings({
    name: "Customer follow-up",
    campaignKey: "ff4f9b9a-2f3c-4e4f-94ad-8109b7cf32ac",
    subject: "Hello {{ contact_name }}",
    fromName: "Bright Organic Sales",
    replyToEmail: "gary@bright-organic.com",
  });

  assert.equal(settings.from_name, "Bright Organic Sales");
  assert.equal(settings.reply_to, "gary@bright-organic.com");
  assert.equal(settings.subject_line, "Hello *|FNAME|*");
  assert.match(settings.title, /\[bfo:ff4f9b9a-2f3c-4e4f-94ad-8109b7cf32ac\]$/);
});

test("updates and verifies the audience's campaign-default sender", async () => {
  const originalKey = process.env.MAILCHIMP_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.MAILCHIMP_API_KEY = "test-us1";
  const requests: Array<{ method: string; body?: any }> = [];
  let defaults = {
    from_email: "old@example.com",
    from_name: "Old sender",
    subject: "Existing subject",
    language: "en",
  };
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    const method = init?.method || "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ method, body });
    if (method === "PATCH") defaults = body.campaign_defaults;
    return new Response(JSON.stringify({ id: "audience-1", campaign_defaults: defaults }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await configureAudienceCampaignDefaults("audience-1", {
      fromEmail: " Sales@Bright-Organic.com ",
      fromName: "Sales Team",
    });
    assert.deepEqual(requests.map((entry) => entry.method), ["GET", "PATCH", "GET"]);
    assert.deepEqual(requests[1].body, {
      campaign_defaults: {
        from_email: "sales@bright-organic.com",
        from_name: "Sales Team",
        subject: "Existing subject",
        language: "en",
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.MAILCHIMP_API_KEY;
    else process.env.MAILCHIMP_API_KEY = originalKey;
  }
});

test("fails closed for connector-only write attempts", async () => {
  const original = process.env.MAILCHIMP_API_KEY;
  delete process.env.MAILCHIMP_API_KEY;
  try {
    await assert.rejects(
      request("/campaigns", { method: "POST", body: {} }),
      (error: any) =>
        error?.type === "mailchimp-write-unavailable" &&
        error?.status === 503,
    );
  } finally {
    if (original === undefined) delete process.env.MAILCHIMP_API_KEY;
    else process.env.MAILCHIMP_API_KEY = original;
  }
});

test("distinguishes definitive provider rejection from uncertain delivery", () => {
  assert.equal(
    deliveryOutcomeIsUncertain(new ProviderError(400, "bad-request", "Rejected")),
    false,
  );
  assert.equal(
    deliveryOutcomeIsUncertain(new ProviderError(502, "unavailable", "Timeout")),
    true,
  );
  assert.equal(
    deliveryOutcomeIsUncertain(new ProviderError(429, "rate-limit", "Slow down")),
    true,
  );
});

test("uses the full request key as the remote recovery marker", () => {
  const key = "0d8f4e7b-2b9a-4ac4-a1f5-7a7927f690ba";
  assert.equal(campaignIdempotencyMarker(key), `[bfo:${key}]`);
});