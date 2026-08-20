// CRITICAL FIX: Define __DEV__ globally for all tests
global.__DEV__ = true;

// Load testing library extensions
import '@testing-library/jest-native/extend-expect';
import { configure, cleanup } from '@testing-library/react-native';

// Configure testing library with explicit host component type mappings
// This bypasses auto-detection which fails with our hybrid React/HTML mocks
configure({
  hostComponentNames: {
    text: 'div',           // Text mock renders as div
    textInput: 'input',    // TextInput mock renders as input
    image: 'div',          // Image mock renders as div
    switch: 'select',      // Switch mock renders as select (MUST be different from textInput!)
    scrollView: 'div',     // ScrollView mock renders as div
    modal: 'div'           // Modal mock renders as div
  }
});

// Set up additional testing utilities
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Reset console error suppression for each test
  global.__SUPPRESS_TEST_CONSOLE_ERRORS__ = false;

  // MOBILE TEST FIX: Restore useAuth mock default value after clearing
  if (global.mockUseAuth && global.mockAuthState) {
    global.mockUseAuth.mockReturnValue(global.mockAuthState);
  }

  // MOBILE TEST FIX: Reset React Native mocks
  if (global.mockReset) {
    global.mockReset();
  }
});

// Track test count for periodic garbage collection hints
let testCount = 0;

// Clean up after each test
afterEach(() => {
  // CRITICAL FIX: Use real timers during cleanup to avoid fake timer interference
  jest.useRealTimers();

  // CRITICAL FIX: Explicitly cleanup all rendered components
  // This prevents cumulative resource exhaustion when running thousands of tests
  cleanup();

  // Ensure console error suppression is reset
  global.__SUPPRESS_TEST_CONSOLE_ERRORS__ = false;

  // Clear any remaining timers
  jest.clearAllTimers();

  // Periodically hint garbage collection if available (every 100 tests)
  testCount++;
  if (testCount % 100 === 0 && global.gc) {
    global.gc();
  }
});

// Set default timeout for async operations - increased for mobile tests
jest.setTimeout(20000);

// MOBILE TEST FIX: Enhanced async operations with act()
const { waitFor, act } = require('@testing-library/react-native');

// Wrap all async operations properly
global.waitForAsync = async (callback, options = {}) => {
  return act(async () => {
    return waitFor(callback, { timeout: 10000, ...options });
  });
};

// Global act wrapper for all state updates
global.actAsync = act;

// Suppress react-test-renderer deprecation warnings and improve error filtering
const originalError = console.error;
const originalWarn = console.warn;

global.console.error = (...args) => {
  // Skip react-test-renderer deprecation warnings
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    args[0].includes('react-test-renderer is deprecated')
  ) {
    return;
  }

  // Skip act() warnings during test runs - they're handled by our wrappers
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    args[0].includes('Warning: An update to') &&
    args[0].includes('inside a test was not wrapped in act')
  ) {
    return;
  }

  // Skip test-related console errors during test runs (but still allow intentional error testing)
  if (
    global.__SUPPRESS_TEST_CONSOLE_ERRORS__ &&
    args[0] &&
    typeof args[0] === 'string'
  ) {
    // Allow error testing with specific patterns
    const isIntentionalTestError = args[0].includes('[AUTHENTICATION]') ||
                                   args[0].includes('[PAYMENT]') ||
                                   args[0].includes('[AUTHORIZATION]') ||
                                   args[0].includes('[VALIDATION]') ||
                                   args[0].includes('[NETWORK]') ||
                                   args[0].includes('[SYSTEM]');

    if (!isIntentionalTestError) {
      return;
    }
  }

  originalError(...args);
};

// Also suppress warnings for test environment
global.console.warn = (...args) => {
  // Skip test-specific warnings that don't affect functionality
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].includes('deprecated') || args[0].includes('act()'))
  ) {
    return;
  }

  originalWarn(...args);
};

// Global flag for test error suppression
global.__SUPPRESS_TEST_CONSOLE_ERRORS__ = false;

// ============================================================================
// HTTP Mocking Strategy
// ============================================================================
// Use axios mocking for HTTP boundaries (MSW has jsdom compatibility issues)
// Individual tests will mock axios for their specific HTTP endpoints
//
// DO NOT mock internal services/components - only external HTTP boundaries!
// ============================================================================ 