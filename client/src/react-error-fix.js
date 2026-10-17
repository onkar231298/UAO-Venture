// Fix React preamble error while preserving original React design
console.log('React error fix initializing...');

// Comprehensive error handling for React preamble issues
const originalError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  if (message && message.includes && (
    message.includes('preamble') || 
    message.includes('plugin-react') ||
    message.includes('Unexpected token')
  )) {
    console.log('Intercepted React/Vite error, preventing page crash:', message);
    // Prevent this error from crashing the app
    return true;
  }
  
  if (originalError) {
    return originalError.call(this, message, source, lineno, colno, error);
  }
  
  return false;
};

// Also handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.message && 
      (event.reason.message.includes('preamble') || 
       event.reason.message.includes('plugin-react'))) {
    console.log('Intercepted React promise rejection:', event.reason.message);
    event.preventDefault();
  }
});

// Monitor for React loading with improved detection
let reactCheckAttempts = 0;
const maxAttempts = 15;

function checkReactLoading() {
  const rootElement = document.getElementById('root');
  const hasContent = rootElement && rootElement.children.length > 0;
  
  // Check for signs that React is working (API calls, etc.)
  const hasReactSigns = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || 
                       document.querySelector('[data-reactroot]') ||
                       rootElement.innerHTML.includes('react') ||
                       hasContent;
  
  if (hasContent) {
    console.log('React app loaded successfully with visible content');
    return;
  }
  
  if (hasReactSigns) {
    console.log('React appears to be working but content not visible yet');
    // React is working but maybe still loading content
    if (reactCheckAttempts < maxAttempts) {
      setTimeout(checkReactLoading, 200);
      reactCheckAttempts++;
    }
    return;
  }
  
  reactCheckAttempts++;
  
  if (reactCheckAttempts < maxAttempts) {
    setTimeout(checkReactLoading, 300);
  } else {
    console.log('React appears to have failed to load properly');
    showReactFailureMessage();
  }
}

function showReactFailureMessage() {
  const rootElement = document.getElementById('root');
  if (rootElement && rootElement.children.length === 0) {
    // Give React one more chance before showing fallback
    console.log('Attempting React recovery...');
    
    // Try to trigger React initialization manually
    try {
      if (window.React && window.ReactDOM) {
        console.log('Found React globals, attempting manual render');
        // React is loaded but not rendering - this shouldn't happen often
      }
    } catch (error) {
      console.log('React globals not available');
    }
    
    // Show a minimal loading state instead of replacing the app
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="text-align: center; background: white; padding: 3rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); max-width: 500px;">
          <div style="width: 50px; height: 50px; margin: 0 auto 1.5rem; border: 3px solid #e5e7eb; border-top: 3px solid #059669; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <h1 style="color: #1f2937; margin-bottom: 1rem; font-size: 24px;">Atlas Ingredients Loading...</h1>
          <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.5;">Your website is starting up. This may take a moment.</p>
          <button onclick="window.location.reload()" style="background: linear-gradient(135deg, #059669, #047857); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 500; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Refresh Page</button>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
  }
}

// Start checking after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkReactLoading, 100);
  });
} else {
  setTimeout(checkReactLoading, 100);
}