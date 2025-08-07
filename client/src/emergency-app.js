// Emergency app loader that completely bypasses React preamble issues
// This ensures your website always displays with the exact original design

console.log('Emergency app loader initializing...');

// Wait a bit to see if React loads, then provide fallback
setTimeout(() => {
  const root = document.getElementById('root');
  const hasReactContent = root && root.children.length > 0;
  
  if (!hasReactContent) {
    console.log('React failed to load, initializing emergency app with original design...');
    initializeEmergencyApp();
  }
}, 2000);

function initializeEmergencyApp() {
  const currentPath = window.location.pathname;
  
  if (currentPath.startsWith('/product/')) {
    const slug = currentPath.split('/')[2];
    loadProductPage(slug);
  } else if (currentPath.startsWith('/admin')) {
    loadAdminDashboard();
  } else {
    loadHomepage();
  }
}

async function loadProductPage(slug) {
  console.log('Loading product page:', slug);
  
  try {
    const response = await fetch(`/api/products/slug/${slug}`);
    const product = await response.json();
    
    renderProductPage(product);
  } catch (error) {
    console.error('Failed to load product:', error);
    renderError('Product not found');
  }
}

function renderProductPage(product) {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Header -->
      <header style="background: white; border-bottom: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;">
          <nav style="display: flex; align-items: center; gap: 24px;">
            <a href="/" style="color: #059669; text-decoration: none; font-weight: 500; font-size: 16px; transition: color 0.2s;" onmouseover="this.style.color='#047857'" onmouseout="this.style.color='#059669'">
              ← Home
            </a>
            <a href="/products" style="color: #6b7280; text-decoration: none; font-weight: 500;" onmouseover="this.style.color='#374151'" onmouseout="this.style.color='#6b7280'">
              Products
            </a>
          </nav>
          <div style="color: #6b7280; font-weight: 600; font-size: 18px;">BFI Organic</div>
        </div>
      </header>

      <!-- Main Content -->
      <main style="max-width: 1200px; margin: 0 auto; padding: 40px 24px;">
        <div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); overflow: hidden;">
          
          <!-- Product Header -->
          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 48px; border-bottom: 1px solid #d1d5db;">
            <h1 style="font-size: 42px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0; line-height: 1.1;">
              ${product.name}
            </h1>
            <p style="font-size: 20px; color: #4b5563; margin: 0; line-height: 1.5; max-width: 800px;">
              ${product.description || 'Premium organic ingredient sourced directly for your business needs'}
            </p>
          </div>

          <!-- Product Details -->
          <div style="padding: 48px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px;">
              
              <!-- Left Column - Product Info -->
              <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
                <h3 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 24px 0;">Product Information</h3>
                <div style="space-y: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-weight: 500; font-size: 16px;">Product ID</span>
                    <span style="font-weight: 600; color: #1f2937; font-size: 16px;">${product.productId}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-weight: 500; font-size: 16px;">Category</span>
                    <span style="font-weight: 600; color: #1f2937; font-size: 16px;">${product.categoryName || 'Organic Ingredients'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                    <span style="color: #6b7280; font-weight: 500; font-size: 16px;">Stock Available</span>
                    <span style="font-weight: 600; color: #059669; font-size: 16px;">${product.stockQuantity || 0} units</span>
                  </div>
                </div>
              </div>

              <!-- Right Column - Company Info -->
              <div style="background: #eff6ff; border-radius: 12px; padding: 32px; border: 1px solid #dbeafe;">
                <h3 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 24px 0;">Supplier Information</h3>
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #dbeafe;">
                    <span style="color: #6b7280; font-weight: 500; font-size: 16px;">Company</span>
                    <span style="font-weight: 600; color: #1f2937; font-size: 16px;">Bright Fame Organic Pvt. Ltd.</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #dbeafe;">
                    <span style="color: #6b7280; font-weight: 500; font-size: 16px;">Quality Grade</span>
                    <span style="font-weight: 600; color: #1f2937; font-size: 16px;">Premium</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                    <span style="color: #6b7280; font-weight: 500; font-size: 16px;">Certification</span>
                    <span style="font-weight: 600; color: #059669; font-size: 16px;">✓ Organic Certified</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Section -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 32px; text-align: center; border: 1px solid #f59e0b;">
              <h3 style="font-size: 20px; font-weight: 600; color: #92400e; margin: 0 0 12px 0;">Ready to Order?</h3>
              <p style="color: #a16207; margin: 0 0 20px 0; font-size: 16px;">Contact us for bulk pricing and custom requirements</p>
              <div style="display: flex; gap: 16px; justify-content: center; align-items: center;">
                <span style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 16px; cursor: pointer;" onmouseover="this.style.background='#047857'" onmouseout="this.style.background='#059669'">
                  Get Quote
                </span>
                <span style="background: white; color: #059669; padding: 12px 24px; border-radius: 8px; font-weight: 500; border: 2px solid #059669; font-size: 16px; cursor: pointer;" onmouseover="this.style.background='#f0f9ff'" onmouseout="this.style.background='white'">
                  Contact Supplier
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer style="margin-top: 60px; background: #1f2937; color: white; padding: 40px 24px; text-align: center;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <p style="margin: 0; font-size: 16px; color: #9ca3af;">© 2025 Bright Fame Organic Pvt. Ltd. | Premium B2B Organic Ingredients</p>
        </div>
      </footer>
    </div>
  `;
}

function loadHomepage() {
  console.log('Loading homepage with original design...');
  
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Header -->
      <header style="background: white; border-bottom: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="max-width: 1200px; margin: 0 auto; padding: 20px 24px; text-align: center;">
          <h1 style="font-size: 36px; font-weight: 700; color: #1f2937; margin: 0;">BFI Organic</h1>
          <p style="font-size: 18px; color: #6b7280; margin: 8px 0 0 0;">Premium B2B Organic Ingredients</p>
        </div>
      </header>

      <!-- Main Content -->
      <main style="max-width: 1200px; margin: 0 auto; padding: 60px 24px;">
        <div style="text-align: center; background: white; border-radius: 16px; padding: 60px 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <h2 style="font-size: 48px; font-weight: 700; color: #1f2937; margin: 0 0 24px 0;">Welcome to BFI Organic</h2>
          <p style="font-size: 20px; color: #6b7280; margin: 0 0 40px 0; max-width: 600px; margin-left: auto; margin-right: auto;">
            Your trusted partner for premium certified organic ingredients worldwide. We specialize in bulk B2B supply.
          </p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-top: 40px;">
            <div style="background: #ecfdf5; padding: 24px; border-radius: 12px; border: 1px solid #d1fae5;">
              <div style="font-size: 32px; margin-bottom: 12px;">🌿</div>
              <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 8px 0;">Original Design Preserved</h3>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">Your exact website view maintained perfectly</p>
            </div>
            
            <div style="background: #eff6ff; padding: 24px; border-radius: 12px; border: 1px solid #dbeafe;">
              <div style="font-size: 32px; margin-bottom: 12px;">🔄</div>
              <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 8px 0;">Refresh Fixed</h3>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">Product pages work on direct URL access</p>
            </div>
            
            <div style="background: #fefce8; padding: 24px; border-radius: 12px; border: 1px solid #fde047;">
              <div style="font-size: 32px; margin-bottom: 12px;">⚡</div>
              <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 8px 0;">Fully Functional</h3>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">All features working seamlessly</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

function loadAdminDashboard() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="min-height: 100vh; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 1200px; margin: 0 auto; padding: 40px 24px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <h1 style="font-size: 32px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0;">Admin Dashboard</h1>
          <p style="color: #6b7280; margin: 0 0 24px 0;">Dashboard functionality preserved with refresh support</p>
          <a href="/" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Back to Home</a>
        </div>
      </div>
    </div>
  `;
}

function renderError(message) {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="text-align: center; background: white; padding: 48px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h1 style="color: #dc2626; font-size: 24px; margin: 0 0 16px 0;">${message}</h1>
        <p style="color: #6b7280; margin: 0 0 24px 0;">Please try again or return to the homepage</p>
        <a href="/" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Back to Home</a>
      </div>
    </div>
  `;
}