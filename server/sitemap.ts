import { CANONICAL_ORIGIN, STATIC_PAGE_SEO } from "./seo";

export type SitemapEntry = {
  url: string;
  lastmod: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
};

export type SitemapProductSource = {
  slug?: string | null;
  isActive?: boolean | null;
  isVisible?: boolean | null;
  updatedAt?: Date | string | null;
};

export type SitemapCategorySource = {
  slug?: string | null;
  isActive?: boolean | null;
  createdAt?: Date | string | null;
};

export type SitemapHealthSupportSource = {
  slug?: string | null;
  isActive?: boolean | null;
  createdAt?: Date | string | null;
};

export type SitemapBlogPostSource = {
  slug?: string | null;
  isPublished?: boolean | null;
  updatedAt?: Date | string | null;
  publishedAt?: Date | string | null;
};

export type SitemapSources = {
  products?: SitemapProductSource[];
  categories?: SitemapCategorySource[];
  healthSupports?: SitemapHealthSupportSource[];
  blogPosts?: SitemapBlogPostSource[];
};

export const isIndexableSitemapProduct = (
  product: SitemapProductSource,
): product is SitemapProductSource & { slug: string; isActive: true; isVisible: true } =>
  !!product.slug?.trim() && product.isActive === true && product.isVisible === true;

export const isIndexableSitemapCategory = (
  category: SitemapCategorySource,
): category is SitemapCategorySource & { slug: string; isActive: true } =>
  !!category.slug?.trim() && category.isActive === true;

export const isIndexableSitemapHealthSupport = (
  healthSupport: SitemapHealthSupportSource,
): healthSupport is SitemapHealthSupportSource & { slug: string; isActive: true } =>
  !!healthSupport.slug?.trim() && healthSupport.isActive === true;

export const isIndexableSitemapBlogPost = (
  post: SitemapBlogPostSource,
): post is SitemapBlogPostSource & { slug: string; isPublished: true } =>
  !!post.slug?.trim() && post.isPublished === true;

export const SITEMAP_COLLECTION_PATHS = ["/products", "/ingredients", "/health-support"] as const;

export const SITEMAP_STATIC_PATHS = Array.from(new Set([
  "/",
  ...SITEMAP_COLLECTION_PATHS,
  ...Object.keys(STATIC_PAGE_SEO),
]));

const formatDate = (value: Date | string | null | undefined, fallback: string) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString().split("T")[0];
};

export const sitemapPageUrl = (
  prefix: "/products" | "/ingredients" | "/health-support" | "/blog",
  slug: string,
) => `${CANONICAL_ORIGIN}${prefix}/${encodeURIComponent(slug.trim())}`;

const staticEntry = (path: string, today: string): SitemapEntry => {
  if (path === "/") {
    return { url: `${CANONICAL_ORIGIN}/`, lastmod: today, changefreq: "daily", priority: "1.0" };
  }
  if (path === "/products" || path === "/ingredients" || path === "/health-support") {
    return { url: `${CANONICAL_ORIGIN}${path}`, lastmod: today, changefreq: path === "/products" ? "daily" : "weekly", priority: "0.9" };
  }
  if (path === "/blog") {
    return { url: `${CANONICAL_ORIGIN}${path}`, lastmod: today, changefreq: "daily", priority: "0.7" };
  }
  const isSearchLandingPage = [
    "/organic-spice-supplier-india",
    "/bulk-organic-exporter-india",
    "/eu-organic-spices",
    "/organic-herbs",
  ].includes(path);
  return {
    url: `${CANONICAL_ORIGIN}${path}`,
    lastmod: today,
    changefreq: isSearchLandingPage ? "weekly" : "monthly",
    priority: isSearchLandingPage ? "0.9" : "0.7",
  };
};

export function buildSitemapEntries(sources: SitemapSources = {}, now = new Date()): SitemapEntry[] {
  const today = formatDate(now, new Date().toISOString().split("T")[0]);
  const entries: SitemapEntry[] = SITEMAP_STATIC_PATHS.map((path) => staticEntry(path, today));

  for (const product of sources.products || []) {
    if (!isIndexableSitemapProduct(product)) continue;
    entries.push({
      url: sitemapPageUrl("/products", product.slug),
      lastmod: formatDate(product.updatedAt, today),
      changefreq: "weekly",
      priority: "0.8",
    });
  }
  for (const category of sources.categories || []) {
    if (!isIndexableSitemapCategory(category)) continue;
    entries.push({
      url: sitemapPageUrl("/ingredients", category.slug),
      lastmod: formatDate(category.createdAt, today),
      changefreq: "weekly",
      priority: "0.7",
    });
  }
  for (const healthSupport of sources.healthSupports || []) {
    if (!isIndexableSitemapHealthSupport(healthSupport)) continue;
    entries.push({
      url: sitemapPageUrl("/health-support", healthSupport.slug),
      lastmod: formatDate(healthSupport.createdAt, today),
      changefreq: "weekly",
      priority: "0.7",
    });
  }
  for (const post of sources.blogPosts || []) {
    if (!isIndexableSitemapBlogPost(post)) continue;
    entries.push({
      url: sitemapPageUrl("/blog", post.slug),
      lastmod: formatDate(post.updatedAt || post.publishedAt, today),
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}

const escapeXml = (value: unknown) => String(value ?? "").replace(/[<>&'"]/g, (character) => ({
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
}[character] as string));

export function renderSitemapXml(entries: SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
}