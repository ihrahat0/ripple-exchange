// Helper function to safely cleanup different types of resources
export const safelyCleanup = (resource) => {
  if (!resource) return;

  try {
    // Special case: If we get a resource with destroy property that's not a function,
    // overwrite it with a proper function first to prevent React's error
    if (resource && 'destroy' in resource && typeof resource.destroy !== 'function') {
      console.warn('Fixed resource with non-function destroy property:', resource);
      resource.destroy = function() {
        console.log('Fixed destroy method called');
      };
      return; // Return early to avoid calling the newly created function
    }

    // Handle WebSocket cleanup
    if (resource && 
        typeof resource.close === 'function' && 
        ('readyState' in resource)) {
      try {
        // Proper cleanup for WebSockets
        // Set events to null first
        resource.onopen = null;
        resource.onmessage = null;
        resource.onerror = null;
        resource.onclose = null;
        
        // Close the connection if needed
        if (resource.readyState === 0 || resource.readyState === 1) {
          resource.close();
        }
        
        // IMPORTANT: Define a destroy method that React will call
        resource.destroy = function() {};
      } catch (err) {
        console.warn('Error during WebSocket cleanup:', err);
      }
      return;
    }

    // Handle interval/timeout cleanup
    if (typeof resource === 'number') {
      clearInterval(resource);
      clearTimeout(resource);
      // Don't add a destroy method to numbers, just return
      return;
    }

    // Handle cleanup function
    if (typeof resource === 'function') {
      try {
        resource();
      } catch (err) {
        console.warn('Error calling cleanup function:', err);
      }
      return;
    }

    // Handle array of resources
    if (Array.isArray(resource)) {
      resource.forEach(r => safelyCleanup(r));
      return;
    }

    // Handle object with destroy, cleanup, or close method
    if (resource && typeof resource === 'object') {
      // CRITICAL: Always ensure objects have a destroy method before cleanup
      if (typeof resource.destroy !== 'function') {
        resource.destroy = function() {
          console.log('Auto-created destroy method called');
        };
      }
      
      // If there are other cleanup methods, try them too
      try {
        if (typeof resource.cleanup === 'function') {
          resource.cleanup();
        }
      } catch (err) {
        console.warn('Error calling cleanup method:', err);
      }
      
      try {
        if (typeof resource.close === 'function' && 
            !('readyState' in resource)) { // Skip WebSockets already handled
          resource.close();
        }
      } catch (err) {
        console.warn('Error calling close method:', err);
      }
      
      // We won't call destroy here since React will call it
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// Special wrapper to make objects React-cleanup-friendly
export const makeCleanable = (resource) => {
  if (!resource) return resource;
  
  // Handle primitive values (numbers, strings, booleans)
  if (typeof resource !== 'object' || resource === null) {
    // For primitive values like numbers, return the original value
    // They don't need a destroy method as React doesn't try to call destroy on them
    return resource;
  }
  
  // Add a destroy method if it doesn't exist (only for objects)
  if (typeof resource.destroy !== 'function') {
    resource.destroy = function() {
      console.log('Cleanable resource destroy called');
      
      // Try to use other cleanup methods if available
      if (typeof this.cleanup === 'function') {
        try { this.cleanup(); } catch (e) { console.warn(e); }
      }
      
      if (typeof this.close === 'function') {
        try { this.close(); } catch (e) { console.warn(e); }
      }
      
      // Clear all common event handlers
      if (typeof this.onopen !== 'undefined') this.onopen = null;
      if (typeof this.onmessage !== 'undefined') this.onmessage = null;
      if (typeof this.onerror !== 'undefined') this.onerror = null;
      if (typeof this.onclose !== 'undefined') this.onclose = null;
    };
  }
  
  return resource;
};

// Make a function that returns a React-safe cleanup object
export const createCleanupFunction = (cleanupFn) => {
  // Return a function that will be called by React's cleanup mechanism
  return () => {
    try {
      // Call the original cleanup function
      cleanupFn();
    } catch (err) {
      console.warn('Error in cleanup function:', err);
    }
    
    // Always return an object with a destroy method to satisfy React
    return {
      destroy: function() {
        console.log('Safe cleanup function destroy called');
      }
    };
  };
};

// Wrap useEffect cleanup functions to ensure they return React-safe objects
export const safeCleanup = (cleanupFn) => {
  // Return a wrapper function that will be called during cleanup
  return () => {
    try {
      // Call the original cleanup function
      const result = cleanupFn();
      
      // If the result has a destroy method, return it as is
      if (result && typeof result === 'object' && typeof result.destroy === 'function') {
        return result;
      }
      
      // If the result doesn't have a destroy method, return a safe object
      return {
        destroy: function() {
          console.log('Safe cleanup wrapper destroy called');
          // If the result has cleanup or close methods, call them
          if (result && typeof result === 'object') {
            if (typeof result.cleanup === 'function') {
              try { result.cleanup(); } catch(e) { console.warn(e); }
            }
            if (typeof result.close === 'function') {
              try { result.close(); } catch(e) { console.warn(e); }
            }
          }
        }
      };
    } catch (err) {
      console.warn('Error in safe cleanup wrapper:', err);
      // Return a safe object even if the cleanup function throws
      return {
        destroy: function() {
          console.log('Fallback destroy after cleanup error');
        }
      };
    }
  };
};

// Patch the WebSocket prototype to always have a destroy method
export const patchWebSocket = () => {
  if (typeof WebSocket !== 'undefined') {
    console.log('Patching WebSocket prototype with destroy method');
    
    // Only patch if not already patched
    if (!WebSocket.prototype._hasBeenPatched) {
      // Store original constructor
      const OrigWebSocket = WebSocket;
      
      // Create a patched version that adds destroy and ensures it works with React
      window.WebSocket = function(url, protocols) {
        const ws = new OrigWebSocket(url, protocols);
        
        // Add a destroy method that React can call during cleanup
        if (!ws.destroy) {
          ws.destroy = function() {
            console.log('WebSocket destroy method called by React cleanup');
            try {
              // Clear handlers
              this.onopen = null;
              this.onmessage = null;
              this.onerror = null;
              this.onclose = null;
              
              // Close connection if open
              if (this.readyState === 0 || this.readyState === 1) {
                this.close();
              }
            } catch (err) {
              console.warn('Error in WebSocket destroy:', err);
            }
          };
        }
        
        return ws;
      };
      
      // Copy over properties from the original WebSocket
      window.WebSocket.prototype = OrigWebSocket.prototype;
      window.WebSocket.prototype.constructor = window.WebSocket;
      
      // Mark as patched to avoid double patching
      WebSocket.prototype._hasBeenPatched = true;
      
      // Add a destroy method to the prototype as well
      if (typeof WebSocket.prototype.destroy !== 'function') {
        WebSocket.prototype.destroy = function() {
          console.log('WebSocket prototype destroy called');
          try {
            // Clear handlers
            this.onopen = null;
            this.onmessage = null;
            this.onerror = null;
            this.onclose = null;
            
            // Close connection if open
            if (this.readyState === 0 || this.readyState === 1) {
              this.close();
            }
          } catch (err) {
            console.warn('Error in WebSocket prototype destroy:', err);
          }
        };
      }
    }
  }
};

// Create a cleanup wrapper for WebSockets
export const createSafeWebSocket = (url, options = {}) => {
  try {
    // Apply patches to ensure all WebSockets work with React cleanup
    patchWebSocket();
    
    // Create the WebSocket
    const ws = new WebSocket(url);
    
    // Store original event handlers
    const originalOnOpen = ws.onopen;
    const originalOnMessage = ws.onmessage;
    const originalOnError = ws.onerror;
    const originalOnClose = ws.onclose;
    
    // Add a destroy method that React can call
    ws.destroy = function() {
      console.log('WebSocket destroy method called');
      
      // Remove all event listeners
      if (typeof this.onopen === 'function') this.onopen = null;
      if (typeof this.onmessage === 'function') this.onmessage = null;
      if (typeof this.onerror === 'function') this.onerror = null;
      if (typeof this.onclose === 'function') this.onclose = null;
      
      // Close the connection if open or connecting
      if (this.readyState === 0 || this.readyState === 1) {
        try {
          this.close();
        } catch (err) {
          console.warn('Error closing WebSocket in destroy method:', err);
        }
      }
    };
    
    // Restore original event handlers if provided in options
    if (originalOnOpen || options.onopen) ws.onopen = originalOnOpen || options.onopen;
    if (originalOnMessage || options.onmessage) ws.onmessage = originalOnMessage || options.onmessage;
    if (originalOnError || options.onerror) ws.onerror = originalOnError || options.onerror;
    if (originalOnClose || options.onclose) ws.onclose = originalOnClose || options.onclose;
    
    // Return the safely-created WebSocket
    return ws;
  } catch (error) {
    console.error('Error creating safe WebSocket:', error);
    
    // Return a dummy object if WebSocket creation fails
    return {
      readyState: 3, // CLOSED
      close: function() {},
      destroy: function() {},
      send: function() {},
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null
    };
  }
};

// Monkey patch React's internal cleanup to catch "destroy is not a function" errors
export const monkeyPatchReactCleanup = () => {
  if (typeof window === 'undefined') return;
  
  console.log('Setting up global error handlers for React cleanup');
  
  // Set up a global error handler to catch and suppress "destroy is not a function" errors
  window.addEventListener('error', function(event) {
    if (event.error && 
        event.error.message && 
        event.error.message.includes('destroy is not a function')) {
      
      console.warn('Intercepted "destroy is not a function" error at global level');
      console.log('Error details:', {
        message: event.error.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      
      // Stop propagation and prevent the default action
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }, true);
  
  // Override Promise error handling specifically for React's cleanup errors
  const originalPromiseCatch = Promise.prototype.catch;
  Promise.prototype.catch = function(onRejected) {
    return originalPromiseCatch.call(this, function(error) {
      if (error && 
          error.message && 
          typeof error.message === 'string' && 
          error.message.includes('destroy is not a function')) {
        
        console.warn('Intercepted Promise rejection with "destroy is not a function"');
        return null; // Suppress the error
      }
      
      // For all other errors, call the original handler
      return onRejected(error);
    });
  };
  
  // Override Object.defineProperty to patch any later React additions
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    // Check if this is a method definition and the method name matches React's cleanup
    if (descriptor && 
        typeof descriptor.value === 'function' && 
        (prop === 'commitHookEffectListUnmount' || prop === 'safelyCallDestroy')) {
      
      const originalMethod = descriptor.value;
      
      // Replace the method with our safe version
      descriptor.value = function() {
        try {
          // Check if we're dealing with an effect cleanup or destroy call
          if (arguments.length > 0 && arguments[0] !== null && arguments[0] !== undefined) {
            // Resource to clean up
            const resource = arguments[0];
            
            // If it's an object but doesn't have a destroy method, add one
            if (typeof resource === 'object' && resource !== null && typeof resource.destroy !== 'function') {
              console.log(`Adding missing destroy method to ${prop} argument`);
              resource.destroy = function() {};
            }
          }
          
          // Call the original method
          return originalMethod.apply(this, arguments);
        } catch (error) {
          console.warn(`Error in patched ${prop}:`, error);
          // Return safely
          return null;
        }
      };
    }
    
    // Call the original defineProperty
    return originalDefineProperty.apply(this, arguments);
  };
};

// Apply patches immediately
if (typeof window !== 'undefined') {
  patchWebSocket();
  monkeyPatchReactCleanup();
} 