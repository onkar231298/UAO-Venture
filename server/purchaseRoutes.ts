import type { Express } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import {
  inventoryReservations,
  materialRequisitions,
  procurementAuditEvents,
  products,
  purchaseOrderItems,
  purchaseOrders,
  qualityBatchNumbers,
  qualityVendors,
  salesOrderFulfillmentRequirements,
  salesOrders,
  vendorApprovalScopes,
  vendorDocumentContents,
  vendorDocuments,
  vendorFinancialProfiles,
  vendorOffers,
} from "@shared/schema";
import {
  calculateStockAvailability,
  isCurrentApprovedScope,
  isScopeEligibleForProduct,
  normalizeUnit,
  normalizeVendorName,
  productOrganicCategory,
} from "./purchaseDomain";
import {
  createRequisitionForShortage,
  getLiveStockAnalysis,
  getPurchaseSafeFulfillmentRows,
  syncAllConfirmedSalesOrders,
} from "./purchaseService";

const adminRoles = ["admin", "super_admin"];
const purchaseRoles = ["purchase_manager", "purchase_executive"];
const qualityRoles = ["quality_manager", "quality_executive"];
const inventoryRoles = ["inventory_manager", "inventory_executive"];
const supportViewRoles = [...adminRoles, ...purchaseRoles, ...qualityRoles, ...inventoryRoles, "logistics_manager", "logistics_executive"];
const purchaseEditRoles = [...adminRoles, ...purchaseRoles];
const bankViewRoles = [...adminRoles, "purchase_manager"];
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

type StaffUser = { id: string; role: string | null };

function rolesOnly(roles: string[]) {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      const user = await storage.getUser(userId);
      if (!user || !roles.includes(user.role || "")) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      req.purchaseStaff = user as StaffUser;
      next();
    } catch (error) {
      console.error("Purchase authorization check failed:", error);
      res.status(500).json({ message: "Authorization check failed" });
    }
  };
}

function parseId(raw: unknown): number | null {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function numeric(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeFileName(fileName: string): string {
  return path.basename(fileName).replace(/[^\w.\- ]/g, "_").slice(0, 200) || "document";
}

function validDocumentFile(file: Express.Multer.File | undefined): boolean {
  if (!file || !file.buffer?.length) return false;
  const name = file.originalname.toLocaleLowerCase("en");
  const bytes = file.buffer;
  const startsPdf = bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  const startsJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const startsPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return (
    (name.endsWith(".pdf") && file.mimetype === "application/pdf" && startsPdf) ||
    ((name.endsWith(".jpg") || name.endsWith(".jpeg")) && file.mimetype === "image/jpeg" && startsJpeg) ||
    (name.endsWith(".png") && file.mimetype === "image/png" && startsPng) ||
    (name.endsWith(".webp") && file.mimetype === "image/webp" && isWebp)
  );
}

async function audit(
  executor: any,
  entityType: string,
  entityId: number,
  action: string,
  actorId: string,
  metadata?: Record<string, unknown>,
) {
  await executor.insert(procurementAuditEvents).values({
    entityType,
    entityId,
    action,
    actorId,
    metadata: metadata || null,
  });
}

async function refreshVendorApprovalStatus(executor: any, vendorId: number) {
  const [vendor] = await executor.select().from(qualityVendors)
    .where(eq(qualityVendors.id, vendorId)).limit(1);
  if (!vendor) return;
  const scopes = await executor.select().from(vendorApprovalScopes)
    .where(eq(vendorApprovalScopes.vendorId, vendorId));
  const requiredScopes = scopes.filter((scope: any) => scope.qualityRequired);
  const allRequiredScopesApproved = requiredScopes.every((scope: any) => isCurrentApprovedScope(scope));
  let approvalStatus = "under_review";
  if (vendor.vendorStatus !== "active") approvalStatus = "suspended";
  else if (vendor.generalApprovalStatus === "rejected" || scopes.some((scope: any) => scope.approvalStatus === "rejected")) approvalStatus = "rejected";
  else if (
    vendor.generalApprovalStatus === "approved" &&
    scopes.length > 0 &&
    allRequiredScopesApproved &&
    scopes.every((scope: any) => scope.approvalStatus === "approved" || !scope.qualityRequired)
  ) approvalStatus = "approved";
  else if (!vendor.submittedAt) approvalStatus = "pending";
  await executor.update(qualityVendors).set({
    approvalStatus,
    approvalDate: approvalStatus === "approved" ? (vendor.approvalDate || new Date()) : null,
    updatedAt: new Date(),
  }).where(eq(qualityVendors.id, vendorId));
}

async function isApprovedProductScope(vendorId: number, productId: number) {
  const [vendor] = await db.select({
    vendorStatus: qualityVendors.vendorStatus,
    approvalStatus: qualityVendors.approvalStatus,
    generalApprovalStatus: qualityVendors.generalApprovalStatus,
  }).from(qualityVendors).where(eq(qualityVendors.id, vendorId)).limit(1);
  if (!vendor || vendor.vendorStatus !== "active" || vendor.approvalStatus !== "approved" || vendor.generalApprovalStatus !== "approved") return null;
  const [product] = await db.select({
    id: products.id,
    productType: products.productType,
    isOrganic: products.isOrganic,
  }).from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return null;
  const scopes = await db.select().from(vendorApprovalScopes)
    .where(and(eq(vendorApprovalScopes.vendorId, vendorId), eq(vendorApprovalScopes.productId, productId)));
  return scopes.find((scope) => isScopeEligibleForProduct(scope, product)) || null;
}

function financialResponse(row: any) {
  if (!row) return null;
  return {
    beneficiaryName: row.beneficiaryName,
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    routingCode: row.routingCode,
    swiftCode: row.swiftCode,
    currency: row.currency,
    paymentTerms: row.paymentTerms,
    updatedAt: row.updatedAt,
  };
}

export function registerPurchaseRoutes(app: Express) {
  app.get("/api/purchase/overview", isAuthenticated, rolesOnly(supportViewRoles), async (_req: any, res) => {
    try {
      const [orders, vendors, requisitions, requirements] = await Promise.all([
        db.select({ id: purchaseOrders.id, status: purchaseOrders.status }).from(purchaseOrders),
        db.select({ id: qualityVendors.id, approvalStatus: qualityVendors.approvalStatus, vendorStatus: qualityVendors.vendorStatus }).from(qualityVendors),
        db.select({ id: materialRequisitions.id, status: materialRequisitions.status }).from(materialRequisitions),
        db.select({ id: salesOrderFulfillmentRequirements.id }).from(salesOrderFulfillmentRequirements),
      ]);
      res.json({
        purchaseOrders: orders.length,
        draftPurchaseOrders: orders.filter((row) => row.status === "draft").length,
        activeVendors: vendors.filter((row) => row.vendorStatus === "active").length,
        vendorsAwaitingApproval: vendors.filter((row) => row.approvalStatus === "pending" || row.approvalStatus === "under_review").length,
        openRequisitions: requisitions.filter((row) => !["cancelled", "ordered", "fulfilled"].includes(row.status || "")).length,
        fulfillmentRequirements: requirements.length,
        purchaseApprovalMatrixConfigured: false,
      });
    } catch (error) {
      console.error("Purchase overview query failed:", error);
      res.status(500).json({ message: "Failed to load purchase overview" });
    }
  });

  app.get("/api/purchase/vendors", isAuthenticated, rolesOnly(supportViewRoles), async (req: any, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const vendorRows = status && status !== "all"
        ? await db.select().from(qualityVendors).where(eq(qualityVendors.approvalStatus, status)).orderBy(desc(qualityVendors.createdAt))
        : await db.select().from(qualityVendors).orderBy(desc(qualityVendors.createdAt));
      const ids = vendorRows.map((vendor) => vendor.id);
      const scopes = ids.length
        ? await db.select().from(vendorApprovalScopes).where(inArray(vendorApprovalScopes.vendorId, ids))
        : [];
      const documents = ids.length
        ? await db.select({
            id: vendorDocuments.id,
            vendorId: vendorDocuments.vendorId,
            approvalScopeId: vendorDocuments.approvalScopeId,
            documentType: vendorDocuments.documentType,
            fileName: vendorDocuments.fileName,
            fileSize: vendorDocuments.fileSize,
            createdAt: vendorDocuments.createdAt,
          }).from(vendorDocuments).where(inArray(vendorDocuments.vendorId, ids))
        : [];
      res.json(vendorRows.map((vendor) => ({
        ...vendor,
        scopes: scopes.filter((scope) => scope.vendorId === vendor.id),
        documents: documents.filter((document) => document.vendorId === vendor.id),
      })));
    } catch (error) {
      console.error("Purchase vendor list failed:", error);
      res.status(500).json({ message: "Failed to load vendors" });
    }
  });

  app.post("/api/purchase/vendors", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const schema = z.object({
      vendorName: z.string().trim().min(2).max(500),
      contactPerson: z.string().trim().max(255).optional().default(""),
      contactEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
      contactPhone: z.string().trim().max(50).optional().default(""),
      address: z.string().trim().max(5000).optional().default(""),
      taxRegistrationNumber: z.string().trim().max(100).optional().default(""),
      registrationNumber: z.string().trim().max(100).optional().default(""),
      website: z.string().trim().max(500).optional().default(""),
      materialSupplied: z.string().trim().max(5000).optional().default(""),
      notes: z.string().trim().max(5000).optional().default(""),
    }).strict();
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter valid vendor details", errors: parsed.error.flatten() });
    const staff = req.purchaseStaff as StaffUser;
    const normalizedVendorName = normalizeVendorName(parsed.data.vendorName);
    try {
      const vendor = await db.transaction(async (tx) => {
        const [existing] = await tx.select({ id: qualityVendors.id }).from(qualityVendors)
          .where(eq(qualityVendors.normalizedVendorName, normalizedVendorName)).limit(1);
        if (existing) throw new Error("A vendor with this normalized legal name is already registered.");
        const [created] = await tx.insert(qualityVendors).values({
          ...parsed.data,
          normalizedVendorName,
          vendorCode: null,
          vendorStatus: "active",
          approvalStatus: "pending",
          generalApprovalStatus: "pending",
          addedById: staff.id,
        }).returning();
        const vendorCode = `VEN-${String(created.id).padStart(6, "0")}`;
        const [updated] = await tx.update(qualityVendors).set({ vendorCode }).where(eq(qualityVendors.id, created.id)).returning();
        await audit(tx, "vendor", updated.id, "registered", staff.id, { fields: Object.keys(parsed.data) });
        return updated;
      });
      res.status(201).json(vendor);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/already registered|duplicate key/i.test(message)) return res.status(409).json({ message: "A vendor with this legal name or code already exists." });
      console.error("Vendor creation failed:", error);
      res.status(500).json({ message: "Failed to register vendor" });
    }
  });

  app.patch("/api/purchase/vendors/:id", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const vendorId = parseId(req.params.id);
    if (!vendorId) return res.status(400).json({ message: "Invalid vendor ID" });
    const schema = z.object({
      vendorName: z.string().trim().min(2).max(500).optional(),
      contactPerson: z.string().trim().max(255).optional(),
      contactEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
      contactPhone: z.string().trim().max(50).optional(),
      address: z.string().trim().max(5000).optional(),
      taxRegistrationNumber: z.string().trim().max(100).optional(),
      registrationNumber: z.string().trim().max(100).optional(),
      website: z.string().trim().max(500).optional(),
      materialSupplied: z.string().trim().max(5000).optional(),
      notes: z.string().trim().max(5000).optional(),
    }).strict().refine((data) => Object.keys(data).length > 0, "Provide at least one field");
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter valid vendor updates", errors: parsed.error.flatten() });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [current] = await db.select().from(qualityVendors).where(eq(qualityVendors.id, vendorId)).limit(1);
      if (!current) return res.status(404).json({ message: "Vendor not found" });
      const update: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      const legalFields = ["vendorName", "taxRegistrationNumber", "registrationNumber", "address"];
      const needsResubmission = legalFields.some((field) => Object.prototype.hasOwnProperty.call(parsed.data, field));
      if (parsed.data.vendorName) {
        const normalizedVendorName = normalizeVendorName(parsed.data.vendorName);
        const [duplicate] = await db.select({ id: qualityVendors.id }).from(qualityVendors)
          .where(eq(qualityVendors.normalizedVendorName, normalizedVendorName)).limit(1);
        if (duplicate && duplicate.id !== vendorId) return res.status(409).json({ message: "Another vendor already uses this legal name." });
        update.normalizedVendorName = normalizedVendorName;
      }
      if (needsResubmission) {
        update.generalApprovalStatus = "pending";
        update.generalReviewedAt = null;
        update.generalReviewedById = null;
        update.generalReviewNotes = null;
        update.approvalStatus = "pending";
        update.approvalDate = null;
      }
      const [saved] = await db.transaction(async (tx) => {
        const row = await tx.update(qualityVendors).set(update as any).where(eq(qualityVendors.id, vendorId)).returning();
        await audit(tx, "vendor", vendorId, "updated", staff.id, { fields: Object.keys(parsed.data), generalApprovalReset: needsResubmission });
        return row;
      });
      res.json(saved);
    } catch (error) {
      console.error("Vendor update failed:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.post("/api/purchase/vendors/:id/submit", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const vendorId = parseId(req.params.id);
    if (!vendorId) return res.status(400).json({ message: "Invalid vendor ID" });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const scopes = await db.select().from(vendorApprovalScopes).where(eq(vendorApprovalScopes.vendorId, vendorId));
      if (!scopes.length) return res.status(400).json({ message: "Add at least one product, packaging, or service scope before submitting the vendor." });
      const [vendor] = await db.update(qualityVendors).set({
        submittedAt: new Date(),
        submittedById: staff.id,
        generalApprovalStatus: "under_review",
        approvalStatus: "under_review",
        updatedAt: new Date(),
      }).where(and(eq(qualityVendors.id, vendorId), eq(qualityVendors.vendorStatus, "active"))).returning();
      if (!vendor) return res.status(404).json({ message: "Active vendor not found" });
      await audit(db, "vendor", vendorId, "submitted_for_review", staff.id);
      res.json(vendor);
    } catch (error) {
      console.error("Vendor submission failed:", error);
      res.status(500).json({ message: "Failed to submit vendor for review" });
    }
  });

  app.post("/api/purchase/vendors/:id/general-review", isAuthenticated, rolesOnly(adminRoles), async (req: any, res) => {
    const vendorId = parseId(req.params.id);
    if (!vendorId) return res.status(400).json({ message: "Invalid vendor ID" });
    const parsed = z.object({
      decision: z.enum(["approved", "rejected", "returned"]),
      notes: z.string().trim().min(3).max(5000),
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "A decision and review notes are required." });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [vendor] = await db.select().from(qualityVendors).where(eq(qualityVendors.id, vendorId)).limit(1);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      const status = parsed.data.decision === "returned" ? "under_review" : parsed.data.decision;
      const [updated] = await db.transaction(async (tx) => {
        await tx.update(qualityVendors).set({
          generalApprovalStatus: status,
          generalReviewedById: staff.id,
          generalReviewedAt: new Date(),
          generalReviewNotes: parsed.data.notes,
          updatedAt: new Date(),
        }).where(eq(qualityVendors.id, vendorId));
        await refreshVendorApprovalStatus(tx, vendorId);
        await audit(tx, "vendor", vendorId, `general_review_${parsed.data.decision}`, staff.id, { notes: parsed.data.notes });
        return tx.select().from(qualityVendors).where(eq(qualityVendors.id, vendorId)).limit(1);
      });
      res.json(updated[0]);
    } catch (error) {
      console.error("Vendor general review failed:", error);
      res.status(500).json({ message: "Failed to review vendor registration" });
    }
  });

  app.post("/api/purchase/vendors/:id/status", isAuthenticated, rolesOnly([...adminRoles, "purchase_manager"]), async (req: any, res) => {
    const vendorId = parseId(req.params.id);
    if (!vendorId) return res.status(400).json({ message: "Invalid vendor ID" });
    const parsed = z.object({ status: z.enum(["active", "inactive"]), reason: z.string().trim().min(3).max(1000) }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "A status and reason are required." });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [updated] = await db.transaction(async (tx) => {
        const rows = await tx.update(qualityVendors).set({
          vendorStatus: parsed.data.status,
          approvalStatus: parsed.data.status === "inactive" ? "suspended" : "pending",
          updatedAt: new Date(),
        }).where(eq(qualityVendors.id, vendorId)).returning();
        if (!rows[0]) throw new Error("Vendor not found");
        await audit(tx, "vendor", vendorId, parsed.data.status === "active" ? "reactivated" : "deactivated", staff.id, { reason: parsed.data.reason });
        return rows;
      });
      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === "Vendor not found") return res.status(404).json({ message: error.message });
      console.error("Vendor status change failed:", error);
      res.status(500).json({ message: "Failed to change vendor status" });
    }
  });

  app.post("/api/purchase/vendors/:id/scopes", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const vendorId = parseId(req.params.id);
    if (!vendorId) return res.status(400).json({ message: "Invalid vendor ID" });
    const parsed = z.object({
      scopeType: z.enum(["product", "packaging", "service"]),
      productId: z.number().int().positive().nullable().optional(),
      scopeDescription: z.string().trim().min(3).max(3000),
      organicRequirement: z.enum(["organic", "conventional", "natural", "synthetic", "nature_identical", "unknown"]).default("unknown"),
      certificationScheme: z.string().trim().max(255).optional().default(""),
      qualityRequired: z.boolean().default(true),
      validUntil: z.string().datetime().nullable().optional(),
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a valid vendor scope", errors: parsed.error.flatten() });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [vendor] = await db.select().from(qualityVendors).where(eq(qualityVendors.id, vendorId)).limit(1);
      if (!vendor || vendor.vendorStatus !== "active") return res.status(404).json({ message: "Active vendor not found" });
      const productId = parsed.data.productId || null;
      if (parsed.data.scopeType !== "service" && !productId) {
        return res.status(400).json({ message: "Product and packaging scopes must identify a product." });
      }
      if (parsed.data.scopeType === "service" && productId) {
        return res.status(400).json({ message: "Service scopes cannot be linked to a product." });
      }
      if (parsed.data.scopeType === "service" && parsed.data.qualityRequired && !parsed.data.certificationScheme.trim()) {
        return res.status(400).json({ message: "A technical service scope needs a certification or quality standard." });
      }
      if (productId) {
        const [product] = await db.select({ id: products.id, productType: products.productType, isOrganic: products.isOrganic })
          .from(products).where(eq(products.id, productId)).limit(1);
        if (!product) return res.status(400).json({ message: "Product does not exist" });
        const requiredCategory = productOrganicCategory(product.productType, product.isOrganic);
        if (requiredCategory === "unknown" || parsed.data.organicRequirement !== requiredCategory) {
          return res.status(400).json({ message: `Scope must match the product's ${requiredCategory} category.` });
        }
        if (requiredCategory === "organic" && (!parsed.data.certificationScheme.trim() || !parsed.data.validUntil)) {
          return res.status(400).json({ message: "Organic product scopes require the certification scheme and certificate expiry date." });
        }
      }
      const duplicateConditions = [
        eq(vendorApprovalScopes.vendorId, vendorId),
        eq(vendorApprovalScopes.scopeType, parsed.data.scopeType),
        productId ? eq(vendorApprovalScopes.productId, productId) : sql`${vendorApprovalScopes.productId} is null`,
        eq(vendorApprovalScopes.organicRequirement, parsed.data.organicRequirement),
      ];
      const [existing] = await db.select({ id: vendorApprovalScopes.id }).from(vendorApprovalScopes)
        .where(and(...duplicateConditions)).limit(1);
      if (existing) return res.status(409).json({ message: "This product/service approval scope already exists for the vendor." });
      const [scope] = await db.transaction(async (tx) => {
        const rows = await tx.insert(vendorApprovalScopes).values({
          vendorId,
          scopeType: parsed.data.scopeType,
          productId,
          scopeDescription: parsed.data.scopeDescription,
          organicRequirement: parsed.data.organicRequirement,
          certificationScheme: parsed.data.certificationScheme || null,
          qualityRequired: parsed.data.scopeType === "service" ? parsed.data.qualityRequired : true,
          validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
          approvalStatus: "pending",
          createdById: staff.id,
        }).returning();
        await tx.update(qualityVendors).set({
          approvalStatus: "pending",
          approvalDate: null,
          updatedAt: new Date(),
        }).where(eq(qualityVendors.id, vendorId));
        await audit(tx, "vendor_scope", rows[0].id, "scope_created", staff.id, { vendorId, scopeType: parsed.data.scopeType, productId });
        return rows;
      });
      res.status(201).json(scope);
    } catch (error) {
      console.error("Vendor scope creation failed:", error);
      res.status(500).json({ message: "Failed to add vendor approval scope" });
    }
  });

  app.get("/api/purchase/vendor-scopes/review-queue", isAuthenticated, rolesOnly([...qualityRoles, ...adminRoles]), async (_req: any, res) => {
    try {
      const rows = await db.select({
        scope: vendorApprovalScopes,
        vendorName: qualityVendors.vendorName,
        vendorCode: qualityVendors.vendorCode,
        vendorStatus: qualityVendors.vendorStatus,
        generalApprovalStatus: qualityVendors.generalApprovalStatus,
      }).from(vendorApprovalScopes)
        .innerJoin(qualityVendors, eq(vendorApprovalScopes.vendorId, qualityVendors.id))
        .where(inArray(vendorApprovalScopes.approvalStatus, ["pending", "returned", "under_review"]))
        .orderBy(desc(vendorApprovalScopes.createdAt));
      res.json(rows);
    } catch (error) {
      console.error("Vendor scope review queue failed:", error);
      res.status(500).json({ message: "Failed to load vendor scope reviews" });
    }
  });

  app.post("/api/purchase/vendor-scopes/:id/review", isAuthenticated, rolesOnly([...qualityRoles, ...adminRoles]), async (req: any, res) => {
    const scopeId = parseId(req.params.id);
    if (!scopeId) return res.status(400).json({ message: "Invalid scope ID" });
    const parsed = z.object({
      decision: z.enum(["approved", "rejected", "returned"]),
      notes: z.string().trim().min(3).max(5000),
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "A decision and review notes are required." });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [scope] = await db.select().from(vendorApprovalScopes).where(eq(vendorApprovalScopes.id, scopeId)).limit(1);
      if (!scope) return res.status(404).json({ message: "Vendor scope not found" });
      if (scope.qualityRequired && !qualityRoles.includes(staff.role || "")) {
        return res.status(403).json({ message: "Only Quality can approve technical supplier scopes." });
      }
      if (!scope.qualityRequired && ![...qualityRoles, ...adminRoles].includes(staff.role || "")) {
        return res.status(403).json({ message: "Only Quality or an authorized admin can review this scope." });
      }
      if (parsed.data.decision === "approved") {
        const [vendor] = await db.select().from(qualityVendors).where(eq(qualityVendors.id, scope.vendorId)).limit(1);
        if (!vendor || vendor.vendorStatus !== "active" || !vendor.submittedAt) {
          return res.status(400).json({ message: "Submit the active vendor registration before approving its scope." });
        }
        if (scope.validUntil && scope.validUntil.getTime() < Date.now()) {
          return res.status(400).json({ message: "The certificate for this scope has expired." });
        }
        if (scope.organicRequirement === "organic") {
          if (!scope.validUntil || !scope.certificationScheme) {
            return res.status(400).json({ message: "An active certification scheme and expiry date are required." });
          }
          const [evidence] = await db.select({ id: vendorDocuments.id }).from(vendorDocuments)
            .where(and(
              eq(vendorDocuments.vendorId, scope.vendorId),
              eq(vendorDocuments.approvalScopeId, scopeId),
              eq(vendorDocuments.documentType, "certification"),
            )).limit(1);
          if (!evidence) return res.status(400).json({ message: "Upload the supporting certificate before approving this organic scope." });
        }
      }
      const [updated] = await db.transaction(async (tx) => {
        const rows = await tx.update(vendorApprovalScopes).set({
          approvalStatus: parsed.data.decision,
          reviewedById: staff.id,
          reviewedAt: new Date(),
          reviewNotes: parsed.data.notes,
          updatedAt: new Date(),
        }).where(eq(vendorApprovalScopes.id, scopeId)).returning();
        await refreshVendorApprovalStatus(tx, scope.vendorId);
        await audit(tx, "vendor_scope", scopeId, `quality_review_${parsed.data.decision}`, staff.id, { notes: parsed.data.notes });
        return rows;
      });
      res.json(updated);
    } catch (error) {
      console.error("Vendor scope review failed:", error);
      res.status(500).json({ message: "Failed to review vendor scope" });
    }
  });

  app.get("/api/purchase/vendors/:id/financial", isAuthenticated, rolesOnly(bankViewRoles), async (req: any, res) => {
    const vendorId = parseId(req.params.id);
    if (!vendorId) return res.status(400).json({ message: "Invalid vendor ID" });
    try {
      const [profile] = await db.select().from(vendorFinancialProfiles)
        .where(eq(vendorFinancialProfiles.vendorId, vendorId)).limit(1);
      res.json(financialResponse(profile));
    } catch (error) {
      console.error("Vendor financial profile lookup failed:", error);
      res.status(500).json({ message: "Failed to load vendor payment details" });
    }
  });

  app.put("/api/purchase/vendors/:id/financial", isAuthenticated, rolesOnly(bankViewRoles), async (req: any, res) => {
    const vendorId = parseId(req.params.id);
    if (!vendorId) return res.status(400).json({ message: "Invalid vendor ID" });
    const parsed = z.object({
      beneficiaryName: z.string().trim().max(255).optional().nullable(),
      bankName: z.string().trim().max(255).optional().nullable(),
      accountNumber: z.string().trim().max(100).optional().nullable(),
      routingCode: z.string().trim().max(100).optional().nullable(),
      swiftCode: z.string().trim().max(30).optional().nullable(),
      currency: z.string().trim().length(3).optional().nullable(),
      paymentTerms: z.string().trim().max(5000).optional().nullable(),
    }).strict().refine((data) => Object.keys(data).length > 0, "Provide at least one field");
    const body = parsed.safeParse(req.body);
    if (!body.success) return res.status(400).json({ message: "Enter valid vendor payment details", errors: body.error.flatten() });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [vendor] = await db.select({ id: qualityVendors.id }).from(qualityVendors).where(eq(qualityVendors.id, vendorId)).limit(1);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      const [profile] = await db.insert(vendorFinancialProfiles).values({
        vendorId,
        ...body.data,
        updatedById: staff.id,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: vendorFinancialProfiles.vendorId,
        set: { ...body.data, updatedById: staff.id, updatedAt: new Date() },
      }).returning();
      await audit(db, "vendor_financial_profile", vendorId, "financial_profile_updated", staff.id, { fields: Object.keys(body.data) });
      res.json(financialResponse(profile));
    } catch (error) {
      console.error("Vendor financial profile update failed:", error);
      res.status(500).json({ message: "Failed to save vendor payment details" });
    }
  });

  app.post("/api/purchase/vendors/:id/documents", isAuthenticated, rolesOnly(purchaseEditRoles), documentUpload.single("file"), async (req: any, res) => {
    const vendorId = parseId(req.params.id);
    if (!vendorId) return res.status(400).json({ message: "Invalid vendor ID" });
    const file = req.file as Express.Multer.File | undefined;
    if (!validDocumentFile(file)) return res.status(400).json({ message: "Upload a valid PDF, JPG, PNG, or WebP document (maximum 10 MB)." });
    const parsed = z.object({
      documentType: z.enum(["registration", "tax_registration", "certification", "quality_certificate", "audit_report", "other"]),
      approvalScopeId: z.coerce.number().int().positive().optional(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Select a valid document type and scope." });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [vendor] = await db.select({ id: qualityVendors.id }).from(qualityVendors).where(eq(qualityVendors.id, vendorId)).limit(1);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      if (parsed.data.approvalScopeId) {
        const [scope] = await db.select({ id: vendorApprovalScopes.id, vendorId: vendorApprovalScopes.vendorId })
          .from(vendorApprovalScopes).where(eq(vendorApprovalScopes.id, parsed.data.approvalScopeId)).limit(1);
        if (!scope || scope.vendorId !== vendorId) return res.status(400).json({ message: "Selected scope does not belong to this vendor." });
      }
      const saved = await db.transaction(async (tx) => {
        const [document] = await tx.insert(vendorDocuments).values({
          vendorId,
          approvalScopeId: parsed.data.approvalScopeId || null,
          documentType: parsed.data.documentType,
          fileName: safeFileName(file!.originalname),
          mimeType: file!.mimetype,
          fileSize: file!.size,
          uploadedById: staff.id,
        }).returning();
        await tx.insert(vendorDocumentContents).values({
          documentId: document.id,
          fileBytes: file!.buffer,
        });
        await audit(tx, "vendor_document", document.id, "uploaded", staff.id, { vendorId, documentType: parsed.data.documentType, size: file!.size });
        return document;
      });
      res.status(201).json(saved);
    } catch (error) {
      console.error("Vendor document upload failed:", error);
      res.status(500).json({ message: "Failed to save vendor document" });
    }
  });

  app.get("/api/purchase/documents/:id", isAuthenticated, rolesOnly([...supportViewRoles]), async (req: any, res) => {
    const documentId = parseId(req.params.id);
    if (!documentId) return res.status(400).json({ message: "Invalid document ID" });
    try {
      const [row] = await db.select({
        document: vendorDocuments,
        bytes: vendorDocumentContents.fileBytes,
      }).from(vendorDocuments)
        .innerJoin(vendorDocumentContents, eq(vendorDocuments.id, vendorDocumentContents.documentId))
        .where(eq(vendorDocuments.id, documentId)).limit(1);
      if (!row) return res.status(404).json({ message: "Document not found" });
      res.setHeader("Content-Type", row.document.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${safeFileName(row.document.fileName)}"`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(row.bytes);
    } catch (error) {
      console.error("Purchase document download failed:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  app.get("/api/purchase/fulfillment", isAuthenticated, rolesOnly(supportViewRoles), async (_req: any, res) => {
    try {
      const rows = await getPurchaseSafeFulfillmentRows();
      res.json(rows);
    } catch (error) {
      console.error("Purchase fulfillment list failed:", error);
      res.status(500).json({ message: "Failed to load fulfillment requirements" });
    }
  });

  app.post("/api/purchase/fulfillment/sync-confirmed", isAuthenticated, rolesOnly([...adminRoles, "purchase_manager"]), async (_req: any, res) => {
    try {
      res.json(await syncAllConfirmedSalesOrders());
    } catch (error) {
      console.error("Confirmed Sales Order synchronization failed:", error);
      res.status(500).json({ message: "Failed to synchronize confirmed Sales Orders" });
    }
  });

  app.get("/api/purchase/fulfillment/:id/stock", isAuthenticated, rolesOnly(supportViewRoles), async (req: any, res) => {
    const requirementId = parseId(req.params.id);
    if (!requirementId) return res.status(400).json({ message: "Invalid fulfillment requirement ID" });
    try {
      const result = await getLiveStockAnalysis(requirementId);
      res.json({
        requirementId: result.requirement.id,
        productId: result.requirement.productId,
        productName: result.requirement.productName,
        requiredQuantity: result.requirement.requiredQuantity,
        unit: result.requirement.unit,
        stockAnalysis: result.analysis,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Fulfillment requirement not found") return res.status(404).json({ message: error.message });
      console.error("Stock analysis failed:", error);
      res.status(500).json({ message: "Failed to analyze available stock" });
    }
  });

  app.post("/api/purchase/fulfillment/:id/requisition", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const requirementId = parseId(req.params.id);
    if (!requirementId) return res.status(400).json({ message: "Invalid fulfillment requirement ID" });
    try {
      const requisition = await createRequisitionForShortage(requirementId, (req.purchaseStaff as StaffUser).id);
      res.status(201).json(requisition);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create requisition";
      if (/already exists|already covers|verified|Released raw materials|No verified/i.test(message)) {
        return res.status(409).json({ message });
      }
      if (message === "Fulfillment requirement not found") return res.status(404).json({ message });
      console.error("Requisition from fulfillment failed:", error);
      res.status(500).json({ message: "Failed to create material requisition" });
    }
  });

  app.post("/api/purchase/fulfillment/:id/reservations", isAuthenticated, rolesOnly([...adminRoles, ...inventoryRoles]), async (req: any, res) => {
    const requirementId = parseId(req.params.id);
    const parsed = z.object({
      qualityBatchId: z.number().int().positive(),
      quantity: z.number().positive().finite(),
      unit: z.string().trim().min(1).max(50),
    }).strict().safeParse(req.body);
    if (!requirementId || !parsed.success) return res.status(400).json({ message: "Enter a valid batch, quantity, and unit." });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const result = await db.transaction(async (tx) => {
        const [requirement] = await tx.select().from(salesOrderFulfillmentRequirements)
          .where(eq(salesOrderFulfillmentRequirements.id, requirementId)).for("update").limit(1);
        const [batch] = await tx.select().from(qualityBatchNumbers)
          .where(eq(qualityBatchNumbers.id, parsed.data.qualityBatchId)).for("update").limit(1);
        if (!requirement || !batch) throw new Error("Requirement or batch not found");
        if (
          batch.productId !== requirement.productId ||
          batch.batchType !== "finished_good" ||
          batch.status !== "approved" ||
          normalizeUnit(batch.unitOfMeasure || batch.unit) !== normalizeUnit(parsed.data.unit) ||
          normalizeUnit(parsed.data.unit) !== normalizeUnit(requirement.unit) ||
          (batch.expiryDate && batch.expiryDate.getTime() < Date.now())
        ) throw new Error("This batch is not eligible for the fulfillment requirement.");
        const [product] = requirement.productId ? await tx.select({
          id: products.id, productType: products.productType, isOrganic: products.isOrganic,
        }).from(products).where(eq(products.id, requirement.productId)).limit(1) : [];
        if (!product || productOrganicCategory(product.productType, product.isOrganic) !== productOrganicCategory(batch.organicType, false)) {
          throw new Error("The batch organic/conventional classification does not match the product.");
        }
        const active = await tx.select({
          quantity: inventoryReservations.quantity,
          unit: inventoryReservations.unit,
        }).from(inventoryReservations).where(and(
          eq(inventoryReservations.qualityBatchId, batch.id),
          eq(inventoryReservations.status, "active"),
        ));
        const reserved = active.filter((item) => normalizeUnit(item.unit) === normalizeUnit(parsed.data.unit))
          .reduce((sum, item) => sum + numeric(item.quantity), 0);
        const physical = batch.remainingQuantity !== null
          ? numeric(batch.remainingQuantity)
          : Math.max(0, numeric(batch.approvedQuantity) - numeric(batch.usedQuantity));
        const requested = parsed.data.quantity;
        if (requested > physical - reserved) throw new Error("The requested quantity exceeds unreserved released batch stock.");
        const [reservation] = await tx.insert(inventoryReservations).values({
          fulfillmentRequirementId: requirementId,
          qualityBatchId: batch.id,
          quantity: String(requested),
          unit: parsed.data.unit,
          status: "active",
          createdById: staff.id,
        }).returning();
        await audit(tx, "inventory_reservation", reservation.id, "created", staff.id, { requirementId, qualityBatchId: batch.id, quantity: requested, unit: parsed.data.unit });
        return reservation;
      });
      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/not found/i.test(message)) return res.status(404).json({ message });
      if (/not eligible|classification|exceeds/i.test(message)) return res.status(409).json({ message });
      console.error("Stock reservation failed:", error);
      res.status(500).json({ message: "Failed to reserve stock" });
    }
  });

  app.post("/api/purchase/reservations/:id/release", isAuthenticated, rolesOnly([...adminRoles, ...inventoryRoles]), async (req: any, res) => {
    const reservationId = parseId(req.params.id);
    const parsed = z.object({ reason: z.string().trim().min(3).max(1000) }).strict().safeParse(req.body);
    if (!reservationId || !parsed.success) return res.status(400).json({ message: "A release reason is required." });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [updated] = await db.transaction(async (tx) => {
        const rows = await tx.update(inventoryReservations).set({
          status: "released",
          releasedById: staff.id,
          releasedAt: new Date(),
        }).where(and(eq(inventoryReservations.id, reservationId), eq(inventoryReservations.status, "active"))).returning();
        if (!rows[0]) throw new Error("Active reservation not found");
        await audit(tx, "inventory_reservation", reservationId, "released", staff.id, { reason: parsed.data.reason });
        return rows;
      });
      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === "Active reservation not found") return res.status(404).json({ message: error.message });
      console.error("Stock reservation release failed:", error);
      res.status(500).json({ message: "Failed to release reservation" });
    }
  });

  app.get("/api/purchase/requisitions", isAuthenticated, rolesOnly(supportViewRoles), async (_req: any, res) => {
    try {
      const rows = await db.select({
        requisition: materialRequisitions,
        soNumber: salesOrders.soNumber,
      }).from(materialRequisitions)
        .leftJoin(salesOrderFulfillmentRequirements, eq(materialRequisitions.fulfillmentRequirementId, salesOrderFulfillmentRequirements.id))
        .leftJoin(salesOrders, eq(salesOrderFulfillmentRequirements.salesOrderId, salesOrders.id))
        .orderBy(desc(materialRequisitions.createdAt));
      res.json(rows.map(({ requisition, soNumber }) => ({ ...requisition, soNumber: soNumber || null })));
    } catch (error) {
      console.error("Requisition list failed:", error);
      res.status(500).json({ message: "Failed to load requisitions" });
    }
  });

  app.post("/api/purchase/requisitions", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const parsed = z.object({
      productId: z.number().int().positive(),
      quantity: z.number().positive().finite(),
      unit: z.string().trim().min(1).max(50),
      requiredBy: z.string().datetime().nullable().optional(),
      reason: z.string().trim().min(5).max(5000),
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter valid requisition details", errors: parsed.error.flatten() });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [product] = await db.select({ id: products.id, name: products.name, description: products.description })
        .from(products).where(eq(products.id, parsed.data.productId)).limit(1);
      if (!product) return res.status(400).json({ message: "Selected product does not exist." });
      const [requisition] = await db.transaction(async (tx) => {
        const rows = await tx.insert(materialRequisitions).values({
          requisitionNumber: `MR-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
          productId: product.id,
          productName: product.name,
          specification: product.description,
          quantity: String(parsed.data.quantity),
          unit: parsed.data.unit,
          requiredBy: parsed.data.requiredBy ? new Date(parsed.data.requiredBy) : null,
          reason: parsed.data.reason,
          status: "draft",
          requestedById: staff.id,
        }).returning();
        await audit(tx, "material_requisition", rows[0].id, "created", staff.id, { productId: product.id, quantity: parsed.data.quantity, unit: parsed.data.unit });
        return rows;
      });
      res.status(201).json(requisition);
    } catch (error) {
      console.error("Manual requisition creation failed:", error);
      res.status(500).json({ message: "Failed to create requisition" });
    }
  });

  app.post("/api/purchase/requisitions/:id/submit", isAuthenticated, rolesOnly([...adminRoles, ...purchaseRoles]), async (req: any, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid requisition ID" });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [current] = await db.select().from(materialRequisitions).where(eq(materialRequisitions.id, id)).limit(1);
      if (!current) return res.status(404).json({ message: "Requisition not found" });
      if (!["draft", "returned"].includes(current.status)) return res.status(409).json({ message: "Only a draft or returned requisition can be submitted." });
      if (!adminRoles.includes(staff.role || "") && !["purchase_manager", "purchase_executive"].includes(staff.role || "")) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const [updated] = await db.update(materialRequisitions).set({
        status: "pending_approval",
        submittedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(materialRequisitions.id, id)).returning();
      await audit(db, "material_requisition", id, "submitted_for_approval", staff.id);
      res.json(updated);
    } catch (error) {
      console.error("Requisition submission failed:", error);
      res.status(500).json({ message: "Failed to submit requisition" });
    }
  });

  app.post("/api/purchase/requisitions/:id/review", isAuthenticated, rolesOnly([...adminRoles, "purchase_manager"]), async (req: any, res) => {
    const id = parseId(req.params.id);
    const parsed = z.object({
      decision: z.enum(["approved", "rejected", "returned"]),
      notes: z.string().trim().min(3).max(5000),
    }).strict().safeParse(req.body);
    if (!id || !parsed.success) return res.status(400).json({ message: "A decision and review notes are required." });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [updated] = await db.transaction(async (tx) => {
        const [current] = await tx.select().from(materialRequisitions)
          .where(eq(materialRequisitions.id, id)).for("update").limit(1);
        if (!current) throw new Error("Requisition not found");
        if (current.status !== "pending_approval") throw new Error("Only submitted requisitions can be reviewed.");
        const rows = await tx.update(materialRequisitions).set({
          status: parsed.data.decision === "returned" ? "returned" : parsed.data.decision,
          approvedById: staff.id,
          approvalNotes: parsed.data.notes,
          approvedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(materialRequisitions.id, id)).returning();
        await audit(tx, "material_requisition", id, `review_${parsed.data.decision}`, staff.id, { notes: parsed.data.notes });
        return rows;
      });
      res.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "Requisition not found") return res.status(404).json({ message });
      if (message.includes("Only submitted")) return res.status(409).json({ message });
      console.error("Requisition review failed:", error);
      res.status(500).json({ message: "Failed to review requisition" });
    }
  });

  app.get("/api/purchase/requisitions/:id/offers", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid requisition ID" });
    try {
      const offers = await db.select({
        offer: vendorOffers,
        vendorName: qualityVendors.vendorName,
        vendorCode: qualityVendors.vendorCode,
        vendorApprovalStatus: qualityVendors.approvalStatus,
        vendorStatus: qualityVendors.vendorStatus,
      }).from(vendorOffers)
        .innerJoin(qualityVendors, eq(vendorOffers.vendorId, qualityVendors.id))
        .where(eq(vendorOffers.materialRequisitionId, id))
        .orderBy(desc(vendorOffers.createdAt));
      res.json(offers);
    } catch (error) {
      console.error("Vendor offer list failed:", error);
      res.status(500).json({ message: "Failed to load vendor offers" });
    }
  });

  app.post("/api/purchase/requisitions/:id/offers", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const requisitionId = parseId(req.params.id);
    const parsed = z.object({
      vendorId: z.number().int().positive(),
      vendorScopeId: z.number().int().positive(),
      quantity: z.number().positive().finite(),
      unit: z.string().trim().min(1).max(50),
      unitPrice: z.number().positive().finite(),
      currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
      leadTimeDays: z.number().int().min(0).max(3650).nullable().optional(),
      paymentTerms: z.string().trim().max(5000).optional().default(""),
      deliveryTerms: z.string().trim().max(5000).optional().default(""),
      validUntil: z.string().datetime().nullable().optional(),
      notes: z.string().trim().max(5000).optional().default(""),
    }).strict().safeParse(req.body);
    if (!requisitionId || !parsed.success) return res.status(400).json({ message: "Enter valid supplier offer details.", errors: parsed.success ? undefined : parsed.error.flatten() });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [requisition] = await db.select().from(materialRequisitions).where(eq(materialRequisitions.id, requisitionId)).limit(1);
      if (!requisition || requisition.status !== "approved") return res.status(409).json({ message: "Supplier offers can only be recorded against an approved requisition." });
      if (parsed.data.quantity > numeric(requisition.quantity)) return res.status(400).json({ message: "Offer quantity cannot exceed the requisition quantity." });
      if (normalizeUnit(parsed.data.unit) !== normalizeUnit(requisition.unit)) return res.status(400).json({ message: "Offer unit must match the requisition unit." });
      if (!requisition.productId) return res.status(400).json({ message: "A product must be linked before supplier offers can be compared." });
      const scope = await isApprovedProductScope(parsed.data.vendorId, requisition.productId);
      if (!scope || scope.id !== parsed.data.vendorScopeId) {
        return res.status(409).json({ message: "This vendor is not currently approved for the exact product and organic/conventional scope." });
      }
      if (parsed.data.validUntil && new Date(parsed.data.validUntil).getTime() < Date.now()) {
        return res.status(400).json({ message: "The supplier quote has already expired." });
      }
      const [offer] = await db.transaction(async (tx) => {
        const rows = await tx.insert(vendorOffers).values({
          vendorId: parsed.data.vendorId,
          vendorScopeId: parsed.data.vendorScopeId,
          materialRequisitionId: requisitionId,
          quantity: String(parsed.data.quantity),
          unit: parsed.data.unit,
          unitPrice: String(parsed.data.unitPrice),
          currency: parsed.data.currency,
          leadTimeDays: parsed.data.leadTimeDays ?? null,
          paymentTerms: parsed.data.paymentTerms || null,
          deliveryTerms: parsed.data.deliveryTerms || null,
          validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
          notes: parsed.data.notes || null,
          recordedById: staff.id,
        }).returning();
        await audit(tx, "vendor_offer", rows[0].id, "recorded", staff.id, { requisitionId, vendorId: parsed.data.vendorId, quantity: parsed.data.quantity, currency: parsed.data.currency });
        return rows;
      });
      res.status(201).json(offer);
    } catch (error) {
      console.error("Supplier offer creation failed:", error);
      res.status(500).json({ message: "Failed to record supplier offer" });
    }
  });

  app.get("/api/purchase-orders", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    try {
      const status = typeof req.query.status === "string" && req.query.status !== "all" ? req.query.status : null;
      const base = db.select({
        order: purchaseOrders,
        vendorName: qualityVendors.vendorName,
        vendorCode: qualityVendors.vendorCode,
      }).from(purchaseOrders)
        .leftJoin(qualityVendors, eq(purchaseOrders.vendorRecordId, qualityVendors.id));
      const rows = status
        ? await base.where(eq(purchaseOrders.status, status)).orderBy(desc(purchaseOrders.createdAt))
        : await base.orderBy(desc(purchaseOrders.createdAt));
      const ids = rows.map((row) => row.order.id);
      const items = ids.length ? await db.select().from(purchaseOrderItems).where(inArray(purchaseOrderItems.purchaseOrderId, ids)) : [];
      res.json({ orders: rows.map(({ order, vendorName, vendorCode }) => ({
        ...order,
        vendorName: vendorName || "Vendor not linked",
        vendorCode: vendorCode || null,
        items: items.filter((item) => item.purchaseOrderId === order.id),
      })), total: rows.length });
    } catch (error) {
      console.error("Purchase order list failed:", error);
      res.status(500).json({ message: "Failed to load purchase orders" });
    }
  });

  app.post("/api/purchase-orders", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const parsed = z.object({
      vendorOfferId: z.number().int().positive(),
      quantity: z.number().positive().finite(),
      expectedDelivery: z.string().datetime().nullable().optional(),
      terms: z.string().trim().max(5000).optional().default(""),
      notes: z.string().trim().max(5000).optional().default(""),
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter valid draft purchase order details.", errors: parsed.error.flatten() });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const created = await db.transaction(async (tx) => {
        const [offer] = await tx.select().from(vendorOffers)
          .where(eq(vendorOffers.id, parsed.data.vendorOfferId)).for("update").limit(1);
        if (!offer || offer.status !== "received") throw new Error("A new PO requires a supplier offer that has not already been selected.");
        const [requisition] = await tx.select().from(materialRequisitions)
          .where(eq(materialRequisitions.id, offer.materialRequisitionId)).for("update").limit(1);
        if (!requisition || requisition.status !== "approved") throw new Error("The linked requisition must be approved before a PO can be drafted.");
        if (parsed.data.quantity > numeric(offer.quantity)) throw new Error("PO quantity exceeds the supplier's quoted quantity.");
        if (normalizeUnit(offer.unit) !== normalizeUnit(requisition.unit)) throw new Error("Supplier offer units no longer match the requisition.");

        const [vendor] = await tx.select().from(qualityVendors).where(eq(qualityVendors.id, offer.vendorId)).limit(1);
        const [scope] = await tx.select().from(vendorApprovalScopes).where(eq(vendorApprovalScopes.id, offer.vendorScopeId)).limit(1);
        const [product] = requisition.productId ? await tx.select({
          id: products.id, productType: products.productType, isOrganic: products.isOrganic,
        }).from(products).where(eq(products.id, requisition.productId)).limit(1) : [];
        if (
          !vendor || vendor.vendorStatus !== "active" || vendor.approvalStatus !== "approved" ||
          vendor.generalApprovalStatus !== "approved" || !scope || !product ||
          !isScopeEligibleForProduct(scope, product) ||
          !isCurrentApprovedScope(scope) ||
          (offer.validUntil && offer.validUntil.getTime() < Date.now())
        ) throw new Error("Vendor registration, exact product scope, or supplier quote is no longer eligible.");

        const existingItems = await tx.select({
          quantity: purchaseOrderItems.quantity,
          status: purchaseOrders.status,
        }).from(purchaseOrderItems).innerJoin(purchaseOrders, eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id))
          .where(eq(purchaseOrderItems.materialRequisitionId, requisition.id));
        const alreadyAllocated = existingItems
          .filter((item) => item.status !== "cancelled")
          .reduce((sum, item) => sum + numeric(item.quantity), 0);
        const outstanding = Math.max(0, numeric(requisition.quantity) - alreadyAllocated);
        if (parsed.data.quantity > outstanding) throw new Error("This draft would exceed the approved requisition's remaining quantity.");

        const amount = parsed.data.quantity * numeric(offer.unitPrice);
        const [order] = await tx.insert(purchaseOrders).values({
          poId: `DPO-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
          vendorRecordId: vendor.id,
          orderDate: new Date(),
          expectedDelivery: parsed.data.expectedDelivery ? new Date(parsed.data.expectedDelivery) : null,
          totalAmount: amount.toFixed(2),
          currency: offer.currency,
          status: "draft",
          paymentStatus: "pending",
          terms: parsed.data.terms || null,
          notes: parsed.data.notes || null,
          createdBy: staff.id,
          updatedBy: staff.id,
        }).returning();
        await tx.insert(purchaseOrderItems).values({
          purchaseOrderId: order.id,
          materialRequisitionId: requisition.id,
          vendorOfferId: offer.id,
          productId: requisition.productId,
          description: requisition.productName,
          specification: requisition.specification,
          quantity: String(parsed.data.quantity),
          unit: requisition.unit,
          unitPrice: offer.unitPrice,
          lineTotal: amount.toFixed(2),
        });
        await tx.update(vendorOffers).set({ status: "selected", updatedAt: new Date() }).where(eq(vendorOffers.id, offer.id));
        await audit(tx, "purchase_order", order.id, "draft_created", staff.id, { requisitionId: requisition.id, vendorId: vendor.id, amount, currency: offer.currency });
        return order;
      });
      res.status(201).json({
        ...created,
        approvalNotice: "Saved as a draft. No purchase-order approval matrix is configured, so this order has not been approved or issued.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/requires|must be approved|exceeds|no longer eligible|would exceed|units/i.test(message)) {
        return res.status(409).json({ message });
      }
      console.error("Draft purchase order creation failed:", error);
      res.status(500).json({ message: "Failed to create draft purchase order" });
    }
  });

  app.get("/api/purchase-orders/:id", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid purchase order ID" });
    try {
      const [row] = await db.select({
        order: purchaseOrders,
        vendorName: qualityVendors.vendorName,
        vendorCode: qualityVendors.vendorCode,
      }).from(purchaseOrders)
        .leftJoin(qualityVendors, eq(purchaseOrders.vendorRecordId, qualityVendors.id))
        .where(eq(purchaseOrders.id, id)).limit(1);
      if (!row) return res.status(404).json({ message: "Purchase order not found" });
      const [items, documents] = await Promise.all([
        db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id)),
        db.select({
          id: vendorDocuments.id,
          documentType: vendorDocuments.documentType,
          fileName: vendorDocuments.fileName,
          fileSize: vendorDocuments.fileSize,
          createdAt: vendorDocuments.createdAt,
        }).from(vendorDocuments).where(eq(vendorDocuments.purchaseOrderId, id)),
      ]);
      res.json({ ...row.order, vendorName: row.vendorName, vendorCode: row.vendorCode, items, documents });
    } catch (error) {
      console.error("Purchase order details failed:", error);
      res.status(500).json({ message: "Failed to load purchase order" });
    }
  });

  app.patch("/api/purchase-orders/:id", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid purchase order ID" });
    const parsed = z.object({
      expectedDelivery: z.string().datetime().nullable().optional(),
      terms: z.string().trim().max(5000).nullable().optional(),
      notes: z.string().trim().max(5000).nullable().optional(),
    }).strict().refine((data) => Object.keys(data).length > 0, "Provide editable draft fields");
    const body = parsed.safeParse(req.body);
    if (!body.success) return res.status(400).json({ message: "Enter valid draft changes", errors: body.error.flatten() });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [current] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
      if (!current) return res.status(404).json({ message: "Purchase order not found" });
      if (current.status !== "draft") return res.status(409).json({ message: "Only draft purchase orders can be edited." });
      const update: Record<string, unknown> = { ...body.data, updatedBy: staff.id, updatedAt: new Date() };
      if (body.data.expectedDelivery !== undefined) update.expectedDelivery = body.data.expectedDelivery ? new Date(body.data.expectedDelivery) : null;
      const [saved] = await db.update(purchaseOrders).set(update as any).where(eq(purchaseOrders.id, id)).returning();
      await audit(db, "purchase_order", id, "draft_updated", staff.id, { fields: Object.keys(body.data) });
      res.json(saved);
    } catch (error) {
      console.error("Purchase order edit failed:", error);
      res.status(500).json({ message: "Failed to update draft purchase order" });
    }
  });

  app.post("/api/purchase-orders/:id/cancel", isAuthenticated, rolesOnly(purchaseEditRoles), async (req: any, res) => {
    const id = parseId(req.params.id);
    const parsed = z.object({ reason: z.string().trim().min(3).max(1000) }).strict().safeParse(req.body);
    if (!id || !parsed.success) return res.status(400).json({ message: "A cancellation reason is required." });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
      if (!order) return res.status(404).json({ message: "Purchase order not found" });
      if (order.status !== "draft") return res.status(409).json({ message: "Only draft POs can be cancelled; issued orders require a receipt/finance workflow." });
      const [updated] = await db.transaction(async (tx) => {
        const rows = await tx.update(purchaseOrders).set({
          status: "cancelled",
          updatedBy: staff.id,
          updatedAt: new Date(),
        }).where(eq(purchaseOrders.id, id)).returning();
        const orderItems = await tx.select({ vendorOfferId: purchaseOrderItems.vendorOfferId })
          .from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
        for (const item of orderItems) {
          if (item.vendorOfferId) {
            await tx.update(vendorOffers).set({ status: "received", updatedAt: new Date() })
              .where(and(eq(vendorOffers.id, item.vendorOfferId), eq(vendorOffers.status, "selected")));
          }
        }
        await audit(tx, "purchase_order", id, "draft_cancelled", staff.id, { reason: parsed.data.reason });
        return rows;
      });
      res.json(updated);
    } catch (error) {
      console.error("Purchase order cancellation failed:", error);
      res.status(500).json({ message: "Failed to cancel draft purchase order" });
    }
  });

  app.post("/api/purchase-orders/:id/documents", isAuthenticated, rolesOnly(purchaseEditRoles), documentUpload.single("file"), async (req: any, res) => {
    const orderId = parseId(req.params.id);
    const file = req.file as Express.Multer.File | undefined;
    if (!orderId) return res.status(400).json({ message: "Invalid purchase order ID" });
    if (!validDocumentFile(file)) return res.status(400).json({ message: "Upload a valid PDF, JPG, PNG, or WebP document (maximum 10 MB)." });
    const staff = req.purchaseStaff as StaffUser;
    try {
      const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, orderId)).limit(1);
      if (!order) return res.status(404).json({ message: "Purchase order not found" });
      if (order.status !== "draft") return res.status(409).json({ message: "Supporting documents can only be added to draft orders." });
      if (!order.vendorRecordId) return res.status(409).json({ message: "Link an approved vendor record before adding supplier documents." });
      const document = await db.transaction(async (tx) => {
        const [row] = await tx.insert(vendorDocuments).values({
          vendorId: order.vendorRecordId!,
          purchaseOrderId: orderId,
          documentType: "purchase_order_support",
          fileName: safeFileName(file!.originalname),
          mimeType: file!.mimetype,
          fileSize: file!.size,
          uploadedById: staff.id,
        }).returning();
        await tx.insert(vendorDocumentContents).values({ documentId: row.id, fileBytes: file!.buffer });
        await audit(tx, "purchase_order_document", row.id, "uploaded", staff.id, { purchaseOrderId: orderId, size: file!.size });
        return row;
      });
      res.status(201).json(document);
    } catch (error) {
      console.error("Purchase order document upload failed:", error);
      res.status(500).json({ message: "Failed to upload purchase-order document" });
    }
  });

  app.get("/api/purchase/audit/:entityType/:entityId", isAuthenticated, rolesOnly([...adminRoles, ...purchaseRoles, ...qualityRoles]), async (req: any, res) => {
    const entityId = parseId(req.params.entityId);
    const entityType = String(req.params.entityType || "");
    if (!entityId || !["vendor", "vendor_scope", "vendor_document", "vendor_offer", "material_requisition", "purchase_order", "purchase_order_document", "inventory_reservation"].includes(entityType)) {
      return res.status(400).json({ message: "Invalid audit target" });
    }
    try {
      const events = await db.select().from(procurementAuditEvents)
        .where(and(eq(procurementAuditEvents.entityType, entityType), eq(procurementAuditEvents.entityId, entityId)))
        .orderBy(desc(procurementAuditEvents.createdAt));
      res.json(events);
    } catch (error) {
      console.error("Purchase audit query failed:", error);
      res.status(500).json({ message: "Failed to load audit history" });
    }
  });

  // Accounts can see only order totals and status; customer identity and delivery addresses stay in Sales.
  app.get("/api/accounts/sales-order-financial-summary", isAuthenticated, rolesOnly([...adminRoles, "accounts_manager", "accounts_executive"]), async (req: any, res) => {
    try {
      const rows = await db.select({
        id: salesOrders.id,
        soNumber: salesOrders.soNumber,
        orderDate: salesOrders.orderDate,
        expectedDeliveryDate: salesOrders.expectedDeliveryDate,
        totalAmount: salesOrders.totalAmount,
        currency: salesOrders.currency,
        status: salesOrders.status,
        paymentStatus: salesOrders.paymentStatus,
      }).from(salesOrders).orderBy(desc(salesOrders.orderDate));
      res.json(rows);
    } catch (error) {
      console.error("Accounts order summary failed:", error);
      res.status(500).json({ message: "Failed to load order financial summary" });
    }
  });
}
