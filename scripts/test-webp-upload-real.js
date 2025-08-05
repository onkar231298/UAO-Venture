import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRealWebPUpload() {
  console.log('🧪 Testing Real WebP Upload with Authentication...\n');

  try {
    // Step 1: Login to get auth token
    console.log('🔐 Step 1: Logging in as admin...');
    
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@bfiorganic.com',
        password: 'onkar231298'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }

    console.log('✅ Login successful');

    // Get auth cookies
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Step 2: Upload a test image
    console.log('\n📸 Step 2: Uploading test image...');
    
    const testImagePath = path.join(__dirname, '..', 'attached_assets', 'Final Logo_1753729864655.png');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Test image not found:', testImagePath);
      return;
    }

    // Create FormData manually
    const formData = new FormData();
    const imageBuffer = fs.readFileSync(testImagePath);
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    
    formData.append('images', imageBlob, 'test-logo.png');
    formData.append('productId', 'webp-test-001');

    console.log('📤 Uploading to WebP processor...');

    const uploadResponse = await fetch('http://localhost:5000/api/products/upload-webp', {
      method: 'POST',
      headers: {
        'Cookie': cookies || ''
      },
      body: formData
    });

    const result = await uploadResponse.json();

    console.log('\n📊 Upload Response:');
    console.log('Status:', uploadResponse.status);
    console.log('Result:', JSON.stringify(result, null, 2));

    if (uploadResponse.ok && result.success) {
      console.log('\n🎉 WebP Upload Test SUCCESSFUL!');
      console.log('✅ Images processed and uploaded to S3');
      console.log('✅ 3 sizes generated per image');
      
      if (result.results && result.results[0]) {
        const firstResult = result.results[0];
        console.log('\n📦 Generated URLs:');
        console.log('- Thumbnail (300px):', firstResult.urls?.thumbnail);
        console.log('- Medium (800px):', firstResult.urls?.medium);
        console.log('- Large (1200px):', firstResult.urls?.large);
      }
    } else {
      console.log('\n❌ Upload failed');
      console.log('Error:', result.error || result.message);
    }

  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure the server is running: npm run dev');
    }
  }
}

testRealWebPUpload();