import test from "node:test";
import assert from "node:assert/strict";
import { extractOwnedQualityAttachmentKey, getImageUrl } from "./s3Upload";

test("quality attachment cleanup accepts only this app's owned upload prefix", () => {
  const ownedUrl = getImageUrl("quality-attachments/record-report.pdf");
  assert.equal(
    extractOwnedQualityAttachmentKey(ownedUrl),
    "quality-attachments/record-report.pdf",
  );
  assert.equal(
    extractOwnedQualityAttachmentKey(`${ownedUrl}?download=1`),
    "quality-attachments/record-report.pdf",
  );
  assert.equal(
    extractOwnedQualityAttachmentKey(getImageUrl("products/1/image.png")),
    null,
  );
});

test("quality attachment cleanup ignores pasted and lookalike URLs", () => {
  const owned = new URL(getImageUrl("quality-attachments/report.pdf"));
  assert.equal(extractOwnedQualityAttachmentKey("https://example.com/quality-attachments/report.pdf"), null);
  assert.equal(
    extractOwnedQualityAttachmentKey(`https://${owned.hostname}.evil.example/quality-attachments/report.pdf`),
    null,
  );
  assert.equal(extractOwnedQualityAttachmentKey("not a url"), null);
});