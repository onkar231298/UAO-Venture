import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEmailAddress } from "./address";

test("email normalization accepts one valid mailbox and trims harmless whitespace", () => {
  assert.equal(normalizeEmailAddress(" Buyer@Example.COM "), "Buyer@example.com");
});

test("email normalization rejects imported non-email and multi-recipient values", () => {
  for (const value of [
    "contact us",
    "buyer",
    "buyer@example",
    "buyer@example.com; other@example.com",
    "buyer@example.com,other@example.com",
    "Buyer <buyer@example.com>",
    "@example.com",
    "buyer@",
    "buyer..name@example.com",
  ]) {
    assert.equal(normalizeEmailAddress(value), undefined, value);
  }
});