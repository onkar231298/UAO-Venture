import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'brightfameimages';
const BUCKET_REGION = 'eu-north-1'; // Your bucket is in Stockholm region

// AWS S3 Configuration with correct region
const s3Client = new S3Client({
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const CDN_URL = process.env.AWS_CLOUDFRONT_URL || `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com`;

// Multer S3 Configuration for Direct Upload
export const uploadToS3 = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: BUCKET_NAME,
    // Remove ACL setting as bucket doesn't allow ACLs
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // Generate unique filename based on upload type
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      let filename: string;
      
      if (file.fieldname.includes('slide')) {
        // Hero slider uploads go to hero-slides folder
        const slideId = req.body.slideId || 'temp';
        filename = `hero-slides/${slideId}/${file.fieldname}-${timestamp}${ext}`;
      } else {
        // Product uploads go to products folder
        const productId = req.body.productId || 'temp';
        filename = `products/${productId}/${file.fieldname}-${timestamp}${ext}`;
      }
      
      console.log(`Uploading to S3: ${filename}, Original: ${file.originalname}, Size: ${file.size || 'unknown'}`);
      cb(null, filename);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf' || file.mimetype.includes('document')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and document files are allowed!'));
    }
  },
});

// Generate Presigned URL for Direct Upload (Alternative approach)
export async function generatePresignedUrl(filename: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  return signedUrl;
}

// Delete image from S3
export async function deleteFromS3(imageKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: imageKey,
  });

  await s3Client.send(command);
}

// Get public URL for uploaded image
export function getImageUrl(s3Key: string): string {
  return `${CDN_URL}/${s3Key}`;
}

// Utility function to extract S3 key from URL
export function extractS3Key(imageUrl: string): string {
  return imageUrl.replace(`${CDN_URL}/`, '');
}

/**
 * Returns an S3 key only for URLs produced by this application's quality
 * attachment uploader. Pasted third-party URLs (including lookalike hosts) are
 * deliberately ignored so record deletion can never remove arbitrary objects.
 */
export function extractOwnedQualityAttachmentKey(fileUrl: string): string | null {
  try {
    const base = new URL(CDN_URL.endsWith('/') ? CDN_URL : `${CDN_URL}/`);
    const candidate = new URL(fileUrl);
    if (candidate.origin !== base.origin) return null;

    const basePath = base.pathname.replace(/^\/+|\/+$/g, '');
    const encodedPrefix = [basePath, 'quality-attachments'].filter(Boolean).join('/') + '/';
    const candidatePath = candidate.pathname.replace(/^\/+/, '');
    if (!candidatePath.startsWith(encodedPrefix)) return null;

    const key = decodeURIComponent(candidatePath.slice(basePath ? basePath.length + 1 : 0));
    if (!key.startsWith('quality-attachments/') || key.includes('\0')) return null;
    return key;
  } catch {
    return null;
  }
}

// Image upload middleware for products
export const productImageUpload = uploadToS3.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'secondImage', maxCount: 1 }, // For second gallery image
  { name: 'thirdImage', maxCount: 1 }, // For third gallery image
  { name: 'galleryImage', maxCount: 1 }, // For single gallery image uploads
  { name: 'galleryImages', maxCount: 10 }, // For multiple gallery image uploads
  { name: 'coaDocument', maxCount: 1 },
  { name: 'certDocument', maxCount: 1 },
  { name: 'specDocument', maxCount: 1 },
  { name: 'msdsDocument', maxCount: 1 },
  { name: 'nonGmoDocument', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 },
  { name: 'halalCert', maxCount: 1 },
  { name: 'euOrganicCert', maxCount: 1 },
  { name: 'indiaOrganicCert', maxCount: 1 },
  { name: 'organicNopCert', maxCount: 1 },
  { name: 'exportCert', maxCount: 1 },
  { name: 'spiceBoardCert', maxCount: 1 },
  { name: 'fssaiLicense', maxCount: 1 },
  { name: 'exportHouseCert', maxCount: 1 },
  { name: 'additionalDocs', maxCount: 5 },
]);

// Hero slider media upload (supports both images and videos)
export const heroSliderUpload = uploadToS3.fields([
  { name: 'slideImage', maxCount: 1 },
  { name: 'slideVideo', maxCount: 1 },
]);

// ── Quality report/attachment uploads → quality-attachments/ folder ───────
// The bucket is public-read, so active content (SVG/HTML) must never be hosted.
// Multipart metadata (claimed MIME type, filename) is attacker-controlled, so:
//  1. extension must be on a closed allowlist,
//  2. the actual file BYTES are validated against that extension (magic numbers),
//  3. the stored Content-Type is set by the server from the allowlist — never
//     from the client and never sniffed from content.
const QUALITY_FILE_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
};

// True if the filename's extension is on the closed attachment allowlist (never svg/html).
export function isAllowedAttachmentExt(originalName: string): boolean {
  return !!QUALITY_FILE_TYPES[path.extname(originalName).toLowerCase()];
}

export function getAllowedAttachmentContentType(originalName: string): string | null {
  return QUALITY_FILE_TYPES[path.extname(originalName).toLowerCase()] || null;
}

// Buffers in memory (10MB cap) so bytes are validated BEFORE anything reaches S3.
export const qualityAttachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for reports/documents
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (QUALITY_FILE_TYPES[ext]) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, image (JPG/PNG/WebP/GIF), Word, Excel, or CSV files are allowed'));
    }
  },
});

// Returns an error message if the file's real bytes don't match its extension, else null.
export function validateQualityFileBytes(buf: Buffer, originalName: string): string | null {
  const ext = path.extname(originalName).toLowerCase();
  const startsWith = (sig: number[] | string, offset = 0): boolean => {
    if (typeof sig === 'string') {
      return buf.length >= offset + sig.length && buf.slice(offset, offset + sig.length).toString('latin1') === sig;
    }
    return buf.length >= offset + sig.length && sig.every((b, i) => buf[offset + i] === b);
  };
  switch (ext) {
    case '.pdf':
      return startsWith('%PDF-') ? null : 'File content is not a valid PDF';
    case '.jpg':
    case '.jpeg':
      return startsWith([0xff, 0xd8, 0xff]) ? null : 'File content is not a valid JPEG image';
    case '.png':
      return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ? null : 'File content is not a valid PNG image';
    case '.gif':
      return startsWith('GIF87a') || startsWith('GIF89a') ? null : 'File content is not a valid GIF image';
    case '.webp':
      return startsWith('RIFF') && startsWith('WEBP', 8) ? null : 'File content is not a valid WebP image';
    case '.doc':
    case '.xls':
      // Legacy Office = OLE compound file
      return startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) ? null : 'File content is not a valid Office document';
    case '.docx':
    case '.xlsx':
      // OOXML = ZIP that must contain [Content_Types].xml — arbitrary ZIPs are rejected
      if (!startsWith([0x50, 0x4b, 0x03, 0x04])) return 'File content is not a valid Office document';
      return buf.includes('[Content_Types].xml') ? null : 'File content is not a valid Office document';
    case '.csv': {
      const head = buf.subarray(0, 8192);
      if (head.includes(0)) return 'CSV must be a plain text file';
      const text = head.toString('utf8').replace(/^\uFEFF/, '').trimStart();
      // Reject markup masquerading as CSV (HTML/SVG/XML)
      if (text.startsWith('<')) return 'CSV must be a plain text file';
      return null;
    }
    default:
      return 'Only PDF, image (JPG/PNG/WebP/GIF), Word, Excel, or CSV files are allowed';
  }
}

// Uploads a validated buffer with a server-chosen Content-Type from the allowlist.
// keyPrefix lets other features (e.g. product documents) reuse the same hardened path.
export async function uploadQualityAttachment(buf: Buffer, originalName: string, keyPrefix = 'quality-attachments', forceDownload = false): Promise<{ key: string; url: string }> {
  const ext = path.extname(originalName).toLowerCase();
  const contentType = QUALITY_FILE_TYPES[ext];
  if (!contentType) throw new Error('Unsupported file type');
  const safeName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
  // UUID guarantees key uniqueness — same-named simultaneous uploads must never overwrite each other
  const key = `${keyPrefix.replace(/\/+$/, '')}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buf,
    ContentType: contentType,
    ContentDisposition: forceDownload ? `attachment; filename="${safeName}"` : undefined,
  }));
  console.log(`Uploaded quality attachment to S3: ${key} (${contentType}, ${buf.length} bytes)`);
  return { key, url: getImageUrl(key) };
}

// ── Documents bucket (separate from image bucket) ─────────────────────────
const DOCUMENTS_BUCKET = process.env.AWS_DOCUMENTS_BUCKET_NAME || 'eurka-unjha-bucket-production';
const DOCUMENTS_BUCKET_REGION = 'eu-north-1';

const docsS3Client = new S3Client({
  region: DOCUMENTS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function generateDocumentPresignedUrl(s3Key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: s3Key,
    ContentType: contentType,
  });
  return getSignedUrl(docsS3Client, command, { expiresIn: 3600 });
}

export function getDocumentPublicUrl(s3Key: string): string {
  return `https://${DOCUMENTS_BUCKET}.s3.${DOCUMENTS_BUCKET_REGION}.amazonaws.com/${s3Key}`;
}

export async function deleteDocumentFromS3(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: s3Key,
  });
  await docsS3Client.send(command);
}