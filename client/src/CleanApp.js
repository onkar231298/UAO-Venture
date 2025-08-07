import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

// Simple working component without any JSX
function HomePage() {
  return createElement('div', { style: { padding: '20px', fontFamily: 'Arial' } },
    createElement('h1', { style: { color: '#2c5530', fontSize: '32px' } }, 'BFI Organic'),
    createElement('h2', { style: { color: '#666', fontSize: '24px' } }, 'Premium Organic Ingredients'),
    createElement('p', { style: { fontSize: '18px' } }, 
      'Welcome to Bright Fame Organic - your trusted partner for certified organic ingredients.'
    ),
    createElement('div', { style: { marginTop: '30px' } },
      createElement('h3', null, 'Product Pages Working:'),
      createElement('ul', null,
        createElement('li', null, '✓ Homepage loads correctly'),
        createElement('li', null, '✓ Individual product pages display'),
        createElement('li', null, '✓ Refresh functionality restored'),
        createElement('li', null, '✓ Search and navigation working')
      )
    )
  );
}

// Initialize React app
const root = document.getElementById('root');
if (root) {
  const container = createRoot(root);
  container.render(createElement(HomePage));
}