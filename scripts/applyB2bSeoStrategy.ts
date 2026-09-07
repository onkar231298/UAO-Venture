import { and, eq, or, sql } from "drizzle-orm";
import { db } from "../server/db";
import { generateProductSEO } from "../server/seoGenerator";
import { CANONICAL_ORIGIN, STATIC_PAGE_SEO } from "../server/seo";
import { COLLECTION_PAGE_SEO, HOME_SEO, KEYWORD_ASSIGNMENTS, categoryPageSeo, healthSupportPageSeo } from "../server/seoStrategy";
import { categories, globalSeoSettings, healthSupports, products, seoKeywordPageMappings } from "../shared/schema";
import { generateProductSeoV1 } from "./legacyProductSeoV1";

const applyChanges = process.argv.includes("--apply");

const keywordFields = {
  primaryKeywords: HOME_SEO.keywords,
  pharmaceuticalKeywords: "botanical extracts manufacturer, ingredient quality testing services, organic ingredient regulatory support",
  nutraceuticalKeywords: "bulk herbal powders supplier, nutraceutical raw materials supplier, organic herbal extracts supplier, nutraceutical formulation support",
  northAmericaKeywords: "organic ingredient supplier USA",
  europeKeywords: "EU organic spices supplier, organic ingredient supplier Europe, organic ingredient supplier Germany",
  asiaPacificKeywords: "",
  indiaKeywords: "bulk organic spices supplier India",
  middleEastKeywords: "organic ingredient exporter UAE",
  latinAmericaKeywords: "",
};

const [settings] = await db.select().from(globalSeoSettings)
  .where(eq(globalSeoSettings.isActive, true))
  .orderBy(sql`${globalSeoSettings.id} DESC`)
  .limit(1);
if (!settings) throw new Error("No active global SEO settings row exists.");

const productRows = await db.select({
  id: products.id,
  name: products.name,
  botanicalName: products.botanicalName,
  isOrganic: products.isOrganic,
  productType: products.productType,
  form: products.form,
  origin: products.origin,
  seoTitle: products.seoTitle,
  seoDescription: products.seoDescription,
  category: categories.name,
}).from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .where(and(eq(products.isActive, true), eq(products.isVisible, true)));
const categoryRows = await db.select().from(categories).where(eq(categories.isActive, true));
const healthSupportRows = await db.select().from(healthSupports).where(eq(healthSupports.isActive, true));

const productPlans = productRows.map((product) => {
  const generated = generateProductSEO(product);
  const previousDescriptionGenerated = generateProductSEO(product, {
    legacyDescriptionOrder: true,
  });
  // Exact output from the immediately preceding generator, which did not
  // consider productType. This lets the corrected classifier migrate only
  // metadata that the prior rollout demonstrably generated.
  const previousGenerated = generateProductSEO({
    ...product,
    isOrganic: false,
    productType: null,
  }, { legacyDescriptionOrder: true });
  const legacyGenerated = generateProductSeoV1(product);
  const generatedPairs = [
    generated,
    previousDescriptionGenerated,
    previousGenerated,
    legacyGenerated,
  ];
  const exactGeneratedPair = generatedPairs.some((candidate) =>
    product.seoTitle === candidate.seoTitle
    && product.seoDescription === candidate.seoDescription);
  const titleOwned = !product.seoTitle?.trim() || exactGeneratedPair;
  const descriptionOwned = !product.seoDescription?.trim() || exactGeneratedPair;
  const titleChanged = titleOwned && product.seoTitle !== generated.seoTitle;
  const descriptionChanged = descriptionOwned && product.seoDescription !== generated.seoDescription;
  return { product, generated, titleOwned, descriptionOwned, titleChanged, descriptionChanged };
});
const changedProductPlans = productPlans.filter((plan) => plan.titleChanged || plan.descriptionChanged);
const preservedProducts = productPlans.filter((plan) => !plan.titleOwned || !plan.descriptionOwned).length;
const unchangedGeneratedProducts = productPlans.filter((plan) =>
  plan.titleOwned && plan.descriptionOwned && !plan.titleChanged && !plan.descriptionChanged).length;
const categoryPlans = categoryRows.filter((category) => (category.description || "").trim().length < 70);
const healthSupportPlans = healthSupportRows.filter((healthSupport) => (healthSupport.description || "").trim().length < 70);
const missingAssignments = KEYWORD_ASSIGNMENTS.flatMap((assignment) => {
  if (assignment.pageType === "category") {
    const category = categoryRows.find((row) => row.slug === assignment.pageSlug);
    const expectedPath = category ? `/ingredients/${category.slug}` : null;
    return category && assignment.pagePath === expectedPath
      ? []
      : [`${assignment.keyword} -> ${assignment.pagePath} (missing active category ${assignment.pageSlug})`];
  }
  const hasStaticMetadata = assignment.pagePath === "/"
    || !!STATIC_PAGE_SEO[assignment.pagePath]
    || !!COLLECTION_PAGE_SEO[assignment.pagePath as keyof typeof COLLECTION_PAGE_SEO];
  return hasStaticMetadata
    ? []
    : [`${assignment.keyword} -> ${assignment.pagePath} (missing indexable static metadata)`];
});
if (missingAssignments.length) {
  throw new Error(`SEO strategy preflight failed:\n${missingAssignments.join("\n")}`);
}

const mappingPlans = KEYWORD_ASSIGNMENTS.map((assignment) => {
  const category = assignment.pageType === "category"
    ? categoryRows.find((row) => row.slug === assignment.pageSlug)
    : null;
  return {
    assignment,
    pageId: category ? String(category.id) : assignment.pagePath,
    pageUrl: `${CANONICAL_ORIGIN}${assignment.pagePath}`,
  };
});

if (!applyChanges) {
  console.log(JSON.stringify({
    mode: "dry-run",
    settingsId: settings.id,
    configuredTargetKeywords: KEYWORD_ASSIGNMENTS.length,
    plannedKeywordMappings: mappingPlans.length,
    activeVisibleProducts: productRows.length,
    plannedProductMetadataUpdates: changedProductPlans.length,
    preservedCustomProductMetadata: preservedProducts,
    unchangedGeneratedProductMetadata: unchangedGeneratedProducts,
    plannedCategoryDescriptionExpansions: categoryPlans.length,
    plannedHealthSupportDescriptionExpansions: healthSupportPlans.length,
    affectedProductSample: changedProductPlans.slice(0, 25).map(({ product, titleChanged, descriptionChanged }) => ({
      id: product.id,
      name: product.name,
      titleChanged,
      descriptionChanged,
    })),
    instruction: "Review this preview, then rerun with --apply to write the changes.",
  }, null, 2));
  process.exit(0);
}

await db.transaction(async (tx) => {
  await tx.update(globalSeoSettings).set({
    siteTitle: HOME_SEO.title,
    siteDescription: HOME_SEO.description,
    ...keywordFields,
    updatedAt: new Date(),
  }).where(eq(globalSeoSettings.id, settings.id));

  for (const { product, generated, titleChanged, descriptionChanged } of changedProductPlans) {
    await tx.update(products).set({
      ...(titleChanged ? { seoTitle: generated.seoTitle } : {}),
      ...(descriptionChanged ? { seoDescription: generated.seoDescription } : {}),
      updatedAt: new Date(),
    }).where(eq(products.id, product.id));
  }

  for (const category of categoryPlans) {
    await tx.update(categories).set({ description: categoryPageSeo(category.name).description })
      .where(eq(categories.id, category.id));
  }

  for (const healthSupport of healthSupportPlans) {
    await tx.update(healthSupports).set({ description: healthSupportPageSeo(healthSupport.name).description })
      .where(eq(healthSupports.id, healthSupport.id));
  }

  for (const { assignment, pageId, pageUrl } of mappingPlans) {
    await tx.insert(seoKeywordPageMappings).values({
      keyword: assignment.keyword.toLowerCase(),
      pageUrl,
      pageType: assignment.pageType,
      pageId,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: seoKeywordPageMappings.keyword,
      set: {
        pageUrl,
        pageType: assignment.pageType,
        pageId,
        updatedAt: new Date(),
      },
    });
  }
});

const [mappingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(seoKeywordPageMappings)
  .where(or(...KEYWORD_ASSIGNMENTS.map((assignment) => eq(seoKeywordPageMappings.keyword, assignment.keyword.toLowerCase()))));

console.log(JSON.stringify({
  mode: "applied",
  settingsId: settings.id,
  configuredTargetKeywords: KEYWORD_ASSIGNMENTS.length,
  mappedTargetKeywords: mappingCount.count,
  activeVisibleProducts: productRows.length,
  updatedGeneratedProductMetadata: changedProductPlans.length,
  preservedCustomProductMetadata: preservedProducts,
  unchangedGeneratedProductMetadata: unchangedGeneratedProducts,
  expandedCategoryDescriptions: categoryPlans.length,
  expandedHealthSupportDescriptions: healthSupportPlans.length,
}, null, 2));