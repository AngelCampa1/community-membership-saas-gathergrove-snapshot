/**
 * JSDOM PERFECTION FIXES
 * Eliminates JSDOM errors and warnings that cause test noise
 */

// Fix JSDOM navigation errors
const originalError = global.console.error;
const originalWarn = global.console.warn;

global.console.error = (...args: any[]) => {
  // Suppress JSDOM navigation errors
  if (args[0] && typeof args[0] === 'object' && args[0].type === 'not implemented') return;
  if (args[0] && args[0].toString && args[0].toString().includes('Not implemented: navigation')) return;
  if (args[0] && args[0].toString && args[0].toString().includes('Error: Not implemented: navigation')) return;
  
  // Call original error for legitimate issues
  originalError(...args);
};

global.console.warn = (...args: any[]) => {
  // Suppress React DOM nesting warnings in tests
  if (args[0] && args[0].toString && args[0].toString().includes('validateDOMNesting')) return;
  if (args[0] && args[0].toString && args[0].toString().includes('Warning: ReactDOM.render')) return;
  
  // Call original warn for legitimate issues
  originalWarn(...args);
};

// Mock problematic JSDOM methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollTo
global.scrollTo = jest.fn();

// Mock performance.mark and performance.measure
global.performance.mark = jest.fn();
global.performance.measure = jest.fn();

export {};