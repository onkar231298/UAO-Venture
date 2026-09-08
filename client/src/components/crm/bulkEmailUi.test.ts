import assert from "node:assert/strict";
import test from "node:test";
import { bulkEmailErrorMessage } from "./bulkEmailUi";

test("extracts actionable problem detail and message", () => {
  assert.equal(
    bulkEmailErrorMessage(new Error('409: {"title":"Blocked","detail":"Routing is not verified."}'), "Fallback"),
    "Routing is not verified.",
  );
  assert.equal(
    bulkEmailErrorMessage(new Error('400: {"message":"Choose an audience."}'), "Fallback"),
    "Choose an audience.",
  );
});

test("handles plain and malformed errors safely", () => {
  assert.equal(bulkEmailErrorMessage(new Error("503: Provider unavailable"), "Fallback"), "Provider unavailable");
  assert.equal(bulkEmailErrorMessage(new Error('500: {"detail":'), "Fallback"), "Fallback");
});