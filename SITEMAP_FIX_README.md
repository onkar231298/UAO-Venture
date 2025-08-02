# Sitemap Fix for Production Deployment

## Problem
Production server at `bright-organic.com` was serving HTML instead of XML for sitemap requests.

## Solution Applied
Added direct sitemap route handling in `server/index.ts` before Vite middleware to ensure proper XML serving.

## Files Modified
1. `server/index.ts` - Added direct `/sitemap.xml` route handler
2. `public/sitemap.xml` - Updated with comprehensive sitemap content
3. `public/robots.txt` - Updated sitemap reference

## Verification
Development server now correctly serves:
- URL: `http://localhost:5000/sitemap.xml`
- Content-Type: `application/xml`
- Contains all main pages and sample products

## For Production Deployment
The same fix should work on production. The key changes ensure:
1. Sitemap route is handled before React app routing
2. Correct XML content-type headers are set
3. Static XML file is served from public folder

## Google Search Console
Once production is updated, use: `sitemap.xml` in Google Search Console