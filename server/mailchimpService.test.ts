import assert from "node:assert/strict";
import test from "node:test";
import {
  appendCampaignFooter,
  audienceCampaignDefaultsMatch,
  campaignFooter,
  campaignReport,
  campaignIdempotencyMarker,
  deliveryOutcomeIsUncertain,
  configureAudienceCampaignDefaults,
  getMailchimpDeliveryState,
  mailchimpMemberHash,
  mailchimpCampaignSettings,
  mapCampaignReport,
  mapMailchimpDeliveryState,
  mapEmailActivity,
  mapWebhookEvent,
  recoverStaleCampaignAttempt,
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

test("maps aggregate reports from authoritative campaign delivery state", () => {
  const summary = mapCampaignReport({ status: "sent" }, {
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
      deliveredCount: 0,
      openedCount: 40,
      clickedCount: 12,
      bouncedCount: 6,
      unsubscribedCount: 4,
      providerError: null,
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

test("does not fabricate recipient activity for empty or unknown Mailchimp events", () => {
  assert.equal(
    mapEmailActivity({ email_address: "buyer@example.com", activity: [] }),
    null,
  );
  assert.equal(
    mapEmailActivity({
      email_address: "buyer@example.com",
      activity: [{ action: "unknown", timestamp: "2026-09-07T10:00:00Z" }],
    }),
    null,
  );
});

test("treats Mailchimp save status as delivery uncertain despite timestamps", () => {
  const state = mapMailchimpDeliveryState(
    { status: "save", emails_sent: 0, send_time: "2026-09-07T10:00:00Z" },
    { emails_sent: 0, send_time: "2026-09-07T10:00:00Z" },
  );
  assert.deepEqual(state, {
    status: "delivery_uncertain",
    sentCount: 0,
    sentAt: null,
    providerError:
      "Mailchimp reports this campaign as a draft; delivery has not been confirmed. The campaign may have been disabled, so check Mailchimp notifications before taking further action.",
  });
});

test("requires both sent provider status and positive send count", () => {
  assert.equal(
    mapMailchimpDeliveryState({ status: "sent", emails_sent: 0 }).status,
    "delivery_uncertain",
  );
  assert.deepEqual(
    {
      ...mapMailchimpDeliveryState(
        { status: "sent" },
        { emails_sent: 1, send_time: "2026-09-07T10:00:00Z" },
      ),
      sentAt: mapMailchimpDeliveryState(
        { status: "sent" },
        { emails_sent: 1, send_time: "2026-09-07T10:00:00Z" },
      ).sentAt?.toISOString(),
    },
    {
      status: "sent",
      sentCount: 1,
      sentAt: "2026-09-07T10:00:00.000Z",
      providerError: null,
    },
  );
});

test("recognizes paused and sending provider statuses without claiming completion", () => {
  const paused = mapMailchimpDeliveryState({
    status: "paused",
    emails_sent: 2,
    send_time: "2026-09-07T10:00:00Z",
  });
  assert.equal(paused.status, "delivery_uncertain");
  assert.equal(paused.sentCount, 2);
  assert.equal(paused.sentAt, null);
  assert.match(paused.providerError || "", /paused/);

  assert.deepEqual(
    mapMailchimpDeliveryState({
      status: "sending",
      emails_sent: 2,
      send_time: "2026-09-07T10:00:00Z",
    }),
    {
      status: "sending",
      sentCount: 2,
      sentAt: null,
      providerError: null,
    },
  );
});

test("never deletes or retries a save campaign with delivery evidence", async () => {
  const originalKey = process.env.MAILCHIMP_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.MAILCHIMP_API_KEY = "test-us1";
  const methods: string[] = [];
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    methods.push(init?.method || "GET");
    return new Response(
      JSON.stringify({
        id: "disabled-campaign",
        status: "save",
        emails_sent: 0,
        send_time: "2026-09-07T10:00:00Z",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof fetch;
  try {
    assert.deepEqual(
      await recoverStaleCampaignAttempt({
        campaignKey: "request-key",
        audienceId: "audience-1",
        campaignId: "disabled-campaign",
        segmentId: "segment-1",
      }),
      {
        outcome: "delivery_possible",
        campaignId: "disabled-campaign",
        segmentId: "segment-1",
        providerStatus: "save",
      },
    );
    assert.deepEqual(methods, ["GET"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.MAILCHIMP_API_KEY;
    else process.env.MAILCHIMP_API_KEY = originalKey;
  }
});

test("gets bounded campaign delivery state without a Mailchimp mutation", async () => {
  const originalKey = process.env.MAILCHIMP_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.MAILCHIMP_API_KEY = "test-us1";
  let requestedPath = "";
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    requestedPath = String(url);
    assert.equal(init?.method, "GET");
    return new Response(JSON.stringify({ status: "sending", emails_sent: 1 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  try {
    assert.deepEqual(await getMailchimpDeliveryState("campaign-1"), {
      status: "sending",
      sentCount: 1,
      sentAt: null,
      providerError: null,
    });
    assert.match(requestedPath, /campaigns\/campaign-1\?fields=id,status,emails_sent,send_time$/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.MAILCHIMP_API_KEY;
    else process.env.MAILCHIMP_API_KEY = originalKey;
  }
});

test("allows a missing report for a not-yet-sent campaign", async () => {
  const originalKey = process.env.MAILCHIMP_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.MAILCHIMP_API_KEY = "test-us1";
  globalThis.fetch = (async (url: string | URL | Request) => {
    if (String(url).includes("/reports/")) {
      return new Response("", { status: 404 });
    }
    return new Response(JSON.stringify({ status: "schedule", emails_sent: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  try {
    const result = await campaignReport("campaign-1");
    assert.equal(result.summary.status, "scheduled");
    assert.equal(result.summary.deliveredCount, 0);
    assert.deepEqual(result.recipients, []);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.MAILCHIMP_API_KEY;
    else process.env.MAILCHIMP_API_KEY = originalKey;
  }
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

test("builds Mailchimp campaign request fields without asserting delivered headers", () => {
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