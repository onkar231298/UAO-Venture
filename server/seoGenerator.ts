interface ProductForSEO {
  id: number;
  name: string;
  botanicalName?: string | null;
  isOrganic?: boolean | null;
  productType?: string | null;
  form?: string | null;
  category?: string | null;
  origin?: string | null;
}

function isOrganicProduct(product: ProductForSEO): boolean {
  if (product.isOrganic === true) return true;
  if (product.productType?.trim().toLowerCase() === "organic") return true;
  if (product.name.toLowerCase().includes("organic")) return true;
  return false;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  const cut = str.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > 0 ? cut.slice(0, lastSpace).trim() : cut.trim();
}

function productNameForTitle(name: string, suffix: string): string {
  const maxNameLength = 65 - suffix.length;
  return truncate(name.trim(), maxNameLength);
}

function getCategoryKeyword(category: string | null | undefined): string {
  if (!category) return "ingredient";
  const cat = category.toLowerCase();
  if (cat.includes("herbal powder")) return "herbal powder";
  if (cat.includes("tea") || cat.includes("infusion")) return "herbal tea";
  if (cat.includes("whole herb")) return "whole herb";
  if (cat.includes("whole spice")) return "whole spice";
  if (cat.includes("spice powder")) return "spice powder";
  if (cat.includes("extract")) return "botanical extract";
  if (cat.includes("spray")) return "spray dried ingredient";
  if (cat.includes("seed") || cat.includes("grain")) return "seeds & grains";
  if (cat.includes("culinary")) return "culinary herb";
  return "botanical ingredient";
}

function getCategoryBenefit(category: string | null | undefined): string {
  if (!category) return "food, beverage & nutraceutical manufacturing";
  const cat = category.toLowerCase();
  if (cat.includes("herbal powder")) return "supplement & nutraceutical manufacturing";
  if (cat.includes("tea") || cat.includes("infusion")) return "tea blending & herbal beverage production";
  if (cat.includes("whole herb")) return "herbal formulation & Ayurvedic product manufacturing";
  if (cat.includes("whole spice")) return "food processing & spice blending";
  if (cat.includes("spice powder")) return "food manufacturing & culinary applications";
  if (cat.includes("extract")) return "supplement, pharma & nutraceutical manufacturing";
  if (cat.includes("spray")) return "functional food & supplement manufacturing";
  return "food, supplement & nutraceutical manufacturing";
}

export function generateProductSEO(product: ProductForSEO, options?: {
  legacyDescriptionOrder?: boolean;
}): {
  seoTitle: string;
  seoDescription: string;
} {
  const organic = isOrganicProduct(product);
  const botanical = product.botanicalName ? ` (${product.botanicalName})` : "";
  const categoryKeyword = getCategoryKeyword(product.category);
  const categoryBenefit = getCategoryBenefit(product.category);

  const nameAlreadySaysOrganic = /^organic\b/i.test(product.name.trim());
  const titleSuffix = organic && !nameAlreadySaysOrganic
    ? " Bulk Organic Supplier India | Bright Fame"
    : " Bulk Supplier India | Bright Fame";
  const seoTitle = `${productNameForTitle(product.name, titleSuffix)}${titleSuffix}`;

  const productLabel = organic && !nameAlreadySaysOrganic ? `organic ${product.name}` : product.name;
  let seoDescription = nameAlreadySaysOrganic && !options?.legacyDescriptionOrder
    ? `Source ${productLabel}${botanical} in bulk from India, a ${categoryKeyword} for ${categoryBenefit}. Request specifications, documentation and samples.`
    : `Source bulk ${productLabel}${botanical} from India, a ${categoryKeyword} for ${categoryBenefit}. Request specifications, documentation and samples.`;

  if (seoDescription.length < 70) {
    seoDescription += " B2B supply enquiries are welcome.";
  }
  if (seoDescription.length > 165) {
    seoDescription = truncate(seoDescription, 162) + "...";
  }

  return { seoTitle, seoDescription };
}
