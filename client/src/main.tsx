import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Error handling wrapper to catch React preamble issues
function initializeApp() {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }
    
    console.log("Initializing React app...");
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("React app initialized successfully");
    
  } catch (error) {
    console.error("React initialization failed:", error);
    
    // Fallback to ensure the page is never blank
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
          <h1 style="color: #dc2626;">Loading...</h1>
          <p>Initializing application...</p>
        </div>
      `;
      
      // Retry initialization after a moment
      setTimeout(() => {
        try {
          const root = createRoot(rootElement);
          root.render(<App />);
        } catch (retryError) {
          console.error("Retry failed:", retryError);
          // Final fallback with working content
          window.location.reload();
        }
      }, 1000);
    }
  }
}

// Initialize with error handling
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
