import assert from "node:assert/strict";
import test from "node:test";
import { assertBulkEmailDispatchState } from "./bulkEmailDispatch";

const shared = { audienceId: "audience", fromEmail: "sales@example.com", fromName: "Sales" };
const expected = { ...shared, replyToEmail: "sales@example.com" };
const current = { enabled: true, configuration: shared, conflicts: [], replyToEmail: expected.replyToEmail };

test("final dispatch allows unchanged authorized same-address routing", () => {
  assert.doesNotThrow(() => assertBulkEmailDispatchState(expected, current));
});
test("a disable during preparation stops final dispatch", () => {
  assert.throws(() => assertBulkEmailDispatchState(expected, { ...current, enabled: false }), { status: 403 });
});
test("shared or reply changes and legacy conflicts stop final dispatch", () => {
  for (const state of [
    { ...current, configuration: null },
    { ...current, configuration: { ...shared, audienceId: "other" } },
    { ...current, configuration: { ...shared, fromName: "Different" } },
    { ...current, conflicts: [shared] },
    { ...current, replyToEmail: "another@example.com" },
  ]) assert.throws(() => assertBulkEmailDispatchState(expected, state), { status: 409 });
});
test("unchanged but unverified independent identities cannot bypass final routing gate", () => {
  for (const replyToEmail of ["alpha@example.com", "bravo@example.com"]) {
    assert.throws(() => assertBulkEmailDispatchState(
      { ...expected, replyToEmail }, { ...current, replyToEmail },
    ), /unverified/);
  }
});