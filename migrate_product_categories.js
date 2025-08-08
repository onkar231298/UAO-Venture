// Migration script to populate product_category_relations from existing product.categoryId
import { db } from './server/db.js';
import { products, productCategoryRelations } from './shared/schema.js';
import { eq, and, isNotNull } from 'drizzle-orm';

async function migrateProductCategories() {
  console.log('🚀 Starting product-category migration...');
  
  try {
    // Get all products that have a categoryId
    const productsWithCategories = await db
      .select({
        id: products.id,
        categoryId: products.categoryId
      })
      .from(products)
      .where(isNotNull(products.categoryId));
    
    console.log(`📊 Found ${productsWithCategories.length} products with categories to migrate`);
    
    if (productsWithCategories.length === 0) {
      console.log('✅ No products to migrate - all done!');
      return;
    }
    
    // Check for existing relations to avoid duplicates
    const existingRelations = await db
      .select({
        productId: productCategoryRelations.productId,
        categoryId: productCategoryRelations.categoryId
      })
      .from(productCategoryRelations);
    
    const existingRelationsSet = new Set(
      existingRelations.map(rel => `${rel.productId}-${rel.categoryId}`)
    );
    
    console.log(`🔍 Found ${existingRelations.length} existing relations`);
    
    // Prepare data for bulk insert - only non-existing relations
    const relationsToInsert = productsWithCategories
      .filter(product => !existingRelationsSet.has(`${product.id}-${product.categoryId}`))
      .map(product => ({
        productId: product.id,
        categoryId: product.categoryId,
        isPrimary: true // All existing category assignments become primary
      }));
    
    console.log(`📝 Will insert ${relationsToInsert.length} new relations`);
    
    if (relationsToInsert.length > 0) {
      // Insert in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < relationsToInsert.length; i += batchSize) {
        const batch = relationsToInsert.slice(i, i + batchSize);
        await db.insert(productCategoryRelations).values(batch);
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(relationsToInsert.length/batchSize)}`);
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Products processed: ${productsWithCategories.length}`);
    console.log(`   - New relations created: ${relationsToInsert.length}`);
    console.log(`   - Existing relations preserved: ${existingRelations.length}`);
    
    // Verify the migration
    const totalRelations = await db
      .select({ count: db.$count() })
      .from(productCategoryRelations);
    
    console.log(`🔢 Total relations in database: ${totalRelations[0]?.count || 0}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateProductCategories()
    .then(() => {
      console.log('🏁 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateProductCategories };