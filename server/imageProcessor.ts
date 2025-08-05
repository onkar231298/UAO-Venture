import sharp from 'sharp';
import { randomUUID } from 'crypto';

interface ImageSize {
  name: 'thumbnail' | 'medium' | 'large';
  width: number;
  quality: number;
}

const IMAGE_SIZES: ImageSize[] = [
  { name: 'thumbnail', width: 300, quality: 80 },
  { name: 'medium', width: 800, quality: 85 },
  { name: 'large', width: 1200, quality: 85 }
];

export interface ProcessedImage {
  buffer: Buffer;
  filename: string;
  size: 'thumbnail' | 'medium' | 'large';
  width: number;
  height: number;
  fileSize: number;
}

export class ImageProcessor {
  /**
   * Process uploaded image into 3 WebP sizes
   * @param inputBuffer - Original image buffer
   * @param originalName - Original filename (for reference)
   * @returns Array of processed images in different sizes
   */
  async processProductImage(inputBuffer: Buffer, originalName: string): Promise<ProcessedImage[]> {
    try {
      // Validate input is a valid image
      const image = sharp(inputBuffer);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image file');
      }

      console.log(`Processing image: ${originalName} (${metadata.width}x${metadata.height}, ${metadata.format})`);

      const processedImages: ProcessedImage[] = [];
      const baseFilename = this.generateFilename(originalName);

      // Process each size
      for (const size of IMAGE_SIZES) {
        try {
          // Create WebP with specific size and quality
          const processed = await sharp(inputBuffer)
            .resize(size.width, null, {
              withoutEnlargement: true, // Don't upscale small images
              fit: 'inside' // Maintain aspect ratio
            })
            .webp({
              quality: size.quality,
              effort: 4 // Balance between speed and compression
            })
            .toBuffer({ resolveWithObject: true });

          const filename = `${baseFilename}-${size.name}.webp`;

          processedImages.push({
            buffer: processed.data,
            filename,
            size: size.name,
            width: processed.info.width,
            height: processed.info.height,
            fileSize: processed.data.length
          });

          console.log(`✅ Created ${size.name}: ${filename} (${processed.info.width}x${processed.info.height}, ${this.formatBytes(processed.data.length)})`);

        } catch (error) {
          console.error(`❌ Failed to process ${size.name} size:`, error);
          throw new Error(`Failed to process image size: ${size.name}`);
        }
      }

      // Log total compression savings
      const totalOutputSize = processedImages.reduce((sum, img) => sum + img.fileSize, 0);
      const compressionRatio = ((inputBuffer.length - totalOutputSize) / inputBuffer.length * 100).toFixed(1);
      console.log(`🎉 Compression complete: ${this.formatBytes(inputBuffer.length)} → ${this.formatBytes(totalOutputSize)} (${compressionRatio}% reduction)`);

      return processedImages;

    } catch (error) {
      console.error('Image processing failed:', error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate unique filename for processed images
   */
  private generateFilename(originalName: string): string {
    const uuid = randomUUID();
    const cleanName = originalName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars
      .toLowerCase()
      .substring(0, 30); // Limit length
    
    return `${cleanName}-${uuid}`;
  }

  /**
   * Format bytes for logging
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Validate if file is a supported image format
   */
  static isValidImageFormat(mimeType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/tiff',
      'image/bmp',
      'image/webp'
    ];
    return supportedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Get file extension for processed images (always .webp)
   */
  static getProcessedExtension(): string {
    return '.webp';
  }
}

export const imageProcessor = new ImageProcessor();