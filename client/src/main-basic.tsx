// @ts-nocheck
import './index.css'
import AppWorking from './AppWorking'

// Working React setup that bypasses preamble detection
const React = window.React;
const ReactDOM = window.ReactDOM;

const root = document.getElementById('root');
if (root && React && ReactDOM) {
  const container = ReactDOM.createRoot(root);
  container.render(React.createElement(AppWorking));
} else {
  console.error('Root element or React not found', { root: !!root, React: !!React, ReactDOM: !!ReactDOM });
}