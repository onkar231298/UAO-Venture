import * as React from "react";

// Create minimal components to test step by step
function MinimalLanding() {
  return React.createElement("div", { 
    style: { padding: "20px", fontFamily: "Arial, sans-serif" }
  }, [
    React.createElement("h1", { key: "title" }, "BFI Organic - Landing Page"),
    React.createElement("p", { key: "desc" }, "Welcome to our organic marketplace"),
    React.createElement("a", { 
      key: "products",
      href: "/products",
      style: { color: "#2196f3", textDecoration: "underline" }
    }, "View Products")
  ]);
}

function MinimalProducts() {
  return React.createElement("div", { 
    style: { padding: "20px", fontFamily: "Arial, sans-serif" }
  }, [
    React.createElement("h1", { key: "title" }, "Products Page"),
    React.createElement("p", { key: "desc" }, "Product listings will appear here"),
    React.createElement("a", { 
      key: "home",
      href: "/",
      style: { color: "#2196f3", textDecoration: "underline" }
    }, "Back to Home")
  ]);
}

function MinimalProductDetail() {
  return React.createElement("div", { 
    style: { padding: "20px", fontFamily: "Arial, sans-serif" }
  }, [
    React.createElement("h1", { key: "title" }, "Product Detail Page"),
    React.createElement("p", { key: "desc" }, "Product details for curry leaf powder"),
    React.createElement("a", { 
      key: "products",
      href: "/products",
      style: { color: "#2196f3", textDecoration: "underline" }
    }, "Back to Products")
  ]);
}

function NotFound() {
  return React.createElement("div", { 
    style: { padding: "20px", fontFamily: "Arial, sans-serif" }
  }, [
    React.createElement("h1", { key: "title" }, "Page Not Found"),
    React.createElement("p", { key: "desc" }, "The requested page could not be found"),
    React.createElement("a", { 
      key: "home",
      href: "/",
      style: { color: "#2196f3", textDecoration: "underline" }
    }, "Go Home")
  ]);
}

function SimpleRouter() {
  const path = window.location.pathname;
  console.log("Simple Router rendering, current path:", path);
  
  // Simple routing logic without external libraries
  if (path === "/") {
    return React.createElement(MinimalLanding);
  } else if (path === "/products") {
    return React.createElement(MinimalProducts);
  } else if (path.startsWith("/product/")) {
    return React.createElement(MinimalProductDetail);
  } else {
    return React.createElement(NotFound);
  }
}

export default function AppMinimal() {
  console.log("Ultra minimal AppMinimal rendering...");
  
  return React.createElement("div", { 
    style: { minHeight: "100vh", backgroundColor: "#f9f9f9" }
  }, React.createElement(SimpleRouter));
}