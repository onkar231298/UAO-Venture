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
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // Generate unique filename: products/BFI001/main-image-timestamp.jpg
      const productId = req.body.productId || 'temp';
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `products/${productId}/${file.fieldname}-${timestamp}${ext}`;
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
  { name: 'galleryImage', maxCount: 1 }, // For single gallery image uploads
  { name: 'galleryImages', maxCount: 10 }, // For multiple gallery image uploads
  { name: 'coaDocument', maxCount: 1 },
  { name: 'certDocument', maxCount: 1 },
  { name: 'specDocument', maxCount: 1 },
  { name: 'msdsDocument', maxCount: 1 },
  { name: 'additionalDocs', maxCount: 5 },
]);