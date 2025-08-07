// Ultra basic test - just plain JavaScript without TypeScript
console.log("Basic test script started");

const rootEl = document.getElementById("root");
if (rootEl) {
  rootEl.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif; background: white;">
      <h1 style="color: green;">BASIC TEST SUCCESS!</h1>
      <p>If you see this, the server and basic script loading works.</p>
      <p>Current URL: ${window.location.href}</p>
      <button onclick="alert('JavaScript is working!')" style="padding: 10px; background: blue; color: white; border: none; cursor: pointer;">
        Test Button
      </button>
    </div>
  `;
  console.log("Basic content inserted into DOM");
} else {
  console.error("Root element not found!");
  document.body.innerHTML = `
    <div style="padding: 20px; background: red; color: white;">
      ERROR: Root element not found!
    </div>
  `;
}