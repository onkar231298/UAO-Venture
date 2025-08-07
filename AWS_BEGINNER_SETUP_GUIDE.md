# Complete AWS S3 Setup Guide for Beginners

## 🎯 What You Need
You need these 4 credentials for your product images:
1. **AWS_ACCESS_KEY_ID** - Your access key
2. **AWS_SECRET_ACCESS_KEY** - Your secret key  
3. **AWS_S3_BUCKET_NAME** - Your bucket name
4. **AWS_REGION** - Your bucket region

---

## 📋 Step 1: Create AWS Account

### If you DON'T have an AWS account:
1. **Go to**: https://aws.amazon.com/
2. **Click**: "Create an AWS Account" (orange button)
3. **Fill in**:
   - Email address (use your business email)
   - Password
   - AWS account name: `BFI-Organic-Account`
4. **Choose**: Business account
5. **Enter your company details**:
   - Company name: Bright Fame Organics
   - Phone number, address, etc.
6. **Payment**: Add a credit card (required, but you won't be charged much)
7. **Identity verification**: Enter phone number for SMS verification
8. **Support plan**: Choose "Basic support" (free)
9. **Wait**: Account activation can take a few minutes

### If you already have AWS account:
- Just sign in to: https://console.aws.amazon.com/

---

## 🔑 Step 2: Create IAM User (Security Best Practice)

**Important**: Never use your root account for daily operations!

1. **Go to**: AWS Console → Search "IAM" → Click IAM
2. **Click**: "Users" in left sidebar
3. **Click**: "Create user" (orange button)
4. **User name**: `bfi-s3-uploader`
5. **Click**: "Next"
6. **Permission options**: Select "Attach policies directly"
7. **Search for**: `AmazonS3FullAccess`
8. **Check the box** next to `AmazonS3FullAccess`
9. **Click**: "Next"
10. **Review** and **Click**: "Create user"

---

## 🔐 Step 3: Generate Access Keys

1. **Click** on your new user: `bfi-s3-uploader`
2. **Go to**: "Security credentials" tab
3. **Scroll down** to "Access keys" section
4. **Click**: "Create access key"
5. **Select**: "Application running outside AWS"
6. **Check**: "I understand the above recommendation"
7. **Click**: "Next"
8. **Description**: `BFI Product Images Upload`
9. **Click**: "Create access key"

### 🚨 IMPORTANT - Save These Now:
```
AWS_ACCESS_KEY_ID: AKIA... (starts with AKIA)
AWS_SECRET_ACCESS_KEY: ... (long random string)
```

**⚠️ WARNING**: You can only see the secret key ONCE! Copy both keys immediately.

---

## 📦 Step 4: Create S3 Bucket

1. **Go to**: AWS Console → Search "S3" → Click S3
2. **Click**: "Create bucket" (orange button)
3. **Bucket name**: `bfi-product-images-2025` 
   - (Must be globally unique - if taken, try: `bfi-products-jan2025` or `brightfame-products-2025`)
4. **Region**: Choose one:
   - **For India**: `Asia Pacific (Mumbai) ap-south-1`
   - **For Global**: `US East (N. Virginia) us-east-1`
5. **Object Ownership**: Keep default "ACLs disabled"
6. **Block Public Access**: **UNCHECK ALL 4 BOXES**
   - ☐ Block all public access
   - ☐ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ☐ Block public access to buckets and objects granted through any access control lists (ACLs)  
   - ☐ Block public access to buckets and objects granted through new public bucket or access point policies
   - ☐ Block public access to buckets and objects granted through any public bucket or access point policies
7. **Acknowledge**: "I acknowledge that the current settings might result in this bucket and the objects within becoming public"
8. **Bucket Versioning**: Disable (default)
9. **Tags**: Skip (optional)
10. **Default encryption**: Keep default
11. **Click**: "Create bucket"

---

## 🔧 Step 5: Configure Bucket Permissions

### 5A: Set Bucket Policy
1. **Click** on your bucket name: `bfi-product-images-2025`
2. **Go to**: "Permissions" tab
3. **Scroll to**: "Bucket policy" section
4. **Click**: "Edit"
5. **Paste this policy** (replace `YOUR-BUCKET-NAME`):

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

6. **Click**: "Save changes"

### 5B: Set CORS Configuration
1. **Scroll to**: "Cross-origin resource sharing (CORS)"
2. **Click**: "Edit"
3. **Paste this configuration**:

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

4. **Click**: "Save changes"

---

## ✅ Step 6: Get Your 4 Credentials

You now have all 4 credentials:

1. **AWS_ACCESS_KEY_ID**: `AKIA...` (from Step 3)
2. **AWS_SECRET_ACCESS_KEY**: `...` (from Step 3)  
3. **AWS_S3_BUCKET_NAME**: `bfi-product-images-2025` (from Step 4)
4. **AWS_REGION**: `ap-south-1` or `us-east-1` (from Step 4)

---

## 🔒 Step 7: Add to Replit Secrets

1. **In your Replit project**: Click "Secrets" tab (🔒 icon in sidebar)
2. **Add these 4 secrets**:

```
Secret Key: AWS_ACCESS_KEY_ID
Value: AKIA... (your access key)

Secret Key: AWS_SECRET_ACCESS_KEY  
Value: ... (your secret key)

Secret Key: AWS_S3_BUCKET_NAME
Value: bfi-product-images-2025

Secret Key: AWS_REGION
Value: ap-south-1
```

3. **Click**: "Add secret" for each one
4. **Restart** your Replit project

---

## 💰 Cost Estimate

**AWS Free Tier** (first 12 months):
- ✅ 5GB storage: **FREE**
- ✅ 20,000 GET requests: **FREE**  
- ✅ 2,000 PUT requests: **FREE**

**After Free Tier** (very low cost):
- Storage: ~$0.023 per GB per month
- For 1000 product images (~2GB): **~$0.05/month**

---

## 🧪 Test Your Setup

After adding the secrets to Replit:

1. **Restart your project**
2. **Run**: `node scripts/test-product-s3.js`
3. **Look for**: "🎉 AWS S3 Product Image Integration Test Completed!"

---

## 🆘 Common Issues

### "Bucket name already exists"
- Try: `bfi-products-jan2025` or `brightfame-images-2025`

### "AccessDenied" errors
- Double-check bucket policy has correct bucket name
- Ensure IAM user has `AmazonS3FullAccess` policy

### "CORS error"
- Make sure CORS configuration is saved correctly
- Check AllowedOrigins includes "*"

### "Invalid access keys"
- Regenerate access keys if needed
- Make sure no extra spaces in Replit secrets

---

## ✨ What Happens Next

Once your AWS credentials are added:

✅ **Product images** → Upload to your S3 bucket  
✅ **Category images** → Stay in Replit Object Storage  
✅ **Hero slides** → Stay in Replit Object Storage  
✅ **Professional CDN** → Fast global image delivery  
✅ **Cost effective** → Pay only for what you use  

Your platform will automatically handle both storage types seamlessly!