import React, { useEffect } from 'react';
import { patchWebSocket } from '../utils/cleanup';

/**
 * WebSocketProvider component
 * 
 * This component ensures that WebSockets are properly patched
 * and cleaned up in components that use them. It should wrap
 * any component that creates WebSocket connections.
 * 
 * @param {Object} props.children - Child components
 */
const WebSocketProvider = ({ children }) => {
  useEffect(() => {
    // Ensure WebSockets are patched when this component mounts
    console.log('WebSocketProvider: Ensuring WebSockets are patched');
    patchWebSocket();
    
    // Return cleanup function that will be called on unmount
    return () => {
      console.log('WebSocketProvider: Component unmounting');
      
      // Handle any additional WebSocket-related cleanup if needed
      // This is where we could clean up any lingering global WebSocket references
      
      // Note: Individual WebSockets should be properly cleaned up
      // by their respective components using safelyCleanup or safeCleanup
    };
  }, []);
  
  // Simply render children - this is a context-free wrapper
  return <>{children}</>;
};

export default WebSocketProvider; 