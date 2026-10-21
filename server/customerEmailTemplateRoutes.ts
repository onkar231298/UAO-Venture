import type { Express } from "express";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { transactionalEmailTemplates } from "@shared/schema";
import {
  ensureCustomerEmailTemplateDefaults,
  renderCustomerEmailTemplatePreview,
  type TemplateContent,
} from "./customerTransactionalEmail";

async function requireSuperAdmin(req: any, res: any, next: any) {
  try {
    const userId = req.user?.claims?.sub;
    const user = userId ? await storage.getUser(userId) : undefined;
    if (user?.role !== "super_admin") {
      return res.status(403).json({ message: "Only a super admin can manage customer email templates" });
    }
    next();
  } catch (error) {
    console.error("Customer email template authorization failed:", error);
    return res.status(500).json({ message: "Could not verify template-management access" });
  }
}

const previewValues = z.object({
  subject: z.string().min(1).max(500),
  htmlContent: z.string().max(200_000),
  textContent: z.string().max(50_000),
  variables: z.array(z.string()).max(40),
}).strict();

export async function registerCustomerEmailTemplateRoutes(app: Express): Promise<void> {
  await ensureCustomerEmailTemplateDefaults();

  app.get(
    "/api/admin/customer-email-templates",
    isAuthenticated,
    requireSuperAdmin,
    async (_req: any, res: any) => {
      try {
        const templates = await db.select()
          .from(transactionalEmailTemplates)
          .orderBy(asc(transactionalEmailTemplates.category), asc(transactionalEmailTemplates.name));
        return res.json({ templates });
      } catch (error) {
        console.error("Failed to list customer email templates:", error);
        return res.status(500).json({ message: "Could not load customer email templates" });
      }
    },
  );

  app.post(
    "/api/admin/customer-email-templates/:templateKey/preview",
    isAuthenticated,
    requireSuperAdmin,
    async (req: any, res: any) => {
      const validation = previewValues.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid preview content", errors: validation.error.flatten() });
      }
      try {
        const rendered = renderCustomerEmailTemplatePreview(validation.data as TemplateContent);
        return res.json(rendered);
      } catch (error) {
        console.error("Failed to preview customer email template:", error);
        return res.status(500).json({ message: "Could not preview this template" });
      }
    },
  );

  app.patch(
    "/api/admin/customer-email-templates/:templateKey",
    isAuthenticated,
    requireSuperAdmin,
    async (req: any, res: any) => {
      const updateSchema = z.object({
        name: z.string().trim().min(1).max(255).optional(),
        subject: z.string().min(1).max(500).optional(),
        htmlContent: z.string().min(1).max(200_000).optional(),
        textContent: z.string().max(50_000).optional(),
        description: z.string().max(2000).nullable().optional(),
        status: z.enum(["active", "draft"]).optional(),
      }).strict();
      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid template changes", errors: validation.error.flatten() });
      }
      if (!Object.keys(validation.data).length) {
        return res.status(400).json({ message: "Provide at least one template field to update" });
      }
      try {
        const [updated] = await db.update(transactionalEmailTemplates)
          .set({
            ...validation.data,
            updatedBy: req.user.claims.sub,
            updatedAt: new Date(),
          })
          .where(eq(transactionalEmailTemplates.templateKey, req.params.templateKey))
          .returning();
        if (!updated) return res.status(404).json({ message: "Customer email template not found" });
        return res.json({ template: updated });
      } catch (error) {
        console.error("Failed to update customer email template:", error);
        return res.status(500).json({ message: "Could not update customer email template" });
      }
    },
  );
}
