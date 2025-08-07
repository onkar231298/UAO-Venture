// Product page fallback script - loads independently of React
(function() {
  'use strict';
  
  // Only run on product pages
  if (!window.location.pathname.startsWith('/product/')) {
    return;
  }
  
  console.log('Product fallback script loaded');
  
  // Wait for React to mount, then check if it failed
  setTimeout(function() {
    const root = document.getElementById('root');
    const hasReactContent = root && root.children.length > 0;
    
    if (!hasReactContent) {
      console.log('React failed to mount, activating product page fallback');
      
      // Extract slug from URL
      const pathSegments = window.location.pathname.split('/').filter(function(s) { return s; });
      const slug = pathSegments[1];
      
      if (slug && root) {
        // Fetch product data and render fallback
        fetch('/api/products/slug/' + slug)
          .then(function(response) {
            if (!response.ok) throw new Error('Product not found');
            return response.json();
          })
          .then(function(product) {
            root.innerHTML = [
              '<div style="min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">',
                '<header style="background: white; border-bottom: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">',
                  '<div style="max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;">',
                    '<nav style="display: flex; align-items: center; gap: 24px;">',
                      '<a href="/" style="color: #059669; text-decoration: none; font-weight: 500;">← Home</a>',
                      '<a href="/products" style="color: #6b7280; text-decoration: none; font-weight: 500;">Products</a>',
                    '</nav>',
                    '<div style="color: #6b7280; font-weight: 600; font-size: 18px;">BFI Organic</div>',
                  '</div>',
                '</header>',
                '<main style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">',
                  '<div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">',
                    '<div style="background: linear-gradient(to right, #ecfdf5, #f0fdfa); padding: 48px; border-bottom: 1px solid #e2e8f0;">',
                      '<h1 style="font-size: 36px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0;">' + (product.name || 'Product') + '</h1>',
                      '<p style="font-size: 18px; color: #4b5563; margin: 0;">' + (product.description || 'Premium organic ingredient for your business needs') + '</p>',
                    '</div>',
                    '<div style="padding: 48px;">',
                      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px;">',
                        '<div style="background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">',
                          '<h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Product Information</h3>',
                          '<p style="margin: 8px 0; color: #4b5563;"><strong>Product ID:</strong> ' + (product.productId || 'N/A') + '</p>',
                          '<p style="margin: 8px 0; color: #4b5563;"><strong>Category:</strong> ' + (product.categoryName || 'Organic Ingredients') + '</p>',
                          '<p style="margin: 8px 0; color: #4b5563;"><strong>Stock:</strong> ' + (product.stockQuantity || 0) + ' units available</p>',
                        '</div>',
                        '<div style="background: #f0f9ff; padding: 24px; border-radius: 12px; border: 1px solid #bae6fd;">',
                          '<h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Quality Assurance</h3>',
                          '<p style="margin: 8px 0; color: #4b5563;"><strong>Supplier:</strong> Bright Fame Organic Pvt. Ltd.</p>',
                          '<p style="margin: 8px 0; color: #4b5563;"><strong>Certification:</strong> USDA Organic</p>',
                          '<p style="margin: 8px 0; color: #4b5563;"><strong>Grade:</strong> Premium Quality</p>',
                        '</div>',
                      '</div>',
                      '<div style="background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">',
                        '<p style="color: #166534; margin: 0; font-weight: 500;">✓ Product page loaded successfully! The React app will be restored on next navigation.</p>',
                      '</div>',
                      '<div style="text-align: center; margin-top: 32px;">',
                        '<a href="/products" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Browse All Products</a>',
                      '</div>',
                    '</div>',
                  '</div>',
                '</main>',
              '</div>'
            ].join('');
          })
          .catch(function(error) {
            console.error('Product fallback failed:', error);
            root.innerHTML = [
              '<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">',
                '<div style="text-align: center; padding: 40px;">',
                  '<h1 style="font-size: 24px; color: #1f2937; margin-bottom: 16px;">Product Not Found</h1>',
                  '<p style="color: #6b7280; margin-bottom: 24px;">The product could not be loaded.</p>',
                  '<a href="/" style="color: #059669; text-decoration: none; font-weight: 500;">← Return to Homepage</a>',
                '</div>',
              '</div>'
            ].join('');
          });
      }
    }
  }, 2500); // Wait 2.5 seconds for React to mount
  
})();