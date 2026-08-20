/**
 * Test utilities for better test design and isolation
 */

/**
 * Suppresses console errors during test execution for expected errors
 * @param callback - The test function that will produce expected errors
 * @returns The result of the callback function
 */
export async function suppressConsoleErrors<T>(callback: () => T | Promise<T>): Promise<T> {
  // Setup error suppression

  try {
    const result = await callback();
    return result;
  } finally {
    /* Error suppression cleanup */
  }
}

/**
 * while suppressing the actual console output during tests
 * @returns Jest spy function
 */
export function createConsoleErrorSpy() {
  return jest.spyOn(console, 'error').mockImplementation(() => {});
}

/**
 * Helper to restore all console spies
 * @param spies - Array of console spies to restore
 */
export function restoreConsoleSpies(spies: jest.SpyInstance[]) {
  spies.forEach(spy => spy.mockRestore());
}

/**
 * Creates a test environment with isolated console suppression
 * @param callback - Test function to execute
 * @returns Promise that resolves with test result
 */
export async function withIsolatedConsole<T>(
  callback: () => T | Promise<T>
): Promise<T> {
  const mockManager = new TestMockManager();
  
  // Suppress all console output during test
  mockManager.registerSpy(jest.spyOn(console, 'error').mockImplementation(() => {}));
  mockManager.registerSpy(jest.spyOn(console, 'warn').mockImplementation(() => {}));
  mockManager.registerSpy(jest.spyOn(console, 'log').mockImplementation(() => {}));
  
  try {
    return await callback();
  } finally {
    mockManager.restoreSpies();
  }
}

/**
 * Creates a mock error object with proper structure for testing
 * @param status - HTTP status code
 * @param message - Error message
 * @param code - Optional error code
 * @returns Mock error object
 */
export function createMockError(status: number, message: string, code?: string) {
  return {
    response: {
      status,
      data: { message, code }
    }
  };
}

/**
 * Creates a mock network error for testing
 * @param code - Network error code (e.g., 'ECONNREFUSED', 'ECONNABORTED')
 * @param message - Optional error message
 * @returns Mock network error object
 */
export function createMockNetworkError(code: string, message?: string) {
  return {
    code,
    message: message || `Network error: ${code}`
  };
}

/**
 * Enhanced mock management for better test isolation
 */
export class TestMockManager {
  private mocks: jest.MockedFunction<(...args: unknown[]) => unknown>[] = [];
  private spies: jest.SpyInstance[] = [];
  private timers: NodeJS.Timeout[] = [];

  /**
   * Register a mock to be automatically reset
   */
  registerMock<T extends (...args: unknown[]) => unknown>(mock: jest.MockedFunction<T>): jest.MockedFunction<T> {
    this.mocks.push(mock as jest.MockedFunction<(...args: unknown[]) => unknown>);
    return mock;
  }

  /**
   * Register a spy to be automatically restored
   */
  registerSpy(spy: jest.SpyInstance) {
    this.spies.push(spy);
    return spy;
  }

  /**
   * Register a timer to be automatically cleared
   */
  registerTimer(timer: NodeJS.Timeout) {
    this.timers.push(timer);
    return timer;
  }

  /**
   * Reset all registered mocks
   */
  resetMocks() {
    this.mocks.forEach(mock => mock.mockReset());
  }

  /**
   * Clear all registered mocks
   */
  clearMocks() {
    this.mocks.forEach(mock => mock.mockClear());
  }

  /**
   * Restore all registered spies
   */
  restoreSpies() {
    this.spies.forEach(spy => spy.mockRestore());
    this.spies = [];
  }

  /**
   * Clear all registered timers
   */
  clearTimers() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
  }

  /**
   * Complete cleanup - resets mocks, restores spies, clears timers
   */
  cleanup() {
    this.resetMocks();
    this.restoreSpies();
    this.clearTimers();
  }
}

/**
 * Async error handling utilities for better test patterns
 */
export class AsyncTestHelper {
  /**
   * Waits for an async function to throw an error
   * @param asyncFn - Function that should throw
   * @param expectedError - Optional expected error message or pattern
   * @returns Promise that resolves when error is thrown
   */
  static async expectAsyncError(
    asyncFn: () => Promise<unknown>,
    expectedError?: string | RegExp
  ): Promise<Error> {
    try {
      await asyncFn();
      throw new Error('Expected function to throw an error, but it did not');
    } catch (error) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          expect((error as Error).message).toContain(expectedError);
        } else {
          expect((error as Error).message).toMatch(expectedError);
        }
      }
      return error as Error;
    }
  }

  /**
   * Creates a controllable promise for testing async behavior
   * @returns Object with promise and resolve/reject controls
   */
  static createControllablePromise<T>() {
    let resolve: (value: T) => void;
    let reject: (reason?: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return {
      promise,
      resolve: resolve!,
      reject: reject!
    };
  }

  /**
   * Waits for multiple async operations to complete
   * @param operations - Array of async operations
   * @param options - Configuration options
   * @returns Promise that resolves when all operations complete
   */
  static async waitForOperations<T = unknown>(
    operations: (() => Promise<T>)[],
    options: { timeout?: number; allowFailures?: boolean } = {}
  ): Promise<T[] | PromiseSettledResult<T>[]> {
    const { timeout = 5000, allowFailures = false } = options;

    const promises = operations.map(op => op());

    if (allowFailures) {
      return Promise.allSettled(promises);
    }

    return Promise.race([
      Promise.all(promises),
      new Promise<T[]>((_, reject) =>
        setTimeout(() => reject(new Error(`Operations timed out after ${timeout}ms`)), timeout)
      )
    ]);
  }
}

/**
 * Test isolation utilities
 */
export function createIsolatedTest<T>(
  testFn: (mockManager: TestMockManager) => Promise<T> | T
): () => Promise<T> {
  return async () => {
    const mockManager = new TestMockManager();
    
    try {
      return await testFn(mockManager);
    } finally {
      mockManager.cleanup();
    }
  };
}