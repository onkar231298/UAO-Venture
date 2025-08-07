# Fresh AWS S3 Setup for BFI Organic Platform

## Current Status
✅ All existing product images removed from database  
✅ Platform ready for fresh AWS S3 integration  
✅ Smart upload system with fallback to Replit Object Storage  

## Quick Setup Steps

### Step 1: Create New AWS S3 Bucket
1. **Go to AWS Console** → S3 Service
2. **Create New Bucket**:
   - Name: `bfi-organic-products-2025` (or similar unique name)
   - Region: `ap-south-1` (Mumbai) or `us-east-1` (Virginia)
   - **Uncheck** "Block all public access"
   - Create bucket

### Step 2: Configure Bucket Permissions
1. **Click your new bucket** → Permissions tab
2. **Bucket Policy** → Edit → Paste this (replace bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bfi-organic-products-2025/*"
    }
  ]
}
```

3. **CORS Configuration** → Edit → Paste this:

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

### Step 3: Get Your Credentials
You'll need these 4 values for Replit Secrets:

1. **AWS_ACCESS_KEY_ID**: From your IAM user
2. **AWS_SECRET_ACCESS_KEY**: From your IAM user
3. **AWS_S3_BUCKET_NAME**: Your new bucket name (e.g., `bfi-organic-products-2025`)
4. **AWS_REGION**: Your bucket region (e.g., `ap-south-1`)

### Step 4: Add to Replit Secrets
1. Go to your Replit project
2. Click **Secrets** tab (🔒 icon)
3. Add each credential as a new secret
4. Restart your project

## File Organization Structure

Your new S3 bucket will organize files like this:

```
bfi-organic-products-2025/
├── categories/
│   ├── adaptogenic-herbs-image.jpg
│   ├── organic-spices-image.jpg
│   └── superfoods-image.jpg
├── products/
│   ├── BFI001/
│   │   ├── main-image.jpg
│   │   ├── gallery-1.jpg
│   │   └── certificate.pdf
│   └── BFI002/
│       ├── main-image.jpg
│       └── specification.pdf
└── hero-slides/
    ├── slide-1-banner.jpg
    └── slide-2-banner.jpg
```

## Testing Your Setup

After adding AWS credentials:

1. **Test Upload**: Go to Website Management → Categories
2. **Upload Image**: Try uploading a category image
3. **Verify**: Image should appear with S3 URL format:
   `https://bfi-organic-products-2025.s3.ap-south-1.amazonaws.com/categories/...`

## Fallback System

Your platform has smart fallback:
- **Primary**: AWS S3 (fast, professional CDN)
- **Fallback**: Replit Object Storage (if AWS fails)

## Benefits of Fresh Setup

✅ **Clean Start**: No old images or conflicts  
✅ **Professional URLs**: S3 CDN for fast loading  
✅ **Organized Storage**: Proper folder structure  
✅ **Scalable**: Handle unlimited images  
✅ **Reliable**: Automatic fallback system  

## Cost Estimate

**AWS Free Tier** (first 12 months):
- 5GB storage FREE
- 20,000 GET requests FREE  
- 2,000 PUT requests FREE

**After Free Tier**:
- Storage: ~$0.023/GB/month
- Requests: Very minimal cost

For your BFI Organic platform, you'll likely stay within free tier limits.

## Ready to Start!

Once you add the 4 AWS credentials to Replit Secrets, your platform will automatically use the new S3 bucket for all image uploads.