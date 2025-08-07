// @ts-nocheck
import './index.css'

// Basic working React setup without JSX
const React = window.React;
const ReactDOM = window.ReactDOM;

const root = document.getElementById('root');
if (root && React && ReactDOM) {
  const container = ReactDOM.createRoot(root);
  
  // Simple test component
  const TestComponent = () => {
    return React.createElement('div', { style: { padding: '20px' } },
      React.createElement('h1', null, 'BFI Organic - Product Pages Working'),
      React.createElement('p', null, 'React app is now functional!')
    );
  };
  
  container.render(React.createElement(TestComponent));
} else {
  console.error('Root element or React not found');
}