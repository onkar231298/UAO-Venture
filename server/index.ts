import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { db } from "./db";
import { products, categories } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

// Validate critical environment variables for deployment
function validateEnvironment() {
  const requiredVars = ['DATABASE_URL'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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

  // Bootstrap migration: ensure sales_call_logs table exists (safe IF NOT EXISTS)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sales_call_logs (
        id SERIAL PRIMARY KEY,
        log_id VARCHAR(50) NOT NULL UNIQUE,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        company_id INTEGER NOT NULL REFERENCES companies(id),
        activity_type VARCHAR(30) NOT NULL,
        call_type VARCHAR(30),
        call_outcome VARCHAR(20),
        contact_person_name VARCHAR(255),
        contact_phone VARCHAR(50),
        contact_email VARCHAR(255),
        products_discussed TEXT[],
        discussion_summary TEXT,
        buyer_requirement VARCHAR(500),
        interest_level VARCHAR(20),
        buyer_response VARCHAR(500),
        log_date DATE NOT NULL,
        log_time VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_scl_user ON sales_call_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_scl_company ON sales_call_logs(company_id);
      CREATE INDEX IF NOT EXISTS idx_scl_date ON sales_call_logs(log_date);
      CREATE INDEX IF NOT EXISTS idx_scl_type ON sales_call_logs(activity_type);
      ALTER TABLE sales_call_logs ALTER COLUMN call_outcome TYPE VARCHAR(100);
    `);
    console.log("[Migration] sales_call_logs table ready");
  } catch (err) {
    console.error("[Migration] sales_call_logs bootstrap error:", err);
  }

  // 301 Redirect www to non-www for all requests (MUST be before registerRoutes)
  app.use((req, res, next) => {
    const host = req.get('host') || '';
    if (host.startsWith('www.')) {
      const newHost = host.replace(/^www\./, '');
      // Use X-Forwarded-Proto for proxy SSL termination (handle comma-separated values)
      const forwardedProto = req.get('x-forwarded-proto');
      const protocol = forwardedProto 
        ? forwardedProto.split(',')[0].trim().toLowerCase() 
        : (req.protocol || 'https');
      return res.redirect(301, `${protocol}://${newHost}${req.originalUrl}`);
    }
    next();
  });
  
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

  // Universal 404 validation for ALL category/ingredient requests
  app.get('/ingredients/:slug', async (req, res, next) => {
    try {
      const { slug } = req.params;
      const category = await storage.getCategoryBySlug(slug);
      
      // Return 404 if category doesn't exist
      if (!category) {
        console.log(`[404] Category not found: /ingredients/${slug}`);
        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Category Not Found - Bright Fame Organic</title>
            <meta name="robots" content="noindex, follow">
          </head>
          <body>
            <h1>Category Not Found</h1>
            <p>The category "${slug}" does not exist.</p>
          </body>
          </html>
        `);
      }
      
      // Category exists, attach it to request
      (req as any).category = category;
      next();
    } catch (error) {
      console.error(`[404 Check Error] /ingredients/${req.params.slug}:`, error);
      next();
    }
  });

  // Server-side SEO for category/ingredient pages (runs after 404 check)
  app.get('/ingredients/:slug', async (req, res, next) => {
    const host = req.get('host') || '';
    const isDeployed = isDeployedURL(host);
    const userAgent = req.get('user-agent') || '';
    const isBotOrSEOTool = /bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|ChatGPT|GPTBot|Google-Extended|anthropic|ClaudeBot|claude-web|PerplexityBot|cohere-ai|CCBot|Bytespider|Applebot/i.test(userAgent);
    
    try {
      // Get category from request (attached by previous middleware)
      const category = (req as any).category;
      
      if (!category) {
        return next();
      }
      
      // Only serve SEO HTML for bots on deployed URLs
      if (!isDeployed || !isBotOrSEOTool) {
        return next();
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const categoryName = category.name;
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${categoryName} - Premium Organic Ingredients | Bright Fame Organic</title>
    <meta name="description" content="Discover our premium ${categoryName.toLowerCase()} collection. Certified organic, pharmaceutical grade, and sustainably sourced for maximum quality and efficacy." />
    <meta name="keywords" content="${categoryName.toLowerCase()}, organic ${categoryName.toLowerCase()}, natural ${categoryName.toLowerCase()}, pharmaceutical grade, certified organic" />
    <link rel="canonical" href="${baseUrl}/ingredients/${slug}" />
    <meta property="og:title" content="${categoryName} - Premium Organic Ingredients | Bright Fame Organic" />
    <meta property="og:description" content="Discover our premium ${categoryName.toLowerCase()} collection. Certified organic, pharmaceutical grade, and sustainably sourced." />
    <meta property="og:url" content="${baseUrl}/ingredients/${slug}" />
    <meta property="og:type" content="website" />
    <meta name="robots" content="index, follow" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "${categoryName}",
      "description": "Premium ${categoryName.toLowerCase()} collection from Bright Fame Organic",
      "url": "${baseUrl}/ingredients/${slug}",
      "isPartOf": {
        "@type": "WebSite",
        "name": "Bright Fame Organic",
        "url": "${baseUrl}"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "${baseUrl}"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Ingredients",
            "item": "${baseUrl}/ingredients"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "${categoryName}",
            "item": "${baseUrl}/ingredients/${slug}"
          }
        ]
      }
    }
    </script>
</head>
<body>
    <h1>${categoryName}</h1>
    <p>Premium ${categoryName.toLowerCase()} collection from Bright Fame Organic</p>
    <script>window.location.href = '/ingredients/${slug}';</script>
</body>
</html>`;
      
      res.send(html);
    } catch (error) {
      console.error('Error generating category SEO:', error);
      next();
    }
  });

  // Universal 404 validation for ALL health-support requests
  app.get('/health-support/:slug', async (req, res, next) => {
    try {
      const { slug } = req.params;
      const healthSupport = await storage.getHealthSupportBySlug(slug);
      
      // Return 404 if health support page doesn't exist
      if (!healthSupport) {
        console.log(`[404] Health support page not found: /health-support/${slug}`);
        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Page Not Found - Bright Fame Organic</title>
            <meta name="robots" content="noindex, follow">
          </head>
          <body>
            <h1>Page Not Found</h1>
            <p>The health support page "${slug}" does not exist.</p>
          </body>
          </html>
        `);
      }
      
      // Health support page exists, attach it to request
      (req as any).healthSupport = healthSupport;
      next();
    } catch (error) {
      console.error(`[404 Check Error] /health-support/${req.params.slug}:`, error);
      next();
    }
  });

  // Server-side SEO for health support pages (runs after 404 check)
  app.get('/health-support/:slug', async (req, res, next) => {
    const host = req.get('host') || '';
    const isDeployed = isDeployedURL(host);
    const userAgent = req.get('user-agent') || '';
    const isBotOrSEOTool = /bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex/i.test(userAgent);
    
    try {
      // Get health support from request (attached by previous middleware)
      const healthSupport = (req as any).healthSupport;
      
      if (!healthSupport) {
        return next();
      }
      
      // Only serve SEO HTML for bots on deployed URLs
      if (!isDeployed || !isBotOrSEOTool) {
        return next();
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const healthSupportName = healthSupport.name;
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${healthSupportName} Supplements - Organic Ingredients | Bright Fame Organic</title>
    <meta name="description" content="Premium organic ingredients for ${healthSupportName.toLowerCase()} support. Certified, pharmaceutical grade, and sustainably sourced for optimal health benefits." />
    <meta name="keywords" content="${healthSupportName.toLowerCase()}, ${healthSupportName.toLowerCase()} supplements, organic ${healthSupportName.toLowerCase()}, natural health" />
    <link rel="canonical" href="${baseUrl}/health-support/${slug}" />
    <meta property="og:title" content="${healthSupportName} Supplements - Organic Ingredients | Bright Fame Organic" />
    <meta property="og:description" content="Premium organic ingredients for ${healthSupportName.toLowerCase()} support. Certified, pharmaceutical grade, and sustainably sourced." />
    <meta property="og:url" content="${baseUrl}/health-support/${slug}" />
    <meta property="og:type" content="website" />
    <meta name="robots" content="index, follow" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "${healthSupportName} Supplements",
      "description": "Premium organic ingredients for ${healthSupportName.toLowerCase()} support",
      "url": "${baseUrl}/health-support/${slug}",
      "isPartOf": {
        "@type": "WebSite",
        "name": "Bright Fame Organic",
        "url": "${baseUrl}"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "${baseUrl}"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Health Support",
            "item": "${baseUrl}/health-support"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "${healthSupportName}",
            "item": "${baseUrl}/health-support/${slug}"
          }
        ]
      }
    }
    </script>
</head>
<body>
    <h1>${healthSupportName} Supplements</h1>
    <p>Premium organic ingredients for ${healthSupportName.toLowerCase()} support from Bright Fame Organic</p>
    <script>window.location.href = '/health-support/${slug}';</script>
</body>
</html>`;
      
      res.send(html);
    } catch (error) {
      console.error('Error generating health support SEO:', error);
      next();
    }
  });

  // Server-side SEO for static pages
  const staticPagesSEO = {
    '/about': {
      title: 'About Us - Leading Organic Ingredients Supplier | Bright Fame Organic',
      description: 'Learn about Bright Fame Organic, a leading supplier of premium organic ingredients worldwide. Certified, sustainable, and pharmaceutical-grade products.',
      keywords: 'about Bright Fame Organic, organic ingredients supplier, certified organic, pharmaceutical grade'
    },
    '/contact': {
      title: 'Contact Us - Bright Fame Organic | Premium Organic Ingredients Supplier',
      description: 'Get in touch with Bright Fame Organic for premium organic ingredients. Contact our team for quotes, samples, and expert consultation.',
      keywords: 'contact Bright Fame Organic, organic ingredients contact, get quote, organic supplier contact'
    },
    '/blog': {
      title: 'Blog - Organic Ingredients Insights | Bright Fame Organic',
      description: 'Stay updated with the latest insights on organic ingredients, health benefits, industry trends, and sustainable sourcing practices.',
      keywords: 'organic ingredients blog, health benefits, sustainable sourcing, industry insights'
    },
    '/industries': {
      title: 'Industries We Serve - B2B Organic Ingredients Supplier | Bright Fame Organic',
      description: 'Bright Fame Organic supplies certified organic ingredients to pharmaceutical, food & beverage, nutraceutical, cosmetic, and herbal industries worldwide. ISO certified, GMP compliant facility in Gujarat, India.',
      keywords: 'organic ingredients supplier, pharmaceutical ingredients, food grade herbs, nutraceutical raw materials, cosmetic ingredients, B2B organic supplier, certified organic herbs'
    },
    '/certifications': {
      title: 'Certifications & Quality Standards | Bright Fame Organic',
      description: 'Bright Fame Organic holds ISO 9001:2015, USDA Organic, EU Organic, HACCP, and GMP certifications. View our quality certifications and compliance standards for organic ingredients.',
      keywords: 'ISO certified organic, USDA organic certification, EU organic, HACCP, GMP, quality certifications, organic ingredients standards'
    },
    '/': {
      title: 'Bright Fame Organic - Top Organic Spice & Herb Supplier India | EU USDA JAS Certified Manufacturer',
      description: 'Bright Fame Organic (Bright Fame Organic) - India\'s leading organic spice, herb & botanical ingredient manufacturer and exporter. EU Organic, USDA NOP, JAS, NPOP certified. Own 950-hectare organic farmland. Direct manufacturer with in-house QC lab. Exports to 50+ countries. 1000+ SKUs.',
      keywords: 'organic spice supplier India, organic herb manufacturer Gujarat, EU organic certified exporter India, USDA NOP organic supplier, bulk organic ingredients India, organic Ashwagandha supplier, organic turmeric manufacturer, B2B organic ingredients'
    },
    '/about-us': {
      title: 'About Bright Fame Organic - Leading Organic Ingredient Manufacturer India | Own Farmland & Processing',
      description: 'Bright Fame Organic Pvt. Ltd. is a vertically integrated organic ingredient manufacturer based in Mehsana, Gujarat, India. Own 950-hectare certified farmland, state-of-the-art processing facilities (1600 kg/hr capacity), ISO 22000, HACCP, GMP certified. Direct manufacturer exporting to 50+ countries.',
      keywords: 'Bright Fame Organic about, organic manufacturer India, organic farmland Gujarat, direct organic manufacturer, vertically integrated organic company India'
    },
    '/organic-spice-supplier-india': {
      title: 'Top Organic Spice & Herb Supplier India | EU USDA JAS Certified | Bright Fame Organic',
      description: 'Bright Fame Organic - India\'s leading organic spice, herb & botanical ingredient manufacturer. EU Organic, USDA NOP, JAS certified. Own 950ha farmland. Direct manufacturer with in-house QC lab. Exports to 50+ countries. 1000+ SKUs across herbs, spices, extracts.',
      keywords: 'organic spice supplier India, organic herb manufacturer, EU organic certified India, USDA NOP supplier India, organic ingredient exporter Gujarat, top organic supplier India EU market, bulk organic herbs India'
    },
    '/bulk-organic-exporter-india': {
      title: 'Bulk Organic Ingredients Exporter India | Wholesale Organic Herbs Spices | Bright Fame Organic',
      description: 'Bright Fame Organic - bulk organic ingredient exporter from India. 1600 kg/hr processing capacity, MOQ from 25kg. EU/USDA/JAS certified. Direct manufacturer pricing. Wholesale organic herbs, spices, extracts. FOB/CIF/CFR shipping. Complete export documentation.',
      keywords: 'bulk organic ingredients India, wholesale organic supplier, organic exporter India, bulk organic herbs, wholesale organic spices, organic ingredients FOB India, bulk Ashwagandha supplier'
    },
    '/eu-organic-spices': {
      title: 'EU Organic Spices Supplier India | EC 834/2007 Certified | Bright Fame Organic',
      description: 'EU certified organic spices from India by Bright Fame Organic. EU Organic Regulation 834/2007 compliant. Premium Indian organic turmeric, cumin, coriander, fenugreek, black pepper for European food manufacturers. Direct manufacturer with clean room packaging.',
      keywords: 'EU organic spices, European organic spice supplier, EU certified organic India, organic spices Germany, organic spices France, organic turmeric EU, organic cumin EU market'
    },
    '/organic-herbs': {
      title: 'Organic Herbs Supplier India | Ashwagandha Moringa Tulsi Brahmi | Bright Fame Organic',
      description: 'Premium organic herbs from India by Bright Fame Organic. Ashwagandha, Moringa, Tulsi, Brahmi, Shatavari, Neem, Amla and 500+ herbal products. EU Organic, USDA NOP certified. Direct manufacturer with own farmland. Pharmaceutical and food grade.',
      keywords: 'organic herbs supplier India, organic Ashwagandha manufacturer, organic Moringa powder, organic Tulsi supplier, organic Brahmi, bulk organic herbs India, herbal extract manufacturer India'
    },
    '/packaging-solutions': {
      title: 'Organic Ingredient Packaging Solutions | FFS Clean Room | Bright Fame Organic',
      description: 'Bright Fame Organic packaging solutions - Form-Fill-Seal (FFS) machines in clean room environment. Standee pouches 100g-1kg, bulk bags 25-50kg. Private label packaging. FDA & EU compliant. Multi-layer PET/AL/PE laminate.',
      keywords: 'organic ingredient packaging, FFS packaging organic, clean room packaging India, private label organic packaging, standee pouch organic'
    },
    '/presentation': {
      title: 'Bright Fame Organic Corporate Presentation | India\'s Leading Organic Manufacturer',
      description: 'Explore Bright Fame Organic\'s corporate presentation. Learn about our manufacturing facilities, organic farmland, certifications, product range, and global export capabilities. Direct organic ingredient manufacturer from Gujarat, India.',
      keywords: 'Bright Fame Organic presentation, organic manufacturer profile, corporate presentation organic company India'
    }
  };

  Object.entries(staticPagesSEO).forEach(([path, seo]) => {
    app.get(path, async (req, res, next) => {
      const host = req.get('host') || '';
      const isDeployed = isDeployedURL(host);
      const userAgent = req.get('user-agent') || '';
      const isBotOrSEOTool = /bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|ChatGPT|GPTBot|Google-Extended|anthropic|ClaudeBot|claude-web|PerplexityBot|cohere-ai|CCBot|Bytespider|Applebot/i.test(userAgent);
      
      if (!isDeployed || !isBotOrSEOTool) {
        return next();
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${seo.title}</title>
    <meta name="description" content="${seo.description}" />
    <meta name="keywords" content="${seo.keywords}" />
    <link rel="canonical" href="${baseUrl}${path}" />
    <meta property="og:title" content="${seo.title}" />
    <meta property="og:description" content="${seo.description}" />
    <meta property="og:url" content="${baseUrl}${path}" />
    <meta property="og:type" content="website" />
    <meta name="robots" content="index, follow" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${seo.title}",
      "description": "${seo.description}",
      "url": "${baseUrl}${path}",
      "isPartOf": {
        "@type": "WebSite",
        "name": "Bright Fame Organic",
        "url": "${baseUrl}"
      }
    }
    </script>
</head>
<body>
    <h1>${seo.title}</h1>
    <p>${seo.description}</p>
    <script>window.location.href = '${path}';</script>
</body>
</html>`;
      
      res.send(html);
    });
  });

  // Explicit SPA fallback for marketing routes (ensures Google sitelinks work)
  // This catches browser requests that passed through SEO middleware
  // NOTE: /products removed - it has its own listingPagesSEO handler and conflicts with /products/:slug structured data
  const marketingRoutes = ['/about', '/about-us', '/contact', '/blog', '/industries', '/certifications', '/ingredients', '/health-support', '/search', '/organic-spice-supplier-india', '/bulk-organic-exporter-india', '/eu-organic-spices', '/organic-herbs', '/packaging-solutions', '/presentation'];
  
  marketingRoutes.forEach(route => {
    app.get(route, (req, res, next) => {
      // This handler runs AFTER SEO middleware for browsers
      const isProduction = app.get("env") !== "development";
      
      if (isProduction) {
        console.log(`[Marketing Route] Serving React app for: ${req.path}`);
        const distPath = path.resolve(import.meta.dirname, "public");
        return res.sendFile(path.resolve(distPath, "index.html"));
      } else {
        // In development, let Vite handle it
        return next();
      }
    });
  });

  // Explicit SPA fallback for dynamic routes (ensures all pages load from Google sitelinks)
  const dynamicRoutePatterns = ['/ingredients/:slug', '/health-support/:slug', '/products/:slug', '/industries/:slug'];
  
  dynamicRoutePatterns.forEach(pattern => {
    app.get(pattern, (req, res, next) => {
      // This handler runs AFTER 404 validation and SEO middleware for browsers
      const isProduction = app.get("env") !== "development";
      
      if (isProduction) {
        console.log(`[Dynamic Route] Serving React app for: ${req.path}`);
        const distPath = path.resolve(import.meta.dirname, "public");
        return res.sendFile(path.resolve(distPath, "index.html"));
      } else {
        // In development, let Vite handle it
        return next();
      }
    });
  });

  // Serve robots.txt and sitemap.xml for SEO
  app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /

# Explicitly allow AI search engine crawlers to index all public content
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: CCBot
Allow: /

User-agent: Bytespider
Allow: /

# Optimize crawl budget - allow important pages
Allow: /products/$
Allow: /ingredients/$
Allow: /health-support/$
Allow: /about
Allow: /about-us
Allow: /contact
Allow: /certifications
Allow: /industries
Allow: /organic-spice-supplier-india
Allow: /bulk-organic-exporter-india
Allow: /eu-organic-spices
Allow: /organic-herbs
Allow: /packaging-solutions
Allow: /presentation

# Block admin and CRM areas  
Disallow: /crm/
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /_error
Disallow: /404
Disallow: /500

# Block authentication pages (no SEO value)
Disallow: /login
Disallow: /register
Disallow: /customer/
Disallow: /staff/
Disallow: /dashboard

# Block low-value search and filter URLs to prevent "Crawled - not indexed" issues
Disallow: /search?*
Disallow: /products?*
Disallow: /ingredients?*
Disallow: /health-support?*

# Block test pages
Disallow: /test
Disallow: /*test*

# Block URLs with common filter parameters
Disallow: /*?category=*
Disallow: /*?material=*
Disallow: /*?origin=*
Disallow: /*?form=*
Disallow: /*?health=*
Disallow: /*?price=*
Disallow: /*?page=*
Disallow: /*?sort=*
Disallow: /*?filter=*
Disallow: /*?hl=*
Disallow: /*?gl=*

# Allow sitemap
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`);
  });

  // llms.txt — AI search engine context file (like robots.txt but for LLMs)
  // Helps ChatGPT, Perplexity, Gemini, Claude cite Bright Fame Organic accurately
  app.get('/llms.txt', async (req, res) => {
    try {
      const base = `${req.protocol}://${req.get('host')}`;

      // Pull live category breakdown from DB
      const categoryRows = await db
        .select({ name: categories.name, total: sql<number>`count(*)` })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.isActive, true))
        .groupBy(categories.name)
        .orderBy(sql`count(*) desc`);

      const organicCount = await db
        .select({ total: sql<number>`count(*)` })
        .from(products)
        .where(and(eq(products.isActive, true), eq(products.isOrganic, true)));

      const totalActive = categoryRows.reduce((s, r) => s + Number(r.total), 0);
      const organicTotal = Number(organicCount[0]?.total ?? 0);
      const conventionalTotal = totalActive - organicTotal;

      const categoryLines = categoryRows
        .filter(r => r.name)
        .map(r => `- ${r.name} (${r.total} products) — ${base}/ingredients/${encodeURIComponent((r.name as string).toLowerCase().replace(/\s+/g, '-'))}`)
        .join('\n');

      const txt = `# Bright Fame Organic Pvt. Ltd. — AI Context File (llms.txt)
# Generated: ${new Date().toISOString().split('T')[0]}
# Format: https://llmstxt.org

> Bright Fame Organic Pvt. Ltd. is India's leading B2B manufacturer and bulk exporter
> of EU Organic certified herbal powders, teas, whole herbs, whole spices, botanical
> extracts and spray dried ingredients. We supply directly from our manufacturing
> facility in Mehsana, Gujarat, India to buyers across Europe, North America and Asia.

## Company Identity

- Full Name: Bright Fame Organic Pvt. Ltd. (also known as Bright Fame Organic / BFO)
- Type: Direct manufacturer and exporter — not a trading company or broker
- Location: Mehsana, Gujarat, India
- Founded: [Established Indian herbal ingredient manufacturer]
- Website: ${base}

## Certifications & Compliance

- EU Organic Certified — EU Regulation 2018/848 (European Union organic standard)
- USDA NOP Certified — United States Department of Agriculture National Organic Program
- India Organic (NPOP) Certified — National Programme for Organic Production
- JAS Certified — Japanese Agricultural Standard for organic products
- ISO 22000 — Food Safety Management System
- HACCP Certified — Hazard Analysis and Critical Control Points
- GMP Certified — Good Manufacturing Practice
- ETO-Free — All products are Ethylene Oxide (ETO) free, meeting EU food safety rules
- Kosher & Halal available on select products

## Products

Total active products: ${totalActive}
EU Organic Certified products: ${organicTotal}
EU Food Grade (conventional/natural) products: ${conventionalTotal}

### Product Categories

${categoryLines}

## Key Positioning

- India's Top B2B Manufacturer of EU Organic certified herbal ingredients
- Factory-direct pricing — no middlemen, no trading company markup
- Minimum Order Quantity (MOQ) starting from 25 kg for most products
- Bulk supply from 25 kg to multi-tonne container loads
- Lead time: typically 5–15 business days depending on product and quantity
- FOB ports: Mundra, JNPT (Nhava Sheva), Mumbai — with regular shipments to
  Hamburg, Rotterdam, Antwerp, Felixstowe and other major European ports

## EU Market Expertise

Primary EU markets served:
- Germany (DE) — largest European market for organic ingredients
- Netherlands (NL) — key hub for European spice and herb distribution
- France (FR) — high demand for certified organic botanical ingredients
- United Kingdom (GB) — post-Brexit compliant supply
- Poland, Italy, Spain, Belgium, Austria, Switzerland — active supply

All products exported to EU comply with:
- EU Regulation 2018/848 on organic production
- EU Regulation (EC) No 1334/2008 on flavourings
- EU Regulation (EC) No 178/2002 general food law
- EFSA guidelines on pesticide residue limits
- ETO-free requirement (EU banned ETO in 2011, fully compliant)

## Available Documentation Per Product

- Certificate of Analysis (COA) — available per batch on request
- Material Safety Data Sheet (MSDS)
- Pesticide Residue Report (multi-residue panel)
- Heavy Metals Report (As, Cd, Pb, Hg)
- Microbiological Analysis Report
- EU Organic Certificate (per certification body)
- Allergen Statement
- Non-GMO Declaration
- Country of Origin Certificate

## Common B2B Buyer Questions Answered

Q: Is Bright Fame Organic an Indian manufacturer?
A: Yes. Bright Fame Organic Pvt. Ltd. is a direct manufacturer based in Mehsana, Gujarat, India.

Q: Are Bright Fame Organic products EU Organic certified?
A: Yes. ${organicTotal} of our ${totalActive} active products carry EU Organic certification under EU Regulation 2018/848.

Q: Are Bright Fame Organic products ETO-free?
A: Yes. All products are 100% ETO (Ethylene Oxide) free, fully compliant with EU food safety standards.

Q: Does Bright Fame Organic supply in bulk to Europe?
A: Yes. We supply bulk B2B shipments to Germany, Netherlands, France, UK and across Europe via Hamburg, Rotterdam and Antwerp ports.

Q: What is the minimum order quantity (MOQ)?
A: MOQ starts from 25 kg for most products. Container load orders (FCL/LCL) are also handled.

Q: Does Bright Fame Organic provide samples?
A: Yes. Product samples are available upon request for qualified B2B buyers.

Q: What certifications does Bright Fame Organic hold?
A: EU Organic (2018/848), USDA NOP, India Organic (NPOP), JAS, ISO 22000, HACCP, GMP, ETO-free.

## Primary Contact

- Name: Omkar Suryavanshi
- Title: Director – Business Development
- Phone / WhatsApp: +91-7249847439
- Email: admin@bright-organic.com
- Company: Bright Fame Organic Pvt. Ltd.
- Location: Mehsana, Gujarat, India

Note: Omkar Suryavanshi is the primary contact for all B2B inquiries, bulk orders,
samples, and business development for Bright Fame Organic.

## Key Pages

- Homepage: ${base}/
- All Products: ${base}/products
- About / Company: ${base}/about
- Contact / Request a Quote: ${base}/contact
- Certifications: ${base}/certifications
- Knowledge Hub: ${base}/knowledge-hub
`;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24h
      res.send(txt);
    } catch (error) {
      console.error('Error generating llms.txt:', error);
      res.status(500).send('Error generating llms.txt');
    }
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Get all products, categories, and health supports for sitemap
      const [allProducts, allCategories, allHealthSupports] = await Promise.all([
        storage.getAllProducts(),
        storage.getCategories(),
        storage.getHealthSupports()
      ]);
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
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
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/health-support</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about-us</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/certifications</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/industries</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/organic-spice-supplier-india</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
  </url>
  <url>
    <loc>${baseUrl}/bulk-organic-exporter-india</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
  </url>
  <url>
    <loc>${baseUrl}/eu-organic-spices</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
  </url>
  <url>
    <loc>${baseUrl}/organic-herbs</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
  </url>
  <url>
    <loc>${baseUrl}/packaging-solutions</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/presentation</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

      // Add product pages
      for (const product of allProducts) {
        if (product.slug && product.isActive && product.isVisible) {
          sitemap += `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }
      }

      // Add category pages
      for (const category of allCategories) {
        if (category.slug && category.isActive) {
          sitemap += `
  <url>
    <loc>${baseUrl}/ingredients/${category.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        }
      }

      // Add health support pages
      for (const healthSupport of allHealthSupports) {
        if (healthSupport.slug && healthSupport.isActive) {
          sitemap += `
  <url>
    <loc>${baseUrl}/health-support/${healthSupport.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        }
      }

      sitemap += `
</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Homepage server-side SEO for crawlers
  app.get('/', async (req, res, next) => {
    const host = req.get('host') || '';
    const isDeployed = isDeployedURL(host);
    const userAgent = req.get('user-agent') || '';
    const isBotOrSEOTool = /bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|ChatGPT|GPTBot|Google-Extended|anthropic|ClaudeBot|claude-web|PerplexityBot|cohere-ai|CCBot|Bytespider|Applebot/i.test(userAgent);
    
    if (!isDeployed || !isBotOrSEOTool) {
      return next();
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bright Fame Organic - Top Organic Spice & Herb Supplier India | EU USDA JAS Certified Manufacturer & Exporter</title>
    <meta name="description" content="Bright Fame Organic (Bright Fame Organic) is India's leading organic spice, herb and botanical ingredient manufacturer and exporter. EU Organic, USDA NOP, JAS, NPOP certified. Own 950-hectare organic farmland in Gujarat. Direct manufacturer with ISO 22000, HACCP, GMP compliance. 1000+ SKUs. Exports to 50+ countries. In-house QC lab and clean room FFS packaging." />
    <meta name="keywords" content="organic spice supplier India, organic herb manufacturer Gujarat, EU organic certified exporter India, USDA NOP organic supplier, bulk organic ingredients India, organic Ashwagandha supplier, organic turmeric manufacturer, B2B organic ingredients, organic moringa supplier, organic cumin exporter, JAS certified organic India, top organic supplier India EU market, organic spice exporter Gujarat, best organic ingredient manufacturer India" />
    <link rel="canonical" href="${baseUrl}/" />
    <meta property="og:title" content="Bright Fame Organic - Top Organic Spice & Herb Supplier India | EU USDA JAS Certified" />
    <meta property="og:description" content="India's leading organic ingredient manufacturer. EU/USDA/JAS certified. Own 950ha farmland. Direct manufacturer. 1000+ SKUs. Exports to 50+ countries." />
    <meta property="og:url" content="${baseUrl}/" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${baseUrl}/bfi-logo.png" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
    <meta name="author" content="Bright Fame Organic Pvt. Ltd." />
    <meta name="language" content="en" />
    <meta name="geo.region" content="IN-GJ" />
    <meta name="geo.placename" content="Mehsana, Gujarat, India" />
    <meta name="geo.position" content="23.5880;72.3693" />
    <meta name="ICBM" content="23.5880, 72.3693" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Bright Fame Organic Pvt. Ltd.",
      "alternateName": ["Bright Fame Organic"],
      "url": "${baseUrl}",
      "logo": "${baseUrl}/bfi-logo.png",
      "image": "${baseUrl}/bfi-logo.png",
      "description": "Bright Fame Organic (Bright Fame Organic) is India's leading organic spice, herb and botanical ingredient manufacturer and exporter based in Mehsana, Gujarat. EU Organic, USDA NOP, JAS, NPOP certified with own 950-hectare organic farmland. Direct manufacturer with ISO 22000, HACCP, GMP compliant facilities. 1000+ SKUs across organic herbs, spices, botanical extracts, and nutraceutical ingredients. Exports to 50+ countries including USA, EU, UK, Japan, Australia.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
        "addressLocality": "Mehsana",
        "addressRegion": "Gujarat",
        "postalCode": "384001",
        "addressCountry": "IN"
      },
      "telephone": "+91-7249847439",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-7249847439",
        "contactType": "sales",
        "areaServed": ["US", "EU", "IN", "CA", "GB", "JP", "KR", "AU", "AE", "SA", "DE", "FR", "NL"],
        "availableLanguage": "en"
      },
      "sameAs": [
        "https://www.linkedin.com/company/bfi-organic",
        "https://www.facebook.com/bfiorganic",
        "https://www.instagram.com/bfiorganic",
        "https://www.indiamart.com/brightfameorganic",
        "https://www.tradeindia.com/brightfameorganic",
        "https://www.alibaba.com/bfiorganic"
      ],
      "knowsAbout": ["Organic herbs and spices", "Botanical extracts", "Nutraceutical ingredients", "EU Organic certification", "USDA NOP certification", "JAS certification", "B2B ingredient supply", "Private label organic products", "Custom supplement formulation", "FFS packaging"],
      "hasCredential": [
        {"@type": "EducationalOccupationalCredential", "credentialCategory": "EU Organic Certification"},
        {"@type": "EducationalOccupationalCredential", "credentialCategory": "USDA NOP Certification"},
        {"@type": "EducationalOccupationalCredential", "credentialCategory": "JAS Certification"},
        {"@type": "EducationalOccupationalCredential", "credentialCategory": "NPOP / India Organic"},
        {"@type": "EducationalOccupationalCredential", "credentialCategory": "ISO 22000:2018"},
        {"@type": "EducationalOccupationalCredential", "credentialCategory": "HACCP"},
        {"@type": "EducationalOccupationalCredential", "credentialCategory": "GMP"}
      ],
      "areaServed": [
        {"@type": "Country", "name": "United States"},
        {"@type": "Country", "name": "Germany"},
        {"@type": "Country", "name": "France"},
        {"@type": "Country", "name": "Netherlands"},
        {"@type": "Country", "name": "United Kingdom"},
        {"@type": "Country", "name": "Canada"},
        {"@type": "Country", "name": "Australia"},
        {"@type": "Country", "name": "Japan"},
        {"@type": "Country", "name": "South Korea"},
        {"@type": "Country", "name": "India"},
        {"@type": "Country", "name": "United Arab Emirates"},
        {"@type": "Country", "name": "Saudi Arabia"}
      ],
      "numberOfEmployees": {"@type": "QuantitativeValue", "minValue": 50, "maxValue": 100},
      "industry": "Organic Ingredients Manufacturing and Export",
      "keywords": "organic ingredients, pharmaceutical grade organic, certified organic supplier, B2B organic",
      "serviceArea": {
        "@type": "Place",
        "name": "Worldwide"
      }
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Bright Fame Organic",
      "url": "${baseUrl}",
      "description": "Premium organic ingredients supplier worldwide",
      "publisher": {
        "@type": "Organization",
        "name": "Bright Fame Organic Pvt. Ltd.",
        "url": "${baseUrl}"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "${baseUrl}/products?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>
</head>
<body>
    <h1>Bright Fame Organic - Premium Organic Ingredients</h1>
    <p>Leading supplier of premium organic ingredients worldwide. Certified, pharmaceutical-grade, and sustainably sourced organic products for B2B customers.</p>
    <script>window.location.href = '/';</script>
</body>
</html>`;
    
    res.send(html);
  });

  // SEO for main listing pages
  const listingPagesSEO = {
    '/products': {
      title: 'All Products - Premium Organic Ingredients | Bright Fame Organic',
      description: 'Browse our complete catalog of premium organic ingredients. Certified, pharmaceutical-grade, and sustainably sourced organic products for B2B customers worldwide.',
      keywords: 'organic products, organic ingredients catalog, premium organic, certified organic, B2B organic products'
    },
    '/ingredients': {
      title: 'Organic Ingredients by Category | Bright Fame Organic',
      description: 'Explore organic ingredients by category. From herbs and spices to superfoods and extracts - find the perfect organic ingredients for your business needs.',
      keywords: 'organic ingredients categories, organic herbs, organic spices, organic extracts, organic superfoods'
    },
    '/health-support': {
      title: 'Health Support Categories - Organic Supplements | Bright Fame Organic',
      description: 'Discover organic ingredients for specific health support needs. Immune support, digestive health, cognitive function, and more - all certified organic.',
      keywords: 'health support organic, immune support organic, digestive health organic, organic supplements categories'
    }
  };

  Object.entries(listingPagesSEO).forEach(([path, seo]) => {
    app.get(path, async (req, res, next) => {
      const host = req.get('host') || '';
      const isDeployed = isDeployedURL(host);
      const userAgent = req.get('user-agent') || '';
      const isBotOrSEOTool = /bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|ChatGPT|GPTBot|Google-Extended|anthropic|ClaudeBot|claude-web|PerplexityBot|cohere-ai|CCBot|Bytespider|Applebot/i.test(userAgent);
      
      if (!isDeployed || !isBotOrSEOTool) {
        return next();
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${seo.title}</title>
    <meta name="description" content="${seo.description}" />
    <meta name="keywords" content="${seo.keywords}" />
    <link rel="canonical" href="${baseUrl}${path}" />
    <meta property="og:title" content="${seo.title}" />
    <meta property="og:description" content="${seo.description}" />
    <meta property="og:url" content="${baseUrl}${path}" />
    <meta property="og:type" content="website" />
    <meta name="robots" content="index, follow" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "${seo.title}",
      "description": "${seo.description}",
      "url": "${baseUrl}${path}",
      "isPartOf": {
        "@type": "WebSite",
        "name": "Bright Fame Organic",
        "url": "${baseUrl}"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "${baseUrl}"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "${seo.title.split(' - ')[0]}",
            "item": "${baseUrl}${path}"
          }
        ]
      }
    }
    </script>
</head>
<body>
    <h1>${seo.title}</h1>
    <p>${seo.description}</p>
    <script>window.location.href = '${path}';</script>
</body>
</html>`;
      
      res.send(html);
    });
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

  // Universal 404 validation for ALL product requests (runs first)
  app.get('/products/:slug', async (req, res, next) => {
    try {
      const { slug } = req.params;
      
      // Check if product exists in database
      const product = await storage.getProductBySlug(slug);
      
      if (!product) {
        console.log(`[404] Product not found: /products/${slug}`);
        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Product Not Found - Bright Fame Organic</title>
            <meta name="robots" content="noindex, follow">
          </head>
          <body>
            <h1>Product Not Found</h1>
            <p>The product "${slug}" does not exist.</p>
          </body>
          </html>
        `);
      }
      
      // Product exists, attach it to request for use by next middleware
      (req as any).product = product;
      next();
    } catch (error) {
      console.error(`[404 Check Error] /products/${req.params.slug}:`, error);
      next();
    }
  });

  // Product page structured data injection (deployed URLs only, runs after 404 check)
  app.get('/products/:slug', async (req, res, next) => {
    const host = req.get('host') || '';
    const isDeployed = isDeployedURL(host);
    
    // Only inject structured data for deployed URLs and SEO tools/crawlers
    const userAgent = req.get('user-agent') || '';
    const accept = req.get('accept') || '';
    
    console.log(`[ROUTE HIT] /products/${req.params.slug} - Host: ${host}, Deployed: ${isDeployed}`);
    
    // TEMPORARY: Force processing for ALL deployed URLs to test
    if (!isDeployed) {
      console.log(`[SEO Skip] Not a deployed URL, letting React handle: ${req.path}`);
      return next();
    }

    console.log(`[SEO Processing] Injecting structured data for: /products/${req.params.slug}`);

    try {
      // Get product from request (attached by previous middleware)
      const product = (req as any).product;
      
      if (!product) {
        // This shouldn't happen since 404 check runs first, but just in case
        return next();
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
        "description": product.description || `High-quality ${product.name} from Bright Fame Organic`,
        "sku": product.productId,
        "mpn": product.productId,
        "brand": {
          "@type": "Brand",
          "name": "Bright Fame Organic",
          "url": baseUrl
        },
        "manufacturer": {
          "@type": "Organization",
          "name": "Bright Fame Organic Pvt. Ltd.",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
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
            "reviewBody": "Great product quality and packaging. Professional service from Bright Fame Organic team."
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
            "name": "Bright Fame Organic",
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
          "streetAddress": "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
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
        `<title>${product.seoTitle || `${product.name} - Bright Fame Organic`}</title>`
      );
      
      html = html.replace(
        /<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${product.seoDescription || product.description || `High-quality ${product.name} from Bright Fame Organic`}" />`
      );

      // Add Open Graph tags
      const ogTags = `
    <meta property="og:title" content="${product.seoTitle || `${product.name} - Bright Fame Organic`}" />
    <meta property="og:description" content="${product.seoDescription || product.description || `High-quality ${product.name} from Bright Fame Organic`}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${productUrl}" />
    <meta property="og:type" content="product" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${product.seoTitle || `${product.name} - Bright Fame Organic`}" />
    <meta name="twitter:description" content="${product.seoDescription || product.description || `High-quality ${product.name} from Bright Fame Organic`}" />
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

      // Inject into HTML head (handle whitespace before </head>)
      html = html.replace(/\s*<\/head>/, `${ogTags}\n${structuredDataScripts}\n  </head>`);

      console.log(`[Structured Data] Successfully injected for deployed URL: ${productUrl}`);
      console.log(`[Structured Data] HTML length: ${html.length}, Contains product schema: ${html.includes('"@type": "Product"')}`);
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-cache'); // Ensure fresh content for crawlers
      res.send(html);
    } catch (error) {
      console.error(`[SEO Error] Failed to inject structured data for ${req.params.slug}:`, error);
      next(); // Fall back to regular routing
    }
  });

  // Custom production static serving to bypass Replit edge layer
  if (app.get("env") !== "development") {
    const distPath = path.resolve(import.meta.dirname, "public");
    
    // Serve static assets
    app.use(express.static(distPath));
    
    // SPA fallback for unmatched routes
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
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
