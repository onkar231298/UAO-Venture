import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  appendHtmlSignature,
  appendLegacyImageSignature,
  CRM_SIGNATURE_MARKER,
  hasSupportedSignatureContent,
  sanitizeSignatureHtml,
  signatureHtmlToText,
} from "./signature";

test("signature sanitization keeps email-safe HTML and inline CSS", () => {
  const sanitized = sanitizeSignatureHtml(`
    <table style="font-family: Arial, sans-serif; color: #166534; position: fixed">
      <tr><td style="padding: 8px"><strong>Jane Smith</strong></td></tr>
    </table>
  `);

  assert.match(sanitized, /<table/);
  assert.match(sanitized, /font-family:Arial, sans-serif/);
  assert.match(sanitized, /color:#166534/);
  assert.doesNotMatch(sanitized, /position/);
});

test("signature sanitization removes executable and unsafe content", () => {
  const sanitized = sanitizeSignatureHtml(`
    <script>alert(1)</script>
    <style>body { display: none }</style>
    <a href="javascript:alert(1)" onclick="alert(1)">Unsafe link</a>
    <img src="javascript:alert(1)" onerror="alert(1)">
    <form><input name="secret"></form>
  `);

  assert.doesNotMatch(sanitized, /script|onclick|onerror|javascript:|<style|<form|<input/i);
  assert.match(sanitized, /Unsafe link/);
});

test("signature text fallback remains readable", () => {
  const text = signatureHtmlToText(
    "<p><strong>Jane Smith</strong><br>Sales Manager</p><p><a href=\"mailto:jane@example.com\">jane@example.com</a></p>",
  );

  assert.equal(text, "Jane Smith\nSales Manager\njane@example.com");
});

test("HTML signatures are appended exactly once", () => {
  const first = appendHtmlSignature("<p>Hello</p>", "Hello", "<p><strong>Jane Smith</strong></p>");
  const second = appendHtmlSignature(first.html, first.text, "<p><strong>Jane Smith</strong></p>");

  assert.match(first.html, new RegExp(CRM_SIGNATURE_MARKER));
  assert.equal(second.html, first.html);
  assert.equal(second.text, first.text);
  assert.equal(hasSupportedSignatureContent("<img src=\"https://example.com/logo.png\">"), true);
});

test("marker text in a message body does not suppress the configured signature", () => {
  const body = `<p>The text ${CRM_SIGNATURE_MARKER} is part of this message.</p>`;
  const result = appendHtmlSignature(body, "Message", "<p>Jane Smith</p>");

  assert.notEqual(result.html, body);
  assert.match(result.html, /<div data-crm-signature="true"/);
});

test("legacy image signatures escape display names before inserting HTML", () => {
  const result = appendLegacyImageSignature(
    "<p>Hello</p>",
    "Hello",
    "https://example.com/signature.png",
    `Jane" onerror="alert(1)`,
  );

  assert.doesNotMatch(result.html, /alt="Jane" onerror=/);
  assert.match(result.html, /alt="Jane&quot; onerror=&quot;alert\(1\)"/);
  assert.equal(result.text, `Hello\n\n--\nJane" onerror="alert(1)`);
});

test("all Titan CRM send routes apply the configured signature helper", () => {
  const routesSource = readFileSync(new URL("../routes.ts", import.meta.url), "utf8");
  const sendRoutes = [
    "app.post('/api/sales-orders/:id/send'",
    "app.post('/api/crm/leads/:leadId/emails/send'",
    "app.post('/api/crm/leads/:leadId/quotations/:quotationId/send'",
  ];

  for (const routeStart of sendRoutes) {
    const startIndex = routesSource.indexOf(routeStart);
    assert.notEqual(startIndex, -1, `Missing send route: ${routeStart}`);
    const nextRouteIndex = routesSource.indexOf("\n  app.", startIndex + routeStart.length);
    const routeSource = routesSource.slice(startIndex, nextRouteIndex === -1 ? undefined : nextRouteIndex);
    assert.match(routeSource, /applyConfiguredEmailSignature\(/, `Signature helper is not wired into ${routeStart}`);
  }

  const companyHandlerStart = routesSource.indexOf("const sendCompanyEmail = async");
  const companyHandlerEnd = routesSource.indexOf("\n  app.post('/api/crm/companies/:id/emails/send'", companyHandlerStart);
  assert.notEqual(companyHandlerStart, -1, "Missing shared company email send handler");
  assert.notEqual(companyHandlerEnd, -1, "Missing company email send route");
  assert.match(
    routesSource.slice(companyHandlerStart, companyHandlerEnd),
    /applyConfiguredEmailSignature\(/,
    "Signature helper is not wired into the shared company email send handler",
  );
  assert.match(routesSource, /app\.post\('\/api\/crm\/companies\/:id\/emails\/send', isAuthenticated, sendCompanyEmail\)/);
  assert.match(routesSource, /app\.post\('\/api\/crm\/companies\/:id\/emails\/ai-send', isAuthenticated, sendCompanyEmail\)/);
});
