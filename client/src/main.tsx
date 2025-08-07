import React from 'react';
import { createRoot } from 'react-dom/client';
import AppWorking from './AppWorking';
import './index.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(React.createElement(AppWorking));
} else {
  console.error('Root element not found');
}
