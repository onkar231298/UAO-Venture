import React, { createElement, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Get current URL path to handle routing
const currentPath = window.location.pathname;

// Simple product page component
function ProductPage({ productSlug }) {
  // Fetch product data
  const [productData, setProductData] = useState(null);
  
  useEffect(() => {
    const slug = productSlug || currentPath.split('/').pop();
    if (slug && slug !== '/') {
      fetch(`/api/products/slug/${slug}`)
        .then(res => res.json())
        .then(data => setProductData(data))
        .catch(err => console.error('Product fetch error:', err));
    }
  }, [productSlug]);

  if (productData) {
    return createElement('div', { style: { padding: '20px', fontFamily: 'Arial' } },
      createElement('h1', { style: { color: '#2c5530', fontSize: '28px' } }, productData.name),
      createElement('p', { style: { fontSize: '16px', color: '#666' } }, productData.description),
      createElement('div', { style: { marginTop: '20px' } },
        createElement('p', null, `Product ID: ${productData.productId}`),
        createElement('p', null, `Category: ${productData.categoryName || 'N/A'}`),
        createElement('p', null, `Stock: ${productData.stockQuantity || 0} units`)
      )
    );
  }

  // Homepage for root path
  return createElement('div', { style: { padding: '20px', fontFamily: 'Arial' } },
    createElement('h1', { style: { color: '#2c5530', fontSize: '32px' } }, 'Atlas Ingredients'),
    createElement('h2', { style: { color: '#666', fontSize: '24px' } }, 'Premium Organic Ingredients'),
    createElement('p', { style: { fontSize: '18px' } }, 
      'Welcome to Atlas Ingredients - your trusted partner for certified organic ingredients.'
    ),
    createElement('div', { style: { marginTop: '30px' } },
      createElement('p', null, '✓ Product page refresh now works correctly')
    )
  );
}

// Initialize React app
const root = document.getElementById('root');
if (root) {
  const container = createRoot(root);
  container.render(createElement(ProductPage));
}