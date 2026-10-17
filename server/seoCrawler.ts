import { createHash } from "node:crypto";
import { parseDocument } from "htmlparser2";
import type { AnyNode, Element } from "domhandler";
import { CANONICAL_ORIGIN } from "./seo";

export type SeoCrawlerFinding = {
  fingerprint: string;
  category: "metadata" | "content" | "indexing" | "image" | "internal_link";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  recommendation: string;
  sourceUrl: string;
  targetUrl?: string;
  evidence: Record<string, unknown>;
};

export type CrawledSeoPage = {
  url: string;
  status: number;
  title: string;
  description: string;
  canonical: string | null;
  canonicalCount: number;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImage: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  robots: string;
  h1Count: number;
  contentLength: number;
  images: { src: string; hasAlt: boolean; alt: string; decorative: boolean }[];
  structuredData: { type: string; valid: boolean; error?: string }[];
  links: string[];
  durationMs: number;
  inSitemap: boolean;
};

export type SeoCrawlerResult = {
  generatedAt: string;
  environment: "development" | "production";
  startUrl: string;
  sitemapUrlCount: number;
  scannedPageCount: number;
  skippedPageCount: number;
  excludedPageCount: number;
  timeLimitReached: boolean;
  findings: SeoCrawlerFinding[];
  pages: CrawledSeoPage[];
  performance: {
    environment: "development" | "production";
    requestCount: number;
    medianMs: number;
    p75Ms: number;
    slowPageCount: number;
    advisory: string;
  };
};

const CRAWLER_UA = "AtlasIngredientsSeoAudit/1.0";
const DEFAULT_MAX_PAGES = 300;
const MAX_PAGES = 500;
const MAX_LINKS = 800;
const MAX_CONCURRENCY = 4;
const REQUEST_TIMEOUT_MS = 8_000;
const PRIVATE_PATH = /^\/(?:api|admin|crm|login|register|customer|staff|dashboard)(?:\/|$)/i;
const STATIC_ASSET = /\.(?:css|js|mjs|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot|mp4|webm)$/i;

function textContent(node: AnyNode): string {
  if ("data" in node && typeof node.data === "string") return node.data;
  if ("children" in node && Array.isArray(node.children)) return node.children.map(textContent).join(" ");
  return "";
}

function visibleTextContent(node: AnyNode): string {
  if ("data" in node && typeof node.data === "string") return node.data;
  if (node.type === "tag" || node.type === "script" || node.type === "style") {
    const element = node as Element;
    if (["script", "style", "noscript", "svg", "nav", "footer"].includes(element.name.toLowerCase())) return "";
  }
  if ("children" in node && Array.isArray(node.children)) return node.children.map(visibleTextContent).join(" ");
  return "";
}

function elements(root: AnyNode, name: string): Element[] {
  const found: Element[] = [];
  const visit = (node: AnyNode) => {
    if ((node.type === "tag" || node.type === "script" || node.type === "style") && (node as Element).name.toLowerCase() === name) found.push(node as Element);
    if ("children" in node && Array.isArray(node.children)) node.children.forEach(visit);
  };
  visit(root);
  return found;
}

function firstText(root: AnyNode, name: string): string {
  return textContent(elements(root, name)[0] || ({} as AnyNode)).replace(/\s+/g, " ").trim();
}

function finding(
  category: SeoCrawlerFinding["category"],
  severity: SeoCrawlerFinding["severity"],
  code: string,
  title: string,
  description: string,
  recommendation: string,
  sourceUrl: string,
  evidence: Record<string, unknown> = {},
  targetUrl?: string,
): SeoCrawlerFinding {
  const fingerprint = createHash("sha256").update([category, code, sourceUrl, targetUrl || ""].join("\u0000")).digest("hex");
  return { fingerprint, category, severity, title, description, recommendation, sourceUrl, ...(targetUrl ? { targetUrl } : {}), evidence };
}

function normalizePageUrl(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (url.search || url.hash) return null;
    url.pathname = url.pathname === "/" ? "/" : url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

function pathType(pathname: string): "static" | "product" | "category" | "health_support" | "blog" {
  if (/^\/products\/[^/]+/.test(pathname)) return "product";
  if (/^\/ingredients\/[^/]+/.test(pathname)) return "category";
  if (/^\/health-support\/[^/]+/.test(pathname)) return "health_support";
  if (/^\/blog\/[^/]+/.test(pathname)) return "blog";
  return "static";
}

export function analyzeSeoHtml(
  url: string,
  html: string,
  status: number,
  contentType: string,
  durationMs: number,
  inSitemap: boolean,
  responseRobotsHeader = "",
): { page: CrawledSeoPage; findings: SeoCrawlerFinding[] } {
  const document = parseDocument(html);
  const head = elements(document, "head")[0];
  const headRoot = head || document;
  const title = firstText(headRoot, "title");
  const meta = elements(headRoot, "meta");
  const description = meta.find(item => (item.attribs.name || "").toLowerCase() === "description")?.attribs.content?.trim() || "";
  const metaProperty = (property: string) => meta.find(item => (item.attribs.property || "").toLowerCase() === property)?.attribs.content?.trim() || "";
  const metaName = (name: string) => meta.find(item => (item.attribs.name || "").toLowerCase() === name)?.attribs.content?.trim() || "";
  const robots = [
    ...meta.filter(item => (item.attribs.name || "").toLowerCase() === "robots").map(item => item.attribs.content || ""),
    responseRobotsHeader,
  ].join(", ").toLowerCase();
  const canonicals = elements(headRoot, "link").filter(item => (item.attribs.rel || "").toLowerCase().split(/\s+/).includes("canonical"));
  const canonical = canonicals[0]?.attribs.href || null;
  const h1Count = elements(document, "h1").length;
  const visibleText = elements(document, "body")[0]
    ? visibleTextContent(elements(document, "body")[0]).replace(/\s+/g, " ").trim()
    : "";
  const images = elements(document, "img").map(image => {
    const alt = image.attribs.alt || "";
    return {
      src: image.attribs.src || image.attribs["data-src"] || "",
      hasAlt: Object.prototype.hasOwnProperty.call(image.attribs, "alt"),
      alt,
      decorative: alt === "" && (image.attribs.role === "presentation" || image.attribs["aria-hidden"] === "true"),
    };
  });
  const links = Array.from(new Set(elements(document, "a")
    .map(anchor => anchor.attribs.href?.trim())
    .filter((href): href is string => !!href)));
  const structuredData = elements(document, "script")
    .filter(script => (script.attribs.type || "").toLowerCase().split(";")[0].trim() === "application/ld+json")
    .map(script => {
      const raw = textContent(script).trim();
      try {
        const parsed = JSON.parse(raw);
        const roots = Array.isArray(parsed) ? parsed : [parsed];
        const types: string[] = [];
        const collectTypes = (value: unknown) => {
          if (Array.isArray(value)) {
            value.forEach(collectTypes);
            return;
          }
          if (!value || typeof value !== "object") return;
          const object = value as Record<string, unknown>;
          const type = object["@type"];
          for (const candidate of Array.isArray(type) ? type : [type]) {
            if (typeof candidate === "string") types.push(candidate.split(/[\/#]/).filter(Boolean).at(-1) || candidate);
          }
          if (Array.isArray(object["@graph"])) collectTypes(object["@graph"]);
        };
        collectTypes(roots);
        return { type: types.join(", ") || "Unknown", valid: roots.length > 0 };
      } catch (error) {
        return { type: "Invalid JSON-LD", valid: false, error: error instanceof Error ? error.message : "Invalid JSON" };
      }
    });

  const page: CrawledSeoPage = {
    url, status, title, description, canonical, canonicalCount: canonicals.length,
    openGraphTitle: metaProperty("og:title"),
    openGraphDescription: metaProperty("og:description"),
    openGraphImage: metaProperty("og:image"),
    twitterCard: metaName("twitter:card"),
    twitterTitle: metaName("twitter:title"),
    twitterDescription: metaName("twitter:description"),
    robots, h1Count, contentLength: visibleText.length, images, structuredData, links, durationMs, inSitemap,
  };
  const findings: SeoCrawlerFinding[] = [];
  const pageUrl = new URL(url);
  const indexable = !robots.includes("noindex");
  const type = pathType(pageUrl.pathname);
  const issue = (item: SeoCrawlerFinding) => findings.push(item);

  if (status < 200 || status >= 400) {
    issue(finding("indexing", status >= 500 ? "critical" : "high", `http-${status}`, `Public page returned HTTP ${status}`, `The crawler received HTTP ${status}.`, "Restore a successful response or remove this URL from internal links and the sitemap after review.", url, { status }));
    return { page, findings };
  }
  if (!contentType.toLowerCase().includes("text/html")) {
    issue(finding("indexing", "high", "not-html", "Sitemap URL did not return HTML", `The crawler received ${contentType || "an unknown content type"}.`, "Make this URL return its intended public HTML page or remove it from the sitemap after review.", url, { contentType }));
    return { page, findings };
  }
  if (indexable && !title) issue(finding("metadata", "critical", "missing-rendered-title", "Rendered page is missing its title", "The fetched HTML contains no title element.", "Return a unique, factual title in the initial HTML response.", url));
    else if (indexable && (title.length < 30 || title.length > 65)) {
    issue(finding("metadata", "low", "advisory-title-length", "Title length is outside the review range", `The title is ${title.length} characters; search engines may display or rewrite it differently.`, "Review clarity and intent. Treat character counts as a display hint, not a ranking rule.", url, { length: title.length, advisoryOnly: true }));
  }
  if (indexable && !description) issue(finding("metadata", "high", "missing-rendered-description", "Rendered page is missing a meta description", "The fetched HTML contains no description meta tag.", "Add a concise and accurate summary to the initial HTML response.", url));
  else if (indexable && description && (description.length < 70 || description.length > 170)) {
    issue(finding("metadata", "low", "advisory-description-length", "Meta description length is outside the review range", `The description is ${description.length} characters; snippets may be rewritten or shortened.`, "Review usefulness and accuracy. Treat character counts as a display hint, not a ranking rule.", url, { length: description.length, advisoryOnly: true }));
  }
  if (indexable) {
    let normalizedCanonical: string | null = null;
    try { if (canonical) normalizedCanonical = normalizePageUrl(new URL(canonical, url).toString()); } catch {}
    const normalizedUrl = normalizePageUrl(new URL(pageUrl.pathname, CANONICAL_ORIGIN).toString());
    if (!normalizedCanonical) issue(finding("indexing", "high", "missing-rendered-canonical", "Rendered page is missing a valid canonical", "No valid canonical link was found in the fetched HTML.", "Set one self-referencing canonical URL for this public page.", url));
    else if (normalizedCanonical !== normalizedUrl) issue(finding("indexing", "high", "mismatched-rendered-canonical", "Rendered canonical points to a different URL", `The canonical is ${normalizedCanonical}.`, "Confirm that the alternate URL is intentional and points to the preferred page.", url, { canonical: normalizedCanonical }));
    if (canonicals.length > 1) issue(finding("indexing", "high", "multiple-rendered-canonicals", "Rendered page has multiple canonical links", `The fetched HTML contains ${canonicals.length} canonical links.`, "Keep exactly one canonical link that points to the preferred URL.", url, { canonicalCount: canonicals.length }));
    if (!inSitemap) issue(finding("indexing", "high", "rendered-page-not-in-sitemap", "Indexable rendered page is not in the sitemap", "The public page is indexable but is absent from sitemap.xml.", "Add it to the sitemap only if it is useful and intended for search.", url));
    if (!page.openGraphTitle || !page.openGraphDescription || !page.openGraphImage) {
      issue(finding("metadata", "medium", "incomplete-open-graph", "Open Graph sharing metadata is incomplete", "At least one of og:title, og:description, or og:image is missing from the fetched HTML.", "Add accurate social-sharing title, description, and image tags in the initial HTML response.", url, { title: !!page.openGraphTitle, description: !!page.openGraphDescription, image: !!page.openGraphImage }));
    }
    if (!page.twitterCard || !page.twitterTitle || !page.twitterDescription) {
      issue(finding("metadata", "low", "incomplete-twitter-metadata", "Twitter/X sharing metadata is incomplete", "At least one of twitter:card, twitter:title, or twitter:description is missing from the fetched HTML.", "Add suitable Twitter/X card metadata, or confirm that the chosen Open Graph fallback is sufficient for the site's sharing needs.", url));
    }
    if (h1Count !== 1) issue(finding("content", h1Count === 0 ? "high" : "medium", "rendered-h1-count", `Rendered page has ${h1Count} H1 headings`, `The fetched HTML contains ${h1Count} H1 elements.`, "Use one clear primary heading in the initial HTML. Treat this as a content-structure check, not a ranking guarantee.", url, { h1Count }));
    if (visibleText.length < 120) issue(finding("content", "medium", "rendered-thin-content", "Little readable content is present in the initial HTML", `Only ${visibleText.length} text characters were found in the response body.`, "Check whether useful page content is delivered to crawlers before client-side JavaScript runs. Review intentionally sparse pages separately.", url, { contentLength: visibleText.length, robots, indexable }));
  } else if (inSitemap) {
    issue(finding("indexing", "high", "noindex-in-sitemap", "A noindex page is listed in the sitemap", "The page asks crawlers not to index it but is still advertised by sitemap.xml.", "Review the sitemap and noindex intent together; do not remove or index the page automatically.", url, { robots }));
  }

  for (const image of images) {
    if (!image.hasAlt) issue(finding("image", "medium", "image-missing-alt", "Image is missing an alt attribute", `Image ${image.src || "(no source)"} has no alt attribute.`, "Add a concise description for meaningful content images. For decorative images, explicitly use alt=\"\".", url, { imageSrc: image.src, missingAltAttribute: true }));
  }
  for (const data of structuredData) {
    if (!data.valid) issue(finding("content", "high", "invalid-structured-data", "Structured data could not be parsed", data.error || "JSON-LD is missing a recognized @type.", "Fix the JSON-LD syntax and provide a valid schema type.", url, { type: data.type, error: data.error || null }));
  }
  const types = new Set(structuredData.flatMap(item => item.valid ? item.type.split(", ") : []));
  const expectedTypes = type === "product" ? ["Product"]
    : type === "blog" ? ["BlogPosting", "Article"]
      : type === "category" || type === "health_support" || pageUrl.pathname === "/products" || pageUrl.pathname === "/ingredients" || pageUrl.pathname === "/health-support" || pageUrl.pathname === "/blog" ? ["CollectionPage"]
        : pageUrl.pathname === "/" ? ["Organization", "LocalBusiness", "WebSite"] : ["WebPage"];
  if (structuredData.every(item => item.valid) && !expectedTypes.some(expected => types.has(expected))) {
    issue(finding("content", "medium", "missing-expected-structured-data", "Expected structured data type was not found", `This ${type} page does not include a recognized ${expectedTypes.join(" or ")} schema type.`, "Add accurate JSON-LD that describes this page type, or review whether structured data is intentionally disabled.", url, { expectedTypes, foundTypes: Array.from(types) }));
  }
  return { page, findings };
}

function parseSitemapDocument(xml: string, origin: string): { pages: string[]; nestedSitemaps: string[] } {
  const document = parseDocument(xml, { xmlMode: true });
  const locs = elements(document, "loc")
    .map(node => textContent(node).trim())
    .map(value => {
      const normalized = normalizePageUrl(value);
      if (!normalized) return null;
      const parsed = new URL(normalized);
      if (parsed.origin === origin) return normalized;
      if (parsed.origin === CANONICAL_ORIGIN) return normalizePageUrl(new URL(`${parsed.pathname}${parsed.search}`, origin).toString());
      return null;
    })
    .filter((value): value is string => !!value);
  const isIndex = elements(document, "sitemapindex").length > 0;
  return isIndex ? { pages: [], nestedSitemaps: locs } : { pages: locs, nestedSitemaps: [] };
}

function robotsDisallows(pathname: string, robots: string): boolean {
  const groups: { agents: string[]; rules: { allow: boolean; pattern: string }[] }[] = [];
  let current: { agents: string[]; rules: { allow: boolean; pattern: string }[] } | null = null;
  for (const line of robots.split(/\r?\n/)) {
    const clean = line.replace(/#.*/, "").trim();
    if (!clean) continue;
    const split = clean.indexOf(":");
    if (split < 0) continue;
    const directive = clean.slice(0, split).trim().toLowerCase();
    const value = clean.slice(split + 1).trim();
    if (directive === "user-agent") {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((directive === "allow" || directive === "disallow") && value && current) {
      current.rules.push({ allow: directive === "allow", pattern: value });
    }
  }
  const wildcardGroups = groups.filter(group => group.agents.includes("*"));
  const rules = wildcardGroups.flatMap(group => group.rules).map(rule => {
    const source = rule.pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    const anchored = source.endsWith("$") ? `^${source.slice(0, -1)}$` : `^${source}`;
    return { ...rule, regex: new RegExp(anchored), specificity: rule.pattern.replace(/[*$]/g, "").length };
  }).filter(rule => rule.regex.test(pathname)).sort((a, b) => b.specificity - a.specificity);
  return rules.length > 0 && !rules[0].allow;
}

async function mapLimit<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]);
    }
  }));
  return results;
}

export async function runSeoCrawlerAudit(options: {
  baseUrl: string;
  environment: "development" | "production";
  maxPages?: number;
  concurrency?: number;
}): Promise<SeoCrawlerResult> {
  const base = new URL(options.baseUrl);
  const origin = base.origin;
  const maxPages = Math.max(1, Math.min(MAX_PAGES, options.maxPages || DEFAULT_MAX_PAGES));
  const concurrency = Math.max(1, Math.min(MAX_CONCURRENCY, options.concurrency || 3));
  const deadlineAt = Date.now() + 90_000;
  const requestPage = async (url: string) => {
    const remainingMs = deadlineAt - Date.now();
    if (remainingMs <= 0) {
      return { status: 0, contentType: "", body: "", durationMs: 0, error: "The 90-second crawl time limit was reached" };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(REQUEST_TIMEOUT_MS, remainingMs));
    const startedAt = performance.now();
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": CRAWLER_UA, Accept: "text/html,application/xml,text/plain;q=0.9,*/*;q=0.1" },
        signal: controller.signal,
        redirect: "manual",
      });
      const contentType = response.headers.get("content-type") || "";
      const maxBytes = 2 * 1024 * 1024;
      const length = Number(response.headers.get("content-length") || 0);
      if (length > maxBytes) {
        await response.body?.cancel();
        return { status: response.status, contentType, body: "", durationMs: Math.round(performance.now() - startedAt), location: response.headers.get("location"), error: "Response exceeded the 2 MB audit limit" };
      }
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > maxBytes) {
            await reader.cancel();
            return { status: response.status, contentType, body: "", durationMs: Math.round(performance.now() - startedAt), location: response.headers.get("location"), error: "Response exceeded the 2 MB audit limit" };
          }
          chunks.push(value);
        }
      }
      const body = new TextDecoder().decode(Buffer.concat(chunks));
      return { status: response.status, contentType, body, durationMs: Math.round(performance.now() - startedAt), location: response.headers.get("location"), robotsHeader: response.headers.get("x-robots-tag") || "" };
    } catch (error) {
      return { status: 0, contentType: "", body: "", durationMs: Math.round(performance.now() - startedAt), error: error instanceof Error ? error.message : "Request failed" };
    } finally {
      clearTimeout(timeout);
    }
  };

  const robotsUrl = new URL("/robots.txt", origin).toString();
  const sitemapUrl = new URL("/sitemap.xml", origin).toString();
  const [robotsResponse, sitemapResponse] = await Promise.all([requestPage(robotsUrl), requestPage(sitemapUrl)]);
  const robots = robotsResponse.status >= 200 && robotsResponse.status < 300 ? robotsResponse.body : "";
  const sitemapQueue = new Set<string>([sitemapUrl]);
  if (robots) {
    for (const line of robots.split(/\r?\n/)) {
      const match = line.match(/^\s*sitemap:\s*(\S+)/i);
      if (!match) continue;
      const candidate = normalizePageUrl(match[1]);
      if (candidate) {
        const parsedCandidate = new URL(candidate);
        if (parsedCandidate.origin === origin) sitemapQueue.add(candidate);
        else if (parsedCandidate.origin === CANONICAL_ORIGIN) sitemapQueue.add(new URL(`${parsedCandidate.pathname}${parsedCandidate.search}`, origin).toString());
      }
    }
  }
  const sitemapUrlsSet = new Set<string>();
  const seenSitemaps = new Set<string>();
  let sitemapErrors: string[] = [];
  while (sitemapQueue.size && seenSitemaps.size < 8) {
    if (Date.now() >= deadlineAt) {
      sitemapErrors.push("The 90-second crawl time limit was reached while reading sitemap files");
      break;
    }
    const currentSitemap = sitemapQueue.values().next().value as string;
    sitemapQueue.delete(currentSitemap);
    if (seenSitemaps.has(currentSitemap)) continue;
    seenSitemaps.add(currentSitemap);
    const response = currentSitemap === sitemapUrl ? sitemapResponse : await requestPage(currentSitemap);
    if (response.status < 200 || response.status >= 300 || !response.body) {
      sitemapErrors.push(`${currentSitemap} returned HTTP ${response.status || "no response"}`);
      continue;
    }
    const parsed = parseSitemapDocument(response.body, origin);
    parsed.pages.forEach(page => sitemapUrlsSet.add(page));
    parsed.nestedSitemaps.forEach(nested => {
      if (!seenSitemaps.has(nested)) sitemapQueue.add(nested);
    });
  }
  const sitemapUrls = Array.from(sitemapUrlsSet);
  const startUrl = new URL("/", origin).toString();
  const candidates = Array.from(new Set([startUrl, ...sitemapUrls]));
  const sitemapSet = new Set(sitemapUrls);
  const preflightFindings = [
    ...sitemapUrls.filter(url => PRIVATE_PATH.test(new URL(url).pathname)).map(url =>
      finding("indexing", "high", "restricted-sitemap-url", "A restricted or login URL is in the sitemap", "This URL points to an API, staff, login, or administration path that should not be advertised for indexing.", "Remove it from the sitemap and keep access restrictions in place.", url, { listedInSitemap: true })),
    ...sitemapUrls.filter(url => robotsDisallows(new URL(url).pathname, robots)).map(url =>
      finding("indexing", "high", "robots-blocks-sitemap-page", "Robots rules block a URL listed in the sitemap", "The URL is in sitemap.xml but matches a Disallow rule in robots.txt.", "Review the crawl rule and sitemap together; do not change either automatically.", url, { robotsUrl })),
  ];
  const eligiblePageUrls = candidates.filter(url => {
    const path = new URL(url).pathname;
    return !PRIVATE_PATH.test(path) && !STATIC_ASSET.test(path) && !robotsDisallows(path, robots);
  });
  const pageUrls = eligiblePageUrls.slice(0, maxPages);
  const pageResultsWithSkipped = await mapLimit(pageUrls, concurrency, async url => {
    if (Date.now() >= deadlineAt) return null;
    const response = await requestPage(url);
    const analysis = analyzeSeoHtml(url, response.body, response.status, response.contentType, response.durationMs, sitemapSet.has(url), (response as any).robotsHeader || "");
    if (response.error) {
      analysis.findings.push(finding("indexing", "high", "page-fetch-failed", "Public page could not be fetched", response.error, "Confirm the page is publicly reachable from the running server and returns a successful response.", url, { error: response.error }));
    }
    if (response.location) {
      let target = response.location;
      try { target = new URL(response.location, url).toString(); } catch {}
      analysis.findings.push(finding("indexing", target.startsWith(origin) ? "medium" : "high", "page-redirect", "Sitemap page redirects instead of serving its canonical page", `The server redirects this sitemap URL to ${target}.`, "Update the sitemap to the final canonical URL, or review the redirect destination.", url, { location: target }, target));
    }
    return analysis;
  });
  const pageResults = pageResultsWithSkipped.filter((result): result is NonNullable<typeof result> => result !== null);
  const completedSeedPageCount = pageResults.length;

  const crawled = new Map(pageResults.map(result => [result.page.url, result]));
  const discoveredPages = new Map<string, string>();
  for (const result of pageResults) {
    for (const href of result.page.links) {
      let target: URL;
      try { target = new URL(href, result.page.url); } catch { continue; }
      if (target.origin !== origin || target.username || target.password || target.search || target.hash || PRIVATE_PATH.test(target.pathname) || STATIC_ASSET.test(target.pathname) || robotsDisallows(target.pathname, robots)) continue;
      const normalized = normalizePageUrl(target.toString());
      if (normalized && !crawled.has(normalized) && !discoveredPages.has(normalized)) discoveredPages.set(normalized, result.page.url);
    }
  }
  const remainingPageSlots = Math.max(0, maxPages - pageResults.length);
  const discoveredUrls = Array.from(discoveredPages.keys()).slice(0, remainingPageSlots);
  const linkedPageResultsWithSkipped = await mapLimit(discoveredUrls, concurrency, async url => {
    if (Date.now() >= deadlineAt) return null;
    const response = await requestPage(url);
    const analysis = analyzeSeoHtml(url, response.body, response.status, response.contentType, response.durationMs, sitemapSet.has(url), (response as any).robotsHeader || "");
    if (response.error) analysis.findings.push(finding("indexing", "high", "page-fetch-failed", "Public page could not be fetched", response.error, "Confirm the page is publicly reachable from the running server and returns a successful response.", url, { error: response.error }));
    return analysis;
  });
  const linkedPageResults = linkedPageResultsWithSkipped.filter((result): result is NonNullable<typeof result> => result !== null);
  pageResults.push(...linkedPageResults);
  for (const result of pageResults) crawled.set(result.page.url, result);
  const uniqueLinks = new Map<string, string>();
  for (const result of pageResults) {
    for (const href of result.page.links) {
      let target: URL;
      try { target = new URL(href, result.page.url); } catch { continue; }
      if (target.origin !== origin || target.username || target.password || target.search || target.hash || PRIVATE_PATH.test(target.pathname) || STATIC_ASSET.test(target.pathname) || robotsDisallows(target.pathname, robots)) continue;
      const normalized = normalizePageUrl(target.toString());
      if (normalized && !uniqueLinks.has(normalized)) uniqueLinks.set(normalized, result.page.url);
    }
  }
  const linkEntries = Array.from(uniqueLinks.entries()).slice(0, MAX_LINKS);
  const linkChecks = await mapLimit(linkEntries, concurrency, async ([targetUrl, sourceUrl]) => {
    if (Date.now() >= deadlineAt) return null;
    const response = await requestPage(targetUrl);
    if (response.status >= 400 || response.status === 0) {
      return finding("internal_link", response.status >= 500 || response.status === 0 ? "high" : "medium", `broken-link-${response.status}`, "Internal link did not reach a successful page", response.status ? `The linked URL returned HTTP ${response.status}.` : "The linked URL could not be fetched.", "Fix the destination or remove the broken link after reviewing its intended target.", sourceUrl, { status: response.status, error: (response as any).error || null }, targetUrl);
    }
    return null;
  });
  const findings = [
    ...preflightFindings,
    ...pageResults.flatMap(result => result.findings),
    ...linkChecks.filter((item): item is SeoCrawlerFinding => item !== null),
  ];
  const duplicateGroups = (field: "title" | "description") => {
    const byValue = new Map<string, CrawledSeoPage[]>();
    for (const result of pageResults) {
      const value = result.page[field].trim().toLowerCase();
      if (!value) continue;
      const group = byValue.get(value) || [];
      group.push(result.page);
      byValue.set(value, group);
    }
    Array.from(byValue.values()).forEach((pages: CrawledSeoPage[]) => {
      if (pages.length < 2) return;
      for (const page of pages) {
        findings.push(finding(
          "metadata",
          field === "title" ? "high" : "medium",
          `duplicate-rendered-${field}`,
          field === "title" ? "Duplicate rendered page title" : "Duplicate rendered meta description",
          `${pages.length} crawled pages share the same ${field}.`,
          `Write a unique, page-specific ${field} for each page. Consider the content and intent first; character length is secondary.`,
          page.url,
          { duplicatePages: pages.map((item: CrawledSeoPage) => item.url), duplicateCount: pages.length },
        ));
      }
    });
  };
  duplicateGroups("title");
  duplicateGroups("description");
  if (sitemapErrors.length || sitemapUrls.length === 0) {
    findings.push(finding("indexing", "high", "sitemap-unavailable-or-empty", "A readable sitemap could not be verified", sitemapErrors.length ? sitemapErrors.join("; ") : "The sitemap returned no same-site page URLs.", "Make sure the public sitemap is accessible, contains canonical page URLs, and is referenced from robots.txt.", sitemapUrl, { errors: sitemapErrors }));
  }
  if (!robots) {
    findings.push(finding("indexing", "medium", "robots-unavailable", "robots.txt could not be read", `The crawler received HTTP ${robotsResponse.status || "no response"} from robots.txt.`, "Confirm that robots.txt is intentionally absent or returns the site's crawl rules.", robotsUrl, { status: robotsResponse.status }));
  }
  const durations = pageResults.filter(result => result.page.status >= 200 && result.page.status < 400).map(result => result.page.durationMs).sort((a, b) => a - b);
  const percentile = (values: number[], ratio: number) => values.length ? values[Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1)] : 0;
  const medianMs = percentile(durations, 0.5);
  const p75Ms = percentile(durations, 0.75);
  if (options.environment === "production" && p75Ms > 3_000) {
    findings.push(finding("content", "low", "production-page-response-time", "Public page responses are slow in this crawl", `The 75th percentile response time was ${p75Ms} ms.`, "Review production measurements alongside Core Web Vitals and repeat at low crawl concurrency; response time alone is not a ranking verdict.", startUrl, { p75Ms, medianMs, advisoryOnly: true }));
  }
  return {
    generatedAt: new Date().toISOString(),
    environment: options.environment,
    startUrl,
    sitemapUrlCount: sitemapUrls.length,
    scannedPageCount: pageResults.length,
    skippedPageCount: Math.max(0, eligiblePageUrls.length - completedSeedPageCount) + Math.max(0, discoveredPages.size - linkedPageResults.length),
    excludedPageCount: Math.max(0, candidates.length - eligiblePageUrls.length),
    timeLimitReached: Date.now() >= deadlineAt,
    findings: findings.sort((a, b) => {
      const severityWeight = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityWeight[a.severity] - severityWeight[b.severity] || a.sourceUrl.localeCompare(b.sourceUrl);
    }),
    pages: pageResults.map(result => result.page),
    performance: {
      environment: options.environment,
      requestCount: durations.length,
      medianMs,
      p75Ms,
      slowPageCount: durations.filter(duration => duration > 3_000).length,
      advisory: options.environment === "development"
        ? "Development timings are diagnostic only and are not representative of production visitor response times."
        : "Measured with low concurrency; response time is a diagnostic, not a ranking guarantee.",
    },
  };
}
