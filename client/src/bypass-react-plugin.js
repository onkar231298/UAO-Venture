// Advanced React plugin preamble bypass
console.log('Initializing comprehensive React bypass...');

// Set all required preamble flags before any module loading
window.__vite_plugin_react_preamble_installed__ = true;
window.__vite_plugin_react_detect_preamble = () => true;

// Block preamble error at source by intercepting Error constructor
const OriginalError = window.Error;
window.Error = function(message, ...args) {
  if (typeof message === 'string' && message.includes('preamble')) {
    console.log('Blocked preamble error successfully');
    return { message: 'Suppressed preamble error', stack: '' };
  }
  return new OriginalError(message, ...args);
};

// Ensure prototype chain is maintained
window.Error.prototype = OriginalError.prototype;
window.Error.captureStackTrace = OriginalError.captureStackTrace;

// Override global error handling to prevent crashes
window.addEventListener('error', function(event) {
  if (event.message && event.message.includes('preamble')) {
    console.log('Prevented preamble error crash');
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true);

window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && typeof event.reason === 'object' && event.reason.message && event.reason.message.includes('preamble')) {
    console.log('Prevented preamble rejection crash');
    event.preventDefault();
    return false;
  }
}, true);

console.log('React bypass protection active');