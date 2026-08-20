/**
 * PERFECTION MODE: Comprehensive Mock Cleanup
 * Ensures perfect test isolation and eliminates memory leaks
 */

import { cleanup } from '@testing-library/react';

export const perfectMockCleanup = () => {
  // React Testing Library cleanup
  cleanup();
  
  // Clear all Jest mocks
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
  
  // Clear all timers
  jest.clearAllTimers();
  jest.runOnlyPendingTimers();
  
  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // Clear storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear any global state
  if (typeof window !== 'undefined') {
    // Reset window location
    delete (window as any).location;
    window.location = new URL('http://localhost:3000') as any;
    
    // Clear window variables
    Object.keys(window).forEach(key => {
      if (key.startsWith('__') || key.includes('mock') || key.includes('test')) {
        delete (window as any)[key];
      }
    });
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
};

// Auto-cleanup after each test
afterEach(() => {
  perfectMockCleanup();
});

export default perfectMockCleanup;