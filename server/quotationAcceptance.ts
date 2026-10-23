import { z } from "zod";

export const staffQuotationAcceptanceSchema = z.object({
  channel: z.enum(["email", "phone", "whatsapp", "other", "signed_quotation_upload"]),
  acceptedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid acceptance date"),
  documentId: z.number().int().positive().optional(),
  notes: z.string().trim().max(2000).optional().default(""),
}).strict().superRefine((value, context) => {
  if (value.channel === "signed_quotation_upload" && !value.documentId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["documentId"],
      message: "Select the uploaded signed quotation to review",
    });
  }
  if (value.channel !== "signed_quotation_upload" && value.documentId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["documentId"],
      message: "A document can only be used for signed-quotation review",
    });
  }
});

function dateKey(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export function parseAcceptanceDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? date
    : null;
}

export function isQuotationExpired(
  validUntil: Date | string | null | undefined,
  at: Date = new Date(),
): boolean {
  const expiryDate = dateKey(validUntil);
  const comparisonDate = dateKey(at);
  return !!expiryDate && !!comparisonDate && expiryDate < comparisonDate;
}

export function isAcceptanceWithinQuotationValidity(
  acceptedAt: Date,
  validUntil: Date | string | null | undefined,
): boolean {
  const expiryDate = dateKey(validUntil);
  const acceptedDate = dateKey(acceptedAt);
  return !expiryDate || (!!acceptedDate && acceptedDate <= expiryDate);
}

export function canConvertQuotationToSalesOrder(status: string | null | undefined): boolean {
  return status === "accepted";
}
