import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import { imageProcessor, type ProcessedImage } from "./imageProcessor.js";

// AWS S3 Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (!AWS_S3_BUCKET_NAME || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.warn('AWS S3 credentials not configured. Some features may not work.');
}

// S3 Client
export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

export class S3NotFoundError extends Error {
  constructor() {
    super("Object not found in S3");
    this.name = "S3NotFoundError";
    Object.setPrototypeOf(this, S3NotFoundError.prototype);
  }
}

// AWS S3 Service for Atlas Ingredients Platform
export class AWSS3Service {
  private get bucketName(): string {
    if (!AWS_S3_BUCKET_NAME) {
      throw new Error('AWS_S3_BUCKET_NAME environment variable is required');
    }
    return AWS_S3_BUCKET_NAME;
  }

  // Generate presigned URL for uploading files
  async generateUploadURL(folder: string = 'uploads', fileExtension: string = 'jpg'): Promise<string> {
    const objectKey = `${folder}/${randomUUID()}.${fileExtension}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: `image/${fileExtension}`,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes
    return signedUrl;
  }

  // Generate presigned URL for category images
  async getCategoryImageUploadURL(): Promise<string> {
    return this.generateUploadURL('categories', 'jpg');
  }

  // Generate presigned URL for product images (legacy - kept for compatibility)
  async getProductImageUploadURL(): Promise<string> {
    return this.generateUploadURL('products', 'webp');
  }

  // Upload processed product images (3 sizes) directly to S3
  async uploadProductImages(images: ProcessedImage[], productId: string): Promise<{ 
    thumbnail: string; 
    medium: string; 
    large: string; 
  }> {
    const uploadPromises = images.map(async (image) => {
      const objectKey = `products/${productId}/${image.filename}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: image.buffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000', // 1 year cache
        ContentDisposition: 'inline',
      });

      await s3Client.send(command);
      
      return {
        size: image.size,
        url: this.getObjectURL(objectKey)
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);
    
    // Organize URLs by size
    const urls = {
      thumbnail: uploadedImages.find(img => img.size === 'thumbnail')?.url || '',
      medium: uploadedImages.find(img => img.size === 'medium')?.url || '',
      large: uploadedImages.find(img => img.size === 'large')?.url || ''
    };

    console.log(`✅ Uploaded ${uploadedImages.length} product images for ${productId}`);
    return urls;
  }

  // Get object URL for public access
  getObjectURL(objectKey: string): string {
    return `https://${this.bucketName}.s3.${AWS_REGION}.amazonaws.com/${objectKey}`;
  }

  // Extract object key from full S3 URL
  extractObjectKey(s3Url: string): string | null {
    try {
      const url = new URL(s3Url);
      const bucketDomain = `${this.bucketName}.s3.${AWS_REGION}.amazonaws.com`;
      
      if (url.hostname === bucketDomain) {
        return url.pathname.slice(1); // Remove leading slash
      }
      
      // Handle different S3 URL formats
      if (url.hostname === 's3.amazonaws.com' || url.hostname.includes('s3')) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts[0] === this.bucketName) {
          return pathParts.slice(1).join('/');
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting object key from URL:', error);
      return null;
    }
  }

  // Check if object exists in S3
  async objectExists(objectKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });
      
      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  // Delete object from S3
  async deleteObject(objectKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    await s3Client.send(command);
  }

  // Delete object by URL
  async deleteObjectByURL(s3Url: string): Promise<boolean> {
    const objectKey = this.extractObjectKey(s3Url);
    if (!objectKey) {
      console.warn('Could not extract object key from URL:', s3Url);
      return false;
    }

    try {
      await this.deleteObject(objectKey);
      return true;
    } catch (error) {
      console.error('Error deleting object:', error);
      return false;
    }
  }

  // Stream object to response (for serving images)
  async streamObjectToResponse(objectKey: string, res: Response): Promise<void> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      const response = await s3Client.send(command);
      
      if (!response.Body) {
        throw new S3NotFoundError();
      }

      // Set headers
      res.set({
        'Content-Type': response.ContentType || 'application/octet-stream',
        'Content-Length': response.ContentLength?.toString() || '',
        'Cache-Control': 'public, max-age=31536000', // 1 year cache
        'Last-Modified': response.LastModified?.toUTCString() || '',
        'ETag': response.ETag || '',
      });

      // Stream the response
      const stream = response.Body as NodeJS.ReadableStream;
      stream.pipe(res);
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        throw new S3NotFoundError();
      }
      throw error;
    }
  }

  // List all objects in a folder (for cleanup operations)
  async listObjects(prefix: string = ''): Promise<string[]> {
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    try {
      const response = await s3Client.send(command);
      return response.Contents?.map(obj => obj.Key || '') || [];
    } catch (error) {
      console.error('Error listing objects:', error);
      return [];
    }
  }

  // Batch delete objects (for cleanup)
  async batchDeleteObjects(objectKeys: string[]): Promise<void> {
    if (objectKeys.length === 0) return;

    const { DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
    
    // S3 supports max 1000 objects per batch delete
    const batches = [];
    for (let i = 0; i < objectKeys.length; i += 1000) {
      batches.push(objectKeys.slice(i, i + 1000));
    }

    for (const batch of batches) {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: batch.map(Key => ({ Key })),
        },
      });

      try {
        await s3Client.send(command);
        console.log(`Deleted ${batch.length} objects from S3`);
      } catch (error) {
        console.error('Error batch deleting objects:', error);
        throw error;
      }
    }
  }

  // Get bucket info
  getBucketInfo(): { bucketName: string; region: string; baseUrl: string } {
    return {
      bucketName: this.bucketName,
      region: AWS_REGION,
      baseUrl: `https://${this.bucketName}.s3.${AWS_REGION}.amazonaws.com`,
    };
  }
}