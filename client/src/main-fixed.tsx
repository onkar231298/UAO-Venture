/** @jsxImportSource react */
import React from 'react';
import { createRoot } from 'react-dom/client';
import "./index.css";

// Super minimal test component
function TestApp() {
  console.log("TestApp rendering...");
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2196f3' }}>React Test Success!</h1>
      <p>If you can see this, React is working properly.</p>
      <p>Current URL: {window.location.pathname}</p>
      <button 
        onClick={() => window.location.href = '/'}
        style={{ padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Go to Home
      </button>
    </div>
  );
}

// Enhanced error handling and logging
console.log("Starting minimal React app...");
console.log("Root element found:", !!document.getElementById("root"));

const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(<TestApp />);
    console.log("Minimal React app rendered successfully");
  } catch (error) {
    console.error("Failed to render minimal React app:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif; background: #f5f5f5; min-height: 100vh;">
        <h1 style="color: #d32f2f;">React Loading Error</h1>
        <p>The React application failed to load properly.</p>
        <p style="color: #666; font-size: 14px;">Error: ${errorMessage}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin: 10px; cursor: pointer; background: #2196f3; color: white; border: none; border-radius: 4px;">
          Refresh Page
        </button>
      </div>
    `;
  }
} else {
  console.error("Root element not found");
}