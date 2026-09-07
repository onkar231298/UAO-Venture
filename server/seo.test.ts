import assert from "node:assert/strict";
import test from "node:test";
import { renderSeoHtml, STATIC_PAGE_SEO } from "./seo";

const template = "<html><head><title>old</title><meta name=\"description\" content=\"old\"></head><body><div id=\"root\"></div><script src=\"/app.js\"></script></body></html>";

test("SEO renderer escapes metadata and preserves the SPA document", () => {
  const html = renderSeoHtml({ title: `<Bright & "Organic">`, description: "A & B", keywords: "one,two", canonicalPath: "/products/a" }, template);
  assert.match(html, /<title>&lt;Bright &amp; &quot;Organic&quot;&gt;<\/title>/);
  assert.match(html, /https:\/\/bright-organic\.com\/products\/a/);
  assert.match(html, /<div id="root"><\/div><script src="\/app\.js"><\/script>/);
});

test("SEO renderer ignores request origins and invalid hreflang sets", () => {
  const html = renderSeoHtml({ title: "Test", canonicalPath: "/", hreflang: [{ language: "en", url: "/relative", isDefault: true }, { language: "fr", url: "https://example.com/fr" }] }, template);
  assert.match(html, /canonical" href="https:\/\/bright-organic\.com\//);
  assert.doesNotMatch(html, /hreflang=/);
});

test("SEO renderer emits language alternates and x-default only for a complete set", () => {
  const html = renderSeoHtml({
    title: "Test",
    canonicalPath: "/about",
    hreflang: [
      { language: "en", region: "IN", url: "https://bright-organic.com/about", isDefault: true },
      { language: "de", region: "DE", url: "https://bright-organic.com/de/uber-uns" },
    ],
  }, template);
  assert.match(html, /hreflang="en-IN"/);
  assert.match(html, /hreflang="de-DE"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/bright-organic\.com\/about"/);
});

test("SEO renderer suppresses malformed, duplicate, or unrelated hreflang sets", () => {
  const html = renderSeoHtml({
    title: "Test",
    canonicalPath: "/about",
    hreflang: [
      { language: "EN", region: "india", url: "https://bright-organic.com/about", isDefault: true },
      { language: "en", region: "IN", url: "https://bright-organic.com/about" },
      { language: "de", region: "DE", url: "https://external.example/de/about" },
    ],
  }, template);
  assert.doesNotMatch(html, /hreflang=/);
});

test("blog and service routes render canonical indexable metadata", () => {
  const paths = [
    "/blog",
    "/services/quality-testing",
    "/services/rd-support",
    "/services/regulatory-compliance",
    "/services/custom-packaging",
    "/services/logistics-solutions",
  ];
  for (const canonicalPath of paths) {
    const metadata = STATIC_PAGE_SEO[canonicalPath];
    assert.ok(metadata?.title);
    const html = renderSeoHtml({ ...metadata, canonicalPath }, template);
    assert.ok(html.includes(`<link rel="canonical" href="https://bright-organic.com${canonicalPath}" />`));
    assert.match(html, /<meta name="robots" content="index, follow" \/>/);
  }
});