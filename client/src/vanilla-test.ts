// Pure JavaScript test without React to isolate the issue
console.log("Vanilla test script loading...");

function createVanillaApp() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  const currentPath = window.location.pathname;
  console.log("Current path:", currentPath);

  let content = "";
  
  if (currentPath === "/") {
    content = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #2196f3;">BFI Organic - Landing Page</h1>
        <p>Welcome to our organic marketplace (Vanilla JS version)</p>
        <a href="/products" style="color: #2196f3; text-decoration: underline;">View Products</a>
      </div>
    `;
  } else if (currentPath === "/products") {
    content = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #2196f3;">Products Page</h1>
        <p>Product listings will appear here (Vanilla JS version)</p>
        <a href="/" style="color: #2196f3; text-decoration: underline;">Back to Home</a>
      </div>
    `;
  } else if (currentPath.startsWith("/product/")) {
    const productSlug = currentPath.split("/product/")[1];
    content = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #2196f3;">Product: ${productSlug}</h1>
        <p>Product details for ${productSlug} (Vanilla JS version)</p>
        <a href="/products" style="color: #2196f3; text-decoration: underline;">Back to Products</a>
        <br><br>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          <h3>Basic Product Info</h3>
          <p><strong>Name:</strong> Organic Curry Leaf Powder</p>
          <p><strong>Category:</strong> Herbs & Spices</p>
          <p><strong>Status:</strong> In Stock</p>
          <button style="background: #4caf50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
            Request Quote
          </button>
        </div>
      </div>
    `;
  } else {
    content = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #d32f2f;">Page Not Found</h1>
        <p>The requested page could not be found (Vanilla JS version)</p>
        <a href="/" style="color: #2196f3; text-decoration: underline;">Go Home</a>
      </div>
    `;
  }

  rootElement.innerHTML = content;
  console.log("Vanilla app rendered successfully");
}

// Initialize the vanilla app
document.addEventListener("DOMContentLoaded", createVanillaApp);

// Also run immediately in case DOM is already loaded
if (document.readyState === "loading") {
  console.log("DOM still loading, waiting for DOMContentLoaded...");
} else {
  console.log("DOM already loaded, initializing immediately...");
  createVanillaApp();
}