import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testWebPWithDirectFormData() {
  console.log('🧪 Testing WebP Upload with Form Data (bypassing auth for testing)...\n');

  try {
    // Create a simple test using curl command instead for authentication
    const testImagePath = path.join(__dirname, '..', 'attached_assets', 'Final Logo_1753729864655.png');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Test image not found:', testImagePath);
      const files = fs.readdirSync(path.join(__dirname, '..', 'attached_assets'))
        .filter(f => f.match(/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i))
        .slice(0, 3);
      console.log('Available images:', files);
      return;
    }

    console.log('📸 Found test image:', path.basename(testImagePath));
    console.log('📊 Image size:', (fs.statSync(testImagePath).size / 1024 / 1024).toFixed(2), 'MB');

    // Test the imageProcessor directly by importing it
    console.log('\n🔄 Testing Sharp processing directly...');
    
    try {
      const { imageProcessor } = await import('../server/imageProcessor.js');
      const imageBuffer = fs.readFileSync(testImagePath);
      
      console.log('📦 Processing image buffer (' + imageBuffer.length + ' bytes)...');
      
      const processedImages = await imageProcessor.processProductImage(imageBuffer, 'test-logo.png');
      
      console.log('✅ Sharp processing successful!');
      console.log('📋 Generated sizes:');
      processedImages.forEach(img => {
        console.log(`  - ${img.size}: ${img.width}x${img.height} (${(img.fileSize / 1024).toFixed(1)}KB)`);
      });

      // Test S3 upload
      console.log('\n☁️  Testing S3 upload...');
      const { AWSS3Service } = await import('../server/awsS3Service.js');
      const s3Service = new AWSS3Service();
      
      const uploadedUrls = await s3Service.uploadProductImages(processedImages, 'webp-test-direct');
      
      console.log('✅ S3 upload successful!');
      console.log('🔗 Generated URLs:');
      console.log('  - Thumbnail:', uploadedUrls.thumbnail);
      console.log('  - Medium:', uploadedUrls.medium);
      console.log('  - Large:', uploadedUrls.large);

      console.log('\n🎉 WebP Processing System FULLY FUNCTIONAL!');

    } catch (error) {
      console.error('❌ Direct processing failed:', error.message);
    }

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  }
}

testWebPWithDirectFormData();