/**
 * Complete Image Cleanup Script
 * 
 * This script will:
 * 1. Remove all product images from database
 * 2. Remove all category images from database  
 * 3. Remove all hero slide images from database
 * 4. Clean up AWS credentials (you'll need to manually remove from Secrets)
 * 5. Reset the platform to use no external storage
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function cleanupAllImages() {
  console.log('🧹 Starting complete image cleanup...\n');

  try {
    // Import database and schema
    const { db } = await import('../server/db.js');
    const { products, categories, heroSlides } = await import('../shared/schema.js');
    const { eq } = await import('drizzle-orm');

    // Step 1: Analyze current state
    console.log('📊 Analyzing current image usage...');
    
    const allProducts = await db.select().from(products);
    const allCategories = await db.select().from(categories);
    const allHeroSlides = await db.select().from(heroSlides);
    
    const productImagesCount = allProducts.filter(p => 
      p.imageUrl || (p.galleryImages && p.galleryImages.length > 0)
    ).length;
    
    const categoryImagesCount = allCategories.filter(c => c.imageUrl).length;
    const heroImagesCount = allHeroSlides.filter(h => h.imageUrl).length;
    
    console.log(`Current image usage:`);
    console.log(`   - Products with images: ${productImagesCount}`);
    console.log(`   - Categories with images: ${categoryImagesCount}`);
    console.log(`   - Hero slides with images: ${heroImagesCount}`);
    console.log(`   - Total images to remove: ${productImagesCount + categoryImagesCount + heroImagesCount}\n`);

    // Step 2: Clean product images
    console.log('🗑️ Removing all product images...');
    
    let productUpdateCount = 0;
    for (const product of allProducts) {
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
    console.log(`✅ Removed images from ${productUpdateCount} products`);

    // Step 3: Clean category images
    console.log('🗑️ Removing all category images...');
    
    let categoryUpdateCount = 0;
    for (const category of allCategories) {
      if (category.imageUrl) {
        await db.update(categories)
          .set({ imageUrl: null })
          .where(eq(categories.id, category.id));
        categoryUpdateCount++;
      }
    }
    console.log(`✅ Removed images from ${categoryUpdateCount} categories`);

    // Step 4: Clean hero slide images
    console.log('🗑️ Removing all hero slide images...');
    
    let heroUpdateCount = 0;
    for (const slide of allHeroSlides) {
      if (slide.imageUrl) {
        await db.update(heroSlides)
          .set({ imageUrl: null })
          .where(eq(heroSlides.id, slide.id));
        heroUpdateCount++;
      }
    }
    console.log(`✅ Removed images from ${heroUpdateCount} hero slides`);

    // Step 5: Summary
    console.log('\n🎉 Image cleanup completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Product images removed: ${productUpdateCount}`);
    console.log(`   - Category images removed: ${categoryUpdateCount}`);
    console.log(`   - Hero slide images removed: ${heroUpdateCount}`);
    console.log(`   - Total images removed: ${productUpdateCount + categoryUpdateCount + heroUpdateCount}`);
    
    console.log('\n📝 Manual steps required:');
    console.log('   1. Go to Replit Secrets tab');
    console.log('   2. Delete these secret keys:');
    console.log('      - AWS_ACCESS_KEY_ID');
    console.log('      - AWS_SECRET_ACCESS_KEY');
    console.log('      - AWS_S3_BUCKET_NAME');
    console.log('      - AWS_REGION');
    console.log('   3. Delete your AWS S3 bucket from AWS console');
    console.log('   4. Your platform will now use Replit object storage only');
    
    console.log('\n✅ Your platform is now cleaned up and ready!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupAllImages();