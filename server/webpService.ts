import sharp from 'sharp';
import AWS from 'aws-sdk';

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const ORIGINAL_BUCKET = process.env.BFI_ORIGINAL_BUCKET!;
const WEBP_BUCKET = process.env.BFI_WEBP_BUCKET!;

export class WebPService {
  
  /**
   * Convert image buffer to WebP format
   */
  async convertToWebP(imageBuffer: Buffer, quality: number = 85): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .webp({ 
          quality,
          effort: 6, // Higher effort for better compression
          lossless: false
        })
        .toBuffer();
    } catch (error) {
      console.error('WebP conversion error:', error);
      throw new Error('Failed to convert image to WebP');
    }
  }

  /**
   * Upload image to S3 bucket
   */
  async uploadToS3(bucket: string, key: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      const params = {
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
      };

      const result = await s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload image to S3');
    }
  }

  /**
   * Check if WebP version exists in S3
   */
  async webpExists(key: string): Promise<boolean> {
    try {
      await s3.headObject({
        Bucket: WEBP_BUCKET,
        Key: key
      }).promise();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get image from S3
   */
  async getImageFromS3(bucket: string, key: string): Promise<Buffer> {
    try {
      const result = await s3.getObject({
        Bucket: bucket,
        Key: key
      }).promise();
      
      return result.Body as Buffer;
    } catch (error) {
      console.error('S3 download error:', error);
      throw new Error('Failed to download image from S3');
    }
  }

  /**
   * Process and store image in both buckets
   */
  async processAndStoreImage(
    imageBuffer: Buffer, 
    filename: string, 
    originalContentType: string
  ): Promise<{ originalUrl: string; webpUrl: string }> {
    
    const timestamp = Date.now();
    const baseName = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    const originalKey = `${baseName}_${timestamp}.${originalContentType.split('/')[1]}`;
    const webpKey = `${baseName}_${timestamp}.webp`;

    try {
      // Upload original image
      const originalUrl = await this.uploadToS3(
        ORIGINAL_BUCKET, 
        originalKey, 
        imageBuffer, 
        originalContentType
      );

      // Convert to WebP and upload
      const webpBuffer = await this.convertToWebP(imageBuffer);
      const webpUrl = await this.uploadToS3(
        WEBP_BUCKET, 
        webpKey, 
        webpBuffer, 
        'image/webp'
      );

      return { originalUrl, webpUrl };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process and store image');
    }
  }

  /**
   * Get optimized image URL (WebP if available, otherwise original)
   */
  getOptimizedImageUrl(originalUrl: string): string {
    try {
      // Extract key from original URL
      const urlParts = originalUrl.split('/');
      const key = urlParts[urlParts.length - 1];
      const webpKey = key.replace(/\.[^/.]+$/, '.webp');
      
      // Return WebP URL (we'll handle fallback on client side)
      return `https://${WEBP_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${webpKey}`;
    } catch (error) {
      console.error('URL optimization error:', error);
      return originalUrl;
    }
  }

  /**
   * Batch convert existing images to WebP
   */
  async batchConvertExistingImages(): Promise<void> {
    console.log('Starting batch conversion of existing images...');
    
    try {
      // List all objects in original bucket
      const listParams = {
        Bucket: ORIGINAL_BUCKET,
      };

      const objects = await s3.listObjectsV2(listParams).promise();
      
      if (!objects.Contents || objects.Contents.length === 0) {
        console.log('No images found in original bucket');
        return;
      }

      console.log(`Found ${objects.Contents.length} images to convert`);

      for (const object of objects.Contents) {
        if (!object.Key) continue;

        try {
          // Check if WebP version already exists
          const webpKey = object.Key.replace(/\.[^/.]+$/, '.webp');
          const webpAlreadyExists = await this.webpExists(webpKey);
          
          if (webpAlreadyExists) {
            console.log(`WebP already exists for ${object.Key}, skipping...`);
            continue;
          }

          // Download original image
          const imageBuffer = await this.getImageFromS3(ORIGINAL_BUCKET, object.Key);
          
          // Convert to WebP
          const webpBuffer = await this.convertToWebP(imageBuffer);
          
          // Upload WebP version
          await this.uploadToS3(WEBP_BUCKET, webpKey, webpBuffer, 'image/webp');
          
          console.log(`Converted ${object.Key} to WebP`);
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Failed to convert ${object.Key}:`, error);
          // Continue with next image
        }
      }

      console.log('Batch conversion completed!');
    } catch (error) {
      console.error('Batch conversion error:', error);
      throw error;
    }
  }
}

export const webpService = new WebPService();