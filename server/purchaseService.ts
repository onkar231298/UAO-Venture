import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "./db";
import {
  inventory,
  inventoryReservations,
  materialRequisitions,
  procurementAuditEvents,
  products,
  qualityBatchNumbers,
  salesOrderFulfillmentRequirements,
  salesOrderItems,
  salesOrders,
} from "@shared/schema";
import { calculateStockAvailability, normalizeUnit } from "./purchaseDomain";

const numberValue = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function syncConfirmedSalesOrder(salesOrderId: number) {
  const [order] = await db.select({
    id: salesOrders.id,
    soNumber: salesOrders.soNumber,
    status: salesOrders.status,
    requiredBy: salesOrders.expectedDeliveryDate,
  }).from(salesOrders).where(eq(salesOrders.id, salesOrderId)).limit(1);
  if (!order) throw new Error("Sales Order not found");
  if (order.status !== "confirmed") throw new Error("Only confirmed Sales Orders can create fulfillment requirements");

  const items = await db.select({
    id: salesOrderItems.id,
    productId: salesOrderItems.productId,
    productName: salesOrderItems.productName,
    specification: salesOrderItems.description,
    quantity: salesOrderItems.quantity,
    unit: salesOrderItems.unit,
  }).from(salesOrderItems).where(eq(salesOrderItems.salesOrderId, salesOrderId));

  const requirements = [];
  for (const item of items) {
    const requiredQuantity = numberValue(item.quantity);
    if (!(requiredQuantity > 0) || !item.unit?.trim()) continue;
    const [requirement] = await db.insert(salesOrderFulfillmentRequirements).values({
      salesOrderId,
      salesOrderItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      specification: item.specification || null,
      requiredQuantity: String(requiredQuantity),
      unit: item.unit,
      requiredBy: order.requiredBy || null,
      fulfillmentStatus: "needs_review",
    }).onConflictDoUpdate({
      target: salesOrderFulfillmentRequirements.salesOrderItemId,
      set: {
        productId: item.productId,
        productName: item.productName,
        specification: item.specification || null,
        requiredQuantity: String(requiredQuantity),
        unit: item.unit,
        requiredBy: order.requiredBy || null,
        updatedAt: new Date(),
      },
    }).returning();
    requirements.push({ ...requirement, soNumber: order.soNumber });
  }
  return requirements;
}

export async function syncAllConfirmedSalesOrders() {
  const orders = await db.select({ id: salesOrders.id }).from(salesOrders)
    .where(eq(salesOrders.status, "confirmed"));
  let createdOrUpdated = 0;
  for (const order of orders) {
    createdOrUpdated += (await syncConfirmedSalesOrder(order.id)).length;
  }
  return { salesOrdersChecked: orders.length, requirementsCreatedOrUpdated: createdOrUpdated };
}

export async function getLiveStockAnalysis(requirementId: number) {
  const [requirement] = await db.select({
    id: salesOrderFulfillmentRequirements.id,
    productId: salesOrderFulfillmentRequirements.productId,
    productName: salesOrderFulfillmentRequirements.productName,
    requiredQuantity: salesOrderFulfillmentRequirements.requiredQuantity,
    unit: salesOrderFulfillmentRequirements.unit,
  }).from(salesOrderFulfillmentRequirements)
    .where(eq(salesOrderFulfillmentRequirements.id, requirementId)).limit(1);
  if (!requirement) throw new Error("Fulfillment requirement not found");

  const [product] = requirement.productId
    ? await db.select({ id: products.id, productType: products.productType, isOrganic: products.isOrganic })
        .from(products).where(eq(products.id, requirement.productId)).limit(1)
    : [];
  const batches = requirement.productId
    ? await db.select().from(qualityBatchNumbers).where(eq(qualityBatchNumbers.productId, requirement.productId))
    : [];
  const reservations = requirement.productId
    ? await db.select({
        qualityBatchId: inventoryReservations.qualityBatchId,
        quantity: inventoryReservations.quantity,
        unit: inventoryReservations.unit,
        status: inventoryReservations.status,
      }).from(inventoryReservations)
        .innerJoin(qualityBatchNumbers, eq(inventoryReservations.qualityBatchId, qualityBatchNumbers.id))
        .where(and(eq(qualityBatchNumbers.productId, requirement.productId), eq(inventoryReservations.status, "active")))
    : [];
  const legacyInventory = requirement.productId
    ? await db.select().from(inventory).where(eq(inventory.productId, requirement.productId))
    : [];

  const batchNumbers = new Set(batches.map((batch) => batch.batchNumber));
  const unverifiedLegacyQuantity = legacyInventory.reduce((total, row) => {
    if (row.batchNumber && batchNumbers.has(row.batchNumber)) return total;
    if (normalizeUnit(row.unit) !== normalizeUnit(requirement.unit)) return total;
    return total + numberValue(row.quantityInStock);
  }, 0);

  const analysis = calculateStockAvailability({
    productId: requirement.productId,
    productType: product?.productType || null,
    isOrganic: product?.isOrganic ?? null,
    requiredQuantity: numberValue(requirement.requiredQuantity),
    unit: requirement.unit,
    batches,
    reservations,
    unverifiedInventoryQuantity: unverifiedLegacyQuantity,
  });
  return { requirement, analysis };
}

export async function createRequisitionForShortage(requirementId: number, requestedById: string) {
  const { requirement, analysis } = await getLiveStockAnalysis(requirementId);
  if (analysis.recommendation === "stock_available") {
    throw new Error("Released finished-goods stock already covers this requirement.");
  }
  if (analysis.recommendation === "inventory_review") {
    throw new Error("Legacy inventory quantity needs quality/batch verification before a requisition can be created.");
  }
  if (analysis.recommendation === "production_review") {
    throw new Error("Released raw materials exist. A production plan or approved BOM/yield is required before sourcing more material.");
  }
  if (!(analysis.purchaseShortage > 0)) {
    throw new Error("No verified purchase shortage is available for this requirement.");
  }

  return db.transaction(async (tx) => {
    const [lockedRequirement] = await tx.select()
      .from(salesOrderFulfillmentRequirements)
      .where(eq(salesOrderFulfillmentRequirements.id, requirementId))
      .for("update")
      .limit(1);
    if (!lockedRequirement) throw new Error("Fulfillment requirement not found");

    const [existing] = await tx.select({ id: materialRequisitions.id })
      .from(materialRequisitions)
      .where(and(
        eq(materialRequisitions.fulfillmentRequirementId, requirementId),
        ne(materialRequisitions.status, "cancelled"),
      ))
      .limit(1);
    if (existing) throw new Error("A requisition already exists for this fulfillment requirement.");

    const requisitionNumber = `MR-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const [requisition] = await tx.insert(materialRequisitions).values({
      requisitionNumber,
      fulfillmentRequirementId: requirementId,
      productId: lockedRequirement.productId,
      productName: lockedRequirement.productName,
      specification: lockedRequirement.specification,
      quantity: String(analysis.purchaseShortage),
      unit: lockedRequirement.unit,
      requiredBy: lockedRequirement.requiredBy,
      reason: `Verified finished-goods shortage for Sales Order fulfillment requirement ${requirementId}.`,
      status: "draft",
      requestedById,
    }).returning();

    await tx.insert(procurementAuditEvents).values({
      entityType: "material_requisition",
      entityId: requisition.id,
      action: "created_from_fulfillment_shortage",
      actorId: requestedById,
      metadata: { fulfillmentRequirementId: requirementId, quantity: analysis.purchaseShortage, unit: lockedRequirement.unit },
    });
    return requisition;
  });
}

export async function getPurchaseSafeFulfillmentRows() {
  const rows = await db.select({
    requirement: salesOrderFulfillmentRequirements,
    soNumber: salesOrders.soNumber,
  }).from(salesOrderFulfillmentRequirements)
    .innerJoin(salesOrders, eq(salesOrderFulfillmentRequirements.salesOrderId, salesOrders.id))
    .orderBy(desc(salesOrderFulfillmentRequirements.createdAt));
  return Promise.all(rows.map(async ({ requirement, soNumber }) => {
    const { analysis } = await getLiveStockAnalysis(requirement.id);
    return {
      id: requirement.id,
      soNumber,
      productId: requirement.productId,
      productName: requirement.productName,
      specification: requirement.specification,
      requiredQuantity: requirement.requiredQuantity,
      unit: requirement.unit,
      requiredBy: requirement.requiredBy,
      priority: requirement.priority,
      fulfillmentStatus: analysis.recommendation,
      stockAnalysis: analysis,
    };
  }));
}
