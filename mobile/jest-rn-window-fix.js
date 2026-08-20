/**
 * CRITICAL FIX: Complete React Native Setup Replacement
 * Hierarchical Hive Mind Solution - Eliminates window redefinition entirely
 * 
 * This replaces React Native's problematic setup.js with our own controlled setup
 */

// PHASE 1: Define ALL React Native globals manually to avoid their setup.js
global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

// PHASE 2: Define window correctly from the start - no conflicts possible
global.window = global;

// PHASE 3: Define all the properties React Native setup.js would define, but safely
Object.defineProperties(global, {
  __DEV__: {
    configurable: true,
    enumerable: true,
    value: true,
    writable: true,
  },
  cancelAnimationFrame: {
    configurable: true,
    enumerable: true,
    value: id => clearTimeout(id),
    writable: true,
  },
  requestAnimationFrame: {
    configurable: true,
    enumerable: true,
    value: callback => setTimeout(() => callback(Date.now()), 0),
    writable: true,
  },
  nativeFabricUIManager: {
    configurable: true,
    enumerable: true,
    value: {},
    writable: true,
  },
  performance: {
    configurable: true,
    enumerable: true,
    value: {
      now: jest.fn(Date.now),
    },
    writable: true,
  },
});

// Complete React Native environment setup - bypassing problematic setup.js

// PHASE 2: Set up critical React Native globals that prevent conflicts
global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

// PHASE 3: Pre-define other properties that React Native setup might conflict with
const reactNativeGlobals = ['__DEV__','cancelAnimationFrame','requestAnimationFrame'];

reactNativeGlobals.forEach(prop => {
  if (global[prop] && !Object.getOwnPropertyDescriptor(global, prop)?.configurable) {
    delete global[prop];
  }
});

// PHASE 4: Define __DEV__ with proper configuration for React Native compatibility
if (!global.__DEV__) {
  Object.defineProperty(global,'__DEV__', {
    configurable: true,
    enumerable: true,
    value: true,
    writable: true,
  });
}

// PHASE 5: Mock ALL critical React Native modules that cause test failures
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: {
    OS:'ios',
    select: jest.fn((specifics) => specifics.ios || specifics.default),
    isPad: false,
    isTVOS: false,
    isWatch: false,
    Version:'14.0',
  },
}));

jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => ({
      width: 375,
      height: 812,
      scale: 3,
      fontScale: 1,
    })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

// CRITICAL: Mock useColorScheme and Appearance for ThemeContext
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() =>'light'),
}));

jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
  __esModule: true,
  default: {
    getColorScheme: jest.fn(() =>'light'),
    addChangeListener: jest.fn(),
    removeChangeListener: jest.fn(),
    setColorScheme: jest.fn(),
  },
  getColorScheme: jest.fn(() =>'light'),
  addChangeListener: jest.fn(),
  removeChangeListener: jest.fn(),
  setColorScheme: jest.fn(),
}));

// Mock React Native core components that are commonly used in tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock useColorScheme hook specifically
  const useColorScheme = jest.fn(() =>'light');
  
  return {
    ...RN,
    useColorScheme,
    Appearance: {
      getColorScheme: () =>'light',
      addChangeListener: jest.fn(),
      removeChangeListener: jest.fn(),
      setColorScheme: jest.fn(),
    },
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      openURL: jest.fn().mockResolvedValue(true),
      canOpenURL: jest.fn().mockResolvedValue(true),
      getInitialURL: jest.fn().mockResolvedValue(null),
    },
    // Ensure Platform is properly mocked
    Platform: {
      OS:'ios',
      select: jest.fn((specifics) => specifics.ios || specifics.default),
      isPad: false,
      isTVOS: false,
      Version:'14.0',
    },
    // Mock Dimensions properly
    Dimensions: {
      get: jest.fn(() => ({
        width: 375,
        height: 812,
        scale: 3,
        fontScale: 1,
      })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

// PHASE 6: Setup global mocks for common imports
global.mockReset = () => {
  // Reset function for test cleanup
};

// PHASE 7: Suppress React Native setup warnings that don't affect functionality
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] &&
    typeof args[0] ==='string' &&
    (args[0].includes('React Native') || 
     args[0].includes('Animated:') ||
     args[0].includes('react-test-renderer'))
  ) {
    return; // Suppress React Native warnings
  }
  originalWarn(...args);
};

// PHASE 8: Set up direct mock implementations for critical modules
jest.doMock('@/hooks/useAuth', () => {
  const mockAuth = {
    user: {
      token:'mock-token',
      user: {
        userId: 1,
        fullName:'Test User',
        email:'test@example.com',
        role:'Member',
        clubId: 123,
        clubTier:'Grow',
      },
      isAuthenticated: true,
    },
    loading: false,
    error: null,
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    checkStoredSession: jest.fn().mockResolvedValue(undefined),
    clearError: jest.fn(),
  };
  
  return {
    useAuth: jest.fn(() => mockAuth),
    defaultMockUser: mockAuth.user,
    defaultAuthState: mockAuth,
  };
});

jest.doMock('@/contexts/ThemeContext', () => {
  const React = require('react');
  
  const defaultTheme = {
    colors: {
      primary:'#007AFF',
      secondary:'#5856D6',
      background:'#F2F2F7',
      card:'#FFFFFF',
      text:'#000000',
      border:'#C7C7CC',
      notification:'#FF3B30',
      success:'#34C759',
      warning:'#FF9500',
      error:'#FF3B30',
      gray:'#8E8E93',
      lightGray:'#F2F2F7',
      darkGray:'#636366',
    },
  };
  
  return {
    ThemeProvider: ({ children }) => React.createElement('div', {'data-testid':'theme-provider' }, children),
    useTheme: jest.fn(() => defaultTheme),
    useColorScheme: jest.fn(() =>'light'),
    defaultTheme,
  };
});

jest.doMock('@/services/memberService', () => {
  const mockProfile = {
    id: 1,
    clubId: 123,
    membershipTypeId: 1,
    membershipTypeName:'Individual',
    fullName:'Test User',
    email:'test@example.com',
    phoneNumber:'+1234567890',
    address:'123 Test St, Test City, TS 12345',
    status:'Active',
    joinDate:'2024-01-15T00:00:00Z',
    duesPaidUntil:'2024-12-31T00:00:00Z',
    hasSmsConsent: true,
    createdAt:'2024-01-15T10:00:00Z',
    updatedAt:'2024-01-15T10:00:00Z',
    totalPaidCurrentPeriod: 25.00,
    expectedDuesAmount: 25.00,
    hasPartialPayments: false,
    duesFrequency:'monthly',
    customFields: [],
  };
  
  return {
    memberService: {
      getMemberProfile: jest.fn().mockResolvedValue(mockProfile),
      updateMemberProfile: jest.fn().mockResolvedValue(mockProfile),
    },
    mockMemberProfile: mockProfile,
  };
});

jest.doMock('@/services/membershipTypeService', () => ({
  membershipTypeService: {
    getMembershipTypes: jest.fn().mockResolvedValue([]),
  },
}));

// Mock React Native AppState globally
jest.doMock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    AppState: {
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
      currentState:'active',
    },
  };
});

// Advanced module mocks configured for mobile tests

// PHASE 9: MSW Support - Add polyfills for browser APIs
// Required for MSW (Mock Service Worker) to work in Jest/Node environment

// Import web streams polyfill for WritableStream, ReadableStream, etc.
const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill');
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;

// Add TextEncoder/TextDecoder from Node.js util
if (typeof global.TextEncoder ==='undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add BroadcastChannel polyfill for MSW
if (typeof global.BroadcastChannel ==='undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

// Also add fetch polyfill for MSW if not available
if (typeof global.fetch ==='undefined') {
  global.fetch = jest.fn();
  global.Request = class Request {};
  global.Response = class Response {};
  global.Headers = class Headers {};
}