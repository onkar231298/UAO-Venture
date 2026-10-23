import test from "node:test";
import assert from "node:assert/strict";
import {
  canConvertQuotationToSalesOrder,
  isAcceptanceWithinQuotationValidity,
  isQuotationExpired,
  parseAcceptanceDate,
  staffQuotationAcceptanceSchema,
} from "./quotationAcceptance";

test("only accepted quotations can be converted to sales orders", () => {
  for (const status of ["draft", "sent", "rejected", "expired", "converted", null, undefined]) {
    assert.equal(canConvertQuotationToSalesOrder(status), false, `${status} must not convert`);
  }
  assert.equal(canConvertQuotationToSalesOrder("accepted"), true);
});

test("quotation validity includes its final calendar date", () => {
  assert.equal(isQuotationExpired("2026-10-24", new Date("2026-10-24T20:00:00.000Z")), false);
  assert.equal(isQuotationExpired("2026-10-23", new Date("2026-10-24T00:00:00.000Z")), true);
  assert.equal(isQuotationExpired(null, new Date("2026-10-24T00:00:00.000Z")), false);
});

test("external acceptance date must be valid and within quotation validity", () => {
  const acceptedAt = parseAcceptanceDate("2026-10-24");
  assert.ok(acceptedAt);
  assert.equal(parseAcceptanceDate("2026-02-30"), null);
  assert.equal(isAcceptanceWithinQuotationValidity(acceptedAt, "2026-10-24"), true);
  assert.equal(isAcceptanceWithinQuotationValidity(acceptedAt, "2026-10-23"), false);
  assert.equal(isAcceptanceWithinQuotationValidity(acceptedAt, null), true);
});

test("signed-copy acceptance requires a document ID and other channels reject one", () => {
  assert.equal(staffQuotationAcceptanceSchema.safeParse({
    channel: "signed_quotation_upload",
    acceptedDate: "2026-10-24",
  }).success, false);
  assert.equal(staffQuotationAcceptanceSchema.safeParse({
    channel: "signed_quotation_upload",
    acceptedDate: "2026-10-24",
    documentId: 12,
  }).success, true);
  assert.equal(staffQuotationAcceptanceSchema.safeParse({
    channel: "email",
    acceptedDate: "2026-10-24",
    documentId: 12,
  }).success, false);
});
