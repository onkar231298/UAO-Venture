import crypto from "node:crypto";
import { CANONICAL_ORIGIN } from "./seo";

export type SeoPage = {
  id: string;
  type: "static" | "product" | "category" | "health_support" | "blog";
  url: string;
  title: string;
  description: string;
  content: string;
  image?: string | null;
  canonicalUrl?: string | null;
  inSitemap: boolean;
  hasInboundLink: boolean;
};

export type SeoFinding = {
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

export const normalizeKeywordTokens = (value: string) => value.toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .map((token) => token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token);

export function replacePrimaryKeywordList(current: string, original: string, replacement: string): string {
  const next = replacement.trim();
  if (!next || next.includes(",")) throw new Error("The replacement must be one keyword without commas.");
  const keywords = current.split(",").map((keyword) => keyword.trim()).filter(Boolean);
  const keywordIndex = keywords.findIndex((keyword) => keyword.toLowerCase() === original.trim().toLowerCase());
  if (keywordIndex < 0) throw new Error("The original keyword is no longer in Primary Keywords.");
  if (keywords.some((keyword, index) => index !== keywordIndex && keyword.toLowerCase() === next.toLowerCase())) {
    throw new Error("The replacement keyword already exists.");
  }
  keywords[keywordIndex] = next;
  return keywords.join(", ");
}

export const keywordMatches = (value: string, keyword: string, threshold = 0.6) => {
  const targetTokens = normalizeKeywordTokens(keyword);
  const valueTokens = new Set(normalizeKeywordTokens(value));
  return targetTokens.length > 0
    && targetTokens.filter((token) => valueTokens.has(token)).length / targetTokens.length >= threshold;
};

export function canonicalPageUrl(value: string): string | null {
  try {
    const url = new URL(value, CANONICAL_ORIGIN);
    if (url.origin !== CANONICAL_ORIGIN || url.search || url.hash || url.pathname.startsWith("/api/")) return null;
    const path = url.pathname === "/" ? "/" : url.pathname.replace(/\/+$/, "");
    return `${CANONICAL_ORIGIN}${path}`;
  } catch {
    return null;
  }
}

function fingerprint(parts: string[]) {
  return crypto.createHash("sha256").update(parts.join("\u0000")).digest("hex");
}

function finding(
  page: SeoPage,
  category: SeoFinding["category"],
  severity: SeoFinding["severity"],
  code: string,
  title: string,
  description: string,
  recommendation: string,
  evidence: Record<string, unknown> = {},
): SeoFinding {
  return {
    fingerprint: fingerprint([category, code, page.url]),
    category,
    severity,
    title,
    description,
    recommendation,
    sourceUrl: page.url,
    evidence,
  };
}

export function auditSeoPages(pages: SeoPage[]): SeoFinding[] {
  const findings: SeoFinding[] = [];
  const duplicateTitles = new Map<string, SeoPage[]>();
  const duplicateDescriptions = new Map<string, SeoPage[]>();

  for (const page of pages) {
    const title = page.title.trim();
    const description = page.description.trim();
    const contentLength = page.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
    if (title) duplicateTitles.set(title.toLowerCase(), [...(duplicateTitles.get(title.toLowerCase()) || []), page]);
    if (description) duplicateDescriptions.set(description.toLowerCase(), [...(duplicateDescriptions.get(description.toLowerCase()) || []), page]);

    if (!title) findings.push(finding(page, "metadata", "critical", "missing-title", "Missing SEO title", "This indexable page has no title.", "Add a unique, factual title that describes this page."));
    else if (title.length < 30 || title.length > 65) findings.push(finding(page, "metadata", "medium", "title-length", "SEO title length needs attention", `The title is ${title.length} characters.`, "Use a descriptive title of roughly 30–65 characters.", { length: title.length }));

    if (!description) findings.push(finding(page, "metadata", "high", "missing-description", "Missing meta description", "This indexable page has no description.", "Add a factual summary that helps searchers understand the page."));
    else if (description.length < 70 || description.length > 170) findings.push(finding(page, "metadata", "medium", "description-length", "Meta description length needs attention", `The description is ${description.length} characters.`, "Use a useful description of roughly 70–170 characters.", { length: description.length }));

    const canonical = canonicalPageUrl(page.canonicalUrl || page.url);
    if (!canonical || canonical !== page.url) findings.push(finding(page, "indexing", "high", "invalid-canonical", "Canonical URL does not match the indexable page", page.canonicalUrl || "No valid canonical URL was found.", "Set the canonical to this exact production page URL.", { canonical: page.canonicalUrl || null }));
    if (!page.inSitemap) findings.push(finding(page, "indexing", "critical", "not-in-sitemap", "Indexable page is missing from the sitemap", "Search engines may discover this page less reliably.", "Add the canonical URL to the public sitemap."));
    if (!page.hasInboundLink) findings.push(finding(page, "internal_link", "high", "orphaned-page", "Page has no detected internal link", "No indexable page or collection was found linking to this URL.", "Add a relevant internal link from a discoverable page."));
    if (page.type === "product" && !page.image) findings.push(finding(page, "image", "medium", "missing-product-image", "Product page has no primary image", "The product has no primary or Open Graph image to describe.", "Add an accurate product image and descriptive alternative text."));
    if (page.type !== "static" && contentLength < 120) findings.push(finding(page, "content", "high", "thin-content", "Page content is very limited", `Only ${contentLength} visible characters were detected.`, "Expand the page with factual, buyer-relevant information.", { contentLength }));
  }

  const addDuplicateFindings = (groups: Map<string, SeoPage[]>, kind: "title" | "description") => {
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      for (const page of group) {
        findings.push(finding(
          page,
          "metadata",
          "high",
          `duplicate-${kind}`,
          `Duplicate SEO ${kind}`,
          `${group.length} indexable pages use the same ${kind}.`,
          `Write a unique ${kind} for this page.`,
          { duplicateUrls: group.map((item) => item.url) },
        ));
      }
    }
  };
  addDuplicateFindings(duplicateTitles, "title");
  addDuplicateFindings(duplicateDescriptions, "description");

  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return findings.sort((a, b) => order[a.severity] - order[b.severity] || a.sourceUrl.localeCompare(b.sourceUrl));
}

export function isCriticalSeoFindingResolved(pages: SeoPage[], findingFingerprint: string): boolean {
  return !auditSeoPages(pages).some((finding) =>
    finding.fingerprint === findingFingerprint && finding.severity === "critical");
}

export function detectCompetingPages(rows: { query: string; page: string }[], keyword: string): string[] {
  return Array.from(new Set(rows
    .filter((row) => row.page && keywordMatches(row.query, keyword))
    .map((row) => canonicalPageUrl(row.page))
    .filter((url): url is string => !!url)));
}
