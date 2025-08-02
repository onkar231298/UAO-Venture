import { Pool } from '@neondatabase/serverless';

// Connect to database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrateFaqs() {
  console.log('Starting FAQ migration...');
  
  try {
    // Get all products that have FAQs in the JSON field
    const result = await pool.query(`
      SELECT id, product_id, faqs 
      FROM products 
      WHERE faqs IS NOT NULL 
      AND faqs != '[]'::jsonb 
      AND jsonb_array_length(faqs) > 0
    `);
    
    console.log(`Found ${result.rows.length} products with FAQs to migrate`);
    
    for (const product of result.rows) {
      console.log(`\nMigrating FAQs for product ${product.product_id} (ID: ${product.id})`);
      
      // Check if this product already has FAQs in the product_faqs table
      const existingFaqs = await pool.query(`
        SELECT COUNT(*) as count FROM product_faqs WHERE product_id = $1
      `, [product.id]);
      
      if (existingFaqs.rows[0].count > 0) {
        console.log(`  Product ${product.product_id} already has FAQs in product_faqs table, skipping...`);
        continue;
      }
      
      const faqs = product.faqs;
      console.log(`  Found ${faqs.length} FAQs to migrate`);
      
      // Insert each FAQ into the product_faqs table
      for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        if (faq.question && faq.answer) {
          await pool.query(`
            INSERT INTO product_faqs (product_id, question, answer, display_order, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `, [product.id, faq.question, faq.answer, i + 1, true]);
          
          console.log(`    ✓ Migrated FAQ ${i + 1}: "${faq.question.substring(0, 50)}..."`);
        }
      }
    }
    
    console.log('\n✅ FAQ migration completed successfully!');
    
    // Test the migration by checking a few products
    const testResult = await pool.query(`
      SELECT p.product_id, p.name, COUNT(pf.id) as faq_count
      FROM products p
      LEFT JOIN product_faqs pf ON p.id = pf.product_id
      WHERE p.faqs IS NOT NULL AND p.faqs != '[]'::jsonb
      GROUP BY p.id, p.product_id, p.name
      LIMIT 5
    `);
    
    console.log('\nSample migration results:');
    testResult.rows.forEach(row => {
      console.log(`  ${row.product_id} (${row.name}): ${row.faq_count} FAQs migrated`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateFaqs();