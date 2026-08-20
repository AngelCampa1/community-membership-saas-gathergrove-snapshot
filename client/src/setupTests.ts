/**
 * Jest Testing Setup - MINIMAL BOUNDARY MOCKING ONLY
 *
 * This file mocks ONLY at system boundaries:
 * - Browser APIs not available in JSDOM (matchMedia, ResizeObserver, etc.)
 * - External services intercepted via MSW
 * - Native platform features
 *
 * UI components (Radix, shadcn, etc.) are NOT mocked - they render as real components.
 * Services and hooks are NOT mocked - they use real implementations with MSW for HTTP.
 */

import '@testing-library/jest-dom';
import { cleanup, configure } from '@testing-library/react';

// Import JSDOM fixes for browser API compatibility
import './__mocks__/jsdom-fixes';

// Set test environment variables - must match MSW handlers (port 8050)
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8050';
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8050/api/v1';
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-turnstile-site-key';

// =============================================================================
// HTTP BOUNDARY MOCKING - Using MSW (Mock Service Worker)
// =============================================================================

// NOTE: Fetch polyfill is set up in jest.polyfills.js (runs before JSDOM environment)
// This ensures MSW 2.x can intercept fetch requests properly

// Import and set up MSW server
import { setupMswServer } from './mocks/server';

// Initialize MSW server for all tests
// MSW handles all HTTP mocking - do NOT override global.fetch
setupMswServer();

// =============================================================================
// BROWSER API MOCKS - Required because JSDOM doesn't implement these
// =============================================================================

// Mock matchMedia (not implemented in JSDOM)
// Try to delete first, then define or assign based on whether it exists
try {
  if ('matchMedia' in window) {
    delete (window as any).matchMedia;
  }
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true, // Allow tests to override this mock
    value: jest.fn().mockImplementation((query) => ({
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
} catch (e) {
  // If defineProperty fails, just assign it directly
  (window as any).matchMedia = jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

// Mock ResizeObserver (not implemented in JSDOM)
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn((element) => {
    setTimeout(() => {
      try {
        callback([{
          target: element,
          contentRect: { width: 800, height: 400, top: 0, left: 0, bottom: 400, right: 800 },
          borderBoxSize: [{ blockSize: 400, inlineSize: 800 }],
          contentBoxSize: [{ blockSize: 400, inlineSize: 800 }],
          devicePixelContentBoxSize: [{ blockSize: 400, inlineSize: 800 }]
        }], this);
      } catch {
        // Silently handle callback errors
      }
    }, 0);
  }),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver (not implemented in JSDOM)
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock HTMLCanvasElement (partial implementation in JSDOM)
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  measureText: jest.fn(() => ({ width: 50 })),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
  setTransform: jest.fn(),
  resetTransform: jest.fn(),
});

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock');
HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  if (callback) callback(new Blob(['mock'], { type: 'image/png' }));
});

// =============================================================================
// STORAGE MOCKS - Browser storage APIs
// =============================================================================

const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
};

Object.defineProperty(window, 'localStorage', { value: createStorageMock() });
Object.defineProperty(window, 'sessionStorage', { value: createStorageMock() });

// =============================================================================
// FILE/URL API MOCKS - Required for file operations
// =============================================================================

global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();
global.open = jest.fn();

(global as any).FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  result: null,
  error: null,
  readyState: 0,
  onload: null,
  onerror: null,
  abort: jest.fn(),
  dispatchEvent: jest.fn(),
  EMPTY: 0,
  LOADING: 1,
  DONE: 2,
}));

// =============================================================================
// CRYPTO API MOCK - Required for secure random generation
// =============================================================================

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockReturnValue(new Uint32Array(1)),
    randomUUID: jest.fn(() => '12345678-1234-1234-1234-123456789012'),
  },
});

// NOTE: TextEncoder/TextDecoder are now provided by jest.polyfills.js
// (required for MSW 2.x to work properly)

// =============================================================================
// PERFORMANCE API MOCK
// =============================================================================

const mockPerformanceNow = jest.fn(() => Date.now());
Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: mockPerformanceNow,
});

// =============================================================================
// NEXT.JS MOCKS - Framework-specific boundary mocks
// =============================================================================

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
    toString: jest.fn(() => ''),
    forEach: jest.fn(),
    entries: jest.fn(() => []),
    keys: jest.fn(() => []),
    values: jest.fn(() => [])
  }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => '/test-path'
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    const React = require('react');
    return React.createElement('img', { src, alt, ...props });
  },
}));

// =============================================================================
// EXTERNAL SERVICE MOCKS - True external boundaries
// =============================================================================

// Mock SignalR (external real-time service)
jest.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: jest.fn().mockImplementation(() => ({
    withUrl: jest.fn().mockReturnThis(),
    withAutomaticReconnect: jest.fn().mockReturnThis(),
    configureLogging: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
      invoke: jest.fn().mockResolvedValue(undefined),
      state: 'Connected',
    }),
  })),
  LogLevel: { Information: 1, Warning: 2, Error: 3 },
  HubConnectionState: { Disconnected: 'Disconnected', Connected: 'Connected' },
}));

// =============================================================================
// CONSOLE NOISE REDUCTION - Suppress expected warnings
// =============================================================================

const originalError = console.error;
const originalWarn = console.warn;

global.console = {
  ...console,
  error: jest.fn((message) => {
    // Suppress expected React warnings
    if (
      typeof message === 'string' && (
        message.includes('Warning: React Router Future Flag') ||
        message.includes('Warning: validateDOMNesting') ||
        message.includes('act(...)') ||
        message.includes('Warning: An invalid form control')
      )
    ) {
      return;
    }
    originalError(message);
  }),
  warn: jest.fn((message) => {
    if (
      typeof message === 'string' && (
        message.includes('React Router Future Flag') ||
        message.includes('componentWillReceiveProps')
      )
    ) {
      return;
    }
    originalWarn(message);
  }),
};

// =============================================================================
// TEST LIFECYCLE HOOKS
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockPerformanceNow.mockClear();
  window.localStorage.clear();
  window.sessionStorage.clear();
  (global.URL.createObjectURL as jest.Mock).mockClear();
  (global.URL.revokeObjectURL as jest.Mock).mockClear();
});

afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  document.body.innerHTML = '';
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  jest.restoreAllMocks();
});

// =============================================================================
// TESTING LIBRARY CONFIG
// =============================================================================

configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 2000,
});

jest.setTimeout(10000);

// =============================================================================
// ACCESSIBILITY TESTING SETUP
// =============================================================================

import { configureAxe } from 'jest-axe';
import { toHaveNoViolations } from 'jest-axe';

configureAxe({
  rules: {
    'color-contrast': { enabled: false },
    'landmark-one-main': { enabled: false },
  },
});

expect.extend(toHaveNoViolations);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

console.log('🧪 Test environment initialized - MSW enabled, boundary-only mocking active');
