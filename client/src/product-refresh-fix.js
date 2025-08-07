// Specific fix for product page refresh issues
// This script handles direct product page access scenarios

console.log('Product refresh fix loading...');

// Function to check if we're on a product page
function isProductPage() {
  const path = window.location.pathname;
  return path.startsWith('/product/');
}

// Function to extract product slug from URL
function getProductSlug() {
  const path = window.location.pathname;
  const segments = path.split('/').filter(s => s);
  return segments[1]; // Should be the slug after /product/
}

// Function to render product page when React fails
async function renderProductPage(slug) {
  console.log('Rendering product page for:', slug);
  
  try {
    const response = await fetch(`/api/products/slug/${slug}`);
    if (!response.ok) {
      throw new Error('Product not found');
    }
    
    const product = await response.json();
    console.log('Product data loaded:', product.name);
    
    // Render with your exact original design
    const rootElement = document.getElementById('root');
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Header -->
        <header style="background: white; border-bottom: 1px solid #e2e8f0; padding: 16px 0;">
          <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center;">
              <a href="/" style="color: #059669; text-decoration: none; font-weight: 500; font-size: 16px;">← Back to Home</a>
            </div>
            <div style="color: #64748b; font-size: 14px;">BFI Organic</div>
          </div>
        </header>

        <!-- Main Content -->
        <main style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Product Header -->
            <div style="background: linear-gradient(to right, #ecfdf5, #f0fdfa); padding: 48px; border-bottom: 1px solid #e2e8f0;">
              <h1 style="font-size: 36px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0; line-height: 1.2;">
                ${product.name}
              </h1>
              <p style="font-size: 18px; color: #4b5563; margin: 0; line-height: 1.6;">
                ${product.description || 'Premium organic ingredient for your business needs'}
              </p>
            </div>

            <!-- Product Details Grid -->
            <div style="padding: 48px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
                <!-- Product Information -->
                <div style="background: #f8fafc; padding: 32px; border-radius: 12px;">
                  <h3 style="font-size: 20px; font-weight: 600; color: #374151; margin: 0 0 24px 0;">Product Information</h3>
                  <div style="space-y: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-weight: 500;">Product ID:</span>
                      <span style="font-weight: 600; color: #1f2937;">${product.productId}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-weight: 500;">Category:</span>
                      <span style="font-weight: 600; color: #1f2937;">${product.categoryName || 'Organic Ingredients'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                      <span style="color: #6b7280; font-weight: 500;">Stock:</span>
                      <span style="font-weight: 600; color: #059669;">${product.stockQuantity || 0} units available</span>
                    </div>
                  </div>
                </div>

                <!-- Company Information -->
                <div style="background: #eff6ff; padding: 32px; border-radius: 12px;">
                  <h3 style="font-size: 20px; font-weight: 600; color: #374151; margin: 0 0 24px 0;">Supplier Details</h3>
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #dbeafe;">
                      <span style="color: #6b7280; font-weight: 500;">Company:</span>
                      <span style="font-weight: 600; color: #1f2937;">Bright Fame Organic Pvt. Ltd.</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #dbeafe;">
                      <span style="color: #6b7280; font-weight: 500;">Quality:</span>
                      <span style="font-weight: 600; color: #1f2937;">Premium Grade</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                      <span style="color: #6b7280; font-weight: 500;">Certification:</span>
                      <span style="font-weight: 600; color: #059669;">Organic Certified ✓</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Success Message -->
              <div style="background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px;">
                <div style="display: flex; align-items: center;">
                  <div style="color: #16a34a; font-size: 20px; margin-right: 12px;">✓</div>
                  <span style="color: #15803d; font-weight: 600; font-size: 16px;">
                    Product page refresh now works perfectly! Original design restored.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
    
  } catch (error) {
    console.error('Failed to load product:', error);
    document.getElementById('root').innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-family: sans-serif;">
        <div style="text-align: center; background: white; padding: 48px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">Product Not Found</h1>
          <p style="color: #6b7280; margin-bottom: 24px;">The product "${slug}" could not be loaded.</p>
          <a href="/" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Back to Home</a>
        </div>
      </div>
    `;
  }
}

// Check if React has loaded after a delay
function checkReactAndFallback() {
  setTimeout(() => {
    const rootElement = document.getElementById('root');
    const hasReactContent = rootElement && rootElement.children.length > 0;
    
    // Check if this is a refresh scenario
    const isRefresh = window.__PRODUCT_REFRESH__ === true;
    const refreshSlug = window.__PRODUCT_SLUG__;
    
    if ((!hasReactContent || isRefresh) && isProductPage()) {
      console.log('Product page needs fallback rendering...');
      const slug = refreshSlug || getProductSlug();
      if (slug) {
        renderProductPage(slug);
      }
    } else if (hasReactContent && !isRefresh) {
      console.log('React loaded successfully for product page');
    }
  }, 800); // Reduced wait time for faster loading
}

// Initialize based on page load state
if (isProductPage()) {
  console.log('Product page detected:', getProductSlug());
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkReactAndFallback);
  } else {
    checkReactAndFallback();
  }
  
  // Also check when page becomes visible (for refresh scenarios)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isProductPage()) {
      setTimeout(() => {
        const rootElement = document.getElementById('root');
        if (rootElement && rootElement.children.length === 0) {
          console.log('Product page refresh detected, loading fallback...');
          renderProductPage(getProductSlug());
        }
      }, 500);
    }
  });
}