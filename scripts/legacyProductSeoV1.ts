/**
 * Immutable copy of the product SEO generator that preceded the B2B strategy.
 * The migration uses this only to identify an exact legacy title/description
 * pair; changing it would make ownership detection destructive.
 */
interface LegacyProductForSEO {
  name: string;
  botanicalName?: string | null;
  isOrganic?: boolean | null;
  productType?: string | null;
  category?: string | null;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > 0 ? cut.slice(0, lastSpace).trim() : cut.trim();
}

function isOrganicProduct(product: LegacyProductForSEO): boolean {
  return product.isOrganic === true
    || product.productType === "organic"
    || product.name.toLowerCase().includes("organic");
}

function getCategoryKeyword(category: string | null | undefined): string {
  if (!category) return "ingredient";
  const value = category.toLowerCase();
  if (value.includes("herbal powder")) return "herbal powder";
  if (value.includes("tea") || value.includes("infusion")) return "herbal tea";
  if (value.includes("whole herb")) return "whole herb";
  if (value.includes("whole spice")) return "whole spice";
  if (value.includes("spice powder")) return "spice powder";
  if (value.includes("extract")) return "botanical extract";
  if (value.includes("spray")) return "spray dried ingredient";
  if (value.includes("seed") || value.includes("grain")) return "seeds & grains";
  if (value.includes("culinary")) return "culinary herb";
  return "botanical ingredient";
}

function getCategoryBenefit(category: string | null | undefined): string {
  if (!category) return "food, beverage & nutraceutical manufacturing";
  const value = category.toLowerCase();
  if (value.includes("herbal powder")) return "supplement & nutraceutical manufacturing";
  if (value.includes("tea") || value.includes("infusion")) return "tea blending & herbal beverage production";
  if (value.includes("whole herb")) return "herbal formulation & Ayurvedic product manufacturing";
  if (value.includes("whole spice")) return "food processing & spice blending";
  if (value.includes("spice powder")) return "food manufacturing & culinary applications";
  if (value.includes("extract")) return "supplement, pharma & nutraceutical manufacturing";
  if (value.includes("spray")) return "functional food & supplement manufacturing";
  return "food, supplement & nutraceutical manufacturing";
}

export function generateProductSeoV1(product: LegacyProductForSEO): {
  seoTitle: string;
  seoDescription: string;
} {
  const organic = isOrganicProduct(product);
  const botanical = product.botanicalName ? ` (${product.botanicalName})` : "";
  const categoryKeyword = getCategoryKeyword(product.category);
  const categoryBenefit = getCategoryBenefit(product.category);
  const prefix = "TOP ";
  const suffix = " manufacturer and exporter from India";
  const maxName = 255 - prefix.length - suffix.length;
  const name = product.name.length <= maxName ? product.name : truncate(product.name, maxName);
  const seoTitle = prefix + name + suffix;

  let seoDescription = organic
    ? `EU Organic certified ${product.name}${botanical} from India's top B2B manufacturer. ETO-free, EU 2018/848 compliant ${categoryKeyword} for ${categoryBenefit}. Bulk wholesale to Europe — COA, MSDS & samples available.`
    : `Premium ${product.name}${botanical} from India's top B2B manufacturer. EU food safety compliant, ETO-free ${categoryKeyword} for ${categoryBenefit}. Bulk wholesale supply to Europe — COA, MSDS & samples available.`;
  if (seoDescription.length > 165) seoDescription = truncate(seoDescription, 162) + "...";

  return { seoTitle, seoDescription };
}