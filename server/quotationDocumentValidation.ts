export const QUOTATION_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export interface ValidatedQuotationDocument {
  fileName: string;
  mimeType: string;
}

export function validateQuotationDocument(
  originalName: string,
  buffer: Buffer,
): ValidatedQuotationDocument | null {
  const fileName = originalName
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, 255);
  if (!fileName || buffer.length === 0 || buffer.length > QUOTATION_DOCUMENT_MAX_BYTES) return null;

  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const mimeType = ALLOWED_MIME_BY_EXTENSION[extension];
  if (!mimeType) return null;

  const isPdf = extension === ".pdf"
    && buffer.subarray(0, Math.min(buffer.length, 1024)).includes(Buffer.from("%PDF-"));
  const isPng = extension === ".png"
    && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = (extension === ".jpg" || extension === ".jpeg")
    && buffer.length >= 3
    && buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff;

  if (!isPdf && !isPng && !isJpeg) return null;
  return { fileName, mimeType };
}
