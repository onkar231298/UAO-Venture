import assert from "node:assert/strict";
import test from "node:test";
import {
  CUSTOMER_EMAIL_TEMPLATE_DEFAULTS,
  renderCustomerEmailTemplate,
  renderCustomerEmailTemplatePreview,
} from "./customerTransactionalEmail";

test("renders customer values as escaped HTML and keeps text readable", () => {
  const result = renderCustomerEmailTemplate({
    subject: "Welcome {{first_name}}",
    htmlContent: "<p>Hello {{first_name}}</p><a href=\"{{reset_url}}\">Reset</a>",
    textContent: "Hello {{first_name}}\n{{reset_url}}",
    variables: ["first_name", "reset_url"],
  }, {
    first_name: "<Asha & Co>",
    reset_url: "https://atlas.example/reset?token=abc&next=1",
  });

  assert.equal(result.subject, "Welcome <Asha & Co>");
  assert.equal(result.html, "<p>Hello &lt;Asha &amp; Co&gt;</p><a href=\"https://atlas.example/reset?token=abc&amp;next=1\">Reset</a>");
  assert.equal(result.text, "Hello <Asha & Co>\nhttps://atlas.example/reset?token=abc&next=1");
});

test("removes control characters from email subjects and blanks unknown placeholders", () => {
  const result = renderCustomerEmailTemplate({
    subject: "Hello {{first_name}}",
    htmlContent: "<p>{{first_name}} {{unexpected}}</p>",
    textContent: "{{first_name}} {{unexpected}}",
    variables: ["first_name"],
  }, {
    first_name: "Asha\r\nBcc: attacker@example.com",
  });

  assert.equal(result.subject, "Hello Asha Bcc: attacker@example.com");
  assert.equal(result.html, "<p>Asha\r\nBcc: attacker@example.com </p>");
  assert.equal(result.text, "Asha\r\nBcc: attacker@example.com ");
});

test("only keeps HTTP and HTTPS URL values in templates", () => {
  const result = renderCustomerEmailTemplate({
    subject: "Shipment tracking",
    htmlContent: "<a href=\"{{tracking_url}}\">Track</a>",
    textContent: "Track: {{tracking_url}}",
    variables: ["tracking_url"],
  }, {
    tracking_url: "javascript:alert(1)",
  });

  assert.equal(result.html, "<a href=\"\">Track</a>");
  assert.equal(result.text, "Track: ");
});

test("provides active account defaults and draft-only future templates", () => {
  const byKey = new Map(CUSTOMER_EMAIL_TEMPLATE_DEFAULTS.map((template) => [template.templateKey, template]));
  assert.equal(byKey.get("customer_welcome")?.status, "active");
  assert.equal(byKey.get("customer_password_reset")?.status, "active");
  assert.equal(byKey.get("quotation_ready")?.status, "draft");
  assert.equal(byKey.get("sales_order_confirmation")?.status, "draft");
  assert.equal(byKey.get("customer_account_invitation")?.status, "draft");

  const preview = renderCustomerEmailTemplatePreview(byKey.get("customer_password_reset")!);
  assert.equal(preview.subject, "Reset your Atlas Ingredients password");
  assert.match(preview.html, /PREVIEW_ONLY/);
  assert.doesNotMatch(preview.html, /token=[a-f0-9]{64}/i);
});

test("adds four draft-only customer operations templates with complete previews", () => {
  const byKey = new Map(CUSTOMER_EMAIL_TEMPLATE_DEFAULTS.map((template) => [template.templateKey, template]));
  const expectedCategories: Record<string, string> = {
    customer_inquiry_received: "sales",
    sample_request_update: "sales",
    shipment_dispatch_update: "operations",
    quality_documents_ready: "quality",
  };

  for (const [templateKey, category] of Object.entries(expectedCategories)) {
    const template = CUSTOMER_EMAIL_TEMPLATE_DEFAULTS.find((item) => item.templateKey === templateKey);
    assert.ok(template, `Missing ${templateKey} template`);
    assert.equal(template.status, "draft");
    assert.equal(template.category, category);

    const preview = renderCustomerEmailTemplatePreview(template);
    assert.doesNotMatch(preview.subject + preview.html + preview.text, /\{\{\s*[a-zA-Z0-9_]+\s*\}\}/);
  }

  assert.match(byKey.get("customer_inquiry_received")!.textContent, /inquiry/);
  assert.match(byKey.get("sample_request_update")!.textContent, /sample request/);
  assert.match(byKey.get("shipment_dispatch_update")!.textContent, /Track shipment/);
  assert.match(byKey.get("quality_documents_ready")!.htmlContent, /For your security/);
});
