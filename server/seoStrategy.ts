export type PageSeo = { title: string; description: string; keywords: string };

export const HOME_SEO: PageSeo = {
  title: "Bulk Organic Ingredients Supplier India | Atlas Ingredients",
  description: "Source bulk organic ingredients, herbal powders, botanical extracts and nutraceutical raw materials from a B2B supplier and exporter in India.",
  keywords: "bulk organic ingredients supplier, organic ingredients manufacturer India, B2B organic ingredients supplier, wholesale botanical ingredients",
};

export const COLLECTION_PAGE_SEO: Record<"/products" | "/ingredients" | "/health-support", PageSeo> = {
  "/products": {
    title: "Bulk Organic Ingredients & Herbal Extracts | B2B Supply",
    description: "Browse bulk organic ingredients, herbal powders, spices, botanical extracts and nutraceutical raw materials for B2B sourcing from India.",
    keywords: "bulk organic ingredients, herbal ingredient catalog, botanical extract products, nutraceutical raw materials supplier",
  },
  "/ingredients": {
    title: "Organic Ingredient Categories for Bulk Buyers | Atlas Ingredients",
    description: "Explore organic herbs, spices, powders, extracts, teas and other ingredient categories available for wholesale and manufacturing requirements.",
    keywords: "organic ingredient categories, wholesale herbal ingredients, bulk botanical ingredients",
  },
  "/health-support": {
    title: "Botanical Ingredients by Health Application | Atlas Ingredients",
    description: "Find botanical and nutraceutical ingredients by intended formulation area, with specifications and documentation available for B2B evaluation.",
    keywords: "botanical ingredients for formulations, nutraceutical ingredients by application, plant based health ingredients",
  },
};

const cleanName = (value: string) => value.replace(/\s+/g, " ").trim();

export function categoryPageSeo(name: string): PageSeo {
  const category = cleanName(name);
  return {
    title: `Bulk ${category} Supplier India | Atlas Ingredients`,
    description: `Source ${category.toLowerCase()} in bulk from India for food, herbal and nutraceutical manufacturing. Request specifications, samples and supply details.`,
    keywords: `bulk ${category.toLowerCase()} supplier, ${category.toLowerCase()} manufacturer India, wholesale ${category.toLowerCase()}`,
  };
}

export function healthSupportPageSeo(name: string): PageSeo {
  const application = cleanName(name);
  return {
    title: `${application} Botanical Ingredients for B2B Formulations`,
    description: `Explore botanical ingredients associated with ${application.toLowerCase()} formulations. Review product options and request specifications for B2B sourcing.`,
    keywords: `${application.toLowerCase()} botanical ingredients, ${application.toLowerCase()} nutraceutical ingredients`,
  };
}

export type KeywordAssignment = {
  keyword: string;
  pagePath: string;
  pageType: "static" | "category";
  pageSlug?: string;
};

export const KEYWORD_ASSIGNMENTS: KeywordAssignment[] = [
  { keyword: "bulk organic ingredients supplier", pagePath: "/", pageType: "static" },
  { keyword: "organic ingredients manufacturer India", pagePath: "/", pageType: "static" },
  { keyword: "certified organic ingredients exporter", pagePath: "/bulk-organic-exporter-india", pageType: "static" },
  { keyword: "B2B organic ingredients supplier", pagePath: "/", pageType: "static" },
  { keyword: "wholesale botanical ingredients", pagePath: "/", pageType: "static" },
  { keyword: "bulk herbal powders supplier", pagePath: "/ingredients/herbal-powders", pageType: "category", pageSlug: "herbal-powders" },
  { keyword: "nutraceutical raw materials supplier", pagePath: "/products", pageType: "static" },
  { keyword: "botanical extracts manufacturer", pagePath: "/ingredients/extracts-powders", pageType: "category", pageSlug: "extracts-powders" },
  { keyword: "organic herbal extracts supplier", pagePath: "/organic-herbs", pageType: "static" },
  { keyword: "bulk organic spices supplier India", pagePath: "/organic-spice-supplier-india", pageType: "static" },
  { keyword: "EU organic spices supplier", pagePath: "/eu-organic-spices", pageType: "static" },
  { keyword: "ingredient quality testing services", pagePath: "/services/quality-testing", pageType: "static" },
  { keyword: "nutraceutical formulation support", pagePath: "/services/rd-support", pageType: "static" },
  { keyword: "organic ingredient regulatory support", pagePath: "/services/regulatory-compliance", pageType: "static" },
  { keyword: "custom ingredient packaging", pagePath: "/services/custom-packaging", pageType: "static" },
  { keyword: "organic ingredient export logistics", pagePath: "/services/logistics-solutions", pageType: "static" },
  { keyword: "organic ingredient supplier USA", pagePath: "/organic-ingredients-supplier-usa", pageType: "static" },
  { keyword: "organic ingredient supplier Europe", pagePath: "/eu-organic-spices", pageType: "static" },
  { keyword: "organic ingredient supplier Germany", pagePath: "/organic-ingredients-supplier-germany", pageType: "static" },
  { keyword: "organic ingredient exporter UAE", pagePath: "/organic-ingredients-exporter-uae", pageType: "static" },
];