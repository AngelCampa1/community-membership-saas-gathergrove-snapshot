/**
 * Test cleanup utilities to prevent hanging tests and resource leaks
 */

/**
 * Clean up any pending timers, promises, and async operations
 * Use this in afterEach or cleanup functions
 */
export const cleanupAsyncOperations = async (timeout = 100): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

/**
 * Force cleanup of global test state
 * Use this in afterAll for comprehensive cleanup
 */
export const forceTestCleanup = async (): Promise<void> => {
  // Clear any remaining timers
  jest.clearAllTimers();
  
  // Run fake timers to completion
  if (jest.isMockFunction(setTimeout)) {
    jest.runAllTimers();
  }
  
  // Wait for any pending micro tasks
  await new Promise(resolve => setImmediate(resolve));
  
  // Force garbage collection if available
  if (typeof global.gc === 'function') {
    global.gc();
  }
};

/**
 * Mock cleanup for SignalR connections in tests
 */
export const mockSignalRCleanup = {
  connection: null as any,
  
  setup: () => {
    const mockConnection = {
      invoke: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
      onConnectionStatus: jest.fn(),
      stopConnection: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn(() => false)
    };
    mockSignalRCleanup.connection = mockConnection;
    return mockConnection;
  },
  
  cleanup: async () => {
    if (mockSignalRCleanup.connection) {
      try {
        await mockSignalRCleanup.connection.stopConnection();
      } catch {
        // Ignore cleanup errors
      }
      mockSignalRCleanup.connection = null;
    }
  }
};

/**
 * Abort controller cleanup for fetch operations
 */
export const createTestAbortController = (): AbortController => {
  const controller = new AbortController();
  
  // Auto-abort after test timeout to prevent hanging
  setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }, 5000);
  
  return controller;
};

/**
 * Timeout wrapper for async test operations
 */
export const withTestTimeout = async <T>(
  operation: () => Promise<T>,
  timeout = 5000,
  timeoutMessage = 'Test operation timed out'
): Promise<T> => {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeout);
    })
  ]);
};

/**
 * Cleanup helper for component tests that use hooks
 */
export const setupHookTestCleanup = () => {
  const cleanupFunctions: (() => void | Promise<void>)[] = [];
  
  const addCleanup = (fn: () => void | Promise<void>) => {
    cleanupFunctions.push(fn);
  };
  
  const runCleanup = async () => {
    await Promise.all(
      cleanupFunctions.map(async (fn) => {
        try {
          await fn();
        } catch (e) {
          // Ignore cleanup errors to prevent test failures
          console.warn('Cleanup function failed:', e);
        }
      })
    );
    cleanupFunctions.length = 0;
  };
  
  return { addCleanup, runCleanup };
};

/**
 * Test-safe setTimeout that auto-clears on test cleanup
 */
export const testTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
  const timeoutId = setTimeout(callback, delay);
  
  // Track for automatic cleanup
  if (typeof window !== 'undefined' && (window as any)._testTimeouts) {
    (window as any)._testTimeouts.add(timeoutId);
  }
  
  return timeoutId;
};

/**
 * Test-safe setInterval that auto-clears on test cleanup
 */
export const testInterval = (callback: () => void, delay: number): NodeJS.Timeout => {
  const intervalId = setInterval(callback, delay);
  
  // Track for automatic cleanup
  if (typeof window !== 'undefined' && (window as any)._testIntervals) {
    (window as any)._testIntervals.add(intervalId);
  }
  
  return intervalId;
};