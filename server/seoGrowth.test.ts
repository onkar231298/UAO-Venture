import assert from "node:assert/strict";
import test from "node:test";
import { auditSeoPages, canonicalPageUrl, detectCompetingPages, isCriticalSeoFindingResolved, keywordMatches, replacePrimaryKeywordList, type SeoPage } from "./seoGrowth";

const page = (overrides: Partial<SeoPage> = {}): SeoPage => ({
  id: "1",
  type: "product",
  url: "https://bright-organic.com/products/turmeric",
  title: "Organic Turmeric Powder Supplier from India",
  description: "Source certified organic turmeric powder for food and ingredient applications from Cape NatureX Organic in India.",
  content: "Detailed factual product information ".repeat(8),
  image: "/turmeric.webp",
  canonicalUrl: "https://bright-organic.com/products/turmeric",
  inSitemap: true,
  hasInboundLink: true,
  ...overrides,
});

test("canonical URLs reject foreign, query, hash, and API URLs", () => {
  assert.equal(canonicalPageUrl("/products/turmeric/"), "https://bright-organic.com/products/turmeric");
  assert.equal(canonicalPageUrl("https://example.com/products/turmeric"), null);
  assert.equal(canonicalPageUrl("/products/turmeric?ref=x"), null);
  assert.equal(canonicalPageUrl("/api/products/1"), null);
});

test("page audit classifies missing metadata and sitemap coverage", () => {
  const findings = auditSeoPages([page({ title: "", description: "", inSitemap: false })]);
  assert.ok(findings.some((item) => item.title === "Missing SEO title" && item.severity === "critical"));
  assert.ok(findings.some((item) => item.title === "Missing meta description" && item.severity === "high"));
  assert.ok(findings.some((item) => item.title === "Indexable page is missing from the sitemap" && item.severity === "critical"));
});

test("critical findings cannot be completed until a fresh scan resolves them", () => {
  const brokenPage = page({ inSitemap: false });
  const critical = auditSeoPages([brokenPage]).find((item) => item.severity === "critical");
  assert.ok(critical);
  assert.equal(isCriticalSeoFindingResolved([brokenPage], critical.fingerprint), false);
  assert.equal(isCriticalSeoFindingResolved([page()], critical.fingerprint), true);
});

test("page audit detects duplicate metadata and thin content", () => {
  const findings = auditSeoPages([
    page({ id: "1", url: "https://bright-organic.com/products/a", canonicalUrl: "https://bright-organic.com/products/a", content: "short" }),
    page({ id: "2", url: "https://bright-organic.com/products/b", canonicalUrl: "https://bright-organic.com/products/b" }),
  ]);
  assert.equal(findings.filter((item) => item.title === "Duplicate SEO title").length, 2);
  assert.ok(findings.some((item) => item.title === "Page content is very limited"));
});

test("keyword matching identifies multiple competing canonical pages", () => {
  assert.equal(keywordMatches("bulk organic turmeric powder supplier", "organic turmeric supplier"), true);
  assert.deepEqual(detectCompetingPages([
    { query: "organic turmeric powder supplier", page: "https://bright-organic.com/products/a" },
    { query: "bulk organic turmeric supplier", page: "https://bright-organic.com/products/b" },
    { query: "unrelated ginger", page: "https://bright-organic.com/products/c" },
  ], "organic turmeric supplier"), [
    "https://bright-organic.com/products/a",
    "https://bright-organic.com/products/b",
  ]);
});

test("confirmed replacements preserve one comma-separated keyword entry", () => {
  assert.equal(
    replacePrimaryKeywordList("organic turmeric, bulk ginger", "organic turmeric", "turmeric supplier"),
    "turmeric supplier, bulk ginger",
  );
  assert.throws(() => replacePrimaryKeywordList("organic turmeric", "organic turmeric", "turmeric, ginger"), /without commas/);
  assert.throws(() => replacePrimaryKeywordList("organic turmeric, bulk ginger", "organic turmeric", "bulk ginger"), /already exists/);
  assert.throws(() => replacePrimaryKeywordList("organic turmeric", "missing", "turmeric supplier"), /no longer/);
});