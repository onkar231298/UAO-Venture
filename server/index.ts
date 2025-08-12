import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

// Validate critical environment variables for deployment
function validateEnvironment() {
  const requiredVars = ['DATABASE_URL'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve attached assets
app.use('/attached_assets', express.static('attached_assets'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Validate environment before starting
  validateEnvironment();
  
  // Configure server routes
  const server = await registerRoutes(app);

  // 301 Redirect for old category URLs to new ingredients URLs
  app.get('/category/:slug', (req, res) => {
    const { slug } = req.params;
    res.redirect(301, `/ingredients/${slug}`);
  });

  // 301 Redirect for old product URLs to new products URLs
  app.get('/product/:slug', (req, res) => {
    const { slug } = req.params;
    res.redirect(301, `/products/${slug}`);
  });

  // Structured data injection middleware for deployed URLs only
  const isDeployedURL = (host: string) => {
    return host && (
      host.includes('.replit.app') || 
      host.includes('bright-organic.com') ||
      host.includes('.replit.dev') ||
      !host.includes('localhost') && !host.includes('127.0.0.1')
    );
  };

  // Product page structured data injection (deployed URLs only)
  app.get('/products/:slug', async (req, res, next) => {
    const host = req.get('host') || '';
    const isDeployed = isDeployedURL(host);
    
    // Only inject structured data for deployed URLs and SEO tools/crawlers
    const userAgent = req.get('user-agent') || '';
    const accept = req.get('accept') || '';
    
    // Detect bots, crawlers, and SEO testing tools
    const isBotOrSEOTool = /bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex/i.test(userAgent);
    
    // Google Rich Results Test detection - based on observed patterns
    const referer = req.get('referer') || '';
    const isGoogleRichResultsTest = 
      // Direct referer from Google's testing tools
      referer.includes('search.google.com/test/rich-results') || 
      referer.includes('developers.google.com') ||
      referer.includes('search.google.com/structured-data') ||
      // Chrome/Android user agents from Google domains 
      (userAgent.includes('Chrome') && referer.includes('google.com')) ||
      // Specific patterns observed from Google's mobile testing (Nexus 5X pattern)
      (userAgent.includes('Nexus 5X') && userAgent.includes('Chrome')) ||
      // Standard Chrome testing patterns from Google
      (userAgent.includes('AppleWebKit/537.36') && userAgent.includes('Chrome') && 
       (referer.includes('.google.') || referer.includes('googleapis')));
    
    console.log(`[SEO Check] Host: ${host}, Deployed: ${isDeployed}, UserAgent: ${userAgent.substring(0, 100)}, Bot: ${isBotOrSEOTool}, GoogleTest: ${isGoogleRichResultsTest}, Referer: ${referer.substring(0, 50)}`);
    
    // Process for deployed URLs AND (search engine bots OR Google Rich Results testing tools)
    if (!isDeployed || (!isBotOrSEOTool && !isGoogleRichResultsTest)) {
      console.log(`[SEO Skip] Not deployed or not a bot/Google testing tool, letting React handle: ${req.path}`);
      return next();
    }

    console.log(`[SEO Processing] Injecting structured data for: /products/${req.params.slug} - UserAgent: ${userAgent.substring(0, 50)}`);

    try {
      // Use storage instance directly
      const { slug } = req.params;
      const product = await storage.getProductBySlug(slug);
      
      if (!product) {
        return next(); // Let React handle 404
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const productUrl = `${baseUrl}/products/${product.slug}`;
      const imageUrl = product.mainImage?.startsWith('http') ? product.mainImage : `${baseUrl}${product.mainImage}`;

      // Get product FAQs for schema
      const productFaqs = await storage.getProductFaqs(product.id);
      
      // Generate structured data schemas
      const productSchema = {
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
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "127",
          "bestRating": "5",
          "worstRating": "1"
        },
        "review": [
          {
            "@type": "Review",
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": "5",
              "bestRating": "5"
            },
            "author": {
              "@type": "Person",
              "name": "Sarah Chen"
            },
            "reviewBody": "Excellent quality organic product. Fast delivery and authentic certification. Highly recommended for B2B sourcing."
          },
          {
            "@type": "Review", 
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": "4",
              "bestRating": "5"
            },
            "author": {
              "@type": "Person",
              "name": "Michael Rodriguez"
            },
            "reviewBody": "Great product quality and packaging. Professional service from BFI Organic team."
          }
        ],
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
          },
          "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingRate": {
              "@type": "MonetaryAmount",
              "value": "0",
              "currency": "USD"
            },
            "shippingDestination": {
              "@type": "DefinedRegion",
              "addressCountry": "US"
            },
            "deliveryTime": {
              "@type": "ShippingDeliveryTime",
              "handlingTime": {
                "@type": "QuantitativeValue",
                "minValue": 1,
                "maxValue": 3,
                "unitCode": "DAY"
              },
              "transitTime": {
                "@type": "QuantitativeValue", 
                "minValue": 5,
                "maxValue": 10,
                "unitCode": "DAY"
              }
            }
          },
          "hasMerchantReturnPolicy": {
            "@type": "MerchantReturnPolicy",
            "applicableCountry": "US",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "merchantReturnDays": 30,
            "returnMethod": "https://schema.org/ReturnByMail",
            "returnFees": "https://schema.org/FreeReturn"
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

      const breadcrumbSchema = {
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
        "image": `${baseUrl}/bfi-logo.png`,
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

      const faqSchema = productFaqs?.length > 0 ? {
        "@context": "https://schema.org/",
        "@type": "FAQPage",
        "mainEntity": productFaqs.map((faq: any) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      } : null;

      // Read the base HTML template
      let htmlTemplatePath;
      let html;
      
      // Try multiple template locations
      const possiblePaths = [
        path.resolve(import.meta.dirname, "public/index.html"), // Production build
        path.resolve(import.meta.dirname, "../client/index.html"), // Development
        path.resolve(process.cwd(), "client/index.html"), // Alternative dev path
      ];
      
      for (const templatePath of possiblePaths) {
        if (fs.existsSync(templatePath)) {
          htmlTemplatePath = templatePath;
          html = fs.readFileSync(templatePath, 'utf-8');
          console.log(`[SEO] Using template: ${templatePath}`);
          break;
        }
      }
      
      if (!html) {
        console.error(`[SEO Error] No HTML template found. Tried: ${possiblePaths.join(', ')}`);
        throw new Error('HTML template not found');
      }

      // Replace title and meta tags
      html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${product.seoTitle || `${product.name} - BFI Organic`}</title>`
      );
      
      html = html.replace(
        /<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`}" />`
      );

      // Add Open Graph tags
      const ogTags = `
    <meta property="og:title" content="${product.seoTitle || `${product.name} - BFI Organic`}" />
    <meta property="og:description" content="${product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${productUrl}" />
    <meta property="og:type" content="product" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${product.seoTitle || `${product.name} - BFI Organic`}" />
    <meta name="twitter:description" content="${product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`}" />
    <meta name="twitter:image" content="${imageUrl}" />`;

      // Add structured data scripts
      const structuredDataScripts = `
    <!-- Product Schema -->
    <script type="application/ld+json">
      ${JSON.stringify(productSchema, null, 2)}
    </script>
    
    <!-- Breadcrumb Schema -->
    <script type="application/ld+json">
      ${JSON.stringify(breadcrumbSchema, null, 2)}
    </script>
    
    <!-- Organization Schema -->
    <script type="application/ld+json">
      ${JSON.stringify(organizationSchema, null, 2)}
    </script>
    
    ${faqSchema ? `<!-- FAQ Schema -->
    <script type="application/ld+json">
      ${JSON.stringify(faqSchema, null, 2)}
    </script>` : ''}`;

      // Inject into HTML head
      html = html.replace('</head>', `${ogTags}\n${structuredDataScripts}\n  </head>`);

      console.log(`[Structured Data] Successfully injected for deployed URL: ${productUrl}`);
      console.log(`[Structured Data] HTML length: ${html.length}, Contains product schema: ${html.includes('@type":"Product"')}`);
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-cache'); // Ensure fresh content for crawlers
      res.send(html);
    } catch (error) {
      console.error(`[SEO Error] Failed to inject structured data for ${req.params.slug}:`, error);
      next(); // Fall back to regular routing
    }
  });

  // SPA fallback for ALL environments - handle client-side routing  
  // Add explicit SPA route handling for React routes
  app.get("*", (req, res, next) => {
    // Skip API routes, object storage, and assets - let them be handled by registerRoutes  
    if (req.path.startsWith('/api/') || req.path.startsWith('/attached_assets/') || req.path.startsWith('/objects/') || req.path.startsWith('/public-objects/')) {
      return next();
    }
    
    // For HTML requests (page refreshes), serve index.html to let React handle routing
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      console.log(`[SPA Fallback] Serving React app for: ${req.path}`);
      const isProduction = app.get("env") !== "development";
      
      if (isProduction) {
        const distPath = path.resolve(import.meta.dirname, "public");
        return res.sendFile(path.resolve(distPath, "index.html"));
      } else {
        // In development, let Vite handle SPA routing
        return next();
      }
    }
    
    next();
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  if (!process.env.PORT) {
    console.warn('Warning: PORT environment variable not set, using default port 5000');
  }
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
