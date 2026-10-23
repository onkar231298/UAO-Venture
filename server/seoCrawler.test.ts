import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { analyzeSeoHtml, runSeoCrawlerAudit } from "./seoCrawler";

const validHome = `<html><head>
<title>Atlas Ingredients | Certified Organic Ingredient Supplier</title>
<meta name="description" content="Source certified organic ingredients with dependable quality, documentation and global B2B supply from Atlas Ingredients.">
<link rel="canonical" href="https://bright-organic.com/">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Atlas Ingredients"}</script>
</head><body><main><h1>Organic Ingredients for Global Buyers</h1>
<p>${"Atlas Ingredients supplies certified organic ingredients to food, supplement and pharmaceutical manufacturers. ".repeat(2)}</p>
<img src="/decorative.webp" alt="" role="presentation"><a href="/products/turmeric">Turmeric</a>
</main></body></html>`;

test("HTML parser checks returned metadata, content and schema without treating empty alt as an error", () => {
  const { page, findings } = analyzeSeoHtml(
    "https://bright-organic.com/",
    validHome,
    200,
    "text/html; charset=utf-8",
    20,
    true,
  );
  assert.equal(page.title, "Atlas Ingredients | Certified Organic Ingredient Supplier");
  assert.equal(page.h1Count, 1);
  assert.equal(page.structuredData[0]?.type, "Organization");
  assert.equal(page.contentLength > 120, true);
  assert.equal(findings.some(item => item.title === "Image is missing an alt attribute"), false);
  assert.equal(findings.some(item => item.title === "Expected structured data type was not found"), false);
});

test("missing alt attributes are reported, while noindex pages are distinguished from indexable pages", () => {
  const missingAlt = analyzeSeoHtml(
    "https://bright-organic.com/products/turmeric",
    `<html><head><title>Turmeric powder product page</title><meta name="description" content="${"Turmeric ingredient. ".repeat(5)}"><link rel="canonical" href="https://bright-organic.com/products/turmeric"></head><body><h1>Turmeric powder</h1><img src="/turmeric.webp"></body></html>`,
    200,
    "text/html",
    10,
    true,
  );
  assert.ok(missingAlt.findings.some(item => item.title === "Image is missing an alt attribute"));

  const noindex = analyzeSeoHtml(
    "https://bright-organic.com/private-preview",
    `<html><head><meta name="robots" content="noindex"><script type="application/ld+json">{"@type":"WebPage"}</script></head><body>Preview</body></html>`,
    200,
    "text/html",
    10,
    true,
  );
  assert.ok(noindex.findings.some(item => item.title === "A noindex page is listed in the sitemap"));
  assert.equal(noindex.findings.some(item => item.title === "Rendered page is missing its title"), false);
  assert.equal(noindex.findings.some(item => item.title === "Rendered page has 0 H1 headings"), false);
});

test("malformed JSON-LD and multiple H1 headings are surfaced", () => {
  const { findings } = analyzeSeoHtml(
    "https://bright-organic.com/about",
    `<html><head><title>Atlas Ingredients company information page</title><meta name="description" content="${"Learn about our company and ingredient sourcing. ".repeat(3)}"><link rel="canonical" href="https://bright-organic.com/about"><script type="application/ld+json">{broken}</script></head><body><h1>About</h1><h1>Company</h1></body></html>`,
    200,
    "text/html",
    10,
    true,
  );
  assert.ok(findings.some(item => item.title === "Structured data could not be parsed"));
  assert.ok(findings.some(item => item.title === "Rendered page has 2 H1 headings"));
});

test("the crawl continues through a same-host sitemap in resumable batches and checks internal links", async () => {
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (url.pathname === "/robots.txt") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end(`User-agent: *\nDisallow: /private\nSitemap: http://${req.headers.host}/sitemap.xml\n`);
      return;
    }
    if (url.pathname === "/sitemap.xml") {
      res.writeHead(200, { "content-type": "application/xml" });
      res.end(`<urlset><url><loc>http://${req.headers.host}/</loc></url><url><loc>http://${req.headers.host}/duplicate</loc></url><url><loc>http://${req.headers.host}/private</loc></url></urlset>`);
      return;
    }
    if (url.pathname === "/broken") {
      res.writeHead(404, { "content-type": "text/html" });
      res.end("<h1>Not found</h1>");
      return;
    }
    if (url.pathname === "/private") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(`<html><head><meta name="robots" content="noindex"><title>Preview page</title></head><body>Hidden</body></html>`);
      return;
    }
    if (url.pathname === "/duplicate") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(validHome.replace("https://bright-organic.com/", "https://bright-organic.com/duplicate").replace("/products/turmeric", "/broken"));
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(validHome.replace("/products/turmeric", "/broken"));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    const report = await runSeoCrawlerAudit({
      baseUrl: `http://127.0.0.1:${address.port}`,
      environment: "development",
      maxPages: 1,
      concurrency: 2,
    });
    assert.equal(report.scannedPageCount, 1);
    assert.equal(report.sitemapUrlCount, 3);
    assert.equal(report.totalEligiblePageCount, 2);
    assert.equal(report.nextCursor, 1);
    assert.equal(report.complete, false);
    assert.equal(report.sitemapReadComplete, true);
    assert.equal(report.performance.environment, "development");
    assert.match(report.performance.advisory, /not representative/);
    assert.ok(report.findings.some(item => item.title === "Robots rules block a URL listed in the sitemap"));
    assert.equal(report.excludedPageCount, 1);
    assert.ok(report.findings.some(item => item.title === "Internal link did not reach a successful page" && item.targetUrl?.endsWith("/broken")));
    await assert.rejects(() => runSeoCrawlerAudit({
      baseUrl: `http://127.0.0.1:${address.port}`,
      environment: "development",
      maxPages: 1,
      offset: report.nextCursor,
      snapshotHash: "0".repeat(64),
    }), /SEO_SITEMAP_CHANGED/);
    await assert.rejects(() => runSeoCrawlerAudit({
      baseUrl: `http://127.0.0.1:${address.port}`,
      environment: "production",
      maxPages: 1,
      offset: report.nextCursor,
      snapshotHash: report.snapshotHash,
    }), /SEO_SITEMAP_CHANGED/);
    const continuation = await runSeoCrawlerAudit({
      baseUrl: `http://127.0.0.1:${address.port}`,
      environment: "development",
      maxPages: 1,
      offset: report.nextCursor,
      snapshotHash: report.snapshotHash,
    });
    assert.equal(continuation.scannedPageCount, 1);
    assert.equal(continuation.complete, true);
    assert.equal(continuation.sitemapReadComplete, true);
    assert.equal(continuation.nextCursor, 2);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test("continues beyond the 300-page request boundary until every sitemap URL is checked", async () => {
  const sitemapPageCount = 305;
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (url.pathname === "/robots.txt") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end(`User-agent: *\nSitemap: http://${req.headers.host}/sitemap.xml\n`);
      return;
    }
    if (url.pathname === "/sitemap.xml") {
      const urls = Array.from({ length: sitemapPageCount }, (_, index) =>
        `<url><loc>http://${req.headers.host}/catalog/${index}</loc></url>`).join("");
      res.writeHead(200, { "content-type": "application/xml" });
      res.end(`<urlset>${urls}</urlset>`);
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end("<html><head><title>Catalog page</title></head><body><main><h1>Catalog</h1><p>Content</p></main></body></html>");
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const firstBatch = await runSeoCrawlerAudit({
      baseUrl,
      environment: "development",
      concurrency: 3,
    });
    assert.equal(firstBatch.nextCursor, 300);
    assert.equal(firstBatch.totalEligiblePageCount, sitemapPageCount);
    assert.equal(firstBatch.skippedPageCount, 5);
    assert.equal(firstBatch.complete, false);

    const finalBatch = await runSeoCrawlerAudit({
      baseUrl,
      environment: "development",
      concurrency: 3,
      offset: firstBatch.nextCursor,
      snapshotHash: firstBatch.snapshotHash,
    });
    assert.equal(finalBatch.nextCursor, sitemapPageCount);
    assert.equal(finalBatch.skippedPageCount, 0);
    assert.equal(finalBatch.scannedPageCount, 5);
    assert.equal(finalBatch.complete, true);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test("reads all child sitemaps beyond the former eight-file limit", async () => {
  const childSitemapCount = 10;
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (url.pathname === "/robots.txt") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end(`User-agent: *\nSitemap: http://${req.headers.host}/sitemap.xml\n`);
      return;
    }
    if (url.pathname === "/sitemap.xml") {
      const children = Array.from({ length: childSitemapCount }, (_, index) =>
        `<sitemap><loc>http://${req.headers.host}/sitemap-${index}.xml</loc></sitemap>`).join("");
      res.writeHead(200, { "content-type": "application/xml" });
      res.end(`<sitemapindex>${children}</sitemapindex>`);
      return;
    }
    const childMatch = url.pathname.match(/^\/sitemap-(\d+)\.xml$/);
    if (childMatch) {
      const pagePath = `/item-${childMatch[1]}`;
      res.writeHead(200, { "content-type": "application/xml" });
      res.end(`<urlset><url><loc>http://${req.headers.host}${pagePath}</loc></url></urlset>`);
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end("<html><head><title>Public page</title></head><body><main><h1>Page</h1><p>Content</p></main></body></html>");
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    const report = await runSeoCrawlerAudit({
      baseUrl: `http://127.0.0.1:${address.port}`,
      environment: "development",
      maxPages: 20,
      concurrency: 3,
    });
    assert.equal(report.sitemapUrlCount, childSitemapCount);
    assert.equal(report.totalEligiblePageCount, childSitemapCount);
    assert.equal(report.nextCursor, childSitemapCount);
    assert.equal(report.skippedPageCount, 0);
    assert.equal(report.sitemapReadComplete, true);
    assert.equal(report.complete, true);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test("accepts a sitemap larger than the HTML response limit", async () => {
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (url.pathname === "/robots.txt") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end(`User-agent: *\nSitemap: http://${req.headers.host}/sitemap.xml\n`);
      return;
    }
    if (url.pathname === "/sitemap.xml") {
      const padding = " ".repeat(2 * 1024 * 1024 + 64);
      res.writeHead(200, { "content-type": "application/xml" });
      res.end(`<urlset>${padding}<url><loc>http://${req.headers.host}/large-sitemap-page</loc></url></urlset>`);
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end("<html><head><title>Public page</title></head><body><main><h1>Page</h1><p>Content</p></main></body></html>");
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    const report = await runSeoCrawlerAudit({
      baseUrl: `http://127.0.0.1:${address.port}`,
      environment: "development",
    });
    assert.equal(report.sitemapUrlCount, 1);
    assert.equal(report.totalEligiblePageCount, 1);
    assert.equal(report.sitemapReadComplete, true);
    assert.equal(report.complete, true);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test("does not mark the full crawl complete when the sitemap cannot be read", async () => {
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (url.pathname === "/robots.txt") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end(`User-agent: *\nSitemap: http://${req.headers.host}/sitemap.xml\n`);
      return;
    }
    if (url.pathname === "/sitemap.xml") {
      res.writeHead(503, { "content-type": "text/plain" });
      res.end("Unavailable");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(validHome);
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    const report = await runSeoCrawlerAudit({
      baseUrl: `http://127.0.0.1:${address.port}`,
      environment: "development",
    });
    assert.equal(report.sitemapReadComplete, false);
    assert.equal(report.complete, false);
    assert.ok(report.findings.some(item => item.title === "A readable sitemap could not be verified"));
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
