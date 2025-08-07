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

  // Structured data injection middleware for deployed URLs only
  const isDeployedURL = (host: string) => {
    return host && (host.includes('.replit.app') || host.includes('bright-organic.com'));
  };

  // Product page structured data injection (deployed URLs only)
  app.get('/product/:slug', async (req, res, next) => {
    // Only apply to deployed URLs, skip development
    if (!isDeployedURL(req.get('host') || '')) {
      return next();
    }

    // Only for HTML requests
    if (!req.headers.accept || !req.headers.accept.includes('text/html')) {
      return next();
    }

    try {
      // Use storage instance directly
      const { slug } = req.params;
      const product = await storage.getProductBySlug(slug);
      
      if (!product) {
        return next(); // Let React handle 404
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const productUrl = `${baseUrl}/product/${product.slug}`;
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
      const distPath = path.resolve(import.meta.dirname, "public");
      const htmlPath = path.resolve(distPath, "index.html");
      let html = fs.readFileSync(htmlPath, 'utf-8');

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

      console.log(`[Structured Data] Injected for deployed URL: ${productUrl}`);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error injecting structured data:', error);
      next(); // Fall back to regular routing
    }
  });

  // SPA fallback for production - handle client-side routing
  if (app.get("env") !== "development") {
    // Add explicit SPA route handling before static serving
    app.get("*", (req, res, next) => {
      // Skip API routes - let them be handled by registerRoutes
      if (req.path.startsWith('/api/') || req.path.startsWith('/attached_assets/')) {
        return next();
      }
      
      // For HTML requests (page refreshes), serve index.html to let React handle routing
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        console.log(`[SPA Fallback] Serving React app for: ${req.path}`);
        const distPath = path.resolve(import.meta.dirname, "public");
        return res.sendFile(path.resolve(distPath, "index.html"));
      }
      
      next();
    });
  }

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
