# AWS S3 Quick Setup Checklist ✅

## Pre-Setup
- [ ] Have business email ready
- [ ] Have credit card ready (required but minimal charges)
- [ ] Have company details ready

## AWS Account Setup
- [ ] Create AWS account at https://aws.amazon.com/
- [ ] Verify email and phone
- [ ] Choose Basic support plan (free)
- [ ] Account activated successfully

## IAM User Creation
- [ ] Go to IAM service
- [ ] Create user: `bfi-s3-uploader`
- [ ] Attach policy: `AmazonS3FullAccess`
- [ ] User created successfully

## Access Keys Generation  
- [ ] Go to user Security credentials
- [ ] Create access key for "Application running outside AWS"
- [ ] **SAVE IMMEDIATELY**:
  - [ ] AWS_ACCESS_KEY_ID: `AKIA...`
  - [ ] AWS_SECRET_ACCESS_KEY: `...`

## S3 Bucket Creation
- [ ] Go to S3 service
- [ ] Create bucket name: `bfi-product-images-2025` (or variant)
- [ ] Choose region: `ap-south-1` (Mumbai) or `us-east-1` (Virginia)
- [ ] **UNCHECK** all "Block public access" boxes
- [ ] Acknowledge public access warning
- [ ] Bucket created successfully

## Bucket Configuration
- [ ] Set bucket policy (allows public read)
- [ ] Set CORS configuration (allows uploads)
- [ ] Both configurations saved

## Replit Integration
- [ ] Add 4 secrets to Replit:
  - [ ] AWS_ACCESS_KEY_ID
  - [ ] AWS_SECRET_ACCESS_KEY  
  - [ ] AWS_S3_BUCKET_NAME
  - [ ] AWS_REGION
- [ ] Restart Replit project

## Testing
- [ ] Run: `node scripts/test-product-s3.js`
- [ ] See success message: "🎉 AWS S3 Product Image Integration Test Completed!"
- [ ] Product upload ready to use

---

## Your 4 Credentials Template

```
AWS_ACCESS_KEY_ID=AKIA________________
AWS_SECRET_ACCESS_KEY=________________________________
AWS_S3_BUCKET_NAME=bfi-product-images-2025
AWS_REGION=ap-south-1
```

## Need Help?
- **Bucket name conflicts**: Try `bfi-products-jan2025` or `brightfame-images-2025`
- **Access denied**: Check IAM permissions and bucket policy
- **CORS errors**: Verify CORS configuration saved correctly
- **Connection issues**: Restart Replit after adding secrets

Your platform will automatically use S3 for product images and Replit storage for everything else!