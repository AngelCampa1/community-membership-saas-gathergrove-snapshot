import { useRef, useEffect } from 'react';
import { toast } from 'sonner';

// Track recent toasts to prevent duplicates (module-level for cross-component deduplication)
const recentToasts = new Map<string, number>();
const DUPLICATE_THRESHOLD = 2000; // 2 seconds
const CLEANUP_INTERVAL = 30000; // Clean up old entries every 30 seconds

// BUG FIX: Only create interval in browser environment (prevent SSR memory leak)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

// BUG FIX: Cleanup on module unload (prevent listener accumulation)
// Store handler reference to allow proper cleanup and prevent duplicates
let beforeUnloadHandler: (() => void) | null = null;

if (typeof window !== 'undefined') {
  // Periodic cleanup to prevent Map from growing indefinitely (BUG FIX: F-01)
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    recentToasts.forEach((timestamp, key) => {
      if (now - timestamp > DUPLICATE_THRESHOLD * 2) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => recentToasts.delete(key));
  }, CLEANUP_INTERVAL);

  beforeUnloadHandler = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }
    recentToasts.clear();
  };

  // Remove any existing listener first (in case of HMR)
  window.removeEventListener('beforeunload', beforeUnloadHandler);
  // Add the listener
  window.addEventListener('beforeunload', beforeUnloadHandler);
}

/**
 * Custom hook that prevents duplicate toasts from being shown in quick succession
 * BUG FIX F-01: Added proper cleanup to prevent memory leaks
 */
export function useToast() {
  const cleanupTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  // Clean up all timeouts on unmount (BUG FIX: F-01)
  useEffect(() => {
    return () => {
      // Clear all pending timeouts when component unmounts
      cleanupTimeouts.current.forEach(timeout => clearTimeout(timeout));
      cleanupTimeouts.current.clear();
    };
  }, []);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, options?: Record<string, unknown>) => {
    const key = `${type}-${message}`;
    const now = Date.now();
    const lastShown = recentToasts.get(key);

    // If the same toast was shown recently, don't show it again
    if (lastShown && (now - lastShown) < DUPLICATE_THRESHOLD) {
      return;
    }

    // Show the toast
    recentToasts.set(key, now);
    toast[type](message, options);

    // Clean up the recent toast tracking after a delay
    const timeout = setTimeout(() => {
      recentToasts.delete(key);
      cleanupTimeouts.current.delete(timeout);
    }, DUPLICATE_THRESHOLD);

    cleanupTimeouts.current.add(timeout);
  };

  return {
    success: (message: string, options?: Record<string, unknown>) => showToast('success', message, options),
    error: (message: string, options?: Record<string, unknown>) => showToast('error', message, options),
    warning: (message: string, options?: Record<string, unknown>) => showToast('warning', message, options),
    info: (message: string, options?: Record<string, unknown>) => showToast('info', message, options),
  };
}