# AWS S3 Setup Guide for BFI Organic Platform

## Required Environment Variables

Add these environment variables to your Replit project:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=bfi-organic-products
AWS_CLOUDFRONT_URL=https://your-cloudfront-domain.com (optional)
```

## Step-by-Step AWS Setup

### 1. Create AWS Account & S3 Bucket
1. Sign up for AWS account at aws.amazon.com
2. Go to S3 Console
3. Create bucket named `bfi-organic-products`
4. Set bucket to **public read** for product images
5. Enable CORS for web uploads

### 2. Create IAM User for S3 Access
1. Go to IAM Console
2. Create new user: `bfi-s3-uploader`
3. Attach policy: `AmazonS3FullAccess`
4. Generate Access Keys
5. Copy Access Key ID and Secret Access Key

### 3. Configure Bucket Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bfi-organic-products/*"
    }
  ]
}
```

### 4. CORS Configuration
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## How It Works

### Image Upload Flow:
1. **User selects file** → Frontend captures file
2. **File uploads to S3** → Server processes upload using multer-s3
3. **S3 returns URL** → `https://bfi-organic-products.s3.amazonaws.com/products/BFI001/main-image-123456.jpg`
4. **URL saved to database** → Product record stores S3 URL
5. **Images display fast** → Direct loading from AWS CDN

### File Organization:
```
bfi-organic-products/
├── products/
│   ├── BFI001/
│   │   ├── main-image-123456.jpg
│   │   ├── gallery-1-123457.jpg
│   │   └── coa-document-123458.pdf
│   └── BFI002/
│       ├── main-image-123459.jpg
│       └── certificate-123460.pdf
```

## Benefits of AWS S3:

✅ **Professional CDN** - Images load fast worldwide
✅ **Unlimited Storage** - No server space concerns  
✅ **Automatic Backup** - 99.999999999% durability
✅ **Cost Effective** - Pay only for what you use
✅ **Scalable** - Handles any traffic volume
✅ **Security** - Enterprise-grade file security

## Testing the Upload

1. Set up AWS credentials in environment variables
2. Go to Website Management → Add Product
3. Upload an image file using the file input
4. Check if image appears with S3 URL
5. Verify image loads correctly in product preview

The system supports both direct URLs and file uploads, giving you flexibility in how you manage product images.