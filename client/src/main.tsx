import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add comprehensive error handling for browser extensions and undefined property access
window.addEventListener('unhandledrejection', (event) => {
  // Ignore browser extension errors and undefined property access
  if (event.reason && typeof event.reason === 'object') {
    const errorMessage = event.reason.message || '';
    const errorStack = event.reason.stack || '';
    
    if (errorStack.includes('extension') || 
        errorMessage.includes('extension') ||
        errorStack.includes('chrome-') ||
        errorStack.includes('moz-') ||
        errorMessage.includes("Cannot read properties of undefined (reading 'on") ||
        errorMessage.includes("Cannot read property 'on") ||
        errorStack.includes('badge.tsx') ||
        errorStack.includes('utils.js') ||
        errorStack.includes('tabutils.js') ||
        errorStack.includes('contextmenu.js') ||
        errorStack.includes('download.js')) {
      event.preventDefault();
      return;
    }
  }
});

// Also handle regular errors
window.addEventListener('error', (event) => {
  if (event.error && typeof event.error === 'object') {
    const errorMessage = event.error.message || '';
    const errorStack = event.error.stack || '';
    
    if (errorStack.includes('extension') || 
        errorMessage.includes('extension') ||
        errorStack.includes('chrome-') ||
        errorStack.includes('moz-') ||
        errorMessage.includes("Cannot read properties of undefined (reading 'on") ||
        errorMessage.includes("Cannot read property 'on")) {
      event.preventDefault();
      return;
    }
  }
});

// Gracefully handle missing root element
const rootElement = document.getElementById("root");
console.log("Root element found:", !!rootElement);

if (rootElement) {
  try {
    console.log("Attempting to render React app...");
    createRoot(rootElement).render(<App />);
    console.log("React app rendered successfully");
  } catch (error) {
    console.error("Failed to render React app:", error);
    // Fallback: show a basic error message
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>Loading Error</h1>
        <p>The application failed to load. Please refresh the page.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    `;
  }
} else {
  console.error("Could not find root element");
}
