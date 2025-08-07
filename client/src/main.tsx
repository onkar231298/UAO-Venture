import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("React main.tsx loading...");

// Wait for DOM to be ready
function mountApp() {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    console.log("Mounting React app...");
    const root = createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log("✅ React app mounted successfully!");
  } else {
    console.error("Root element not found");
  }
}

// Ensure DOM is loaded before mounting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
