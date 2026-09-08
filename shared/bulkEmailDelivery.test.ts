import test from "node:test";
import assert from "node:assert/strict";
import { bulkEmailDeliveryNotice } from "./bulkEmailDelivery";

test("successful HTTP responses never imply sent without provider confirmation", () => {
  for (const state of [undefined, null, "draft", "save", "delivery_uncertain", "paused"]) {
    assert.equal(bulkEmailDeliveryNotice(state).title, "Sending is not confirmed");
  }
  assert.equal(bulkEmailDeliveryNotice("sent").title, "Mailchimp confirmed sending");
  assert.match(bulkEmailDeliveryNotice("sent").description, /does not confirm inbox delivery/);
  assert.equal(bulkEmailDeliveryNotice("scheduled").title, "Mailchimp confirmed scheduling");
  assert.equal(bulkEmailDeliveryNotice("sending").title, "Mailchimp is processing");
});