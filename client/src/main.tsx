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
if (rootElement) {
  try {
    createRoot(rootElement).render(<App />);
  } catch (error) {
    console.error("Failed to render React app:", error);
    // Fallback: show a basic error message
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>Loading...</h1>
        <p>Please wait while the application loads.</p>
      </div>
    `;
  }
} else {
  console.error("Could not find root element");
}
