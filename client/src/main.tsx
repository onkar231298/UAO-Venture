import React from "react";
import { createRoot } from "react-dom/client";
import TestApp from "./TestApp";
import "./index.css";

console.log("React main.tsx loading...");

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log("Mounting React app...");
  const root = createRoot(rootElement);
  
  root.render(<TestApp />);
  
  console.log("✅ React app mounted successfully!");
} else {
  console.error("Root element not found");
}
