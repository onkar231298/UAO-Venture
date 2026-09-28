# Complete AWS Setup Guide for BFI Organic Platform

## Step 1: Create AWS Account (Free)

1. **Go to AWS Website**
   - Visit: https://aws.amazon.com
   - Click "Create an AWS Account"

2. **Account Information**
   - Enter your email address
   - Choose account name: "BFI-Organic" or your business name
   - Click "Verify email address"

3. **Contact Information**
   - Choose "Business" or "Personal"
   - Fill in your business details:
     - Company name: Cape NatureX Organic Pvt. Ltd.
     - Address: C/O Cape NatureX International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui, Mehsana, Gujarat 384001
     - Phone: +91-7249847439

4. **Payment Information**
   - Add a credit/debit card (required for verification)
   - AWS Free Tier includes: 5GB S3 storage, 20,000 GET requests, 2,000 PUT requests per month
   - You won't be charged unless you exceed free tier limits

5. **Identity Verification**
   - Enter phone number for SMS verification
   - Complete the automated call verification

6. **Support Plan**
   - Choose "Basic Support - Free"

## Step 2: Access AWS Console

1. **Sign In**
   - Go to: https://console.aws.amazon.com
   - Use your root account credentials

2. **Choose Region**
   - Top-right corner, select region closest to your users
   - Recommended: "Asia Pacific (Mumbai) ap-south-1" (for India)
   - Or "US East (N. Virginia) us-east-1" (most cost-effective)

## Step 3: Create IAM User (Security Best Practice)

1. **Go to IAM Service**
   - In AWS Console, search "IAM"
   - Click "Identity and Access Management"

2. **Create User**
   - Left sidebar → "Users" → "Create user"
   - Username: `bfi-s3-uploader`
   - Check "Provide user access to the AWS Management Console" (optional)
   - Choose "I want to create an IAM user"

3. **Set Permissions**
   - Choose "Attach policies directly"
   - Search and select: `AmazonS3FullAccess`
   - Click "Next" → "Create user"

4. **Create Access Keys**
   - Click on your new user: `bfi-s3-uploader`
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Choose "Application running outside AWS"
   - Click "Next" → "Create access key"
   - **IMPORTANT**: Copy and save these immediately:
     - Access Key ID (starts with AKIA...)
     - Secret Access Key (long random string)

## Step 4: Create S3 Bucket

1. **Go to S3 Service**
   - In AWS Console, search "S3"
   - Click "Amazon S3"

2. **Create Bucket**
   - Click "Create bucket"
   - Bucket name: `bfi-organic-products-2025` (must be globally unique)
   - If taken, try: `bfi-organic-store-2025` or `brightfame-organic-images`
   - Region: Same as you selected earlier (ap-south-1 or us-east-1)

3. **Configure Permissions**
   - **Uncheck** "Block all public access"
   - Check the acknowledgment box
   - Leave other settings as default
   - Click "Create bucket"

4. **Set Bucket Policy**
   - Click on your new bucket
   - Go to "Permissions" tab
   - Scroll to "Bucket policy" → "Edit"
   - Paste this policy (replace `bfi-organic-images` with your bucket name):

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

5. **Enable CORS**
   - Still in "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)" → "Edit"
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

## Step 5: Your Credentials Summary

After completing the above steps, you should have:

1. **AWS_ACCESS_KEY_ID**: Starts with "AKIA..." (from Step 3.4)
2. **AWS_SECRET_ACCESS_KEY**: Long random string (from Step 3.4)
3. **AWS_S3_BUCKET_NAME**: Your bucket name (e.g., "bfi-organic-products-2025")
4. **AWS_REGION**: Your chosen region (e.g., "ap-south-1" or "us-east-1")

## Step 6: Test Your Setup

1. **Upload Test Image**
   - In S3 Console, click your bucket
   - Click "Upload" → "Add files"
   - Choose any image file
   - Click "Upload"

2. **Make It Public**
   - Click on the uploaded file
   - Go to "Permissions" tab
   - Under "Access control list (ACL)" → "Edit"
   - Check "Read" for "Everyone (public access)"
   - Save changes

3. **Test URL**
   - Copy the "Object URL" from the file details
   - Open in browser - image should display
   - URL format: `https://bfi-organic-products-2025.s3.ap-south-1.amazonaws.com/your-image.jpg`

## Security Tips

- Never share your Secret Access Key
- Use IAM users instead of root account for applications
- Enable MFA (Multi-Factor Authentication) on your root account
- Monitor your billing dashboard regularly

## Cost Information

- **Free Tier**: 5GB storage, 20,000 GET requests, 2,000 PUT requests per month
- **After Free Tier**: ~$0.023 per GB per month for storage
- **Bandwidth**: Free for first 100GB/month outbound

Your BFI Organic platform should easily stay within free tier limits for thousands of product images.

## Next Steps

Once you have all 4 credentials:
1. Add them to your Replit project secrets
2. I'll configure your platform to use AWS S3
3. Delete all old images from Replit object storage
4. Test the new system with category image uploads

---

**Need Help?** 
- AWS Support: https://console.aws.amazon.com/support/
- AWS Free Tier Details: https://aws.amazon.com/free/