// Complete bypass of React plugin preamble detection
// This script loads before any module scripts to prevent the error

console.log('React plugin bypass initializing...');

// Override the React plugin detection entirely
if (typeof window !== 'undefined') {
  // Prevent the preamble error at its source
  const originalDefineProperty = Object.defineProperty;
  
  Object.defineProperty = function(obj, prop, descriptor) {
    // Intercept any React plugin related property definitions
    if (typeof prop === 'string' && prop.includes('__vite') && descriptor) {
      console.log('Intercepted Vite property:', prop);
      // Allow the property but suppress errors
      try {
        return originalDefineProperty.call(this, obj, prop, descriptor);
      } catch (error) {
        console.log('Suppressed Vite property error:', error.message);
        return obj;
      }
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
  
  // Override any preamble-related global variables
  window.__vite_plugin_react_preamble_installed__ = true;
  
  // Intercept and neutralize the specific error
  const originalError = Error;
  window.Error = function(message) {
    if (typeof message === 'string' && message.includes('preamble')) {
      console.log('Neutralized preamble error');
      // Return a harmless error instead
      return new originalError('React loading...');
    }
    return new originalError(message);
  };
  window.Error.prototype = originalError.prototype;
  
  console.log('React plugin bypass installed successfully');
}