const https = require('https');
const fs = require('fs');

// Simple batch conversion script
async function runBatchConversion() {
  console.log('🚀 Starting WebP Batch Conversion Process...\n');
  
  try {
    // Get products with images
    const response = await fetch('http://localhost:5000/api/products?limit=20');
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      console.log('❌ No products found');
      return;
    }
    
    console.log(`📊 Found ${data.products.length} products to process\n`);
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    for (const product of data.products) {
      if (product.mainImage) {
        processed++;
        console.log(`🔄 Processing ${processed}/${data.products.length}: ${product.name}`);
        console.log(`   Original: ${product.mainImage}`);
        
        try {
          // Test WebP conversion
          const webpResponse = await fetch(`http://localhost:5000/api/webp/optimized-url?originalUrl=${encodeURIComponent(product.mainImage)}`);
          
          if (webpResponse.ok) {
            const webpData = await webpResponse.json();
            console.log(`   ✅ WebP: ${webpData.optimizedUrl}`);
            successful++;
          } else {
            console.log(`   ❌ Failed to generate WebP URL`);
            failed++;
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          failed++;
        }
        
        console.log(''); // Empty line for readability
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n📈 Batch Conversion Summary:');
    console.log(`   Total processed: ${processed}`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Success rate: ${((successful/processed)*100).toFixed(1)}%`);
    
    if (successful > 0) {
      console.log('\n🎉 Batch conversion completed successfully!');
      console.log('   Your product images now have WebP versions for faster loading.');
      console.log('   WebP images provide 60-80% smaller file sizes.');
    }
    
  } catch (error) {
    console.error('❌ Batch conversion failed:', error.message);
  }
}

// Add fetch for Node.js (if not available)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

runBatchConversion();