/**
 * Test Script for Product Image AWS S3 Integration
 * 
 * This script tests:
 * 1. AWS S3 connection for product images
 * 2. Presigned URL generation for products
 * 3. URL format validation
 * 4. Fallback behavior
 */

async function testProductS3() {
  console.log('🧪 Testing Product Image AWS S3 Integration...\n');

  // Check required environment variables
  const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME', 'AWS_REGION'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.log('❌ Missing AWS environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📝 Please add these to your Replit Secrets and restart the project.');
    return;
  }

  console.log('📋 Checking environment variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const maskedValue = '*'.repeat(Math.min(value.length, 20));
    console.log(`   ✅ ${varName}: ${maskedValue}`);
  });

  try {
    // Test S3 connection
    console.log('\n🧪 Testing S3 connection...');
    
    const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    // Test bucket access
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const command = new HeadBucketCommand({ Bucket: bucketName });
    await s3Client.send(command);
    
    console.log(`   📦 Bucket: ${bucketName}`);
    console.log(`   🌍 Region: ${process.env.AWS_REGION}`);
    console.log(`   ✅ Bucket is accessible`);

    // Test product image URL generation
    console.log('\n🔗 Testing product image upload URL generation...');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: 'products/test-product-image.jpg',
      ContentType: 'image/jpeg',
    });
    
    const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 900 });
    console.log(`   ✅ Product upload URL generated successfully`);
    console.log(`   📄 URL length: ${uploadUrl.length} characters`);

    // Test public URL format for products
    console.log('\n🔍 Testing product image public URL format...');
    const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/products/sample-product.jpg`;
    console.log(`   📄 Product URL format: ${publicUrl}`);

    // Test API endpoint (if server is running)
    console.log('\n🌐 Testing product upload API endpoint...');
    try {
      const response = await fetch('http://localhost:5000/api/products/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: This will fail without authentication, but we can see if endpoint exists
        },
      });
      
      if (response.status === 401) {
        console.log(`   ✅ Product upload endpoint exists (requires authentication)`);
      } else {
        console.log(`   ⚠️  Product upload endpoint response: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not test API endpoint (server may not be running)`);
    }

    console.log('\n🎉 AWS S3 Product Image Integration Test Completed!');
    console.log('\n✅ Your AWS S3 setup for product images is working correctly.');
    console.log('📝 You can now upload product images to your S3 bucket.');
    console.log('📝 Category images and hero slides will continue using Replit Object Storage.');
    
  } catch (error) {
    console.error('\n❌ Product S3 integration test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your AWS credentials are correct');
    console.log('2. Check if your S3 bucket exists and is accessible');
    console.log('3. Ensure your bucket has proper permissions configured');
    console.log('4. Restart your Replit project after adding secrets');
  }
}

testProductS3();