import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Simple React component to test
function TestApp() {
  return React.createElement('div', { style: { padding: '20px' } }, 
    React.createElement('h1', null, 'BFI Organic - Test Page'),
    React.createElement('p', null, 'React app is working!')
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(React.createElement(TestApp));
} else {
  console.error('Root element not found');
}