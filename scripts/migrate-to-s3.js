/**
 * Migration Script: Replit Object Storage to AWS S3
 * 
 * This script will:
 * 1. List all images currently stored in the system
 * 2. Delete all product images from the database
 * 3. Clean up Replit object storage (if needed)
 * 4. Prepare the system for AWS S3
 */

import { db } from '../server/db.js';
import { products, categories, heroSlides } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function migrateToS3() {
  console.log('🚀 Starting migration from Replit Object Storage to AWS S3...\n');

  try {
    // Step 1: Analyze current image usage
    console.log('📊 Analyzing current image usage...');
    
    // Get all products with images
    const productsWithImages = await db.select().from(products);
    const productImagesCount = productsWithImages.filter(p => 
      p.imageUrl || (p.galleryImages && p.galleryImages.length > 0)
    ).length;
    
    // Get all categories with images
    const categoriesWithImages = await db.select().from(categories);
    const categoryImagesCount = categoriesWithImages.filter(c => c.imageUrl).length;
    
    // Get all hero slides with images
    const heroSlidesWithImages = await db.select().from(heroSlides);
    const heroImagesCount = heroSlidesWithImages.filter(h => h.imageUrl).length;
    
    console.log(`📈 Current image usage:`);
    console.log(`   - Products with images: ${productImagesCount}`);
    console.log(`   - Categories with images: ${categoryImagesCount}`);
    console.log(`   - Hero slides with images: ${heroImagesCount}`);
    console.log(`   - Total records to clean: ${productImagesCount + categoryImagesCount + heroImagesCount}\n`);

    // Step 2: Clean product images
    console.log('🧹 Removing product images from database...');
    
    let productUpdateCount = 0;
    for (const product of productsWithImages) {
      if (product.imageUrl || (product.galleryImages && product.galleryImages.length > 0)) {
        await db.update(products)
          .set({ 
            imageUrl: null,
            galleryImages: null
          })
          .where(eq(products.id, product.id));
        productUpdateCount++;
      }
    }
    console.log(`✅ Cleared images from ${productUpdateCount} products`);

    // Step 3: Clean category images
    console.log('🧹 Removing category images from database...');
    
    let categoryUpdateCount = 0;
    for (const category of categoriesWithImages) {
      if (category.imageUrl) {
        await db.update(categories)
          .set({ imageUrl: null })
          .where(eq(categories.id, category.id));
        categoryUpdateCount++;
      }
    }
    console.log(`✅ Cleared images from ${categoryUpdateCount} categories`);

    // Step 4: Clean hero slide images
    console.log('🧹 Removing hero slide images from database...');
    
    let heroUpdateCount = 0;
    for (const slide of heroSlidesWithImages) {
      if (slide.imageUrl) {
        await db.update(heroSlides)
          .set({ imageUrl: null })
          .where(eq(heroSlides.id, slide.id));
        heroUpdateCount++;
      }
    }
    console.log(`✅ Cleared images from ${heroUpdateCount} hero slides`);

    // Step 5: Summary
    console.log('\n🎉 Migration completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Product images removed: ${productUpdateCount}`);
    console.log(`   - Category images removed: ${categoryUpdateCount}`);
    console.log(`   - Hero slide images removed: ${heroUpdateCount}`);
    console.log(`   - Total images cleared: ${productUpdateCount + categoryUpdateCount + heroUpdateCount}`);
    
    console.log('\n📝 Next steps:');
    console.log('   1. Add your AWS credentials to Replit Secrets');
    console.log('   2. Test category image upload with new AWS S3 system');
    console.log('   3. Re-upload your hero slide images');
    console.log('   4. Re-upload product images as needed');
    
    console.log('\n✅ Your platform is now ready for AWS S3!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateToS3();