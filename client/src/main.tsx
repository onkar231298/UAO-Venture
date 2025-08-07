import * as React from "react";
import { createRoot } from "react-dom/client";
import AppMinimal from "./AppMinimal";
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

// Enhanced logging and debugging for page refresh issues
console.log("Root element found:", !!document.getElementById("root"));
console.log("Attempting to render React app...");

const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    // Render minimal app to test routing without JSX issues
    root.render(React.createElement(AppMinimal));
    console.log("Minimal React app rendered successfully");
  } catch (error) {
    console.error("Failed to render React app:", error);
    // Fallback: show a basic error message
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>Loading Error</h1>
        <p>React app failed to load. Check console for details.</p>
        <button onclick="window.location.reload()">Refresh Page</button>
      </div>
    `;
  }
} else {
  console.error("Could not find root element");
}
