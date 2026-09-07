import {
  deleteFromS3,
  getAllowedAttachmentContentType,
  uploadQualityAttachment,
  validateQualityFileBytes,
} from "./s3Upload";

export const MAX_BULK_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_BULK_ATTACHMENTS_BYTES = 25 * 1024 * 1024;

export type IncomingBulkAttachment = {
  content: string;
  filename: string;
  type: string;
};

export type ValidatedBulkAttachment = {
  bytes: Buffer;
  filename: string;
  contentType: string;
  size: number;
};

export type StoredBulkAttachment = {
  key: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
};

function canonicalBase64(value: string): string | null {
  const match = value.match(
    /^(?:data:[^;,]+;base64,)?([A-Za-z0-9+/]+={0,2})$/,
  );
  if (!match || match[1].length % 4 !== 0) return null;
  const withoutPadding = match[1].replace(/=+$/, "");
  const decoded = Buffer.from(match[1], "base64");
  if (decoded.toString("base64").replace(/=+$/, "") !== withoutPadding) {
    return null;
  }
  return match[1];
}

export function validateBulkAttachments(
  attachments: IncomingBulkAttachment[] = [],
): ValidatedBulkAttachment[] {
  let totalSize = 0;
  return attachments.map((attachment) => {
    const contentType = getAllowedAttachmentContentType(attachment.filename);
    // Client MIME metadata is untrusted and can be empty or inconsistent across
    // browsers. The stored MIME type is derived exclusively from the allowlisted
    // extension after the real bytes are validated below.
    if (!contentType) {
      throw Object.assign(
        new Error(`Attachment "${attachment.filename}" has an unsupported file type.`),
        { status: 400 },
      );
    }
    const encoded = canonicalBase64(attachment.content);
    if (!encoded) {
      throw Object.assign(
        new Error(`Attachment "${attachment.filename}" is not valid base64.`),
        { status: 400 },
      );
    }
    const bytes = Buffer.from(encoded, "base64");
    if (bytes.length > MAX_BULK_ATTACHMENT_BYTES) {
      throw Object.assign(
        new Error(`Attachment "${attachment.filename}" exceeds the 10MB limit.`),
        { status: 400 },
      );
    }
    const byteError = validateQualityFileBytes(bytes, attachment.filename);
    if (byteError) {
      throw Object.assign(
        new Error(`Attachment "${attachment.filename}": ${byteError}.`),
        { status: 400 },
      );
    }
    totalSize += bytes.length;
    if (totalSize > MAX_BULK_ATTACHMENTS_BYTES) {
      throw Object.assign(
        new Error("Total attachments exceed the 25MB limit."),
        { status: 400 },
      );
    }
    return {
      bytes,
      filename: attachment.filename,
      contentType,
      size: bytes.length,
    };
  });
}

export async function storeBulkAttachments(
  userId: string,
  campaignId: number,
  attachments: ValidatedBulkAttachment[],
  dependencies: {
    upload: typeof uploadQualityAttachment;
    remove: typeof removeBulkAttachments;
  } = {
    upload: uploadQualityAttachment,
    remove: removeBulkAttachments,
  },
): Promise<StoredBulkAttachment[]> {
  const stored: StoredBulkAttachment[] = [];
  try {
    for (const attachment of attachments) {
      const uploaded = await dependencies.upload(
        attachment.bytes,
        attachment.filename,
        `bulk-email-attachments/${userId}/${campaignId}`,
        true,
      );
      stored.push({
        ...uploaded,
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
      });
    }
    return stored;
  } catch (error) {
    try {
      await dependencies.remove(stored);
    } catch {
      const cleanupError: any = new Error(
        "Attachment upload failed and one or more uploaded files still require cleanup.",
      );
      cleanupError.status = 502;
      cleanupError.recoverableAttachments = stored;
      throw cleanupError;
    }
    throw error;
  }
}

export async function removeBulkAttachments(
  attachments: Array<{ key: string }>,
): Promise<void> {
  const results = await Promise.allSettled(
    attachments.map((attachment) => deleteFromS3(attachment.key)),
  );
  if (results.some((result) => result.status === "rejected")) {
    throw new Error("One or more bulk email attachments could not be removed.");
  }
}