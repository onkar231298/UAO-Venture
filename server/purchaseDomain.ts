export type StockBatch = {
  id: number;
  productId: number | null;
  batchType: string | null;
  status: string | null;
  organicType: string | null;
  unit: string | null;
  unitOfMeasure: string | null;
  approvedQuantity: string | number | null;
  usedQuantity: string | number | null;
  remainingQuantity: string | number | null;
  expiryDate: Date | string | null;
  procurementCertificateVerified?: boolean;
};

export type StockReservation = {
  qualityBatchId: number;
  quantity: string | number;
  unit: string;
  status: string;
  fulfillmentRequirementId?: number;
};

export type StockAvailability = {
  requiredQuantity: number;
  fulfilledQuantity: number;
  allocatedQuantity: number;
  outstandingQuantity: number;
  unit: string;
  finishedGoodsAvailable: number;
  rawMaterialsAvailable: number;
  unverifiedInventoryQuantity: number;
  purchaseShortage: number;
  activeReservations: number;
  unverifiedBatchQuantity: number;
  recommendation: "stock_available" | "production_review" | "inventory_review" | "purchase_required";
  excludedBatchCount: number;
  reasons: string[];
  eligibleFinishedGoodBatches: Array<{ id: number; freeQuantity: number; allocatedQuantity: number; unit: string }>;
};

export function normalizeVendorName(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function normalizeUnit(value: string | null | undefined): string {
  const normalized = (value || "").trim().toLocaleLowerCase("en").replace(/[.\s_-]+/g, "");
  const aliases: Record<string, string> = {
    kilogram: "kg",
    kilograms: "kg",
    kgs: "kg",
    gram: "g",
    grams: "g",
    gms: "g",
    litre: "l",
    liter: "l",
    liters: "l",
    litres: "l",
    metricton: "mt",
    metrictons: "mt",
    tons: "mt",
    tonne: "mt",
    tonnes: "mt",
    pieces: "pcs",
    piece: "pcs",
  };
  return aliases[normalized] || normalized;
}

function amount(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function organicCategory(value: string | null | undefined): string {
  const normalized = (value || "").trim().toLocaleLowerCase("en");
  if (["organic", "o", "org"].includes(normalized)) return "organic";
  if (["conventional", "convention", "c", "conv"].includes(normalized)) return "conventional";
  if (["natural", "n"].includes(normalized)) return "natural";
  if (["synthetic", "s"].includes(normalized)) return "synthetic";
  if (["nature_identical", "nature identical", "ni"].includes(normalized)) return "nature_identical";
  return normalized;
}

export function productOrganicCategory(productType: string | null | undefined, isOrganic: boolean | null | undefined): string {
  if (isOrganic) return "organic";
  const category = organicCategory(productType);
  return category || "unknown";
}

export function calculateStockAvailability(input: {
  productId: number | null;
  productType: string | null;
  isOrganic: boolean | null;
  requiredQuantity: number;
  fulfilledQuantity?: number;
  fulfillmentRequirementId?: number;
  unit: string;
  batches: StockBatch[];
  reservations: StockReservation[];
  unverifiedInventoryQuantity?: number;
}): StockAvailability {
  const requiredUnit = normalizeUnit(input.unit);
  const requiredType = productOrganicCategory(input.productType, input.isOrganic);
  const reservationByBatch = new Map<number, number>();
  for (const reservation of input.reservations) {
    if (reservation.status !== "active" || normalizeUnit(reservation.unit) !== requiredUnit) continue;
    reservationByBatch.set(
      reservation.qualityBatchId,
      (reservationByBatch.get(reservation.qualityBatchId) || 0) + amount(reservation.quantity),
    );
  }

  let finishedGoodsAvailable = 0;
  let rawMaterialsAvailable = 0;
  let unverifiedBatchQuantity = 0;
  let excludedBatchCount = 0;
  const eligibleFinishedGoodBatches: StockAvailability["eligibleFinishedGoodBatches"] = [];
  const now = Date.now();
  for (const batch of input.batches) {
    const type = batch.batchType || "";
    const category = organicCategory(batch.organicType);
    const expiry = batch.expiryDate ? new Date(batch.expiryDate).getTime() : null;
    const eligible =
      input.productId !== null &&
      batch.productId === input.productId &&
      batch.status === "approved" &&
      ["finished_good", "raw_material"].includes(type) &&
      normalizeUnit(batch.unitOfMeasure || batch.unit) === requiredUnit &&
      category === requiredType &&
      (expiry === null || Number.isFinite(expiry) && expiry >= now);
    if (!eligible) {
      excludedBatchCount++;
      continue;
    }

    const physical = batch.remainingQuantity !== null && batch.remainingQuantity !== undefined
      ? amount(batch.remainingQuantity)
      : Math.max(0, amount(batch.approvedQuantity) - amount(batch.usedQuantity));
    const activeReserved = reservationByBatch.get(batch.id) || 0;
    const unreserved = Math.max(0, physical - activeReserved);
    const ownAllocated = input.reservations
      .filter((reservation) =>
        reservation.status === "active" &&
        reservation.qualityBatchId === batch.id &&
        reservation.fulfillmentRequirementId === input.fulfillmentRequirementId &&
        normalizeUnit(reservation.unit) === requiredUnit,
      )
      .reduce((sum, reservation) => sum + amount(reservation.quantity), 0);
    const available = unreserved;

    // Quality batch approval alone does not prove current organic certificate,
    // document, and market eligibility. Missing evidence must trigger review.
    if (requiredType === "organic" && !batch.procurementCertificateVerified) {
      unverifiedBatchQuantity += Math.max(0, physical - activeReserved);
      excludedBatchCount++;
      continue;
    }
    if (type === "finished_good") finishedGoodsAvailable += available;
    if (type === "raw_material") rawMaterialsAvailable += available;
    if (type === "finished_good") {
      eligibleFinishedGoodBatches.push({
        id: batch.id,
        freeQuantity: available,
        allocatedQuantity: ownAllocated,
        unit: input.unit,
      });
    }
  }

  const unverifiedInventoryQuantity = Math.max(0, amount(input.unverifiedInventoryQuantity));
  const fulfilledQuantity = Math.min(input.requiredQuantity, Math.max(0, amount(input.fulfilledQuantity)));
  const allocatedQuantity = Math.min(
    Math.max(0, input.requiredQuantity - fulfilledQuantity),
    eligibleFinishedGoodBatches.reduce((sum, batch) => sum + batch.allocatedQuantity, 0),
  );
  const outstandingQuantity = Math.max(0, input.requiredQuantity - fulfilledQuantity - allocatedQuantity);
  const purchaseShortage = Math.max(0, outstandingQuantity - finishedGoodsAvailable);
  const activeReservations = Math.max(0, input.reservations
    .filter((reservation) => reservation.status === "active" && normalizeUnit(reservation.unit) === requiredUnit)
    .reduce((sum, reservation) => sum + amount(reservation.quantity), 0));
  const reasons: string[] = [];
  let recommendation: StockAvailability["recommendation"];
  if (purchaseShortage <= 0) {
    recommendation = "stock_available";
  } else if (unverifiedInventoryQuantity > 0 || unverifiedBatchQuantity > 0 || requiredType === "unknown") {
    recommendation = "inventory_review";
    if (unverifiedInventoryQuantity > 0) reasons.push("Legacy inventory has quantity without a matching quality-released batch, so it is not counted as available.");
    if (unverifiedBatchQuantity > 0) reasons.push("Organic batch stock needs valid certification documents and market-eligibility review before it can be counted.");
  } else if (rawMaterialsAvailable > 0) {
    recommendation = "production_review";
    reasons.push("Released raw material exists, but there is no approved bill of materials or yield rule to convert it into finished goods.");
  } else {
    recommendation = "purchase_required";
  }
  if (excludedBatchCount > 0) {
    reasons.push("Some batches were excluded because their release status, expiry, product, organic category, or unit did not match.");
  }
  if (requiredType === "unknown") {
    reasons.push("The product's organic/conventional category is not explicit; no batch was treated as eligible.");
  }

  return {
    requiredQuantity: input.requiredQuantity,
    fulfilledQuantity,
    allocatedQuantity,
    outstandingQuantity,
    unit: input.unit,
    finishedGoodsAvailable,
    rawMaterialsAvailable,
    unverifiedInventoryQuantity,
    purchaseShortage,
    activeReservations,
    unverifiedBatchQuantity,
    recommendation,
    excludedBatchCount,
    reasons,
    eligibleFinishedGoodBatches,
  };
}

export function isCurrentApprovedScope(scope: {
  approvalStatus: string | null;
  validUntil: Date | string | null;
}, now = new Date()): boolean {
  if (scope.approvalStatus !== "approved") return false;
  if (!scope.validUntil) return true;
  const expiry = new Date(scope.validUntil).getTime();
  return Number.isFinite(expiry) && expiry >= now.getTime();
}

export function isScopeEligibleForProduct(scope: {
  approvalStatus: string | null;
  validUntil: Date | string | null;
  scopeType: string;
  productId: number | null;
  organicRequirement: string | null;
  certificationScheme?: string | null;
}, product: {
  id: number;
  productType: string | null;
  isOrganic: boolean | null;
} | null, now = new Date()): boolean {
  if (!isCurrentApprovedScope(scope, now) || scope.scopeType !== "product" || !product) return false;
  if (scope.productId !== product.id) return false;
  return scope.organicRequirement === productOrganicCategory(product.productType, product.isOrganic);
}

export function redactSalesOrderCustomerFields<T extends Record<string, unknown>>(order: T): Omit<T,
  "customerId" | "customerCompanyName" | "customerContactName" | "customerEmail" | "customerPhone" |
  "billingAddress" | "billingCity" | "billingState" | "billingPostalCode" | "billingCountry" |
  "shippingAddress" | "shippingCity" | "shippingState" | "shippingPostalCode" | "shippingCountry"
> {
  const {
    customerId, customerCompanyName, customerContactName, customerEmail, customerPhone,
    billingAddress, billingCity, billingState, billingPostalCode, billingCountry,
    shippingAddress, shippingCity, shippingState, shippingPostalCode, shippingCountry,
    ...safeOrder
  } = order;
  void customerId; void customerCompanyName; void customerContactName; void customerEmail; void customerPhone;
  void billingAddress; void billingCity; void billingState; void billingPostalCode; void billingCountry;
  void shippingAddress; void shippingCity; void shippingState; void shippingPostalCode; void shippingCountry;
  return safeOrder;
}
