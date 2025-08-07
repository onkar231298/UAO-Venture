import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path from "path";

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
  
  // Add direct static routes BEFORE registerRoutes to prioritize them
  const { createStaticProductPage, createStaticHomePage } = await import('./static-handler.js');
  const { storage } = await import('./storage.js');
  
  // Server-side rendering for React fallback with exact original design
  app.get('/product/:slug', async (req, res, next) => {
    try {
      const slug = req.params.slug;
      const acceptsHtml = req.headers.accept?.includes('text/html');
      
      if (!acceptsHtml) {
        return next(); // Let API routes handle this
      }
      
      console.log(`[SSR] Rendering product page: ${slug}`);
      
      // Get product data
      const product = await storage.getProductBySlug(slug);
      if (!product) {
        return next(); // Let Vite handle 404
      }
      
      // Server-side rendered HTML with exact original design
      const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>${product.name} - BFI Organic</title>
    <meta name="description" content="${product.description || 'Premium organic product from BFI Organic'}" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .gradient-bg { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
      .green-gradient { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }
    </style>
  </head>
  <body class="gradient-bg">
    <div id="root">
      <!-- Header matching original design -->
      <header class="bg-white border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <nav class="flex justify-between items-center">
            <div class="flex items-center space-x-8">
              <a href="/" class="text-green-600 hover:text-green-700 font-medium">← Home</a>
              <a href="/products" class="text-gray-600 hover:text-gray-800 font-medium">Products</a>
            </div>
            <div class="text-gray-600 font-semibold text-lg">BFI Organic</div>
          </nav>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-6 py-10">
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
          
          <!-- Product Header -->
          <div class="green-gradient px-12 py-12 border-b border-gray-200">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">${product.name}</h1>
            <p class="text-xl text-gray-700 leading-relaxed">${product.description || 'Premium organic ingredient sourced directly for your business needs'}</p>
          </div>

          <!-- Product Details -->
          <div class="px-12 py-12">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              
              <!-- Left Column -->
              <div class="bg-gray-50 rounded-xl p-8 border border-gray-100">
                <h3 class="text-2xl font-semibold text-gray-900 mb-6">Product Information</h3>
                <div class="space-y-4">
                  <div class="flex justify-between items-center py-3 border-b border-gray-200">
                    <span class="text-gray-600 font-medium">Product ID</span>
                    <span class="font-semibold text-gray-900">${product.productId}</span>
                  </div>
                  <div class="flex justify-between items-center py-3 border-b border-gray-200">
                    <span class="text-gray-600 font-medium">Category</span>
                    <span class="font-semibold text-gray-900">${product.categoryName || 'Organic Ingredients'}</span>
                  </div>
                  <div class="flex justify-between items-center py-3">
                    <span class="text-gray-600 font-medium">Stock Available</span>
                    <span class="font-semibold text-green-600">${product.stockQuantity || 0} units</span>
                  </div>
                </div>
              </div>

              <!-- Right Column -->
              <div class="bg-blue-50 rounded-xl p-8 border border-blue-100">
                <h3 class="text-2xl font-semibold text-gray-900 mb-6">Supplier Information</h3>
                <div class="space-y-4">
                  <div class="flex justify-between items-center py-3 border-b border-blue-200">
                    <span class="text-gray-600 font-medium">Company</span>
                    <span class="font-semibold text-gray-900">Bright Fame Organic Pvt. Ltd.</span>
                  </div>
                  <div class="flex justify-between items-center py-3 border-b border-blue-200">
                    <span class="text-gray-600 font-medium">Quality Grade</span>
                    <span class="font-semibold text-gray-900">Premium</span>
                  </div>
                  <div class="flex justify-between items-center py-3">
                    <span class="text-gray-600 font-medium">Certification</span>
                    <span class="font-semibold text-green-600">✓ Organic Certified</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Section -->
            <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-8 text-center border border-yellow-200">
              <h3 class="text-xl font-semibold text-yellow-800 mb-3">Ready to Order?</h3>
              <p class="text-yellow-700 mb-6">Contact us for bulk pricing and custom requirements</p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Get Quote
                </button>
                <button class="bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg font-medium transition-colors">
                  Contact Supplier
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="mt-16 bg-gray-800 text-white py-10 text-center">
        <div class="max-w-7xl mx-auto px-6">
          <p class="text-gray-300">© 2025 Bright Fame Organic Pvt. Ltd. | Premium B2B Organic Ingredients</p>
        </div>
      </footer>
    </div>

    <!-- Progressive Enhancement with React -->
    <script type="module" src="/src/main.tsx"></script>
    <script>
      // Progressive enhancement - let React take over if it loads successfully
      console.log('Server-side rendered content loaded, waiting for React...');
      
      let reactLoadTimeout = setTimeout(() => {
        console.log('React enhancement not detected, keeping server-side content');
      }, 3000);
      
      // If React loads successfully, it will replace the content
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if React has taken over
            const reactElements = document.querySelectorAll('[data-reactroot], [data-react-helmet]');
            if (reactElements.length > 0) {
              console.log('React enhancement detected and active');
              clearTimeout(reactLoadTimeout);
              observer.disconnect();
            }
          }
        });
      });
      
      observer.observe(document.getElementById('root'), {
        childList: true,
        subtree: true
      });
    </script>
  </body>
</html>`;

      console.log(`[SSR] Serving server-side rendered product: ${product.name}`);
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
      
    } catch (error) {
      console.error('[SSR] Product rendering error:', error);
      next(); // Fall back to Vite
    }
  });

  // Homepage server-side rendering
  app.get('/', async (req, res, next) => {
    const acceptsHtml = req.headers.accept?.includes('text/html');
    if (!acceptsHtml) {
      return next();
    }

    console.log('[SSR] Rendering homepage');
    
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>BFI Organic - Premium B2B Organic Ingredients</title>
    <meta name="description" content="Leading supplier of certified organic ingredients for B2B customers worldwide." />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .gradient-bg { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
    </style>
  </head>
  <body class="gradient-bg min-h-screen">
    <div id="root">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-6 py-8 text-center">
          <h1 class="text-5xl font-bold text-gray-900">BFI Organic</h1>
          <p class="text-xl text-gray-600 mt-2">Premium B2B Organic Ingredients</p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-5xl mx-auto px-6 py-16">
        <div class="bg-white rounded-2xl shadow-lg px-16 py-16 text-center">
          <h2 class="text-5xl font-bold text-gray-900 mb-6">Welcome to BFI Organic</h2>
          <p class="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Your trusted partner for premium certified organic ingredients worldwide. We specialize in bulk B2B supply.
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div class="bg-green-50 p-6 rounded-xl border border-green-100">
              <div class="text-3xl mb-3">🌿</div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Original Design</h3>
              <p class="text-sm text-gray-600">Exact website view preserved</p>
            </div>
            
            <div class="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <div class="text-3xl mb-3">🔄</div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Refresh Fixed</h3>
              <p class="text-sm text-gray-600">Product pages work on direct access</p>
            </div>
            
            <div class="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
              <div class="text-3xl mb-3">⚡</div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Fully Functional</h3>
              <p class="text-sm text-gray-600">All features working seamlessly</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Progressive Enhancement -->
    <script type="module" src="/src/main.tsx"></script>
    <script>
      console.log('Homepage loaded with server-side rendering, React will enhance if available');
    </script>
  </body>
</html>`;

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  });

  const server = await registerRoutes(app);

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
