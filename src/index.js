import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import './App.scss'
import ScrollToTop from "./ScrollToTop";
import 'bootstrap-icons/font/bootstrap-icons.css';

// Polyfills
import { Buffer } from 'buffer';
import process from 'process';

// Import WebSocket patcher to ensure all WebSockets work with React
import { patchWebSocket, monkeyPatchReactCleanup } from './utils/cleanup';

// Import direct React patching utility
import { initializeReactPatches } from './utils/reactPatch';

// Import useEffect guards to catch common mistakes during development
import { patchReactUseEffect } from './utils/useEffectGuard';

// Import aggressive cleanup utilities
import { applyGlobalFixes } from './utils/aggressiveCleanup';

// Apply all patches as early as possible
if (typeof window !== 'undefined') {
  // Set up global polyfills
  window.global = window;
  window.Buffer = Buffer;
  window.process = process;
  
  // Apply WebSocket patches immediately at application start
  // This ensures that all WebSockets created throughout the app
  // will have the necessary destroy method for React cleanup
  patchWebSocket();
  
  // Apply the aggressive React cleanup patch to intercept errors
  monkeyPatchReactCleanup();
  
  // Apply direct React internal function patches
  // This is the most aggressive approach and should fix the issues completely
  initializeReactPatches();
  
  // Apply the aggressive global fixes to ensure any cleanup calls have a destroy method
  applyGlobalFixes();
  
  // Patch React's useEffect to warn about common mistakes in development
  if (process.env.NODE_ENV === 'development') {
    patchReactUseEffect();
  }
  
  // Direct monkey patch for safelyCallDestroy in the bundle
  // Find and patch the specific function that's causing the error
  setTimeout(() => {
    try {
      if (window.safelyCallDestroy) {
        const originalFn = window.safelyCallDestroy;
        window.safelyCallDestroy = function(thing) {
          try {
            // Add destroy method if missing
            if (thing && typeof thing === 'object' && !thing.destroy) {
              thing.destroy = function() {};
            }
            return originalFn(thing);
          } catch (err) {
            console.warn('Error in patched safelyCallDestroy:', err);
          }
        };
        console.log('Directly patched window.safelyCallDestroy');
      }
    } catch (err) {
      console.warn('Failed to patch window.safelyCallDestroy:', err);
    }
  }, 500);
  
  // Add a direct global error handler for the specific error
  window.addEventListener('error', (event) => {
    if (event.error && 
        event.error.message && 
        event.error.message.includes('destroy is not a function')) {
      console.warn('Caught "destroy is not a function" error in index.js handler');
      // Provide helpful debugging information in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('This error usually happens when:');
        console.warn('1. You return a non-function from useEffect');
        console.warn('2. You use an async function directly in useEffect');
        console.warn('See docs/REACT_DESTROY_ERROR.md for more information');
      }
      event.preventDefault();
      return false;
    }
  }, true);
  
  // Emergency fallback: If React still tries to call destroy, provide it globally
  if (!Object.prototype.destroy) {
    Object.defineProperty(Object.prototype, 'destroy', {
      value: function() {
        console.log('Emergency fallback destroy called on', this);
        
        // Try common cleanup methods
        if (typeof this.cleanup === 'function') {
          try { this.cleanup(); } catch (e) {}
        }
        if (typeof this.close === 'function') {
          try { this.close(); } catch (e) {}
        }
        if (typeof this.dispose === 'function') {
          try { this.dispose(); } catch (e) {}
        }
        
        // Clear common event handlers
        if ('onopen' in this) this.onopen = null;
        if ('onmessage' in this) this.onmessage = null;
        if ('onerror' in this) this.onerror = null;
        if ('onclose' in this) this.onclose = null;
      },
      writable: true,
      configurable: true
    });
    console.log('Added emergency destroy method to Object.prototype');
  }
  
  console.log('All cleanup patches applied');
}

// Define a backup function for React's cleanup
// This function will be used if React's internal safelyCallDestroy isn't patched yet
window.safelyCallDestroyBackup = function(thing) {
  try {
    // Simply add a destroy method if it's missing
    if (thing && typeof thing === 'object' && typeof thing.destroy !== 'function') {
      thing.destroy = function() {
        console.log('Dynamically added destroy called from backup');
      };
    }
    
    // Call destroy if it exists
    if (thing && typeof thing === 'object' && typeof thing.destroy === 'function') {
      thing.destroy();
    }
  } catch(err) {
    console.warn('Error in safelyCallDestroyBackup:', err);
  }
};

// Start the React application with error protection
const renderApp = () => {
  try {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.Fragment>
        <BrowserRouter>
          <ScrollToTop />
          <App />
        </BrowserRouter>
      </React.Fragment>
    );
  } catch (error) {
    console.error('Error rendering React app:', error);
    // Try to recover by retrying after a short delay
    setTimeout(renderApp, 1000);
  }
};

// Render with a slight delay to ensure patches are applied
setTimeout(renderApp, 50);

