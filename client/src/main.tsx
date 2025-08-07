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

// Robust React app initialization with multiple fallback strategies
function initializeApp() {
  const rootElement = document.getElementById("root");
  console.log("Root element found:", !!rootElement);

  if (!rootElement) {
    console.error("Could not find root element");
    return;
  }

  // Strategy 1: Try normal React rendering
  try {
    console.log("Attempting to render React app...");
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("React app rendered successfully");
    return;
  } catch (error) {
    console.error("Failed to render React app (Strategy 1):", error);
  }

  // Strategy 2: Try with a delay to let extensions settle
  setTimeout(() => {
    try {
      console.log("Attempting delayed React app render...");
      const root = createRoot(rootElement);
      root.render(<App />);
      console.log("React app rendered successfully (delayed)");
      return;
    } catch (error) {
      console.error("Failed to render React app (Strategy 2):", error);
      
      // Strategy 3: Show loading fallback and keep trying
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f9fafb;">
          <div style="max-width: 400px;">
            <div style="width: 60px; height: 60px; border: 4px solid #f3f4f6; border-top: 4px solid #f97316; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <h1 style="color: #111827; margin-bottom: 10px;">Loading Application...</h1>
            <p style="color: #6b7280; margin-bottom: 20px;">Please wait while we load the product page.</p>
            <button onclick="window.location.reload()" style="background: #f97316; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px;">
              Refresh Page
            </button>
          </div>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </div>
      `;
      
      // Strategy 4: Keep trying every 2 seconds
      const retryInterval = setInterval(() => {
        try {
          console.log("Retrying React app render...");
          const root = createRoot(rootElement);
          root.render(<App />);
          console.log("React app rendered successfully (retry)");
          clearInterval(retryInterval);
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      }, 2000);
      
      // Stop retrying after 30 seconds
      setTimeout(() => {
        clearInterval(retryInterval);
        console.error("Giving up on React app rendering after 30 seconds");
      }, 30000);
    }
  }, 1000);
}

// Wait for DOM to be ready and extensions to settle
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready, but wait a bit for extensions
  setTimeout(initializeApp, 500);
}
