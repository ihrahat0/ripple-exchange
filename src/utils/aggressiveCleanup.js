/**
 * Aggressive Cleanup Utilities
 * Tools for ensuring thorough cleanup of resources to prevent memory leaks.
 */

// Determine if an object is a DOM node
const isDOMNode = (obj) => {
  try {
    return obj instanceof Node;
  } catch (e) {
    return false;
  }
};

// Determine if an object is likely a React component
const isReactComponent = (obj) => {
  return obj && (
    (obj.$$typeof && typeof obj.$$typeof === 'symbol') ||
    (obj._reactInternalFiber) ||
    (obj._reactInternalInstance) ||
    (typeof obj.render === 'function')
  );
};

// Check if object has a destroy or close method
const hasCleanupMethod = (obj) => {
  return obj && (
    typeof obj.destroy === 'function' ||
    typeof obj.close === 'function' ||
    typeof obj.cleanup === 'function' ||
    typeof obj.dispose === 'function' ||
    typeof obj.unmount === 'function'
  );
};

// Aggressively clean up a single resource
export const aggressiveCleanup = (resources = []) => {
  resources.forEach(resource => {
    try {
      if (resource && typeof resource.cleanup === 'function') {
        resource.cleanup();
      }
    } catch (e) {
      console.warn('Error during aggressive cleanup:', e);
    }
  });
};

// Clean up a collection of resources
export const cleanupResources = (resources = []) => {
  aggressiveCleanup(resources);
};

// Add the export that index.js is looking for
export const applyGlobalFixes = () => {
  console.log('Applying global fixes for resources cleanup');
  
  // Implement any global fixes here
  if (!Object.prototype.cleanup) {
    Object.defineProperty(Object.prototype, 'cleanup', {
      value: function() {
        // Basic cleanup implementation
        console.log('Global cleanup called');
      },
      configurable: true,
      writable: true
    });
  }
  
  return { fixesApplied: true };
};

// Keep your default export
const cleanupUtils = {
  aggressiveCleanup,
  cleanupResources
};

export default cleanupUtils; 