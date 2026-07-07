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