/**
 * Test Script: AWS S3 Connection
 * 
 * This script tests your AWS S3 configuration and credentials
 */

async function testS3Connection() {
  console.log('🔍 Testing AWS S3 connection...\n');

  // Check environment variables
  const requiredVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY', 
    'AWS_S3_BUCKET_NAME',
    'AWS_REGION'
  ];

  console.log('📋 Checking environment variables:');
  let missingVars = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: ${'*'.repeat(Math.min(value.length, 20))}`);
    } else {
      console.log(`   ❌ ${varName}: Not set`);
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.log(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.log('\n📝 Please add these to your Replit Secrets:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    return;
  }

  try {
    // Test S3 service manually
    console.log('\n🧪 Testing S3 service...');
    
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

    // Test presigned URL generation
    console.log('\n🔗 Testing presigned URL generation...');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: 'test/upload-test.jpg',
      ContentType: 'image/jpeg',
    });
    
    const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 900 });
    console.log(`   ✅ Presigned URL generated successfully`);
    console.log(`   📄 URL length: ${uploadUrl.length} characters`);

    // Test public URL format
    console.log('\n🔍 Testing public URL format...');
    const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/categories/test-image.jpg`;
    console.log(`   📄 Public URL format: ${publicUrl}`);

    console.log('\n🎉 AWS S3 connection test completed successfully!');
    console.log('\n✅ Your AWS S3 configuration is working correctly.');
    console.log('📝 You can now proceed with uploading images.');

  } catch (error) {
    console.error('\n❌ S3 connection test failed:', error.message);
    
    if (error.message.includes('credentials')) {
      console.log('\n💡 Possible solutions:');
      console.log('   - Verify your AWS Access Key and Secret Key are correct');
      console.log('   - Check that your IAM user has S3 permissions');
      console.log('   - Ensure the bucket name exists and is accessible');
    }
    
    if (error.message.includes('region')) {
      console.log('\n💡 Region issue:');
      console.log('   - Verify your AWS_REGION matches your bucket region');
      console.log('   - Common regions: us-east-1, us-west-2, eu-west-1, ap-south-1');
    }
  }
}

testS3Connection();