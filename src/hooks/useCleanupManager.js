/**
 * useCleanupManager Hook
 * A hook for managing resource cleanup in React components.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { safelyCleanup } from '../utils/cleanup';

export const useCleanupManager = () => {
  const resources = useRef(new Set());
  
  // Add a resource to be cleaned up
  const addResource = useCallback((resource) => {
    if (!resource) return;
    resources.current.add(resource);
    return resource;
  }, []);
  
  // Remove a resource from the cleanup list
  const removeResource = useCallback((resource) => {
    if (!resource) return;
    resources.current.delete(resource);
  }, []);
  
  // Clean up all resources
  const cleanupAll = useCallback(() => {
    resources.current.forEach(resource => {
      try {
        safelyCleanup(resource);
      } catch (error) {
        console.warn(`Error cleaning up resource: ${error.message}`);
      }
    });
    resources.current.clear();
  }, []);
  
  // Clean up all resources when component unmounts
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);
  
  return {
    addResource,
    removeResource,
    cleanupAll
  };
};

export default useCleanupManager; 