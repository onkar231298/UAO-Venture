// BFI Organic Marketplace - Vanilla JavaScript Implementation
// Temporary solution while resolving Vite React plugin issues

console.log("BFI Organic Marketplace loading...");

class BFIMarketplace {
  constructor() {
    this.currentPath = window.location.pathname;
    this.init();
  }

  init() {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      console.error("Root element not found");
      return;
    }

    this.render(rootElement);
    this.setupEventListeners();
  }

  render(container) {
    console.log("Rendering page for path:", this.currentPath);

    if (this.currentPath.startsWith('/product/')) {
      this.renderProductPage(container);
    } else if (this.currentPath === '/products') {
      this.renderProductsPage(container);
    } else {
      this.renderHomePage(container);
    }
  }

  renderProductPage(container) {
    const productSlug = this.currentPath.split('/product/')[1];
    const productName = this.formatProductName(productSlug);

    container.innerHTML = `
      <div style="min-height: 100vh; background: #f9fafb;">
        <!-- Header -->
        <header style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 1rem 0;">
          <div style="max-width: 1200px; margin: 0 auto; padding: 0 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <h1 style="color: #059669; font-size: 1.5rem; margin: 0; font-weight: 700;">BFI Organic</h1>
              <nav style="display: flex; gap: 2rem;">
                <a href="/" style="color: #374151; text-decoration: none; font-weight: 500;">Home</a>
                <a href="/products" style="color: #374151; text-decoration: none; font-weight: 500;">Products</a>
              </nav>
            </div>
          </div>
        </header>

        <!-- Product Content -->
        <main style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start;">
            
            <!-- Product Image -->
            <div style="background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="aspect-ratio: 1; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 1.125rem;">
                ${productName} Image
              </div>
            </div>

            <!-- Product Info -->
            <div style="background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="font-size: 2rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">
                ${productName}
              </h1>
              
              <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <span style="background: #dcfce7; color: #166534; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">
                  Organic Certified
                </span>
                <span style="background: #dbeafe; color: #1d4ed8; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">
                  In Stock
                </span>
              </div>

              <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 0.5rem 0;">Product Description</h3>
                <p style="color: #6b7280; line-height: 1.6; margin: 0;">
                  Premium organic ${productName.toLowerCase()} sourced from certified organic farms. 
                  Perfect for culinary applications and traditional wellness practices. 
                  Our products meet the highest quality standards for B2B customers.
                </p>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                <div>
                  <h4 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin: 0 0 0.25rem 0;">Category</h4>
                  <p style="color: #6b7280; margin: 0;">Herbs & Spices</p>
                </div>
                <div>
                  <h4 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin: 0 0 0.25rem 0;">Origin</h4>
                  <p style="color: #6b7280; margin: 0;">India</p>
                </div>
                <div>
                  <h4 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin: 0 0 0.25rem 0;">Form</h4>
                  <p style="color: #6b7280; margin: 0;">Powder</p>
                </div>
                <div>
                  <h4 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin: 0 0 0.25rem 0;">MOQ</h4>
                  <p style="color: #6b7280; margin: 0;">25 kg</p>
                </div>
              </div>

              <button 
                onclick="window.marketplace.requestQuote('${productSlug}')"
                style="width: 100%; background: #059669; color: white; padding: 1rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background-color 0.2s;"
                onmouseover="this.style.background='#047857'"
                onmouseout="this.style.background='#059669'"
              >
                Request Quote
              </button>
            </div>
          </div>

          <!-- Additional Sections -->
          <div style="margin-top: 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            
            <!-- Frequently Bought Together -->
            <div style="background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h3 style="font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0 0 1rem 0;">
                Frequently Bought Together
              </h3>
              <div style="display: grid; gap: 1rem;">
                ${this.generateRelatedProducts(['turmeric-powder', 'ginger-powder', 'moringa-powder'])}
              </div>
            </div>

            <!-- You Might Also Like -->
            <div style="background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h3 style="font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0 0 1rem 0;">
                You Might Also Like
              </h3>
              <div style="display: grid; gap: 1rem;">
                ${this.generateRelatedProducts(['ashwagandha-powder', 'neem-powder', 'tulsi-powder'])}
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  renderProductsPage(container) {
    container.innerHTML = `
      <div style="min-height: 100vh; background: #f9fafb; padding: 2rem;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h1 style="font-size: 2.5rem; font-weight: 700; color: #111827; margin-bottom: 2rem;">
            Our Products
          </h1>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
            ${this.generateProductGrid()}
          </div>
          <div style="margin-top: 2rem;">
            <a href="/" style="color: #059669; text-decoration: none; font-weight: 500;">← Back to Home</a>
          </div>
        </div>
      </div>
    `;
  }

  renderHomePage(container) {
    container.innerHTML = `
      <div style="min-height: 100vh; background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);">
        <!-- Hero Section -->
        <section style="padding: 4rem 2rem; text-align: center;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h1 style="font-size: 3rem; font-weight: 700; color: #111827; margin-bottom: 1rem;">
              BFI Organic
            </h1>
            <p style="font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem; line-height: 1.6;">
              Premium B2B Organic Ingredients for Your Business
            </p>
            <a 
              href="/products" 
              style="display: inline-block; background: #059669; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1.125rem; transition: background-color 0.2s;"
              onmouseover="this.style.background='#047857'"
              onmouseout="this.style.background='#059669'"
            >
              Browse Products
            </a>
          </div>
        </section>

        <!-- Featured Products -->
        <section style="padding: 2rem; background: white;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h2 style="font-size: 2rem; font-weight: 700; color: #111827; margin-bottom: 2rem; text-align: center;">
              Featured Products
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
              ${this.generateFeaturedProducts()}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  generateProductGrid() {
    const products = [
      'organic-curry-leaf-powder',
      'organic-turmeric-powder', 
      'organic-ginger-powder',
      'organic-moringa-powder',
      'organic-ashwagandha-powder',
      'organic-neem-powder'
    ];

    return products.map(slug => {
      const name = this.formatProductName(slug);
      return `
        <div style="background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s;"
             onmouseover="this.style.transform='translateY(-2px)'"
             onmouseout="this.style.transform='translateY(0)'">
          <div style="aspect-ratio: 1; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 6px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: #6b7280;">
            ${name}
          </div>
          <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 0.5rem 0;">${name}</h3>
          <p style="color: #6b7280; margin: 0 0 1rem 0; font-size: 0.875rem;">Premium organic ingredient for B2B use</p>
          <a href="/product/${slug}" 
             style="display: inline-block; background: #059669; color: white; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 0.875rem;">
            View Details
          </a>
        </div>
      `;
    }).join('');
  }

  generateFeaturedProducts() {
    return ['organic-curry-leaf-powder', 'organic-turmeric-powder', 'organic-moringa-powder'].map(slug => {
      const name = this.formatProductName(slug);
      return `
        <div style="background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="aspect-ratio: 1; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 6px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: #6b7280;">
            ${name}
          </div>
          <h3 style="font-weight: 600; color: #111827; margin: 0 0 0.5rem 0;">${name}</h3>
          <a href="/product/${slug}" style="color: #059669; text-decoration: none; font-weight: 500;">Learn More →</a>
        </div>
      `;
    }).join('');
  }

  generateRelatedProducts(slugs) {
    return slugs.map(slug => {
      const name = this.formatProductName(slug);
      return `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: #f9fafb; border-radius: 6px;">
          <div style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%); border-radius: 4px; flex-shrink: 0;"></div>
          <div style="flex: 1;">
            <p style="font-weight: 500; color: #111827; margin: 0; font-size: 0.875rem;">${name}</p>
            <a href="/product/${slug}" style="color: #059669; text-decoration: none; font-size: 0.75rem;">View Product</a>
          </div>
        </div>
      `;
    }).join('');
  }

  formatProductName(slug) {
    return slug.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  requestQuote(productSlug) {
    const productName = this.formatProductName(productSlug);
    alert(`Quote request for ${productName}\n\nThis functionality will be connected to the backend quote system. For now, please contact us directly.`);
  }

  setupEventListeners() {
    // Handle navigation without page refresh
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && e.target.href && e.target.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const newPath = new URL(e.target.href).pathname;
        window.history.pushState({}, '', newPath);
        this.currentPath = newPath;
        this.render(document.getElementById('root'));
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.currentPath = window.location.pathname;
      this.render(document.getElementById('root'));
    });
  }
}

// Initialize the marketplace
window.marketplace = new BFIMarketplace();
console.log("BFI Organic Marketplace initialized successfully");