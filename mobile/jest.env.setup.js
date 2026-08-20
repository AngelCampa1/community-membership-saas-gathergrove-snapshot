/**
 * Jest Environment Setup
 * Configures the test environment before any tests run
 */

// Setup global test environment
global.__DEV__ = true;

// Mock global fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
  global.Request = jest.fn();
  global.Response = jest.fn();
  global.Headers = jest.fn();
}

// Mock timers for consistent test behavior
jest.useFakeTimers();

// Setup console error/warn suppression for expected warnings
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const message = args[0];
  // Suppress known React Native testing warnings
  if (
    typeof message === 'string' && (
      message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Warning: Failed prop type') ||
      message.includes('Warning: componentWillMount has been renamed') ||
      message.includes('Warning: componentWillReceiveProps has been renamed')
    )
  ) {
    return;
  }
  originalError(...args);
};

console.warn = (...args) => {
  const message = args[0];
  // Suppress known React Native testing warnings
  if (
    typeof message === 'string' && (
      message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Animated: `useNativeDriver` was not specified')
    )
  ) {
    return;
  }
  originalWarn(...args);
};

// Setup React Native testing environment
global.requestAnimationFrame = global.requestAnimationFrame || ((cb) => {
  return setTimeout(cb, 0);
});

global.cancelAnimationFrame = global.cancelAnimationFrame || ((id) => {
  clearTimeout(id);
});