import assert from "node:assert/strict";
import test from "node:test";
import { STATIC_PAGE_SEO } from "./seo";
import {
  buildSitemapEntries,
  isIndexableSitemapHealthSupport,
  renderSitemapXml,
  sitemapPageUrl,
  SITEMAP_STATIC_PATHS,
} from "./sitemap";
import { auditSeoPages, type SeoPage } from "./seoGrowth";

test("static sitemap inventory covers every indexable static SEO route", () => {
  assert.ok(SITEMAP_STATIC_PATHS.includes("/"));
  assert.ok(SITEMAP_STATIC_PATHS.includes("/products"));
  assert.ok(SITEMAP_STATIC_PATHS.includes("/ingredients"));
  assert.ok(SITEMAP_STATIC_PATHS.includes("/health-support"));
  for (const path of Object.keys(STATIC_PAGE_SEO)) assert.ok(SITEMAP_STATIC_PATHS.includes(path));

  const urls = new Set(buildSitemapEntries({}, new Date("2026-09-07T00:00:00Z")).map((entry) => entry.url));
  assert.ok(urls.has("https://bright-organic.com/blog"));
  assert.ok(urls.has("https://bright-organic.com/services/quality-testing"));
  assert.ok(urls.has("https://bright-organic.com/services/rd-support"));
  assert.ok(urls.has("https://bright-organic.com/services/regulatory-compliance"));
  assert.ok(urls.has("https://bright-organic.com/services/custom-packaging"));
  assert.ok(urls.has("https://bright-organic.com/services/logistics-solutions"));
});

test("dynamic sitemap inventory includes only live indexable records", () => {
  const entries = buildSitemapEntries({
    products: [
      { slug: "live-product", isActive: true, isVisible: true },
      { slug: "hidden-product", isActive: true, isVisible: false },
      { slug: "inactive-product", isActive: false, isVisible: true },
    ],
    categories: [
      { slug: "live-category", isActive: true },
      { slug: "inactive-category", isActive: false },
    ],
    healthSupports: [
      { slug: "live-support", isActive: true },
      { slug: "inactive-support", isActive: false },
    ],
    blogPosts: [
      { slug: "live-post", isPublished: true },
      { slug: "draft-post", isPublished: false },
    ],
  }, new Date("2026-09-07T00:00:00Z"));
  const urls = new Set(entries.map((entry) => entry.url));

  assert.ok(urls.has("https://bright-organic.com/products/live-product"));
  assert.ok(urls.has("https://bright-organic.com/ingredients/live-category"));
  assert.ok(urls.has("https://bright-organic.com/health-support/live-support"));
  assert.ok(urls.has("https://bright-organic.com/blog/live-post"));
  assert.ok(!urls.has("https://bright-organic.com/products/hidden-product"));
  assert.ok(!urls.has("https://bright-organic.com/products/inactive-product"));
  assert.ok(!urls.has("https://bright-organic.com/ingredients/inactive-category"));
  assert.ok(!urls.has("https://bright-organic.com/health-support/inactive-support"));
  assert.ok(!urls.has("https://bright-organic.com/blog/draft-post"));
});

test("sitemap output is canonical XML without API, query, hash, or foreign URLs", () => {
  const entries = buildSitemapEntries({
    products: [{ slug: "Psyllium & Husk", isActive: true, isVisible: true }],
  }, new Date("2026-09-07T00:00:00Z"));
  const xml = renderSitemapXml(entries);

  assert.match(xml, /https:\/\/bright-organic\.com\/products\/Psyllium%20%26%20Husk/);
  assert.doesNotMatch(xml, /<loc>[^<]*\/api\//);
  assert.doesNotMatch(xml, /<loc>[^<]*[?#]/);
  assert.doesNotMatch(xml, /<loc>https:\/\/(?!bright-organic\.com)/);
});

test("dynamic page URLs use the same encoded canonical form for sitemap and mapping validation", () => {
  assert.equal(
    sitemapPageUrl("/products", "Psyllium & Husk"),
    "https://bright-organic.com/products/Psyllium%20%26%20Husk",
  );
  assert.equal(
    sitemapPageUrl("/ingredients", "Herbs & Spices"),
    "https://bright-organic.com/ingredients/Herbs%20%26%20Spices",
  );
  assert.equal(
    sitemapPageUrl("/blog", "Buyer Guide"),
    "https://bright-organic.com/blog/Buyer%20Guide",
  );
});

test("inactive and slugless health supports never enter the audited sitemap inventory", () => {
  const healthSupports = [
    { id: 1, name: "Active Support", slug: "active-support", description: "Active health support content", isActive: true },
    { id: 2, name: "Inactive Support", slug: "inactive-support", description: "Hidden content", isActive: false },
    { id: 3, name: "Slugless Support", slug: " ", description: "Hidden content", isActive: true },
  ];
  const entries = buildSitemapEntries({ healthSupports }, new Date("2026-09-07T00:00:00Z"));
  const sitemapUrls = new Set(entries.map((entry) => entry.url));
  const pages: SeoPage[] = healthSupports.filter(isIndexableSitemapHealthSupport).map((healthSupport) => {
    const url = sitemapPageUrl("/health-support", healthSupport.slug);
    return {
      id: String(healthSupport.id),
      type: "health_support",
      url,
      title: healthSupport.name,
      description: healthSupport.description,
      content: `${healthSupport.name} ${healthSupport.description}`,
      canonicalUrl: url,
      inSitemap: sitemapUrls.has(url),
      hasInboundLink: true,
    };
  });
  assert.deepEqual(pages.map((page) => page.id), ["1"]);
  assert.equal(auditSeoPages(pages).some((finding) => finding.severity === "critical"), false);
});