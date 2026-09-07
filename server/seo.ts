import fs from "fs";
import path from "path";

export const CANONICAL_ORIGIN = "https://bright-organic.com";

export const STATIC_PAGE_SEO: Record<string, { title: string; description: string; keywords: string }> = {
  "/about": {
    title: "Organic Ingredient Manufacturer in India | About Bright Fame",
    description: "Learn about Bright Fame Organic's ingredient processing, sourcing, quality systems and B2B supply capabilities from Gujarat, India.",
    keywords: "organic ingredient manufacturer India, B2B ingredient company Gujarat",
  },
  "/about-us": {
    title: "About Bright Fame Organic | Organic Ingredient Manufacturer India",
    description: "Discover Bright Fame Organic's certified farmland, processing capabilities, quality systems, and global organic ingredient supply.",
    keywords: "organic manufacturer India, organic farmland Gujarat, organic ingredient processing",
  },
  "/contact": {
    title: "Contact Bright Fame Organic | Quotes, Samples and Bulk Supply",
    description: "Contact Bright Fame Organic for bulk ingredient quotes, product samples, documentation, and B2B supply enquiries.",
    keywords: "organic ingredient quote, bulk ingredient samples, organic supplier contact",
  },
  "/blog": {
    title: "Organic Ingredients Knowledge Hub | Bright Fame Organic",
    description: "Read practical guidance about organic ingredients, certifications, quality, sourcing, and international B2B supply.",
    keywords: "organic ingredients blog, organic certification, ingredient sourcing",
  },
  "/industries": {
    title: "Organic Ingredients for Food & Nutraceutical Manufacturers",
    description: "Certified organic ingredients for food, nutraceutical, pharmaceutical, cosmetic, herbal, and beverage manufacturers.",
    keywords: "B2B organic ingredients, nutraceutical ingredients, food ingredients, cosmetic ingredients",
  },
  "/certifications": {
    title: "Organic Certifications and Quality Standards | Bright Fame Organic",
    description: "Review the organic, food-safety, quality, and manufacturing standards supporting Bright Fame Organic products.",
    keywords: "EU Organic, USDA Organic, NPOP, JAS, HACCP, GMP, ISO 22000",
  },
  "/organic-spice-supplier-india": {
    title: "Organic Spice and Herb Supplier India | Bright Fame Organic",
    description: "Bulk certified organic spices, herbs, and botanical ingredients supplied directly from India to global B2B buyers.",
    keywords: "organic spice supplier India, organic herb manufacturer, bulk organic ingredients",
  },
  "/bulk-organic-exporter-india": {
    title: "Bulk Organic Ingredients Exporter India | Bright Fame Organic",
    description: "Source wholesale organic herbs, spices, teas, powders, and extracts from an export-focused Indian manufacturer.",
    keywords: "certified organic ingredients exporter, bulk organic ingredients India, wholesale organic supplier, organic exporter India",
  },
  "/eu-organic-spices": {
    title: "EU Organic Spices Supplier India | Bright Fame Organic",
    description: "EU Organic certified spices and botanical ingredients for European food and ingredient buyers.",
    keywords: "EU organic spices, European organic spice supplier, EU certified organic India",
  },
  "/organic-herbs": {
    title: "Organic Herbs Supplier India | Bright Fame Organic",
    description: "Bulk organic herbs, powders, and botanical ingredients for food, herbal, and nutraceutical applications.",
    keywords: "organic herbs supplier India, bulk organic herbs, botanical ingredients",
  },
  "/organic-ingredients-supplier-usa": {
    title: "Organic Ingredient Supplier for USA B2B Buyers | Bright Fame",
    description: "Source bulk organic ingredients, herbal powders and botanical extracts from India for USA food, supplement and wellness product requirements.",
    keywords: "organic ingredient supplier USA, bulk herbal ingredients USA, botanical extracts supplier USA",
  },
  "/organic-ingredients-supplier-germany": {
    title: "Organic Ingredient Supplier for Germany | Bright Fame Organic",
    description: "Source bulk organic spices, herbs, powders and botanical ingredients from India for German food, nutraceutical and distribution requirements.",
    keywords: "organic ingredient supplier Germany, bulk organic spices Germany, herbal ingredients Germany",
  },
  "/organic-ingredients-exporter-uae": {
    title: "Organic Ingredient Exporter to UAE | Bright Fame Organic",
    description: "Source bulk organic herbs, spices, powders and botanical extracts from India with documentation and logistics coordination for UAE buyers.",
    keywords: "organic ingredient exporter UAE, bulk organic ingredients UAE, herbal ingredients supplier UAE",
  },
  "/packaging-solutions": {
    title: "Organic Ingredient Packaging Solutions | Bright Fame Organic",
    description: "Bulk and retail-ready packaging options for certified organic ingredients and private-label requirements.",
    keywords: "organic ingredient packaging, bulk ingredient packaging, private label organic",
  },
  "/presentation": {
    title: "Bright Fame Organic Corporate Presentation",
    description: "Explore Bright Fame Organic's manufacturing, farmland, certification, product, and export capabilities.",
    keywords: "Bright Fame Organic presentation, organic manufacturer profile",
  },
  "/services/quality-testing": {
    title: "Ingredient Quality Testing Services | Bright Fame Organic",
    description: "Quality testing coordination and documentation support for bulk organic, herbal and botanical ingredients supplied to B2B buyers.",
    keywords: "ingredient quality testing services, herbal ingredient testing, certificate of analysis support",
  },
  "/services/rd-support": {
    title: "Nutraceutical Formulation & Ingredient R&D Support",
    description: "Ingredient selection and product-development support for organic, botanical, food and nutraceutical formulation requirements.",
    keywords: "nutraceutical formulation support, ingredient R&D support, botanical product development",
  },
  "/services/regulatory-compliance": {
    title: "Organic Ingredient Regulatory & Documentation Support",
    description: "Documentation and regulatory support for international buyers sourcing organic, herbal and botanical ingredients from India.",
    keywords: "organic regulatory compliance, ingredient export documents, organic certification support",
  },
  "/services/custom-packaging": {
    title: "Custom Organic Ingredient Packaging for B2B Buyers",
    description: "Custom bulk, retail-ready and private-label packaging options for organic, herbal and botanical ingredient requirements.",
    keywords: "custom ingredient packaging, private label organic, bulk packaging",
  },
  "/services/logistics-solutions": {
    title: "Organic Ingredient Export Logistics from India",
    description: "Export documentation, shipment planning and logistics coordination for bulk organic ingredient orders supplied from India.",
    keywords: "organic ingredient export logistics, bulk ingredient shipping India, B2B export coordination",
  },
};

export type SeoHtml = {
  title: string;
  description?: string | null;
  keywords?: string | null;
  canonicalPath: string;
  robots?: string;
  ogType?: string;
  image?: string | null;
  jsonLd?: object[];
  hreflang?: { language: string; region?: string | null; url: string; isDefault?: boolean | null }[];
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character] as string));
}

function readTemplate(): string {
  const candidates = [
    path.resolve(import.meta.dirname, "public/index.html"),
    path.resolve(import.meta.dirname, "../client/index.html"),
    path.resolve(process.cwd(), "client/index.html"),
  ];
  const template = candidates.find(fs.existsSync);
  if (!template) throw new Error(`SEO HTML template not found (${candidates.join(", ")})`);
  return fs.readFileSync(template, "utf8");
}

function safeJson(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

/** Renders the actual SPA document, replacing only document metadata. */
export function renderSeoHtml(seo: SeoHtml, template = readTemplate()): string {
  const canonical = `${CANONICAL_ORIGIN}${seo.canonicalPath.startsWith("/") ? seo.canonicalPath : `/${seo.canonicalPath}`}`;
  const validHreflang = (seo.hreflang || []).filter((item) => {
    if (!/^[a-z]{2,3}$/.test(item.language) || (item.region && !/^[A-Z]{2}$/.test(item.region))) return false;
    try {
      const url = new URL(item.url);
      return url.origin === CANONICAL_ORIGIN && !url.search && !url.hash && !url.pathname.startsWith("/api/");
    } catch {
      return false;
    }
  });
  const tags = validHreflang.map((item) => `${item.language}${item.region ? `-${item.region}` : ""}`);
  const urls = validHreflang.map((item) => new URL(item.url).toString());
  const defaultItems = validHreflang.filter((item) => item.isDefault);
  const defaultItem = defaultItems[0];
  const completeSet = validHreflang.length >= 2
    && defaultItems.length === 1
    && new Set(tags).size === tags.length
    && new Set(urls).size === urls.length
    && new URL(defaultItem?.url || CANONICAL_ORIGIN).toString() === new URL(canonical).toString();
  const hreflang = completeSet
    ? [
        ...validHreflang.map((item) => `<link rel="alternate" hreflang="${escapeHtml(`${item.language}${item.region ? `-${item.region}` : ""}`)}" href="${escapeHtml(item.url)}" />`),
        `<link rel="alternate" hreflang="x-default" href="${escapeHtml(defaultItem.url)}" />`,
      ].join("\n")
    : "";
  const image = seo.image ? (seo.image.startsWith("http") ? seo.image : `${CANONICAL_ORIGIN}${seo.image}`) : "";
  const metadata = [
    `<title>${escapeHtml(seo.title)}</title>`,
    seo.description ? `<meta name="description" content="${escapeHtml(seo.description)}" />` : "",
    seo.keywords ? `<meta name="keywords" content="${escapeHtml(seo.keywords)}" />` : "",
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta name="robots" content="${escapeHtml(seo.robots || "index, follow")}" />`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
    seo.description ? `<meta property="og:description" content="${escapeHtml(seo.description)}" />` : "",
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="${escapeHtml(seo.ogType || "website")}" />`,
    image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : "",
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
    seo.description ? `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />` : "",
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : "",
    hreflang,
    ...(seo.jsonLd || []).map((item) => `<script type="application/ld+json">${safeJson(item)}</script>`),
  ].filter(Boolean).join("\n    ");
  const stripped = template
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|keywords|robots|twitter:[^"']+|og:[^"']+)["'][^>]*>/gi, "")
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<link\b[^>]*rel=["']alternate["'][^>]*hreflang=[^>]*>/gi, "")
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");
  return stripped.replace(/<\/head>/i, `    ${metadata}\n  </head>`);
}