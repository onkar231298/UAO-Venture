import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertInquirySchema, 
  insertQuotationSchema, 
  insertProductSchema, 
  insertCategorySchema,
  insertProductTagSchema,
  insertHeroSliderSchema,
  insertProductDocumentSchema,
  insertSampleRequestSchema,
  insertProductFaqSchema,
  insertBlogPostSchema,
  insertSeoMonitoringSchema,
  insertCoreWebVitalsSchema,
  insertSearchAnalyticsSchema,
  insertHreflangConfigSchema,
  insertGlobalSeoSettingsSchema,
  insertNewsletterSubscriptionSchema,
  customerRegistrationSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import multer from "multer";
import { productImageUpload, heroSliderUpload, generatePresignedUrl, getImageUrl, deleteFromS3 } from "./s3Upload";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { AWSS3Service } from "./awsS3Service";
import { imageProcessor, ImageProcessor } from "./imageProcessor";
import mimeTypes from "mime-types";
import { createStaticProductPage, createStaticHomePage } from "./static-handler";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const s3Service = new AWSS3Service();
  
  // Multer configuration for WebP processing
  const webpUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 10 // Max 10 files per upload
    },
    fileFilter: (req, file, cb) => {
      const mimeType = file.mimetype;
      if (ImageProcessor.isValidImageFormat(mimeType)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported image format: ${mimeType}. Supported: JPEG, PNG, GIF, TIFF, BMP, WebP`));
      }
    }
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // CAPTCHA verification function
  async function verifyCaptcha(token: string, remoteip?: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY!,
          response: token,
          ...(remoteip && { remoteip }),
        }),
      });
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('CAPTCHA verification error:', error);
      return false;
    }
  }

  // Customer registration endpoint
  app.post('/api/auth/register-customer', async (req, res) => {
    try {
      const validatedData = customerRegistrationSchema.parse(req.body);
      const { password, confirmPassword, ...userData } = validatedData;
      
      const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create customer user
      const user = await storage.createCustomer({
        ...userData,
        password: hashedPassword,
        userType: 'customer',
        accountStatus: 'active',
        registrationIp: clientIp,
      });

      res.status(201).json({ 
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
        }
      });
    } catch (error) {
      console.error("Customer registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Customer login route
  app.post('/api/auth/customer-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find customer by email
      const customer = await storage.getUserByEmail(email);
      if (!customer || customer.userType !== 'customer') {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, customer.password || '');
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Return customer info (without password)
      const { password: _, ...customerInfo } = customer;
      res.json({
        message: "Login successful",
        user: customerInfo
      });
    } catch (error) {
      console.error("Error during customer login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin customer management routes
  app.get('/api/admin/customers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { search, country, industryType, accountStatus, page = '1', limit = '20' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const result = await storage.getCustomers({
        search: search as string,
        country: country as string,
        industryType: industryType as string,
        accountStatus: accountStatus as string,
        limit: parseInt(limit),
        offset,
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/admin/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const customer = await storage.getUser(req.params.id);
      if (!customer || customer.userType !== 'customer') {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.put('/api/admin/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = req.body;
      delete updates.password; // Don't allow password updates through this endpoint
      delete updates.id; // Don't allow ID changes

      const updatedCustomer = await storage.updateCustomer(req.params.id, updates);
      res.json(updatedCustomer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });


  // Server-side SEO endpoint for structured data (used by React component)
  app.get('/api/products/:slug/seo', async (req, res) => {
    try {
      const { slug } = req.params;
      const product = await storage.getProductBySlug(slug);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const productUrl = `${baseUrl}/product/${product.slug}`;
      const imageUrl = product.mainImage?.startsWith('http') ? product.mainImage : `${baseUrl}${product.mainImage}`;

      // Get product FAQs for schema
      const productFaqs = await storage.getProductFaqs(product.id);
      
      // Generate enhanced structured data with FAQ schema
      const structuredData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "description": product.description || `High-quality ${product.name} from BFI Organic`,
        "sku": product.productId,
        "mpn": product.productId,
        "brand": {
          "@type": "Brand",
          "name": "BFI Organic",
          "url": baseUrl
        },
        "manufacturer": {
          "@type": "Organization",
          "name": "Bright Fame Organic Pvt. Ltd.",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "C/O Bright Fame International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
            "addressLocality": "Mehsana",
            "addressRegion": "Gujarat",
            "postalCode": "384001",
            "addressCountry": "IN"
          },
          "telephone": "+91-7249847439",
          "url": baseUrl
        },
        "image": imageUrl,
        "url": productUrl,
        "category": product.healthSupport || "Organic Ingredients",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": product.priceUSD || product.rate || 0,
          "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          "availability": product.currentStock && Number(product.currentStock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition",
          "seller": {
            "@type": "Organization",
            "name": "BFI Organic",
            "url": baseUrl
          }
        },
        "additionalProperty": [
          ...(product.botanicalName ? [{
            "@type": "PropertyValue",
            "name": "Botanical Name",
            "value": product.botanicalName
          }] : []),
          ...(product.origin ? [{
            "@type": "PropertyValue", 
            "name": "Origin",
            "value": product.origin
          }] : []),
          ...(product.form ? [{
            "@type": "PropertyValue",
            "name": "Form", 
            "value": product.form
          }] : [])
        ]
      };

      // Add FAQ schema if FAQs exist
      const faqSchema = productFaqs?.length > 0 ? {
        "@context": "https://schema.org/",
        "@type": "FAQPage",
        "mainEntity": productFaqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      } : null;

      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem", 
            "position": 2,
            "name": "Products",
            "item": `${baseUrl}/products`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": product.name,
            "item": productUrl
          }
        ]
      };

      const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Bright Fame Organic Pvt. Ltd.",
        "url": baseUrl,
        "logo": `${baseUrl}/logo.png`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "C/O Bright Fame International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
          "addressLocality": "Mehsana",
          "addressRegion": "Gujarat",
          "postalCode": "384001",
          "addressCountry": "IN"
        },
        "telephone": "+91-7249847439"
      };

      res.json({
        productSchema: structuredData,
        breadcrumbSchema: breadcrumbData,
        organizationSchema: organizationSchema,
        faqSchema: faqSchema,
        seoData: {
          title: product.seoTitle || `${product.name} - BFI Organic`,
          description: product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`,
          canonical: productUrl,
          ogTitle: product.seoTitle || `${product.name} - BFI Organic`,
          ogDescription: product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`,
          ogImage: imageUrl,
          ogUrl: productUrl
        }
      });
    } catch (error) {
      console.error('Error generating SEO data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // IP-based currency detection endpoint
  app.get('/api/detect-currency', async (req, res) => {
    try {
      // Get IP address from request (handle proxy headers)
      const forwarded = req.headers['x-forwarded-for'] as string;
      const clientIP = forwarded ? forwarded.split(',')[0].trim() : 
                      req.headers['x-real-ip'] as string || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress || 
                      '127.0.0.1';

      console.log(`Detecting currency for IP: ${clientIP}`);

      // Skip localhost/development IPs
      if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP?.startsWith('192.168.') || clientIP?.startsWith('10.')) {
        return res.json({ currency: 'USD', source: 'localhost_default', ip: clientIP });
      }

      // Try multiple IP geolocation services
      const services = [
        // Service 1: ipapi.co
        async () => {
          const response = await fetch(`https://ipapi.co/${clientIP}/json/`);
          const data = await response.json();
          return { countryCode: data.country_code, service: 'ipapi.co' };
        },
        
        // Service 2: ip-api.com (free, no key required)
        async () => {
          const response = await fetch(`http://ip-api.com/json/${clientIP}?fields=countryCode`);
          const data = await response.json();
          return { countryCode: data.countryCode, service: 'ip-api.com' };
        }
      ];

      // Country to currency mapping (server-side)
      const COUNTRY_CURRENCY_MAP: Record<string, string> = {
        US: 'USD', CA: 'USD', MX: 'USD', // North America
        IN: 'INR', // India
        DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', // Europe
        PT: 'EUR', IE: 'EUR', FI: 'EUR', LU: 'EUR', MT: 'EUR', CY: 'EUR', SK: 'EUR',
        SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', GR: 'EUR',
        GB: 'GBP', UK: 'GBP', // UK
      };

      // Try each service
      for (const service of services) {
        try {
          const result = await service();
          const currency = COUNTRY_CURRENCY_MAP[result.countryCode] || 'USD';
          
          if (result.countryCode) {
            console.log(`Currency detected: ${result.countryCode} -> ${currency} via ${result.service}`);
            return res.json({ 
              currency, 
              countryCode: result.countryCode, 
              source: result.service,
              ip: clientIP 
            });
          }
        } catch (error) {
          console.warn(`IP service failed:`, error);
          continue;
        }
      }

      // Fallback to USD
      res.json({ currency: 'USD', source: 'fallback', ip: clientIP });
    } catch (error) {
      console.error('Currency detection error:', error);
      res.json({ currency: 'USD', source: 'error_fallback' });
    }
  });

  // Public API routes (no authentication required)
  
  // Get products with advanced filtering
  app.get('/api/products', async (req, res) => {
    try {
      const { 
        category, 
        search, 
        materials, 
        productType,
        isOrganic,
        healthSupport, 
        origin, 
        form, 
        inStock, 
        priceMin, 
        priceMax, 
        sortBy, 
        limit = '50', 
        offset = '0' 
      } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Handle array filters (comma-separated)
      if (category) {
        filters.category = Array.isArray(category) ? category : (category as string).split(',');
      }
      
      if (healthSupport) {
        filters.healthSupport = Array.isArray(healthSupport) ? healthSupport : (healthSupport as string).split(',');
      }
      
      if (origin) {
        filters.origin = Array.isArray(origin) ? origin : (origin as string).split(',');
      }
      
      if (form) {
        filters.form = Array.isArray(form) ? form : (form as string).split(',');
      }
      
      if (materials) {
        filters.materials = Array.isArray(materials) ? materials : (materials as string).split(',');
      }
      
      if (productType) {
        filters.productType = Array.isArray(productType) ? productType : (productType as string).split(',');
      }

      // Handle other filters
      if (search) {
        filters.search = search as string;
      }
      
      if (inStock !== undefined) {
        filters.inStock = inStock === 'true';
      }
      
      if (priceMin && priceMax) {
        filters.priceRange = [parseFloat(priceMin as string), parseFloat(priceMax as string)];
      }
      
      if (sortBy) {
        filters.sortBy = sortBy as string;
      }
      
      // Handle isOrganic filter
      if (isOrganic !== undefined) {
        filters.isOrganic = isOrganic === 'true';
      }

      const result = await storage.getProducts(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get featured products (public endpoint) - MUST be before :id route
  app.get('/api/products/featured', async (req, res) => {
    try {
      const { limit = '8' } = req.query;
      const limitNum = parseInt(limit as string, 10) || 8;
      console.log('Fetching featured products with limit:', limitNum);
      const featuredProducts = await storage.getFeaturedProducts(limitNum);
      console.log('Featured products fetched:', featuredProducts?.length || 0);
      res.json(featuredProducts);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // Get product by slug
  app.get('/api/products/slug/:slug', async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Get single product by ID - MUST be after specific routes
  app.get('/api/products/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Get categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Object storage endpoints for category images
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object storage endpoints - handle /objects/ path for uploaded files
  app.get("/objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upload endpoints - AWS S3 for products, Replit for categories/hero slides
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      // Default to Replit object storage for category/hero uploads
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL, provider: 'replit-object-storage' });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // NEW: Direct WebP processing and upload endpoint for product images
  app.post("/api/products/upload-webp", isAuthenticated, webpUpload.array('images', 10), async (req: any, res) => {
    try {
      if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID) {
        return res.status(503).json({ 
          error: "AWS S3 not configured for product images",
          message: "Please configure AWS credentials for product image uploads" 
        });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const userId = req.user.claims.sub;
      const productId = req.body.productId || `temp-${Date.now()}`;

      console.log(`🚀 Processing ${files.length} images for product ${productId}...`);

      const processedResults = [];

      for (const file of files) {
        try {
          console.log(`📸 Processing: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);

          // Process image into 3 WebP sizes
          const processedImages = await imageProcessor.processProductImage(file.buffer, file.originalname);

          // Upload all 3 sizes to S3
          const uploadedUrls = await s3Service.uploadProductImages(processedImages, productId);

          processedResults.push({
            originalName: file.originalname,
            productId,
            urls: uploadedUrls,
            sizes: processedImages.map(img => ({
              size: img.size,
              width: img.width,
              height: img.height,
              fileSize: img.fileSize
            }))
          });

          console.log(`✅ Successfully processed ${file.originalname}`);

        } catch (error) {
          console.error(`❌ Failed to process ${file.originalname}:`, error);
          processedResults.push({
            originalName: file.originalname,
            error: error instanceof Error ? error.message : 'Processing failed'
          });
        }
      }

      const successCount = processedResults.filter(r => !r.error).length;
      const failCount = processedResults.filter(r => r.error).length;

      console.log(`🎉 WebP processing complete: ${successCount} successful, ${failCount} failed`);

      res.json({
        success: true,
        message: `Processed ${successCount}/${files.length} images successfully`,
        results: processedResults,
        provider: 'aws-s3-webp'
      });

    } catch (error) {
      console.error("WebP processing error:", error);
      res.status(500).json({ 
        error: "WebP processing failed",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Legacy: Product image upload endpoint - AWS S3 only (kept for compatibility)
  app.post("/api/products/upload", isAuthenticated, async (req, res) => {
    try {
      // Check if AWS S3 is configured for product images
      if (process.env.AWS_S3_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID) {
        const uploadURL = await s3Service.getProductImageUploadURL();
        return res.json({ uploadURL, provider: 'aws-s3' });
      } else {
        return res.status(503).json({ 
          error: "AWS S3 not configured for product images",
          message: "Please configure AWS credentials for product image uploads" 
        });
      }
    } catch (error) {
      console.error("Error generating product upload URL:", error);
      res.status(500).json({ error: "Failed to generate product upload URL" });
    }
  });

  // Category image upload endpoint - uses public object storage
  app.post("/api/categories/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getPublicObjectUploadURL();
      return res.json({ uploadURL, provider: 'replit-object-storage-public' });
    } catch (error) {
      console.error("Error generating category upload URL:", error);
      res.status(500).json({ error: "Failed to generate category upload URL" });
    }
  });

  app.put("/api/category-images", isAuthenticated, async (req, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const userId = (req as any).user?.claims?.sub;

    try {
      // Categories always use Replit object storage
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageUrl,
        {
          owner: userId,
          visibility: "public", // Category images should be public
        },
      );

      // Ensure the returned path is clean and doesn't contain full URLs
      const cleanPath = objectPath.startsWith('/objects/') 
        ? objectPath 
        : `/objects/${objectPath}`;

      res.status(200).json({
        objectPath: cleanPath,
        provider: 'replit-object-storage'
      });
    } catch (error) {
      console.error("Error setting category image:", error);
      
      // If ACL setting fails, still try to provide a clean path
      try {
        const objectStorageService = new ObjectStorageService();
        const fallbackPath = objectStorageService.normalizeObjectEntityPath(req.body.imageUrl);
        const cleanPath = fallbackPath.startsWith('/objects/') 
          ? fallbackPath 
          : `/objects/${fallbackPath}`;
          
        res.status(200).json({
          objectPath: cleanPath,
          provider: 'replit-object-storage',
          warning: 'ACL policy not set, but image should still be accessible'
        });
      } catch (fallbackError) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Product image handling endpoint - AWS S3 only
  app.put("/api/product-images", isAuthenticated, async (req, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    try {
      // Check if using AWS S3 for product images
      if (process.env.AWS_S3_BUCKET_NAME && req.body.imageUrl.includes('amazonaws.com')) {
        const { AWSS3Service } = await import('./awsS3Service');
        const s3Service = new AWSS3Service();
        const objectKey = s3Service.extractObjectKey(req.body.imageUrl);
        
        if (objectKey) {
          // Return the public S3 URL for products
          const publicUrl = s3Service.getObjectURL(objectKey);
          return res.status(200).json({
            objectPath: publicUrl,
            provider: 'aws-s3'
          });
        }
      }
      
      return res.status(400).json({ 
        error: "Invalid product image URL or AWS S3 not configured",
        message: "Product images must be uploaded to AWS S3" 
      });
    } catch (error) {
      console.error("Error setting product image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get hero slides
  app.get('/api/hero-slides', async (req, res) => {
    try {
      const slides = await storage.getHeroSlides();
      res.json(slides);
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      res.status(500).json({ message: "Failed to fetch hero slides" });
    }
  });

  // Create hero slide
  app.post('/api/hero-slides', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const slideData = insertHeroSliderSchema.parse(req.body);
      const slide = await storage.createHeroSlide(slideData);
      res.json(slide);
    } catch (error) {
      console.error("Error creating hero slide:", error);
      res.status(500).json({ message: "Failed to create hero slide" });
    }
  });

  // Update hero slide
  app.put('/api/hero-slides/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const slideData = req.body;
      const slide = await storage.updateHeroSlide(parseInt(id), slideData);
      res.json(slide);
    } catch (error) {
      console.error("Error updating hero slide:", error);
      res.status(500).json({ message: "Failed to update hero slide" });
    }
  });

  // Delete hero slide
  app.delete('/api/hero-slides/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      await storage.deleteHeroSlide(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting hero slide:", error);
      res.status(500).json({ message: "Failed to delete hero slide" });
    }
  });



  // Get product documents
  app.get('/api/products/:id/documents', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const documents = await storage.getProductDocuments(productId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get frequently bought together products
  app.get('/api/products/:id/frequently-bought-together', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 8;
      const relatedProducts = await storage.getFrequentlyBoughtTogether(productId, limit);
      res.json(relatedProducts);
    } catch (error) {
      console.error("Error fetching frequently bought together products:", error);
      res.status(500).json({ message: "Failed to fetch related products" });
    }
  });

  // Get similar/related products
  app.get('/api/products/:id/similar', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 8;
      const similarProducts = await storage.getSimilarProducts(productId, limit);
      res.json(similarProducts);
    } catch (error) {
      console.error("Error fetching similar products:", error);
      res.status(500).json({ message: "Failed to fetch similar products" });
    }
  });

  // Protected API routes (authentication required)

  // Create inquiry (allow both admin and customer creation)
  app.post('/api/inquiries', async (req: any, res) => {
    try {
      let customerId = null;
      
      // Check if admin user is authenticated
      if (req.user && req.user.claims && req.user.claims.sub) {
        customerId = req.user.claims.sub;
      }
      // For customer users, customerId should be sent from frontend
      else if (req.body.customerId) {
        customerId = req.body.customerId;
      }
      
      const inquiryData = insertInquirySchema.parse({ ...req.body, customerId });
      
      const inquiry = await storage.createInquiry(inquiryData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      console.error("Error creating inquiry:", error);
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  // Get user's inquiries
  app.get('/api/inquiries', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Admin inquiries request - User:', req.user);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      console.log('Found user:', user);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Role-based filtering
      if (user.role === 'customer') {
        filters.customerId = userId;
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        // Admin users see all inquiries - no filtering
      } else if (user.role?.includes('sales')) {
        filters.assignedTo = userId;
      }

      if (status && status !== 'all') {
        filters.status = status as string;
      }

      console.log('Using filters:', filters);
      const result = await storage.getInquiries(filters);
      console.log('Inquiry results:', result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Customer-specific endpoints (no auth required, customer ID from request body)
  app.get('/api/customer/inquiries/:customerId', async (req: any, res) => {
    try {
      const customerId = req.params.customerId;
      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        customerId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getInquiries(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching customer inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.get('/api/customer/sample-requests/:customerId', async (req: any, res) => {
    try {
      const customerId = req.params.customerId;
      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        customerId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getSampleRequests(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching customer sample requests:", error);
      res.status(500).json({ message: "Failed to fetch sample requests" });
    }
  });

  app.get('/api/customer/quotations/:customerId', async (req: any, res) => {
    try {
      const customerId = req.params.customerId;
      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        customerId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getQuotations(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching customer quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  // Update inquiry (for sales team)
  app.put('/api/inquiries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('sales') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const inquiryId = parseInt(req.params.id);
      const updateData = req.body;
      
      const inquiry = await storage.updateInquiry(inquiryId, updateData);
      res.json(inquiry);
    } catch (error) {
      console.error("Error updating inquiry:", error);
      res.status(500).json({ message: "Failed to update inquiry" });
    }
  });

  // Sample Request routes

  // Create sample request (for both logged in and non-logged users)
  app.post('/api/sample-requests', async (req: any, res) => {
    try {
      let customerId = null;
      
      // Check if admin user is authenticated
      if (req.user && req.user.claims && req.user.claims.sub) {
        customerId = req.user.claims.sub;
      }
      // For customer users, customerId should be sent from frontend
      else if (req.body.customerId) {
        customerId = req.body.customerId;
      }
      
      const requestData = insertSampleRequestSchema.parse({ 
        ...req.body, 
        customerId 
      });
      
      const sampleRequest = await storage.createSampleRequest(requestData);
      res.status(201).json(sampleRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sample request data", errors: error.errors });
      }
      console.error("Error creating sample request:", error);
      res.status(500).json({ message: "Failed to create sample request" });
    }
  });

  // Get sample requests (admin/sales only)
  app.get('/api/sample-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Role-based filtering
      if (user.role?.includes('sales') && !user.role?.includes('admin')) {
        filters.assignedTo = userId;
      }

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getSampleRequests(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching sample requests:", error);
      res.status(500).json({ message: "Failed to fetch sample requests" });
    }
  });

  // Update sample request (for admin/sales team)
  app.put('/api/sample-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const requestId = parseInt(req.params.id);
      const updateData = req.body;
      
      const sampleRequest = await storage.updateSampleRequest(requestId, updateData);
      res.json(sampleRequest);
    } catch (error) {
      console.error("Error updating sample request:", error);
      res.status(500).json({ message: "Failed to update sample request" });
    }
  });

  // Enhanced inquiry creation - allow both logged in and non-logged users
  app.post('/api/inquiries-enhanced', async (req: any, res) => {
    try {
      let customerId = null;
      
      // Check if user is authenticated
      if (req.user && req.user.claims && req.user.claims.sub) {
        customerId = req.user.claims.sub;
      }
      
      const inquiryData = insertInquirySchema.parse({ 
        ...req.body, 
        customerId 
      });
      
      const inquiry = await storage.createInquiry(inquiryData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      console.error("Error creating inquiry:", error);
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  // Get quotations
  app.get('/api/quotations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Role-based filtering
      if (user.role === 'customer') {
        filters.customerId = userId;
      }

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getQuotations(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  // Create quotation (for sales team)
  app.post('/api/quotations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('sales') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      console.log("Received quotation data:", req.body);
      
      // Convert string date to Date object if needed
      const processedData = {
        ...req.body,
        createdBy: userId,
        validUntil: typeof req.body.validUntil === 'string' ? new Date(req.body.validUntil) : req.body.validUntil
      };
      
      const quotationData = insertQuotationSchema.parse(processedData);
      console.log("Parsed quotation data:", quotationData);
      
      const quotation = await storage.createQuotation(quotationData);
      
      // Update the inquiry status to "responded" when quotation is created
      if (quotation.inquiryId) {
        await storage.updateInquiry(quotation.inquiryId, { 
          status: 'responded',
          assignedTo: userId 
        });
      }
      
      res.status(201).json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid quotation data", errors: error.errors });
      }
      console.error("Error creating quotation:", error);
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  // Accept quotation (for customers)
  app.patch('/api/quotations/:id/accept', async (req: any, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.updateQuotation(quotationId, { 
        status: 'accepted'
      });
      res.json(quotation);
    } catch (error) {
      console.error("Error accepting quotation:", error);
      res.status(500).json({ message: "Failed to accept quotation" });
    }
  });

  // Generate PDF for quotation
  app.get('/api/quotations/:id/pdf', async (req: any, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      
      // Get quotation with product details
      const result = await storage.getQuotations({ 
        limit: 1000, 
        offset: 0 
      });
      
      const quotation = result.quotations.find(q => q.id === quotationId);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      // Get customer details
      const customer = await storage.getUser(quotation.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Import PDF generator
      const { generateQuotationPDF } = await import('./pdf-generator');
      
      // Prepare quotation data for PDF
      const quotationData = {
        id: quotation.id,
        quotationId: quotation.quotationId,
        quotationDate: quotation.createdAt,
        validUntil: quotation.validUntil,
        productName: quotation.productName,
        quantity: quotation.quantity,
        unit: quotation.unit,
        unitPrice: quotation.unitPrice,
        totalAmount: quotation.totalAmount,
        currency: quotation.currency,
        terms: quotation.terms,
        notes: quotation.notes,
        paymentTerms: quotation.paymentTerms,
        deliveryTerms: quotation.deliveryTerms,
        subtotal: quotation.subtotal,
        discountPercent: quotation.discountPercent,
        discountAmount: quotation.discountAmount,
        includeGst: quotation.includeGst,
        gstNumber: quotation.gstNumber,
        gstPercentage: quotation.gstPercentage,
        gstAmount: quotation.gstAmount,
        sellerGstin: quotation.sellerGstin,
        sellerPan: quotation.sellerPan,
        buyerGstin: quotation.buyerGstin,
        buyerPan: quotation.buyerPan,
        customerCompanyName: quotation.customerCompanyName,
        customerAddress: quotation.customerAddress,
        customerCity: quotation.customerCity,
        customerState: quotation.customerState,
        customerCountry: quotation.customerCountry,
        customerPostalCode: quotation.customerPostalCode,
        placeOfSupply: quotation.placeOfSupply,
        countryOfSupply: quotation.countryOfSupply,
      };

      const customerData = {
        name: customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}` : customer.email || '',
        email: customer.email || '',
        companyName: customer.companyName || '',
        phone: customer.phoneNumber || '',
        address: customer.address || '',
        city: '',
        state: '',
        country: customer.country || '',
        postalCode: '',
      };

      // Generate PDF
      const pdfBuffer = await generateQuotationPDF(quotationData, customerData);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Quotation-${quotation.quotationId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get sales orders
  app.get('/api/sales-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Role-based filtering
      if (user.role === 'customer') {
        filters.customerId = userId;
      }

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getSalesOrders(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      res.status(500).json({ message: "Failed to fetch sales orders" });
    }
  });

  // Get purchase orders (for purchase team)
  app.get('/api/purchase-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('purchase') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getPurchaseOrders(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  // Get inventory (for inventory and logistics teams)
  app.get('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('inventory') && !user.role?.includes('logistics') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { productId } = req.query;
      
      const inventory = await storage.getInventory(productId ? parseInt(productId as string) : undefined);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  // Dashboard analytics
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // AWS S3 Image Upload Routes

  // Upload hero slider media (images with WebP processing and videos)
  app.post('/api/admin/hero-slides/upload', isAuthenticated, webpUpload.any(), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID) {
        return res.status(503).json({ 
          error: "AWS S3 not configured for hero slider media",
          message: "Please configure AWS credentials for hero slider uploads" 
        });
      }

      const files = req.files as Express.Multer.File[];
      const uploadedFiles: { [key: string]: string } = {};
      const slideId = req.body.slideId || `temp-${Date.now()}`;

      console.log('Hero slider upload request received. Files:', files.length);

      // Process uploaded files
      for (const file of files) {
        const fieldName = file.fieldname;
        console.log(`Processing field: ${fieldName}, file: ${file.originalname}`);
        
        if (file.mimetype.startsWith('image/') && ImageProcessor.isValidImageFormat(file.mimetype)) {
          // Process images with WebP conversion
          console.log(`📸 Processing hero slider image: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
          
          try {
            // Process image into 3 WebP sizes
            const processedImages = await imageProcessor.processProductImage(file.buffer, file.originalname);
            
            // Upload all 3 sizes to S3 under hero-slides folder
            const uploadPromises = processedImages.map(async (image) => {
              const objectKey = `hero-slides/${slideId}/${image.filename}`;
              
              const { PutObjectCommand } = await import('@aws-sdk/client-s3');
              const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: objectKey,
                Body: image.buffer,
                ContentType: 'image/webp',
                CacheControl: 'public, max-age=31536000', // 1 year cache
                ContentDisposition: 'inline',
              });

              const { s3Client } = await import('./awsS3Service');
              await s3Client.send(command);
              
              return {
                size: image.size,
                url: s3Service.getObjectURL(objectKey)
              };
            });

            const uploadedImages = await Promise.all(uploadPromises);
            
            // Use large size for hero slider
            const largeUrl = uploadedImages.find(img => img.size === 'large')?.url || 
                           uploadedImages.find(img => img.size === 'medium')?.url || 
                           uploadedImages[0]?.url;
            
            uploadedFiles[fieldName] = largeUrl;
            console.log(`✅ Successfully processed hero slider image ${file.originalname} -> ${largeUrl}`);
            
          } catch (error) {
            console.error(`❌ Failed to process hero slider image ${file.originalname}:`, error);
            // Fallback: upload original image without WebP processing
            const objectKey = `hero-slides/${slideId}/${file.originalname}-${Date.now()}`;
            const { PutObjectCommand } = await import('@aws-sdk/client-s3');
            const command = new PutObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME!,
              Key: objectKey,
              Body: file.buffer,
              ContentType: file.mimetype,
            });
            
            const { s3Client } = await import('./awsS3Service');
            await s3Client.send(command);
            uploadedFiles[fieldName] = s3Service.getObjectURL(objectKey);
          }
        } else if (file.mimetype.startsWith('video/')) {
          // Process videos without conversion - upload as-is
          console.log(`🎥 Processing hero slider video: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
          
          const objectKey = `hero-slides/${slideId}/videos/${file.originalname}-${Date.now()}`;
          const { PutObjectCommand } = await import('@aws-sdk/client-s3');
          const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: objectKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          });
          
          const { s3Client } = await import('./awsS3Service');
          await s3Client.send(command);
          uploadedFiles[fieldName] = s3Service.getObjectURL(objectKey);
          
          console.log(`✅ Successfully uploaded hero slider video ${file.originalname}`);
        } else {
          // Other file types - upload as-is
          console.log(`📄 Processing hero slider file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
          
          const objectKey = `hero-slides/${slideId}/${file.originalname}-${Date.now()}`;
          const { PutObjectCommand } = await import('@aws-sdk/client-s3');
          const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: objectKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          });
          
          const { s3Client } = await import('./awsS3Service');
          await s3Client.send(command);
          uploadedFiles[fieldName] = s3Service.getObjectURL(objectKey);
          
          console.log(`✅ Successfully uploaded hero slider file ${file.originalname}`);
        }
      }

      res.json({
        success: true,
        files: uploadedFiles,
        message: 'Hero slider media uploaded successfully with WebP processing for images'
      });
    } catch (error) {
      console.error("Error uploading hero slider media:", error);
      res.status(500).json({ message: "Failed to upload hero slider media", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Upload product images and documents with WebP processing for images
  app.post('/api/admin/products/upload', isAuthenticated, webpUpload.any(), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID) {
        return res.status(503).json({ 
          error: "AWS S3 not configured for product images",
          message: "Please configure AWS credentials for product image uploads" 
        });
      }

      const files = req.files as Express.Multer.File[];
      const uploadedFiles: { [key: string]: string | string[] } = {};
      const productId = req.body.productId || `temp-${Date.now()}`;

      console.log('Admin upload request received. Files:', files.length);

      // Group files by field name for proper handling
      const filesByField: { [key: string]: Express.Multer.File[] } = {};
      files.forEach(file => {
        if (!filesByField[file.fieldname]) {
          filesByField[file.fieldname] = [];
        }
        filesByField[file.fieldname].push(file);
      });

      // Process uploaded files by field
      for (const [fieldName, fileArray] of Object.entries(filesByField)) {
        console.log(`Processing field: ${fieldName}, files:`, fileArray.length);
        
        if (fieldName === 'galleryImages' || fieldName === 'additionalDocs') {
          // Multiple files
          const processedUrls: string[] = [];
          
          for (const file of fileArray) {
            if (file.mimetype.startsWith('image/') && ImageProcessor.isValidImageFormat(file.mimetype)) {
              console.log(`📸 Processing image: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
              
              try {
                // Process image into 3 WebP sizes
                const processedImages = await imageProcessor.processProductImage(file.buffer, file.originalname);
                
                // Upload all 3 sizes to S3
                const uploadedUrls = await s3Service.uploadProductImages(processedImages, productId);
                
                // Use medium size for gallery
                processedUrls.push(uploadedUrls.medium);
                console.log(`✅ Successfully processed image ${file.originalname} -> ${uploadedUrls.medium}`);
                
              } catch (error) {
                console.error(`❌ Failed to process image ${file.originalname}:`, error);
                // Fallback: upload original image without WebP processing
                const objectKey = `products/${productId}/${file.originalname}-${Date.now()}`;
                const { PutObjectCommand } = await import('@aws-sdk/client-s3');
                const command = new PutObjectCommand({
                  Bucket: process.env.AWS_S3_BUCKET_NAME!,
                  Key: objectKey,
                  Body: file.buffer,
                  ContentType: file.mimetype,
                });
                
                const { s3Client } = await import('./awsS3Service');
                await s3Client.send(command);
                processedUrls.push(s3Service.getObjectURL(objectKey));
              }
            } else {
              // Non-image files (documents) - upload as-is
              console.log(`📄 Processing document: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
              
              const objectKey = `products/${productId}/documents/${file.originalname}-${Date.now()}`;
              const { PutObjectCommand } = await import('@aws-sdk/client-s3');
              const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: objectKey,
                Body: file.buffer,
                ContentType: file.mimetype,
              });
              
              const { s3Client } = await import('./awsS3Service');
              await s3Client.send(command);
              processedUrls.push(s3Service.getObjectURL(objectKey));
              
              console.log(`✅ Successfully uploaded document ${file.originalname}`);
            }
          }
          
          uploadedFiles[fieldName] = processedUrls;
        } else {
          // Single file - includes secondImage, thirdImage, mainImage, documents
          const file = fileArray[0];
          if (!file) continue;
          
          if (file.mimetype.startsWith('image/') && ImageProcessor.isValidImageFormat(file.mimetype)) {
            console.log(`📸 Processing image: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
            
            try {
              // Process image into 3 WebP sizes
              const processedImages = await imageProcessor.processProductImage(file.buffer, file.originalname);
              
              // Upload all 3 sizes to S3
              const uploadedUrls = await s3Service.uploadProductImages(processedImages, productId);
              
              // Store the medium size URL as the main URL for this field
              uploadedFiles[fieldName] = uploadedUrls.medium;
              
              console.log(`✅ Successfully processed image ${file.originalname} -> ${uploadedUrls.medium}`);
              
            } catch (error) {
              console.error(`❌ Failed to process image ${file.originalname}:`, error);
              // Fallback: upload original image without WebP processing
              const objectKey = `products/${productId}/${file.originalname}-${Date.now()}`;
              const { PutObjectCommand } = await import('@aws-sdk/client-s3');
              const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: objectKey,
                Body: file.buffer,
                ContentType: file.mimetype,
              });
              
              const { s3Client } = await import('./awsS3Service');
              await s3Client.send(command);
              uploadedFiles[fieldName] = s3Service.getObjectURL(objectKey);
            }
          } else {
            // Non-image files (documents) - upload as-is
            console.log(`📄 Processing document: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
            
            const objectKey = `products/${productId}/documents/${file.originalname}-${Date.now()}`;
            const { PutObjectCommand } = await import('@aws-sdk/client-s3');
            const command = new PutObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME!,
              Key: objectKey,
              Body: file.buffer,
              ContentType: file.mimetype,
            });
            
            const { s3Client } = await import('./awsS3Service');
            await s3Client.send(command);
            uploadedFiles[fieldName] = s3Service.getObjectURL(objectKey);
            
            console.log(`✅ Successfully uploaded document ${file.originalname}`);
          }
        }
      }

      res.json({
        success: true,
        files: uploadedFiles,
        message: 'Files uploaded successfully with WebP processing for images'
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });



  // Generate presigned URL for direct upload (alternative method)
  app.post('/api/admin/products/presigned-url', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { filename, contentType, productId } = req.body;
      
      if (!filename || !contentType) {
        return res.status(400).json({ message: "Filename and content type are required" });
      }

      const timestamp = Date.now();
      const s3Key = `products/${productId || 'temp'}/${filename}-${timestamp}`;
      
      const presignedUrl = await generatePresignedUrl(s3Key, contentType);
      const publicUrl = getImageUrl(s3Key);

      res.json({
        presignedUrl,
        publicUrl,
        s3Key
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ message: "Failed to generate presigned URL" });
    }
  });

  // Delete image from S3
  app.delete('/api/admin/products/image/:s3Key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const s3Key = decodeURIComponent(req.params.s3Key);
      await deleteFromS3(s3Key);

      res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
      console.error("Error deleting image from S3:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Admin dashboard route
  app.get("/admin/dashboard", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.redirect("/login");
      }

      const user = req.user;
      
      // Check if this is a local admin session
      if (user.isLocal && user.claims && user.claims.sub === 'admin_001') {
        const adminUser = await storage.getUser('admin_001');
        if (adminUser) {
          // Serve the React app for admin dashboard
          res.redirect("/#/admin/dashboard");
          return;
        }
      }
      
      return res.redirect("/login");
    } catch (error) {
      console.error("Error accessing admin dashboard:", error);
      res.redirect("/login");
    }
  });

  // Admin authentication check API
  app.get("/api/admin/auth-check", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.user;
      
      // Check if this is a local admin session
      if (user.isLocal && user.claims && user.claims.sub === 'admin_001') {
        const adminUser = await storage.getUser('admin_001');
        if (adminUser) {
          res.json({
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            role: adminUser.role
          });
          return;
        }
      }

      return res.status(401).json({ message: "Not admin user" });
    } catch (error) {
      console.error("Error checking admin auth:", error);
      res.status(500).json({ message: "Auth check failed" });
    }
  });

  // Admin stats API
  app.get("/api/admin/stats", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.user;
      
      // Check if this is a local admin session
      if (!user.isLocal || user.claims?.sub !== 'admin_001') {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      // Get dashboard statistics
      const stats = {
        totalProducts: 1, // Mock data for now
        totalInquiries: 0,
        totalUsers: 1,
        totalQuotations: 0,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // ==========================================
  // WEBSITE MANAGEMENT API ROUTES (ADMIN ONLY)
  // ==========================================

  // Role validation middleware for admin-only routes
  const isAdminOrWebsiteManager = (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Get all products (admin view with all fields)
  app.get('/api/admin/products', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const { 
        category, 
        search, 
        status, 
        dateFilter, 
        visibility, 
        sortBy, 
        limit = '100', 
        offset = '0' 
      } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (category && category !== 'all') filters.category = category as string;
      if (search) filters.search = search as string;
      if (status && status !== 'all') filters.status = status as string;
      if (dateFilter && dateFilter !== 'all') filters.dateFilter = dateFilter as string;
      if (visibility && visibility !== 'all') filters.visibility = visibility as string;
      if (sortBy) filters.sortBy = sortBy as string;

      const result = await storage.getAdminProducts(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Create new product
  app.post('/api/admin/products', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const { selectedCategories, ...productData } = req.body;
      const parsedProductData = insertProductSchema.parse(productData);
      parsedProductData.createdBy = (req.user as any)?.claims?.sub;
      parsedProductData.updatedBy = (req.user as any)?.claims?.sub;
      
      const product = await storage.createProduct(parsedProductData);
      
      // Handle multiple categories if provided
      if (selectedCategories && Array.isArray(selectedCategories) && selectedCategories.length > 0) {
        for (const categoryData of selectedCategories) {
          await storage.addProductToCategory(product.id, categoryData.categoryId, categoryData.isPrimary);
        }
      }
      
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Get all product tags
  app.get('/api/admin/tags', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const tags = await storage.getAllProductTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching product tags:", error);
      res.status(500).json({ message: "Failed to fetch product tags" });
    }
  });

  // Update product
  app.put('/api/admin/products/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { selectedCategories, ...productData } = req.body;
      const parsedProductData = insertProductSchema.partial().parse(productData);
      parsedProductData.updatedBy = (req.user as any)?.claims?.sub;
      
      const product = await storage.updateProduct(productId, parsedProductData);
      
      // Handle multiple categories update if provided
      if (selectedCategories && Array.isArray(selectedCategories)) {
        // Get current categories for this product
        const currentCategories = await storage.getProductCategories(productId);
        const currentCategoryIds = currentCategories.map((c: any) => c.id);
        const newCategoryIds = selectedCategories.map(c => c.categoryId);
        
        // Remove categories that are no longer selected
        for (const currentCatId of currentCategoryIds) {
          if (!newCategoryIds.includes(currentCatId)) {
            await storage.removeProductFromCategory(productId, currentCatId);
          }
        }
        
        // Add or update categories
        for (const categoryData of selectedCategories) {
          if (currentCategoryIds.includes(categoryData.categoryId)) {
            // Update existing relation
            await storage.updateProductCategoryRelation(productId, categoryData.categoryId, categoryData.isPrimary);
          } else {
            // Add new relation
            await storage.addProductToCategory(productId, categoryData.categoryId, categoryData.isPrimary);
          }
        }
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete('/api/admin/products/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Get all categories (admin view)
  app.get('/api/admin/categories', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create new category
  app.post('/api/admin/categories', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Update category
  app.put('/api/admin/categories/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      
      const category = await storage.updateCategory(categoryId, categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Delete category (soft delete)
  app.delete('/api/admin/categories/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      await storage.deleteCategory(categoryId);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Product-Category relationship endpoints
  
  // Get product with all its categories
  app.get('/api/products/:id/categories', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const productWithCategories = await storage.getProductWithCategories(productId);
      
      if (!productWithCategories) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(productWithCategories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  // Get products by category (using junction table)
  app.get('/api/categories/:id/products', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getProductsByCategory(categoryId, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  // Add product to category
  app.post('/api/admin/products/:productId/categories/:categoryId', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const categoryId = parseInt(req.params.categoryId);
      const { isPrimary } = req.body;
      
      const relation = await storage.addProductToCategory(productId, categoryId, isPrimary);
      res.status(201).json(relation);
    } catch (error) {
      console.error("Error adding product to category:", error);
      res.status(500).json({ message: "Failed to add product to category" });
    }
  });

  // Remove product from category
  app.delete('/api/admin/products/:productId/categories/:categoryId', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const categoryId = parseInt(req.params.categoryId);
      
      await storage.removeProductFromCategory(productId, categoryId);
      res.json({ message: "Product removed from category successfully" });
    } catch (error) {
      console.error("Error removing product from category:", error);
      res.status(500).json({ message: "Failed to remove product from category" });
    }
  });

  // Update product-category relationship (change primary status)
  app.put('/api/admin/products/:productId/categories/:categoryId', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const categoryId = parseInt(req.params.categoryId);
      const { isPrimary } = req.body;
      
      const relation = await storage.updateProductCategoryRelation(productId, categoryId, isPrimary);
      res.json(relation);
    } catch (error) {
      console.error("Error updating product-category relationship:", error);
      res.status(500).json({ message: "Failed to update product-category relationship" });
    }
  });

  // Get all categories for a specific product
  app.get('/api/admin/products/:id/categories', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const categories = await storage.getProductCategories(productId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  // Bulk product upload via CSV/Excel
  app.post('/api/admin/products/bulk-upload', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
    try {
      const upload = multer({ 
        storage: multer.memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        fileFilter: (req, file, cb) => {
          const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
          if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
            cb(null, true);
          } else {
            cb(new Error('Only CSV and Excel files are allowed'));
          }
        }
      }).single('file');

      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const result = await storage.bulkUploadProducts(req.file, req.user.claims.sub, req.body.defaultCategory);
        res.json(result);
      });
    } catch (error) {
      console.error("Error in bulk upload:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });

  // Download product template
  app.get('/api/admin/products/template', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
    try {
      const categoryId = req.query.category ? parseInt(req.query.category as string) : undefined;
      const template = await storage.generateProductTemplate(categoryId);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="product-template.csv"');
      res.send(template);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  // Get all product tags
  app.get('/api/admin/tags', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const tags = await storage.getProductTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Create new product tag
  app.post('/api/admin/tags', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const tagData = insertProductTagSchema.parse(req.body);
      // Note: tagData doesn't have createdBy field in the schema
      
      const tag = await storage.createProductTag(tagData);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  // Update product tag
  app.put('/api/admin/tags/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const tagId = parseInt(req.params.id);
      const tagData = insertProductTagSchema.partial().parse(req.body);
      
      const tag = await storage.updateProductTag(tagId, tagData);
      res.json(tag);
    } catch (error) {
      console.error("Error updating tag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update tag" });
    }
  });

  // Delete product tag
  app.delete('/api/admin/tags/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const tagId = parseInt(req.params.id);
      await storage.deleteProductTag(tagId);
      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Migrate existing product certifications to tags
  app.post('/api/admin/tags/migrate', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      await storage.migrateExistingCertificationsToTags();
      res.json({ message: "Migration completed successfully" });
    } catch (error) {
      console.error("Error migrating certifications:", error);
      res.status(500).json({ message: "Failed to migrate certifications" });
    }
  });

  // Get all hero sliders
  app.get('/api/admin/sliders', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const sliders = await storage.getHeroSliders();
      res.json(sliders);
    } catch (error) {
      console.error("Error fetching sliders:", error);
      res.status(500).json({ message: "Failed to fetch sliders" });
    }
  });

  // Get active hero sliders (public endpoint for frontend)
  app.get('/api/sliders/active', async (req, res) => {
    try {
      const sliders = await storage.getHeroSliders();
      const activeSliders = sliders.filter(slider => 
        slider.status === 'active' && 
        (!slider.startDate || new Date(slider.startDate) <= new Date()) &&
        (!slider.endDate || new Date(slider.endDate) >= new Date())
      );
      res.json(activeSliders);
    } catch (error) {
      console.error("Error fetching active sliders:", error);
      res.status(500).json({ message: "Failed to fetch active sliders" });
    }
  });

  // Schema Validation API Routes
  
  // Get schema validation results
  app.get('/api/admin/schema-validation', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const validationResults = await storage.getSchemaValidationResults();
      res.json(validationResults);
    } catch (error) {
      console.error("Error fetching schema validation results:", error);
      res.status(500).json({ message: "Failed to fetch validation results" });
    }
  });

  // Get schema validation summary
  app.get('/api/admin/schema-validation/summary', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const summary = await storage.getSchemaValidationSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching schema validation summary:", error);
      res.status(500).json({ message: "Failed to fetch validation summary" });
    }
  });

  // Run schema validation
  app.post('/api/admin/schema-validation/run', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const results = await storage.runSchemaValidation();
      res.json({ message: "Schema validation completed", results });
    } catch (error) {
      console.error("Error running schema validation:", error);
      res.status(500).json({ message: "Failed to run schema validation" });
    }
  });

  // Export schema validation results as CSV
  app.get('/api/admin/schema-validation/export', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const csvData = await storage.exportSchemaValidationResults();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="schema-validation-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } catch (error) {
      console.error("Error exporting schema validation results:", error);
      res.status(500).json({ message: "Failed to export validation results" });
    }
  });

  // SEO ENHANCEMENT ROUTES

  // Product FAQ routes
  app.get('/api/products/:productId/faqs', async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const faqs = await storage.getProductFaqs(productId);
      res.json(faqs);
    } catch (error) {
      console.error('Error fetching product FAQs:', error);
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  app.post('/api/admin/products/:productId/faqs', isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const faqData = insertProductFaqSchema.parse({ ...req.body, productId });
      const faq = await storage.createProductFaq(faqData);
      res.json(faq);
    } catch (error) {
      console.error('Error creating product FAQ:', error);
      res.status(500).json({ message: "Failed to create FAQ" });
    }
  });

  app.put('/api/admin/products/faqs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const faq = await storage.updateProductFaq(id, updates);
      if (!faq) {
        return res.status(404).json({ message: "FAQ not found" });
      }
      res.json(faq);
    } catch (error) {
      console.error('Error updating product FAQ:', error);
      res.status(500).json({ message: "Failed to update FAQ" });
    }
  });

  app.delete('/api/admin/products/faqs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProductFaq(id);
      res.json({ message: "FAQ deleted successfully" });
    } catch (error) {
      console.error('Error deleting product FAQ:', error);
      res.status(500).json({ message: "Failed to delete FAQ" });
    }
  });

  // Blog routes
  app.get('/api/blog', async (req, res) => {
    try {
      const { category, published = 'true', limit = '10', offset = '0' } = req.query;
      const filters: any = {
        category: category as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      
      // Only filter by published status if not "all"
      if (published !== 'all') {
        filters.published = published === 'true';
      }
      
      const result = await storage.getBlogPosts(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post('/api/admin/blog', isAuthenticated, async (req: any, res) => {
    try {
      const postData = insertBlogPostSchema.parse({
        ...req.body,
        authorId: req.user.claims.sub
      });
      const post = await storage.createBlogPost(postData);
      res.json(post);
    } catch (error) {
      console.error('Error creating blog post:', error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put('/api/admin/blog/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const post = await storage.updateBlogPost(id, updates);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete('/api/admin/blog/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlogPost(id);
      res.json({ message: "Blog post deleted successfully" });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // SEO monitoring routes
  app.get('/api/admin/seo/issues', isAuthenticated, async (req: any, res) => {
    try {
      const { type } = req.query;
      const issues = await storage.getSeoIssues(type as string);
      res.json(issues);
    } catch (error) {
      console.error('Error fetching SEO issues:', error);
      res.status(500).json({ message: "Failed to fetch SEO issues" });
    }
  });

  app.post('/api/admin/seo/issues', isAuthenticated, async (req: any, res) => {
    try {
      const issueData = insertSeoMonitoringSchema.parse(req.body);
      const issue = await storage.createSeoIssue(issueData);
      res.json(issue);
    } catch (error) {
      console.error('Error creating SEO issue:', error);
      res.status(500).json({ message: "Failed to create SEO issue" });
    }
  });

  // Search suggestion routes
  app.get('/api/search/suggestions', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json([]);
      }
      const suggestions = await storage.getSearchSuggestions(q as string);
      res.json(suggestions);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      res.status(500).json({ message: "Failed to fetch search suggestions" });
    }
  });

  app.post('/api/search/analytics', async (req, res) => {
    try {
      const analyticsData = insertSearchAnalyticsSchema.parse(req.body);
      const analytics = await storage.recordSearchAnalytics(analyticsData);
      res.json(analytics);
    } catch (error) {
      console.error('Error recording search analytics:', error);
      res.status(500).json({ message: "Failed to record search analytics" });
    }
  });

  app.get('/api/admin/search/popular', isAuthenticated, async (req: any, res) => {
    try {
      const { limit = '10' } = req.query;
      const popularSearches = await storage.getPopularSearches(parseInt(limit as string));
      res.json(popularSearches);
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      res.status(500).json({ message: "Failed to fetch popular searches" });
    }
  });

  // Global SEO Settings routes
  app.get('/api/admin/seo/settings', isAuthenticated, async (req: any, res) => {
    try {
      const settings = await storage.getGlobalSeoSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching global SEO settings:', error);
      res.status(500).json({ message: "Failed to fetch SEO settings" });
    }
  });

  app.put('/api/admin/seo/settings', isAuthenticated, async (req: any, res) => {
    try {
      const settingsData = insertGlobalSeoSettingsSchema.parse(req.body);
      const settings = await storage.updateGlobalSeoSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error('Error updating global SEO settings:', error);
      res.status(500).json({ message: "Failed to update SEO settings" });
    }
  });

  // SEO audit endpoint
  app.get('/api/admin/seo/audit', isAuthenticated, async (req: any, res) => {
    try {
      // Get all products for SEO audit
      const { products } = await storage.getAdminProducts({ limit: 1000 });
      
      const auditResults = await Promise.all(
        products.map(async (product) => {
          // Get FAQs for this product
          const faqs = await storage.getProductFaqs(product.id);
          
          // Basic SEO audit
          const audit = {
            productId: product.productId,
            name: product.name,
            slug: product.slug,
            seoScore: 0,
            issues: [] as string[],
            recommendations: [] as string[]
          };

          // Check SEO fields
          if (!product.seoTitle) {
            audit.issues.push('Missing SEO title');
            audit.recommendations.push('Add a descriptive SEO title');
          } else {
            audit.seoScore += 20;
          }

          if (!product.seoDescription) {
            audit.issues.push('Missing SEO description');
            audit.recommendations.push('Add a compelling meta description');
          } else {
            audit.seoScore += 20;
          }

          if (!product.mainImage) {
            audit.issues.push('Missing main image');
            audit.recommendations.push('Add a high-quality product image');
          } else {
            audit.seoScore += 15;
          }

          if (!product.description || product.description.length < 100) {
            audit.issues.push('Poor product description');
            audit.recommendations.push('Improve product description (min 100 characters)');
          } else {
            audit.seoScore += 15;
          }

          if (faqs.length === 0) {
            audit.issues.push('No FAQs available');
            audit.recommendations.push('Add frequently asked questions');
          } else {
            audit.seoScore += 15;
          }

          if (!product.botanicalName) {
            audit.issues.push('Missing botanical name');
            audit.recommendations.push('Add botanical name for better search relevance');
          } else {
            audit.seoScore += 10;
          }

          if (!product.origin) {
            audit.recommendations.push('Add country of origin');
          } else {
            audit.seoScore += 5;
          }

          return audit;
        })
      );

      res.json({
        totalProducts: products.length,
        averageScore: auditResults.reduce((sum, audit) => sum + audit.seoScore, 0) / auditResults.length,
        results: auditResults
      });
    } catch (error) {
      console.error('Error performing SEO audit:', error);
      res.status(500).json({ message: "Failed to perform SEO audit" });
    }
  });

  // Newsletter subscription routes
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const subscriptionData = insertNewsletterSubscriptionSchema.parse(req.body);
      const subscription = await storage.subscribeToNewsletter(subscriptionData);
      res.json({ 
        message: "Successfully subscribed to newsletter!", 
        subscription: { id: subscription.id, email: subscription.email } 
      });
    } catch (error: any) {
      console.error('Error subscribing to newsletter:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid email address" });
      }
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });

  app.post('/api/newsletter/unsubscribe', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      await storage.unsubscribeFromNewsletter(email);
      res.json({ message: "Successfully unsubscribed from newsletter" });
    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error);
      res.status(500).json({ message: "Failed to unsubscribe from newsletter" });
    }
  });

  app.get('/api/admin/newsletter/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const { isActive, limit = '50', offset = '0' } = req.query;
      const filters = {
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      const result = await storage.getNewsletterSubscriptions(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching newsletter subscriptions:', error);
      res.status(500).json({ message: "Failed to fetch newsletter subscriptions" });
    }
  });

  // Robots.txt route
  app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(`User-agent: *
Allow: /

# Block admin areas
Disallow: /admin/
Disallow: /crm/
Disallow: /api/

# Sitemap
Sitemap: https://bright-organic.com/sitemap.xml`);
  });

  // Sitemap.xml route - simplified for maximum reliability
  app.get('/sitemap.xml', async (req, res) => {
    // Always set XML headers first
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    const baseUrl = 'https://bright-organic.com';
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Start with core pages that always exist
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/products</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/ingredients</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

    // Try to add dynamic content but don't fail if there's an error
    try {
      // Add categories if available
      const categories = await storage.getCategories();
      if (categories && Array.isArray(categories)) {
        for (const category of categories) {
          if (category?.slug) {
            sitemap += `
  <url>
    <loc>${baseUrl}/ingredients/${category.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
          }
        }
      }
    } catch (error) {
      console.error('Failed to add categories to sitemap:', error);
    }

    try {
      // Add products if available
      const products = await storage.getProducts({ limit: 5000, offset: 0 });
      if (products?.products && Array.isArray(products.products)) {
        for (const product of products.products) {
          if (product?.slug && product.isActive !== false) {
            sitemap += `
  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
          }
        }
      }
    } catch (error) {
      console.error('Failed to add products to sitemap:', error);
    }

    // Close the sitemap
    sitemap += `
</urlset>`;

    res.send(sitemap);
  });

  // Static routes removed from here - they're now handled as fallback in server/index.ts

  const httpServer = createServer(app);
  return httpServer;
}
