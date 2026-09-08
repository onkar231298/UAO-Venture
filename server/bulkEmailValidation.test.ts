import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessCampaign,
  dedupeRecipients,
  isEligibleBulkEmailSender,
  parseCampaignSchedule,
  publicBulkEmailError,
  resolveBulkEmailReplyTo,
  mailchimpRoutingCapability,
  resolveSharedMailchimpConfiguration,
  sharedMailchimpConfigurationMatches,
} from "./bulkEmailCampaignService";
import { storeBulkAttachments, validateBulkAttachments } from "./bulkEmailAttachments";
import { acquireBulkEmailRequestLock } from "./bulkEmailRequestLock";

test("deduplicates recipients case-insensitively without mutating input", () => {
  const input = [
    { email: " Buyer@Example.com ", companyId: 1 },
    { email: "buyer@example.com", companyId: 2 },
    { email: "other@example.com", companyId: 3 },
  ];
  const snapshot = structuredClone(input);
  const output = dedupeRecipients(input);
  assert.deepEqual(input, snapshot);
  assert.deepEqual(output, [
    { email: "buyer@example.com", companyId: 1 },
    { email: "other@example.com", companyId: 3 },
  ]);
});

test("campaign ownership is isolated unless the caller is an admin", () => {
  assert.equal(canAccessCampaign({ createdBy: "sales-a" }, "sales-a", false), true);
  assert.equal(canAccessCampaign({ createdBy: "sales-a" }, "sales-b", false), false);
  assert.equal(canAccessCampaign({ createdBy: "sales-a" }, "admin", true), true);
});

test("only active sales and admin roles can bulk send", () => {
  assert.equal(isEligibleBulkEmailSender({ role: "sales_executive", accountStatus: "active" }), true);
  assert.equal(isEligibleBulkEmailSender({ role: "admin", accountStatus: "active" }), true);
  assert.equal(isEligibleBulkEmailSender({ role: "sales_executive", accountStatus: "suspended" }), false);
  assert.equal(isEligibleBulkEmailSender({ role: "quality_manager", accountStatus: "active" }), false);
});

test("uses an assigned company email for Reply-To without Titan connection or credentials", () => {
  const assigned = {
    companyEmail: " Gary@Bright-Organic.com ",
  };
  assert.equal(resolveBulkEmailReplyTo(assigned), "gary@bright-organic.com");
  assert.equal(resolveBulkEmailReplyTo({ companyEmail: "not-an-email" }, "staff@example.com"), "staff@example.com");
  assert.equal(resolveBulkEmailReplyTo(null, "not-an-email"), null);
});

test("explains the Mailchimp limitation for different From and agent Reply-To", () => {
  assert.equal(mailchimpRoutingCapability("sales@example.com", "sales@example.com").ready, true);
  const distinct = mailchimpRoutingCapability("sales@example.com", "agent@example.com");
  assert.equal(distinct.ready, false);
  assert.match(distinct.message || "", /provider limitation/i);
  assert.equal(mailchimpRoutingCapability("sales@example.com", null).ready, false);
});

test("enabled sales users require one Mailchimp audience and sender identity", () => {
  const existing = [{
    audienceId: "shared-audience",
    fromEmail: " SALES@Example.com ",
    fromName: "Sales Team",
  }];
  assert.equal(
    sharedMailchimpConfigurationMatches(existing, {
      audienceId: "shared-audience",
      fromEmail: "sales@example.com",
      fromName: "Sales Team",
    }),
    true,
  );
  assert.equal(
    sharedMailchimpConfigurationMatches(existing, {
      audienceId: "another-audience",
      fromEmail: "sales@example.com",
      fromName: "Sales Team",
    }),
    false,
  );
  assert.equal(
    sharedMailchimpConfigurationMatches(existing, {
      audienceId: "shared-audience",
      fromEmail: "person@example.com",
      fromName: "Sales Team",
    }),
    false,
  );
  assert.equal(
    sharedMailchimpConfigurationMatches(existing, {
      audienceId: "shared-audience",
      fromEmail: "sales@example.com",
      fromName: "Another Team",
    }),
    false,
  );
});

test("shared configuration normalizes duplicates and exposes distinct legacy conflicts", () => {
  assert.deepEqual(resolveSharedMailchimpConfiguration([
    { audienceId: "audience", fromEmail: " SALES@example.com ", fromName: " Sales " },
    { audienceId: "audience", fromEmail: "sales@example.com", fromName: "Sales" },
  ]), {
    configuration: { audienceId: "audience", fromEmail: "sales@example.com", fromName: "Sales" },
    conflicts: [],
  });
  const result = resolveSharedMailchimpConfiguration([
    { audienceId: "first", fromEmail: "sales@example.com", fromName: "Sales" },
    { audienceId: "second", fromEmail: "sales@example.com", fromName: "Sales" },
  ]);
  assert.equal(result.conflicts.length, 2);
});

test("preserves safe client errors without exposing unexpected failures", () => {
  assert.deepEqual(
    publicBulkEmailError({ status: 403, message: "Selected company is not assigned to you." }),
    { status: 403, message: "Selected company is not assigned to you." },
  );
  assert.deepEqual(
    publicBulkEmailError({ status: 400, message: "Attachment content is invalid." }),
    { status: 400, message: "Attachment content is invalid." },
  );
  assert.deepEqual(
    publicBulkEmailError(new Error("database connection contains private details")),
    { status: 500, message: "Failed to create email campaign" },
  );
});

test("accepts only bounded future campaign schedules", () => {
  const now = Date.parse("2026-09-07T00:00:00Z");
  assert.equal(parseCampaignSchedule(undefined, now), undefined);
  assert.equal(
    parseCampaignSchedule("2026-09-07T00:10:00Z", now)?.toISOString(),
    "2026-09-07T00:10:00.000Z",
  );
  assert.throws(() => parseCampaignSchedule("not-a-date", now));
  assert.throws(() => parseCampaignSchedule("2026-09-07T00:09:59Z", now));
  assert.throws(() => parseCampaignSchedule("2028-09-07T00:00:00Z", now));
});

test("validates attachment bytes and derives MIME without trusting client MIME", () => {
  const valid = validateBulkAttachments([
    {
      filename: "offer.pdf",
      type: "text/html",
      content: Buffer.from("%PDF-1.7\ncontent").toString("base64"),
    },
  ]);
  assert.equal(valid[0].contentType, "application/pdf");
  assert.equal(valid[0].size, 16);
  assert.throws(() =>
    validateBulkAttachments([
      {
        filename: "offer.pdf",
        type: "application/pdf",
        content: Buffer.from("<html>not a pdf</html>").toString("base64"),
      },
    ]),
  );
  assert.throws(() =>
    validateBulkAttachments([
      {
        filename: "payload.html",
        type: "text/html",
        content: Buffer.from("<html></html>").toString("base64"),
      },
    ]),
  );
  assert.throws(() =>
    validateBulkAttachments([
      {
        filename: "offer.pdf",
        type: "application/pdf",
        content: "definitely-not-base64",
      },
    ]),
  );
});

test("preserves partial upload references when compensating cleanup fails", async () => {
  let uploads = 0;
  await assert.rejects(
    storeBulkAttachments(
      "sales-user",
      42,
      [
        { bytes: Buffer.from("%PDF-one"), filename: "one.pdf", contentType: "application/pdf", size: 8 },
        { bytes: Buffer.from("%PDF-two"), filename: "two.pdf", contentType: "application/pdf", size: 8 },
      ],
      {
        upload: (async (_bytes: Buffer, filename: string) => {
          uploads += 1;
          if (uploads === 2) throw new Error("upload failed");
          return { key: `key-${filename}`, url: `https://files.example/${filename}` };
        }) as any,
        remove: (async () => {
          throw new Error("cleanup failed");
        }) as any,
      },
    ),
    (error: any) =>
      error?.recoverableAttachments?.[0]?.key === "key-one.pdf",
  );
});

test("allows only one worker to own a campaign request key", async () => {
  let held = false;
  const fakePool = {
    connect: async () => ({
      query: async (sql: string) => {
        if (sql.includes("pg_try_advisory_lock")) {
          if (held) return { rows: [{ acquired: false }] };
          held = true;
          return { rows: [{ acquired: true }] };
        }
        if (sql.includes("pg_advisory_unlock")) held = false;
        return { rows: [{}] };
      },
      release: () => undefined,
    }),
  };
  const first = await acquireBulkEmailRequestLock("user", "key", fakePool as any);
  const blocked = await acquireBulkEmailRequestLock("user", "key", fakePool as any);
  assert.ok(first);
  assert.equal(blocked, null);
  await first?.assertHeld();
  await first?.release();
  const afterRelease = await acquireBulkEmailRequestLock("user", "key", fakePool as any);
  assert.ok(afterRelease);
  await afterRelease?.release();
});