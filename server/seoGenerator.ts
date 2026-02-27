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
  if (product.productType === "organic") return true;
  if (product.name.toLowerCase().includes("organic")) return true;
  return false;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trim();
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

export function generateProductSEO(product: ProductForSEO): {
  seoTitle: string;
  seoDescription: string;
} {
  const organic = isOrganicProduct(product);
  const botanical = product.botanicalName ? ` (${product.botanicalName})` : "";
  const categoryKeyword = getCategoryKeyword(product.category);
  const categoryBenefit = getCategoryBenefit(product.category);

  // ─── SEO TITLE ────────────────────────────────────────────────────────────
  // Target: max ~78 chars. Format differs for organic vs conventional.
  const ORGANIC_SUFFIX = " | India's Top B2B Manufacturer | EU Organic Certified";
  const CONV_SUFFIX = " | India's Top B2B Manufacturer | Bulk Europe";

  let seoTitle: string;

  if (organic) {
    const full = product.name + ORGANIC_SUFFIX;
    if (full.length <= 80) {
      seoTitle = full;
    } else {
      const maxName = 80 - ORGANIC_SUFFIX.length;
      seoTitle = truncate(product.name, maxName) + ORGANIC_SUFFIX;
    }
  } else {
    const full = product.name + CONV_SUFFIX;
    if (full.length <= 80) {
      seoTitle = full;
    } else {
      const maxName = 80 - CONV_SUFFIX.length;
      seoTitle = truncate(product.name, maxName) + CONV_SUFFIX;
    }
  }

  // ─── SEO DESCRIPTION ──────────────────────────────────────────────────────
  // Target: 150–160 chars. Unique per category + organic/conventional split.
  let seoDescription: string;

  if (organic) {
    seoDescription = `EU Organic certified ${product.name}${botanical} from India's top B2B manufacturer. ETO-free, EU 2018/848 compliant ${categoryKeyword} for ${categoryBenefit}. Bulk wholesale to Europe — COA, MSDS & samples available.`;
  } else {
    seoDescription = `Premium ${product.name}${botanical} from India's top B2B manufacturer. EU food safety compliant, ETO-free ${categoryKeyword} for ${categoryBenefit}. Bulk wholesale supply to Europe — COA, MSDS & samples available.`;
  }

  // Clamp description to 165 chars max
  if (seoDescription.length > 165) {
    seoDescription = truncate(seoDescription, 162) + "...";
  }

  return { seoTitle, seoDescription };
}
