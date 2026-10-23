import { z } from "zod";
import { companyLengthErrors } from "@shared/companyValidation";

function validateLengths(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  for (const error of companyLengthErrors(data)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [error.field], message: error.message });
  }
}

const companyFields = z.object({
  companyName: z.string().min(1, "Company name is required"),
  primaryEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  primaryPhone: z.string().optional(),
  gstNumber: z.string().optional(),
  industryType: z.string().optional(),
  companySize: z.string().optional(),
  website: z.string().optional().or(z.literal("")),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressCountry: z.string().optional(),
  addressZip: z.string().optional(),
});

export const companyEditSchema = companyFields.superRefine(validateLengths);

export const companySchema = companyFields.extend({
  factoryAddressStreet: z.string().optional(),
  factoryAddressCity: z.string().optional(),
  factoryAddressState: z.string().optional(),
  factoryAddressCountry: z.string().optional(),
  factoryAddressZip: z.string().optional(),
  departmentPhones: z.array(z.object({
    department: z.string(),
    phone: z.string(),
  })).optional(),
  additionalEmails: z.array(z.object({
    position: z.string(),
    email: z.string().email("Invalid email"),
  })).optional(),
}).superRefine(validateLengths);
