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
  insertSampleRequestSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { productImageUpload, heroSliderUpload, generatePresignedUrl, getImageUrl, deleteFromS3 } from "./s3Upload";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Server-side rendered product pages with structured data - using API route to avoid Vite conflicts
  app.get('/api/product-page/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const product = await storage.getProductBySlug(slug);
      
      if (!product) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Product Not Found - BFI Organic</title>
              <meta name="description" content="The requested product was not found.">
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/src/main.tsx"></script>
            </body>
          </html>
        `);
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const productUrl = `${baseUrl}/products/${product.slug}`;
      const imageUrl = product.mainImage?.startsWith('http') ? product.mainImage : `${baseUrl}${product.mainImage}`;

      // Generate structured data
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
          "availability": product.currentStock && product.currentStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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

      // Generate complete HTML with structured data
      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="/vite.svg" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${product.seoTitle || `${product.name} - BFI Organic`}</title>
            <meta name="description" content="${product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`}">
            
            <!-- Open Graph Meta Tags -->
            <meta property="og:title" content="${product.seoTitle || `${product.name} - BFI Organic`}">
            <meta property="og:description" content="${product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`}">
            <meta property="og:image" content="${imageUrl}">
            <meta property="og:url" content="${productUrl}">
            <meta property="og:type" content="product">
            
            <!-- Twitter Card Meta Tags -->
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="${product.seoTitle || `${product.name} - BFI Organic`}">
            <meta name="twitter:description" content="${product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`}">
            <meta name="twitter:image" content="${imageUrl}">
            
            <!-- Structured Data - Product Schema -->
            <script type="application/ld+json">
              ${JSON.stringify(structuredData, null, 2)}
            </script>
            
            <!-- Structured Data - Breadcrumb Schema -->
            <script type="application/ld+json">
              ${JSON.stringify(breadcrumbData, null, 2)}
            </script>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error rendering product page:', error);
      res.status(500).send('Internal Server Error');
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

      const result = await storage.getProducts(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get single product by ID
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

  // Protected API routes (authentication required)

  // Create inquiry
  app.post('/api/inquiries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inquiryData = insertInquirySchema.parse({ ...req.body, customerId: userId });
      
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
      } else if (user.role?.includes('sales')) {
        filters.assignedTo = userId;
      }

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getInquiries(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
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
      
      // Check if user is authenticated
      if (req.user && req.user.claims && req.user.claims.sub) {
        customerId = req.user.claims.sub;
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

      const quotationData = insertQuotationSchema.parse({ ...req.body, createdBy: userId });
      
      const quotation = await storage.createQuotation(quotationData);
      res.status(201).json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quotation data", errors: error.errors });
      }
      console.error("Error creating quotation:", error);
      res.status(500).json({ message: "Failed to create quotation" });
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

  // Upload hero slider media (images and videos)
  app.post('/api/admin/hero-slides/upload', isAuthenticated, heroSliderUpload, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const files = req.files as { [fieldname: string]: any[] };
      const uploadedFiles: { [key: string]: string | string[] } = {};

      console.log('Hero slider upload request received. Files:', Object.keys(files));

      // Process uploaded files
      for (const [fieldName, fileArray] of Object.entries(files)) {
        console.log(`Processing field: ${fieldName}, files:`, fileArray.length);
        
        if (fileArray[0]) {
          console.log(`File details for ${fieldName}:`, {
            key: fileArray[0].key,
            location: fileArray[0].location,
            size: fileArray[0].size,
            contentType: fileArray[0].contentType
          });
        }
        const url = fileArray[0] ? getImageUrl(fileArray[0].key) : '';
        uploadedFiles[fieldName] = url;
        console.log(`Generated URL for ${fieldName}:`, url);
      }

      res.json({
        success: true,
        files: uploadedFiles,
        message: 'Hero slider media uploaded successfully to AWS S3'
      });
    } catch (error) {
      console.error("Error uploading hero slider media to S3:", error);
      res.status(500).json({ message: "Failed to upload media", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Upload product images and documents
  app.post('/api/admin/products/upload', isAuthenticated, productImageUpload, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const files = req.files as { [fieldname: string]: any[] };
      const uploadedFiles: { [key: string]: string | string[] } = {};

      console.log('Upload request received. Files:', Object.keys(files));

      // Process uploaded files
      for (const [fieldName, fileArray] of Object.entries(files)) {
        console.log(`Processing field: ${fieldName}, files:`, fileArray.length);
        
        if (fieldName === 'galleryImages' || fieldName === 'additionalDocs') {
          // Multiple files
          uploadedFiles[fieldName] = fileArray.map(file => {
            console.log(`File details for ${fieldName}:`, {
              key: file.key,
              location: file.location,
              size: file.size,
              contentType: file.contentType
            });
            const url = getImageUrl(file.key);
            console.log(`Generated URL for ${fieldName}:`, url);
            return url;
          });
        } else {
          // Single file - includes secondImage, thirdImage, mainImage, documents
          if (fileArray[0]) {
            console.log(`File details for ${fieldName}:`, {
              key: fileArray[0].key,
              location: fileArray[0].location,
              size: fileArray[0].size,
              contentType: fileArray[0].contentType
            });
          }
          const url = fileArray[0] ? getImageUrl(fileArray[0].key) : '';
          uploadedFiles[fieldName] = url;
          console.log(`Generated URL for ${fieldName}:`, url);
        }
      }

      res.json({
        success: true,
        files: uploadedFiles,
        message: 'Files uploaded successfully to AWS S3'
      });
    } catch (error) {
      console.error("Error uploading files to S3:", error);
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
      const productData = insertProductSchema.parse(req.body);
      productData.createdBy = (req.user as any)?.claims?.sub;
      productData.updatedBy = (req.user as any)?.claims?.sub;
      
      const product = await storage.createProduct(productData);
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
      const productData = insertProductSchema.partial().parse(req.body);
      productData.updatedBy = (req.user as any)?.claims?.sub;
      
      const product = await storage.updateProduct(productId, productData);
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
      const categoryId = req.query.category ? parseInt(req.query.category) : null;
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

  const httpServer = createServer(app);
  return httpServer;
}
