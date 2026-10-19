import { z } from "zod";
import type { QuotationPdfTemplateSettings } from "@shared/schema";

export const QUOTATION_PDF_TEMPLATE_NAME = "Atlas Ingredients Quotation";

export const DEFAULT_QUOTATION_PDF_TEMPLATE_SETTINGS: QuotationPdfTemplateSettings = {
  documentTitle: "SALES QUOTATION",
  sectionHeading: "Quotation",
  forestColor: "#173f32",
  greenColor: "#2f6b50",
  goldColor: "#c49a55",
};

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex colour");

export const quotationPdfTemplateSettingsSchema = z.object({
  documentTitle: z.string().trim().min(3).max(40),
  sectionHeading: z.string().trim().min(2).max(50),
  forestColor: hexColor,
  greenColor: hexColor,
  goldColor: hexColor,
}).strict();
