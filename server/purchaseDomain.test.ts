import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateStockAvailability,
  isCurrentApprovedScope,
  isScopeEligibleForProduct,
  normalizeUnit,
  normalizeVendorName,
  productOrganicCategory,
  redactCustomerIdentity,
  type StockBatch,
} from "./purchaseDomain";

function batch(overrides: Partial<StockBatch> = {}): StockBatch {
  return {
    id: 1,
    productId: 12,
    batchType: "finished_good",
    status: "approved",
    organicType: "conventional",
    unit: "kg",
    unitOfMeasure: "kg",
    approvedQuantity: "20",
    usedQuantity: "0",
    remainingQuantity: "20",
    expiryDate: null,
    ...overrides,
  };
}

test("vendor names and units normalize equivalent formatting", () => {
  assert.equal(normalizeVendorName("  ACME   Foods "), "acme foods");
  assert.equal(normalizeUnit("Kilograms (kg)"), "kg");
  assert.equal(normalizeUnit("KGS"), "kg");
  assert.equal(normalizeUnit("metric ton"), "mt");
});

test("finished-good availability excludes other orders' reservations and includes only own allocation", () => {
  const result = calculateStockAvailability({
    productId: 12,
    productType: "conventional",
    isOrganic: false,
    requiredQuantity: 12,
    fulfilledQuantity: 1,
    fulfillmentRequirementId: 44,
    unit: "kg",
    batches: [
      batch({ id: 1, remainingQuantity: "10" }),
      batch({ id: 2, status: "quarantined", remainingQuantity: "100" }),
      batch({ id: 3, expiryDate: "2000-01-01", remainingQuantity: "100" }),
      batch({ id: 4, productId: 99, remainingQuantity: "100" }),
      batch({ id: 5, unitOfMeasure: "g", remainingQuantity: "100" }),
    ],
    reservations: [
      { qualityBatchId: 1, quantity: 4, unit: "kg", status: "active" },
      { qualityBatchId: 1, quantity: 3, unit: "kg", status: "active", fulfillmentRequirementId: 44 },
      { qualityBatchId: 1, quantity: 30, unit: "kg", status: "cancelled" },
    ],
  });

  assert.equal(result.finishedGoodsAvailable, 3);
  assert.equal(result.allocatedQuantity, 3);
  assert.equal(result.outstandingQuantity, 8);
  assert.equal(result.purchaseShortage, 5);
  assert.equal(result.recommendation, "purchase_required");
  assert.deepEqual(result.eligibleFinishedGoodBatches, [{ id: 1, freeQuantity: 3, allocatedQuantity: 3, unit: "kg" }]);
  assert.equal(result.excludedBatchCount, 4);
});

test("explicit zero remaining quantity is not replaced by approved quantity", () => {
  const result = calculateStockAvailability({
    productId: 12,
    productType: "conventional",
    isOrganic: false,
    requiredQuantity: 5,
    unit: "kg",
    batches: [batch({ remainingQuantity: "0", approvedQuantity: "20", usedQuantity: "0" })],
    reservations: [],
  });

  assert.equal(result.finishedGoodsAvailable, 0);
  assert.equal(result.purchaseShortage, 5);
});

test("raw materials require a production review when no BOM or yield is configured", () => {
  const result = calculateStockAvailability({
    productId: 12,
    productType: "conventional",
    isOrganic: false,
    requiredQuantity: 30,
    unit: "kg",
    batches: [batch({ batchType: "raw_material", remainingQuantity: "80" })],
    reservations: [],
  });

  assert.equal(result.rawMaterialsAvailable, 80);
  assert.equal(result.recommendation, "production_review");
  assert.equal(result.purchaseShortage, 30);
});

test("organic stock without explicit certificate verification and unmatched legacy stock need review", () => {
  const organic = calculateStockAvailability({
    productId: 12,
    productType: "organic",
    isOrganic: true,
    requiredQuantity: 4,
    unit: "kg",
    batches: [batch({ organicType: "organic", remainingQuantity: "9" })],
    reservations: [],
  });
  assert.equal(organic.finishedGoodsAvailable, 0);
  assert.equal(organic.unverifiedBatchQuantity, 9);
  assert.equal(organic.recommendation, "inventory_review");

  const legacy = calculateStockAvailability({
    productId: 12,
    productType: "conventional",
    isOrganic: false,
    requiredQuantity: 4,
    unit: "kg",
    batches: [],
    reservations: [],
    unverifiedInventoryQuantity: 9,
  });
  assert.equal(legacy.unverifiedInventoryQuantity, 9);
  assert.equal(legacy.recommendation, "inventory_review");
});

test("organic and conventional vendor scopes require exact category and current approval", () => {
  const now = new Date("2026-10-23T00:00:00Z");
  const scope = {
    approvalStatus: "approved",
    validUntil: "2026-11-01T00:00:00Z",
    scopeType: "product",
    productId: 12,
    organicRequirement: "organic",
  };
  assert.equal(isScopeEligibleForProduct(scope, { id: 12, productType: "organic", isOrganic: true }, now), true);
  assert.equal(isScopeEligibleForProduct(scope, { id: 12, productType: "conventional", isOrganic: false }, now), false);
  assert.equal(isScopeEligibleForProduct(scope, { id: 13, productType: "organic", isOrganic: true }, now), false);
  assert.equal(isCurrentApprovedScope({ ...scope, validUntil: "2020-01-01T00:00:00Z" }, now), false);
  assert.equal(isCurrentApprovedScope({ ...scope, approvalStatus: "pending" }, now), false);
});

test("unknown product classification is not treated as a known organic category", () => {
  assert.equal(productOrganicCategory("spice", false), "unknown");
});

test("quality-role responses hide customer identities and mask customer-bearing references", () => {
  const record = {
    id: 8,
    referenceId: "QTR-Demo-Customer-1026-001",
    customerName: "Demo Customer",
    company: { id: 77, companyName: "Demo Foods", primaryEmail: "buyer@example.test" },
    productName: "Turmeric",
  };

  const safe = redactCustomerIdentity(record, "quality_manager");
  assert.deepEqual(safe, { id: 8, referenceId: "QTR-8", productName: "Turmeric" });
  assert.equal(redactCustomerIdentity(record, "sales_executive"), record);
  assert.equal(redactCustomerIdentity(record, "admin"), record);
});
