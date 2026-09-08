import assert from "node:assert/strict";
import test from "node:test";
import {
  bulkEmailConfigurationSchema,
  configurationFieldErrors,
  sharedConfigurationDraft,
} from "./bulkEmailConfiguration";

test("shared draft preserves common audience and normalized email while leaving a differing name blank", () => {
  assert.deepEqual(sharedConfigurationDraft([
    { audienceId: "8c5d2d213a", fromEmail: " Sales@Example.com ", fromName: "Sales" },
    { audienceId: "8c5d2d213a", fromEmail: "sales@example.com", fromName: "BFI Sales" },
  ]), {
    audienceId: "8c5d2d213a",
    fromEmail: "sales@example.com",
    fromName: null,
  });
});

test("shared draft leaves every fully divergent field blank", () => {
  assert.deepEqual(sharedConfigurationDraft([
    { audienceId: "one", fromEmail: "one@example.com", fromName: "One" },
    { audienceId: "two", fromEmail: "two@example.com", fromName: "Two" },
  ]), {
    audienceId: null,
    fromEmail: null,
    fromName: null,
  });
});

test("configuration rejects null and blank fields with field messages", () => {
  const result = bulkEmailConfigurationSchema.safeParse({
    audienceId: null,
    fromEmail: "   ",
    fromName: null,
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(configurationFieldErrors(result.error), {
      audienceId: "Choose an audience.",
      fromEmail: "Enter a sender email address.",
      fromName: "Enter a sender display name.",
    });
  }
});

test("configuration trims valid values and defaults enableAll", () => {
  const result = bulkEmailConfigurationSchema.parse({
    audienceId: " 8c5d2d213a ",
    fromEmail: " sales@example.com ",
    fromName: " Sales Team ",
  });
  assert.deepEqual(result, {
    audienceId: "8c5d2d213a",
    fromEmail: "sales@example.com",
    fromName: "Sales Team",
    enableAll: false,
  });
});