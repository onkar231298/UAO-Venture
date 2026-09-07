import { z } from "zod";

export const bulkEmailAttachmentSchema = z.object({
  content: z.string(),
  filename: z.string().min(1).max(255),
  type: z.string(),
});

export const bulkEmailCampaignRequestSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(255),
  subject: z.string().min(1, "Subject is required").max(500),
  htmlContent: z.string().min(1, "Email content is required").max(2_000_000),
  textContent: z.string().optional().nullable(),
  companyIds: z.array(z.number().int().positive()).min(1, "At least one company is required").max(1000),
  templateId: z.number().optional(),
  scheduledAt: z.string().optional(),
  idempotencyKey: z.string().uuid(),
  permissionConfirmed: z.literal(true, {
    errorMap: () => ({ message: "Confirm recipient email permission before sending." }),
  }),
  attachments: z.array(bulkEmailAttachmentSchema).max(20).optional(),
});

export type BulkEmailCampaignRequest = z.infer<typeof bulkEmailCampaignRequestSchema>;

export function buildBulkEmailCampaignRequest(
  input: Omit<BulkEmailCampaignRequest, "permissionConfirmed"> & {
    permissionConfirmed: boolean;
  },
): BulkEmailCampaignRequest {
  return bulkEmailCampaignRequestSchema.parse(input);
}

export function serializeBulkEmailCampaignRequest(
  input: BulkEmailCampaignRequest,
): string {
  return JSON.stringify(bulkEmailCampaignRequestSchema.parse(input));
}