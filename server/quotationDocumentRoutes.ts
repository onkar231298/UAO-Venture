import type { Express } from "express";
import multer from "multer";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import { isAuthenticated, isCustomerAuthenticated } from "./replitAuth";
import { ObjectStorageService } from "./objectStorage";
import { quotationDocuments } from "@shared/schema";
import { validateQuotationDocument } from "./quotationDocumentValidation";

type ActorMode = "customer" | "staff";

const quoteDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single("file");

function parseUpload(req: any, res: any, next: any) {
  quoteDocumentUpload(req, res, (error: any) => {
    if (error) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({
        message: status === 413
          ? "Files must be 10 MB or smaller"
          : "Could not read the uploaded file",
      });
    }
    next();
  });
}

async function authorizeQuotation(req: any, res: any, quotationId: number, mode: ActorMode) {
  const quotation = await storage.getQuotation(quotationId);
  if (!quotation) {
    res.status(404).json({ message: "Quotation not found" });
    return null;
  }

  const userId = String(mode === "customer"
    ? req.customerUser?.id || req.user?.claims?.sub || ""
    : req.user?.claims?.sub || "");
  if (!userId) {
    res.status(401).json({ message: "Login required" });
    return null;
  }

  if (mode === "customer") {
    const relatedInquiry = quotation.inquiryId
      ? await storage.getInquiry(quotation.inquiryId)
      : undefined;
    const ownerId = quotation.customerId ?? relatedInquiry?.customerId;
    if (ownerId !== userId) {
      res.status(403).json({ message: "You can only access documents for your own quotations" });
      return null;
    }
    return { quotation, userId, uploaderRole: "customer" as const };
  }

  const user = await storage.getUser(userId);
  if (!user) {
    res.status(401).json({ message: "Staff account not found" });
    return null;
  }
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  let isAssignedSalesRep = false;
  if (!isAdmin && user.role?.includes("sales")) {
    if (quotation.inquiryId) {
      const inquiry = await storage.getInquiry(quotation.inquiryId);
      isAssignedSalesRep = inquiry?.assignedTo === userId;
    } else {
      isAssignedSalesRep = quotation.createdBy === userId;
    }
  }
  if (!isAdmin && !isAssignedSalesRep) {
    res.status(403).json({ message: "You can only access documents for quotations assigned to you" });
    return null;
  }
  return { quotation, userId, uploaderRole: "staff" as const };
}

function publicDocumentMetadata(document: typeof quotationDocuments.$inferSelect) {
  return {
    id: document.id,
    documentType: document.documentType,
    fileName: document.fileName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    uploaderRole: document.uploaderRole,
    createdAt: document.createdAt,
  };
}

async function listQuotationDocuments(req: any, res: any, mode: ActorMode) {
  try {
    const quotationId = Number(req.params.id);
    if (!Number.isInteger(quotationId) || quotationId <= 0) {
      return res.status(400).json({ message: "Invalid quotation ID" });
    }
    if (!(await authorizeQuotation(req, res, quotationId, mode))) return;
    const documents = await db.select()
      .from(quotationDocuments)
      .where(eq(quotationDocuments.quotationId, quotationId))
      .orderBy(desc(quotationDocuments.createdAt));
    res.json({ documents: documents.map(publicDocumentMetadata) });
  } catch (error) {
    console.error("Error listing quotation documents:", error);
    res.status(500).json({ message: "Could not load quotation documents" });
  }
}

async function uploadQuotationDocument(req: any, res: any, mode: ActorMode) {
  let objectPath: string | null = null;
  const objectStorageService = new ObjectStorageService();
  try {
    const quotationId = Number(req.params.id);
    if (!Number.isInteger(quotationId) || quotationId <= 0) {
      return res.status(400).json({ message: "Invalid quotation ID" });
    }
    const access = await authorizeQuotation(req, res, quotationId, mode);
    if (!access) return;

    const allowedStatuses = mode === "customer"
      ? ["sent", "accepted"]
      : ["sent", "accepted", "converted"];
    if (!allowedStatuses.includes(access.quotation.status || "")) {
      return res.status(409).json({ message: "Documents can only be added to an active quotation" });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ message: "Choose a signed quotation or PO file" });
    const validatedFile = validateQuotationDocument(file.originalname, file.buffer);
    if (!validatedFile) {
      return res.status(400).json({
        message: "Upload a valid PDF, JPG, JPEG, or PNG file no larger than 10 MB",
      });
    }

    let documentType: string;
    if (mode === "customer") {
      const customerDocumentTypes: Record<string, string> = {
        signed_quotation: "customer_signed_quotation",
        purchase_order: "customer_purchase_order",
      };
      documentType = customerDocumentTypes[String(req.body?.documentType || "")];
      if (!documentType) {
        return res.status(400).json({ message: "Choose signed quotation or purchase order" });
      }
    } else {
      documentType = "sales_signed_po";
    }

    const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file.buffer,
      headers: { "Content-Type": validatedFile.mimeType },
    });
    if (!uploadResponse.ok) {
      return res.status(502).json({ message: "Could not store the document securely. Please retry." });
    }

    objectPath = objectStorageService.normalizeObjectEntityPath(uploadUrl.split("?")[0]);
    if (!objectPath.startsWith("/objects/")) {
      throw new Error("The private upload returned an invalid object path");
    }
    const [document] = await db.insert(quotationDocuments).values({
      quotationId,
      documentType,
      fileName: validatedFile.fileName,
      objectPath,
      mimeType: validatedFile.mimeType,
      fileSize: file.size,
      uploaderRole: access.uploaderRole,
      uploadedBy: access.userId,
    }).returning();

    res.status(201).json({ document: publicDocumentMetadata(document) });
  } catch (error) {
    if (objectPath) {
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
        await objectFile.delete();
      } catch (cleanupError) {
        console.error("Could not clean up an unlinked quotation document:", cleanupError);
      }
    }
    console.error("Error uploading quotation document:", error);
    res.status(500).json({ message: "Could not upload the document" });
  }
}

async function downloadQuotationDocument(req: any, res: any, mode: ActorMode) {
  try {
    const quotationId = Number(req.params.id);
    const documentId = Number(req.params.documentId);
    if (!Number.isInteger(quotationId) || quotationId <= 0 ||
        !Number.isInteger(documentId) || documentId <= 0) {
      return res.status(400).json({ message: "Invalid document request" });
    }
    if (!(await authorizeQuotation(req, res, quotationId, mode))) return;

    const [document] = await db.select()
      .from(quotationDocuments)
      .where(and(
        eq(quotationDocuments.id, documentId),
        eq(quotationDocuments.quotationId, quotationId),
      ))
      .limit(1);
    if (!document) return res.status(404).json({ message: "Document not found" });

    const objectFile = await new ObjectStorageService().getObjectEntityFile(document.objectPath);
    const [metadata] = await objectFile.getMetadata();
    res.set({
      "Content-Type": document.mimeType,
      "Content-Length": metadata.size,
      "Content-Disposition": `attachment; filename="${document.fileName.replace(/["\\\r\n]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const stream = objectFile.createReadStream();
    stream.on("error", (error) => {
      console.error("Error streaming quotation document:", error);
      if (!res.headersSent) res.status(500).json({ message: "Could not download the document" });
      else res.destroy(error);
    });
    stream.pipe(res);
  } catch (error) {
    console.error("Error downloading quotation document:", error);
    res.status(500).json({ message: "Could not download the document" });
  }
}

export function registerQuotationDocumentRoutes(app: Express) {
  app.get("/api/customer/quotations/:id/documents", isCustomerAuthenticated, (req: any, res) =>
    listQuotationDocuments(req, res, "customer"));
  app.post("/api/customer/quotations/:id/documents", isCustomerAuthenticated, parseUpload, (req: any, res) =>
    uploadQuotationDocument(req, res, "customer"));
  app.get("/api/customer/quotations/:id/documents/:documentId/download", isCustomerAuthenticated, (req: any, res) =>
    downloadQuotationDocument(req, res, "customer"));

  app.get("/api/quotations/:id/documents", isAuthenticated, (req: any, res) =>
    listQuotationDocuments(req, res, "staff"));
  app.post("/api/quotations/:id/documents", isAuthenticated, parseUpload, (req: any, res) =>
    uploadQuotationDocument(req, res, "staff"));
  app.get("/api/quotations/:id/documents/:documentId/download", isAuthenticated, (req: any, res) =>
    downloadQuotationDocument(req, res, "staff"));
}
