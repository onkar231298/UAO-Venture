import assert from "node:assert/strict";
import { test } from "node:test";
import { companyLengthErrors } from "./companyValidation";

test("company phone fields preserve multiple numbers longer than 50 characters", () => {
  const phone = "+356 12345678 / +356 23456789 / +356 34567890 / +356 45678901";
  assert.ok(phone.length > 50);
  assert.deepEqual(companyLengthErrors({ primaryPhone: phone }), []);
});

test("company updates report each overlong field without truncating input", () => {
  const input = { addressZip: "X".repeat(21), companyName: "A".repeat(256), gstNumber: "B".repeat(51) };
  const errors = companyLengthErrors(input);
  assert.deepEqual(errors.map(error => error.field).sort(), ["addressZip", "companyName", "gstNumber"]);
  assert.equal(input.addressZip.length, 21);
  assert.match(errors.find(error => error.field === "addressZip")!.message, /20 characters/);
});

test("company limits accept exact boundaries, nulls and PostgreSQL Unicode character lengths", () => {
  assert.deepEqual(companyLengthErrors({ addressZip: "X".repeat(20), addressCity: "😀".repeat(100), primaryPhone: null }), []);
  assert.equal(companyLengthErrors({ addressCity: "😀".repeat(101) })[0].field, "addressCity");
});
