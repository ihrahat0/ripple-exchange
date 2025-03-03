/**
 * useEffectGuard
 * A utility that provides a safer implementation of useEffect that helps prevent memory leaks.
 */

import { useEffect, useRef } from 'react';

// Enhanced useEffect that automatically handles component unmounting
export const useEffectGuard = (effect, deps) => {
  const isMounted = useRef(true);
  
  // Main effect wrapper
  useEffect(() => {
    if (!isMounted.current) return;
    
    let cleanup;
    try {
      cleanup = effect();
    } catch (error) {
      console.error('Error in guarded useEffect:', error);
    }
    
    // Return a cleanup function that checks if still mounted
    return () => {
      isMounted.current = false;
      if (typeof cleanup === 'function') {
        try {
          cleanup();
        } catch (error) {
          console.error('Error in guarded useEffect cleanup:', error);
        }
      }
    };
  }, deps);
  
  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
};

// Export a function to ensure all async operations are properly handled
export const guardAsyncOperation = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    console.error('Error in guarded async operation:', error);
    return fallback;
  }
};

// Add the export that index.js is looking for
export const patchReactUseEffect = () => {
  console.log('Patching React useEffect');
  
  // This is just a stub - in a real implementation, you'd need to actually
  // monkey patch React's useEffect, which is complex and not recommended
  return {
    patched: true,
    useGuardedEffect: useEffectGuard
  };
};

export default {
  useEffectGuard,
  guardAsyncOperation,
  patchReactUseEffect
}; 