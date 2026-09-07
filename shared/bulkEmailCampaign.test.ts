import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBulkEmailCampaignRequest,
  bulkEmailCampaignRequestSchema,
  serializeBulkEmailCampaignRequest,
} from "./bulkEmailCampaign";

test("bulk campaign request serialization preserves send-safety fields", () => {
  const request = buildBulkEmailCampaignRequest({
    name: "September follow-up",
    subject: "New products",
    htmlContent: "<p>Hello</p>",
    companyIds: [17, 23],
    idempotencyKey: "ff4f9b9a-2f3c-4e4f-94ad-8109b7cf32ac",
    permissionConfirmed: true,
  });

  const serialized = serializeBulkEmailCampaignRequest(request);
  const body = JSON.parse(serialized);

  assert.equal(body.idempotencyKey, "ff4f9b9a-2f3c-4e4f-94ad-8109b7cf32ac");
  assert.equal(body.permissionConfirmed, true);
  assert.equal(bulkEmailCampaignRequestSchema.safeParse(body).success, true);
});

test("bulk campaign request construction rejects missing permission", () => {
  assert.throws(() =>
    buildBulkEmailCampaignRequest({
      name: "September follow-up",
      subject: "New products",
      htmlContent: "<p>Hello</p>",
      companyIds: [17],
      idempotencyKey: "ff4f9b9a-2f3c-4e4f-94ad-8109b7cf32ac",
      permissionConfirmed: false,
    }),
  );
});