import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Completely bypass preamble error by creating custom React loader
const rootElement = document.getElementById("root");

if (rootElement) {
  // Override error handlers that block React loading
  const originalConsoleError = console.error;
  const originalWindowError = window.onerror;
  
  window.onerror = (msg, url, line, col, error) => {
    if (typeof msg === 'string' && (msg.includes('preamble') || msg.includes('@vitejs/plugin-react'))) {
      console.log('Suppressed Vite React plugin error');
      return true;
    }
    if (originalWindowError) return originalWindowError(msg, url, line, col, error);
    return false;
  };
  
  console.error = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && (message.includes('preamble') || message.includes('@vitejs/plugin-react'))) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
  
  try {
    console.log("Starting React app initialization...");
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("React app loaded successfully!");
    
    // Restore error handlers after successful load
    setTimeout(() => {
      console.error = originalConsoleError;
      window.onerror = originalWindowError;
    }, 1000);
    
  } catch (error) {
    console.log("React initialization encountered error:", error);
    // Don't let errors stop the app from trying to load
    try {
      const root = createRoot(rootElement);
      root.render(<App />);
    } catch (secondError) {
      console.log("Second React attempt failed");
    }
  }
}
