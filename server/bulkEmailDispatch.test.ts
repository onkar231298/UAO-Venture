import assert from "node:assert/strict";
import test from "node:test";
import { assertBulkEmailDispatchState } from "./bulkEmailDispatch";
import {
  resolveAutomaticMailchimpConfiguration,
  resolveSharedMailchimpConfiguration,
} from "./bulkEmailCampaignService";

const shared = { audienceId: "audience", fromEmail: "sales@bright-organic.com", fromName: "Bright Fame Organic" };
const expected = { ...shared, replyToEmail: "sales@bright-organic.com" };
const current = { configuration: shared, conflicts: [] };

test("final dispatch allows unchanged authorized same-address routing", () => {
  assert.doesNotThrow(() => assertBulkEmailDispatchState(expected, current));
});
test("no per-user configuration is needed at final dispatch", () => {
  // The final snapshot is provider-resolved, not a per-user settings row.
  assert.doesNotThrow(() => assertBulkEmailDispatchState(expected, { configuration: shared, conflicts: [] }));
});
test("a sole automatically selected audience becoming ambiguous stops dispatch before send", () => {
  const legacy = resolveSharedMailchimpConfiguration([]);
  const expectedConfig = resolveAutomaticMailchimpConfiguration(legacy, [{ id: "sole" }]);
  let sent = false;
  assert.throws(() => {
    const current = resolveAutomaticMailchimpConfiguration(legacy, [{ id: "sole" }, { id: "later" }]);
    assertBulkEmailDispatchState({ ...expectedConfig, replyToEmail: expected.replyToEmail }, {
      configuration: current, conflicts: legacy.conflicts,
    });
    sent = true;
  }, /multiple audiences/i);
  assert.equal(sent, false);
});
test("shared or reply changes and legacy conflicts stop final dispatch", () => {
  for (const state of [
    { ...current, configuration: null },
    { ...current, configuration: { ...shared, audienceId: "other" } },
    { ...current, configuration: { ...shared, fromName: "Different" } },
    { ...current, conflicts: [shared] },
  ]) assert.throws(() => assertBulkEmailDispatchState(expected, state), { status: 409 });
});