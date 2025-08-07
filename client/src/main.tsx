/** @jsxRuntime classic */
/** @jsx React.createElement */
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Create a simple working React component first
function WorkingApp() {
  const currentPath = window.location.pathname;
  
  if (currentPath.startsWith('/product/')) {
    const productSlug = currentPath.split('/product/')[1];
    return React.createElement('div', { 
      style: { padding: '20px', fontFamily: 'Arial, sans-serif' }
    }, [
      React.createElement('h1', { 
        key: 'title',
        style: { color: '#2196f3' } 
      }, `Product: ${productSlug}`),
      React.createElement('p', { key: 'desc' }, 'This is working React with classic JSX runtime!'),
      React.createElement('div', {
        key: 'product-info',
        style: { background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginTop: '20px' }
      }, [
        React.createElement('h3', { key: 'info-title' }, 'Product Information'),
        React.createElement('p', { key: 'name' }, React.createElement('strong', null, 'Name: '), 'Organic Curry Leaf Powder'),
        React.createElement('p', { key: 'category' }, React.createElement('strong', null, 'Category: '), 'Herbs & Spices'),
        React.createElement('p', { key: 'status' }, React.createElement('strong', null, 'Status: '), 'In Stock'),
        React.createElement('button', {
          key: 'quote-btn',
          style: { 
            background: '#4caf50', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          },
          onClick: () => alert('Quote request functionality coming soon!')
        }, 'Request Quote')
      ])
    ]);
  }
  
  return React.createElement('div', { 
    style: { padding: '20px', fontFamily: 'Arial, sans-serif' }
  }, [
    React.createElement('h1', { 
      key: 'title',
      style: { color: '#2196f3' } 
    }, 'BFI Organic Marketplace'),
    React.createElement('p', { key: 'desc' }, 'React is working with classic JSX runtime!'),
    React.createElement('a', { 
      key: 'product-link',
      href: '/product/organic-curry-leaf-powder',
      style: { color: '#2196f3', textDecoration: 'underline' }
    }, 'View Curry Leaf Powder Product')
  ]);
}

// Enhanced logging and debugging
console.log("Root element found:", !!document.getElementById("root"));
console.log("Attempting to render React app with classic JSX runtime...");

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(React.createElement(WorkingApp));
    console.log("React app rendered successfully with classic JSX runtime");
  } catch (error) {
    console.error("Failed to render React app:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>React Loading Error</h1>
        <p>React app failed to load. Check console for details.</p>
        <button onclick="window.location.reload()">Refresh Page</button>
      </div>
    `;
  }
} else {
  console.error("Could not find root element");
}
