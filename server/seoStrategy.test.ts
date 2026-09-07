import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COLLECTION_PAGE_SEO, HOME_SEO, KEYWORD_ASSIGNMENTS, categoryPageSeo, healthSupportPageSeo } from "./seoStrategy";
import { generateProductSEO } from "./seoGenerator";
import { STATIC_PAGE_SEO } from "./seo";
import { keywordMatches } from "./seoGrowth";

describe("B2B SEO strategy", () => {
  it("keeps broad homepage targeting concise and commercial", () => {
    assert.equal(HOME_SEO.keywords.split(",").length, 4);
    assert.ok(HOME_SEO.title.length <= 65);
    assert.ok(HOME_SEO.description.length >= 70);
    assert.ok(HOME_SEO.description.length <= 170);
  });

  it("assigns every target keyword to exactly one canonical page", () => {
    const normalized = KEYWORD_ASSIGNMENTS.map((row) => row.keyword.toLowerCase());
    assert.equal(new Set(normalized).size, normalized.length);
    assert.ok(KEYWORD_ASSIGNMENTS.every((row) => row.pagePath.startsWith("/")));
  });

  it("represents every assigned keyword in its landing-page metadata", () => {
    const categoryNames: Record<string, string> = {
      "herbal-powders": "Herbal Powders",
      "extracts-powders": "Extracts & Powders",
    };
    for (const assignment of KEYWORD_ASSIGNMENTS) {
      const metadata = assignment.pagePath === "/"
        ? HOME_SEO
        : assignment.pageType === "category"
          ? categoryPageSeo(categoryNames[assignment.pageSlug!] || assignment.pageSlug!)
          : COLLECTION_PAGE_SEO[assignment.pagePath as keyof typeof COLLECTION_PAGE_SEO]
            || STATIC_PAGE_SEO[assignment.pagePath];
      assert.ok(metadata, `Missing metadata for ${assignment.pagePath}`);
      assert.ok(
        keywordMatches(`${metadata.title} ${metadata.description} ${metadata.keywords}`, assignment.keyword),
        `${assignment.keyword} is not represented on ${assignment.pagePath}`,
      );
    }
  });

  it("does not repeat an assigned primary phrase on another strategy page", () => {
    const normalizePhrase = (value: string) => value.toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const strategyPages: Record<string, { title: string; description: string; keywords: string }> = {
      "/": HOME_SEO,
      ...COLLECTION_PAGE_SEO,
      ...STATIC_PAGE_SEO,
      "/ingredients/herbal-powders": categoryPageSeo("Herbal Powders"),
      "/ingredients/extracts-powders": categoryPageSeo("Extracts & Powders"),
    };

    for (const assignment of KEYWORD_ASSIGNMENTS) {
      const targetPhrase = normalizePhrase(assignment.keyword);
      const competingPaths = Object.entries(strategyPages)
        .filter(([pagePath]) => pagePath !== assignment.pagePath)
        .filter(([, metadata]) =>
          normalizePhrase(`${metadata.title} ${metadata.description} ${metadata.keywords}`)
            .includes(targetPhrase))
        .map(([pagePath]) => pagePath);
      assert.deepEqual(
        competingPaths,
        [],
        `${assignment.keyword} is also explicitly targeted by ${competingPaths.join(", ")}`,
      );
    }
  });

  it("creates distinct category and application metadata", () => {
    assert.match(categoryPageSeo("Herbal Powders").title, /Bulk Herbal Powders/);
    assert.match(healthSupportPageSeo("Digestive Support").title, /Digestive Support/);
    assert.notEqual(COLLECTION_PAGE_SEO["/products"].title, COLLECTION_PAGE_SEO["/ingredients"].title);
  });

  it("creates readable product metadata without unsupported compliance claims", () => {
    const result = generateProductSEO({ id: 1, name: "Ashwagandha Root Powder", isOrganic: true, category: "Herbal Powders" });
    assert.ok(result.seoTitle.length <= 65);
    assert.match(result.seoTitle, /Bulk Organic Supplier India/);
    assert.doesNotMatch(result.seoDescription, /EU 2018|ETO-free|top B2B/i);
    assert.ok(result.seoDescription.length <= 165);
    const organicByProductType = generateProductSEO({ id: 2, name: "Ashwagandha Root Powder", isOrganic: false, productType: "organic", category: "Herbal Powders" });
    assert.match(organicByProductType.seoTitle, /Bulk Organic Supplier India/);
    const organicByName = generateProductSEO({ id: 3, name: "Organic Ashwagandha Root Powder", isOrganic: true, productType: "organic", category: "Herbal Powders" });
    assert.notEqual(organicByName.seoDescription.toLowerCase(), organicByProductType.seoDescription.toLowerCase());
  });
});