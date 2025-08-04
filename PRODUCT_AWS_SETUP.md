# AWS S3 Setup for Product Images Only

## 🎯 Storage Strategy

**Product Images**: AWS S3 (Professional CDN)  
**Category Images**: Replit Object Storage  
**Hero Slides**: Replit Object Storage  
**All Other Files**: Replit Object Storage  

## ✅ Already Completed

- All existing product images removed from database
- Platform configured for AWS S3 product images only
- Replit storage maintained for categories and hero slides
- Smart upload system implemented

## 🛠️ AWS Setup Steps

### Step 1: Create AWS Account & IAM User

1. **Create AWS Account** (if you don't have one)
   - Go to: https://aws.amazon.com/
   - Click "Create an AWS Account"
   - Follow the registration process

2. **Create IAM User for S3 Access**
   - Go to AWS Console → IAM
   - Click "Users" → "Create user"
   - Username: `bfi-product-uploader`
   - Select "Attach policies directly"
   - Add policy: `AmazonS3FullAccess`
   - Create user

3. **Generate Access Keys**
   - Click on your new user
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Select "Application running outside AWS"
   - Save both keys securely!

### Step 2: Create S3 Bucket for Products

1. **Go to S3 Service**
   - AWS Console → S3
   - Click "Create bucket"

2. **Bucket Configuration**
   - **Bucket name**: `bfi-product-images-2025` (must be globally unique)
   - **Region**: `ap-south-1` (Mumbai) or `us-east-1` (Virginia)
   - **Uncheck** "Block all public access"
   - **Acknowledge** the warning about public access
   - Click "Create bucket"

### Step 3: Configure Bucket Permissions

1. **Set Bucket Policy**
   - Click your bucket → Permissions tab
   - Scroll to "Bucket policy" → Edit
   - Paste this policy (replace bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bfi-product-images-2025/*"
    }
  ]
}
```

2. **Configure CORS**
   - Scroll to "Cross-origin resource sharing (CORS)" → Edit
   - Paste this configuration:

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

### Step 4: Add Credentials to Replit

Add these 4 secrets in your Replit Secrets tab:

1. **AWS_ACCESS_KEY_ID**: Your IAM access key (starts with AKIA...)
2. **AWS_SECRET_ACCESS_KEY**: Your IAM secret key (long random string)
3. **AWS_S3_BUCKET_NAME**: `bfi-product-images-2025` (your bucket name)
4. **AWS_REGION**: `ap-south-1` (or your chosen region)

## 📁 File Organization

Your new S3 bucket will organize product images like this:

```
bfi-product-images-2025/
└── products/
    ├── uuid-1.jpg (main product image)
    ├── uuid-2.jpg (gallery image)
    ├── uuid-3.jpg (gallery image)
    └── uuid-4.jpg (product certificate)
```

## 🧪 Testing Your Setup

1. **Add AWS credentials** to Replit Secrets
2. **Restart your project**
3. **Go to Products Management**
4. **Try uploading a product image**
5. **Verify the image URL** contains your S3 bucket name

Expected URL format:
`https://bfi-product-images-2025.s3.ap-south-1.amazonaws.com/products/uuid.jpg`

## 💰 Cost Estimate

**AWS Free Tier** (first 12 months):
- 5GB storage: FREE
- 20,000 GET requests: FREE
- 2,000 PUT requests: FREE

**After Free Tier**:
- Storage: ~$0.023/GB/month
- GET requests: $0.0004/1,000 requests
- PUT requests: $0.005/1,000 requests

For typical product catalog: **$2-5/month**

## 🔄 Migration Benefits

✅ **Separated Concerns**: Products on S3, other images on Replit  
✅ **Professional CDN**: Fast global image delivery for products  
✅ **Cost Effective**: Pay only for product images storage  
✅ **Scalable**: Handle unlimited product images  
✅ **Clean Architecture**: Clear separation of image types  

## 🚨 Important Notes

- **Only product images** will use AWS S3
- **Category images** remain in Replit Object Storage
- **Hero slides** remain in Replit Object Storage
- Your platform automatically handles both storage types
- No existing functionality is broken

## ✅ Ready to Upload!

Once you add the 4 AWS credentials, your platform will automatically use S3 for all new product image uploads while keeping existing category/hero functionality intact.