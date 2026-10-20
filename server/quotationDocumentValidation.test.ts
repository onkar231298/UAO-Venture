import test from "node:test";
import assert from "node:assert/strict";
import { validateQuotationDocument } from "./quotationDocumentValidation";

test("quotation uploads require the real PDF signature and normalize paths", () => {
  const result = validateQuotationDocument(
    "../../customer-signed.pdf",
    Buffer.from("%PDF-1.7\nsample"),
  );
  assert.deepEqual(result, { fileName: "customer-signed.pdf", mimeType: "application/pdf" });
});

test("quotation uploads reject mismatched extensions and active-content formats", () => {
  assert.equal(validateQuotationDocument("signed.pdf", Buffer.from("<html>")), null);
  assert.equal(validateQuotationDocument("signed.svg", Buffer.from("<svg/>")), null);
  assert.equal(validateQuotationDocument("signed.png", Buffer.from("%PDF-1.7")), null);
});

test("quotation uploads enforce a size limit", () => {
  assert.equal(
    validateQuotationDocument("large.pdf", Buffer.alloc(10 * 1024 * 1024 + 1)),
    null,
  );
});
