import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error boundary for unhandled errors
window.addEventListener('unhandledrejection', (event) => {
  // Ignore browser extension errors
  if (event.reason && typeof event.reason === 'object' && 
      (event.reason.stack?.includes('extension') || 
       event.reason.message?.includes('extension') ||
       event.reason.stack?.includes('chrome-') ||
       event.reason.stack?.includes('moz-'))) {
    event.preventDefault();
    return;
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
