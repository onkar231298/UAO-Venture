import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("React main.tsx loading...");

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log("Mounting React app...");
  const root = createRoot(rootElement);
  
  // Mount without StrictMode to avoid issues
  root.render(<App />);
  
  console.log("✅ React app mounted successfully!");
}
