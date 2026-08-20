// HIVE MIND: React Native globals handled by jest-rn-window-fix.js
// Don't redefine __DEV__ here to avoid conflicts
global.process = global.process || {};
global.process.env = global.process.env || {};
global.process.env.NODE_ENV = 'test';

// CRITICAL: Mock React Native platform and dimensions FIRST
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: {
    OS: 'ios',
    select: jest.fn((specifics) => specifics.ios || specifics.default),
    isPad: false,
    isTVOS: false,
    isWatch: false,
    Version: '14.0',
    constants: {
      reactNativeVersion: { major: 0, minor: 73, patch: 0 }
    },
    getConstants: jest.fn(() => ({
      reactNativeVersion: { major: 0, minor: 73, patch: 0 },
      Version: '14.0',
      OS: 'ios',
    })),
  },
}));

// Mock Dimensions before any React Native components
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
    set: jest.fn(),
  },
}));

// Mock the critical native modules that cause getConstants errors
jest.mock('react-native/Libraries/Utilities/NativeDeviceInfo', () => ({
  __esModule: true,
  default: {
    getConstants: jest.fn(() => ({
      Dimensions: {
        window: { width: 375, height: 812, scale: 3, fontScale: 1 },
        screen: { width: 375, height: 812, scale: 3, fontScale: 1 },
      },
    })),
  },
}));

// Mock React Native Animated - comprehensive fix for animation issues
// Silences warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
// Based on React Native community discussions for 0.75+ versions

// Mock the animated module API to prevent "Native animated module is not available" errors
jest.mock('react-native/src/private/animated/NativeAnimatedHelper', () => ({
  __esModule: true,
  default: {
    shouldUseNativeDriver: jest.fn(() => false),
    API: {
      createAnimatedNode: jest.fn(),
      startAnimatingNode: jest.fn(),
      stopAnimation: jest.fn(),
      setAnimatedNodeValue: jest.fn(),
      setAnimatedNodeOffset: jest.fn(),
      flattenAnimatedNodeOffset: jest.fn(),
      extractAnimatedNodeOffset: jest.fn(),
      connectAnimatedNodeToView: jest.fn(),
      disconnectAnimatedNodeFromView: jest.fn(),
      restoreDefaultValues: jest.fn(),
      dropAnimatedNode: jest.fn(),
      addAnimatedEventToView: jest.fn(),
      removeAnimatedEventFromView: jest.fn(),
      startListeningToAnimatedNodeValue: jest.fn(),
      stopListeningToAnimatedNodeValue: jest.fn(),
      connectAnimatedNodes: jest.fn(),
      disconnectAnimatedNodes: jest.fn(),
      getValue: jest.fn(() => 0),
      flushQueue: jest.fn(),
    },
    assertNativeAnimatedModule: jest.fn(),
  },
  API: {
    createAnimatedNode: jest.fn(),
    startAnimatingNode: jest.fn(),
    stopAnimation: jest.fn(),
    setAnimatedNodeValue: jest.fn(),
    setAnimatedNodeOffset: jest.fn(),
    flattenAnimatedNodeOffset: jest.fn(),
    extractAnimatedNodeOffset: jest.fn(),
    connectAnimatedNodeToView: jest.fn(),
    disconnectAnimatedNodeFromView: jest.fn(),
    restoreDefaultValues: jest.fn(),
    dropAnimatedNode: jest.fn(),
    addAnimatedEventToView: jest.fn(),
    removeAnimatedEventFromView: jest.fn(),
    startListeningToAnimatedNodeValue: jest.fn(),
    stopListeningToAnimatedNodeValue: jest.fn(),
    connectAnimatedNodes: jest.fn(),
    disconnectAnimatedNodes: jest.fn(),
    getValue: jest.fn(() => 0),
    flushQueue: jest.fn(),
  },
  assertNativeAnimatedModule: jest.fn(),
}));

// Suppress React act() warnings in test environment
const originalError = console.error;
global.console.error = (...args) => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    args[0].includes('act(...)')
  ) {
    return;
  }
  originalError(...args);
};

// Simplified approach - just suppress animation warnings
const originalWarn = console.warn;
global.console.warn = (...args) => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].includes('Animated:') || 
     args[0].includes('shouldUseNativeDriver') ||
     args[0].includes('ProgressBarAndroid has been extracted') ||
     args[0].includes('Clipboard has been extracted') ||
     args[0].includes('PushNotificationIOS has been extracted'))
  ) {
    return;
  }
  originalWarn(...args);
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: {
      isConnectionExpensive: false,
      ssid: 'test-wifi',
      strength: 100,
      ipAddress: '192.168.1.1',
    },
  })),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: jest.fn(() => ({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
  })),
}));

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  hasInternetCredentials: jest.fn(),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');

// Mock TurboModuleRegistry to prevent native module conflicts
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn(() => null),
  get: jest.fn(() => null),
}));

// Mock NativeEventEmitter to fix testing library compatibility
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return class MockNativeEventEmitter {
    constructor() {
      this.listeners = {};
    }
    
    addListener = jest.fn((eventType, listener) => {
      if (!this.listeners[eventType]) {
        this.listeners[eventType] = [];
      }
      this.listeners[eventType].push(listener);
      return {
        remove: jest.fn(() => {
          if (this.listeners[eventType]) {
            const index = this.listeners[eventType].indexOf(listener);
            if (index > -1) {
              this.listeners[eventType].splice(index, 1);
            }
          }
        })
      };
    });
    
    removeListener = jest.fn((eventType, listener) => {
      if (this.listeners[eventType]) {
        const index = this.listeners[eventType].indexOf(listener);
        if (index > -1) {
          this.listeners[eventType].splice(index, 1);
        }
      }
    });
    
    removeAllListeners = jest.fn((eventType) => {
      if (eventType) {
        delete this.listeners[eventType];
      } else {
        this.listeners = {};
      }
    });
    
    emit = jest.fn((eventType, ...args) => {
      if (this.listeners[eventType]) {
        this.listeners[eventType].forEach(listener => listener(...args));
      }
    });
  };
});

// Mock Alert globally (for tests that don't need to spy on it)
const mockAlert = jest.fn();
global.Alert = {
  alert: mockAlert,
};

// Mock Linking globally  
const mockLinkingOpenURL = jest.fn().mockResolvedValue(true);
global.Linking = {
  openURL: mockLinkingOpenURL,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getInitialURL: jest.fn().mockResolvedValue(null),
  canOpenURL: jest.fn().mockResolvedValue(true),
};

// Mock react-native Alert and Linking modules specifically
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: mockAlert,
    },
    Linking: {
      openURL: mockLinkingOpenURL,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getInitialURL: jest.fn().mockResolvedValue(null),
      canOpenURL: jest.fn().mockResolvedValue(true),
    },
  };
});

// Export mock functions for test access
global.mockAlert = mockAlert;
global.mockLinking = mockLinkingOpenURL;

// Mock specific problematic native modules without breaking the full RN ecosystem
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children, ...props }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, props, children);
  },
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  initialWindowMetrics: {
    insets: { top: 44, bottom: 34, left: 0, right: 0 },
    frame: { x: 0, y: 0, width: 390, height: 844 },
  },
}));

// Better React Navigation mocking with context support
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      popToTop: jest.fn(),
      replace: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      isFocused: jest.fn(() => true),
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
    }),
    useRoute: () => ({
      params: { eventId: 1 },
      name: 'TestScreen',
      key: 'TestScreen-key',
    }),
    useFocusEffect: (callback) => {
      // Call immediately for tests
      callback();
    },
    useIsFocused: () => true,
  };
});

// Mock React Navigation Elements with better context support
jest.mock('@react-navigation/elements', () => ({
  SafeAreaProviderCompat: ({ children }) => children,
  useHeaderHeight: () => 44,
}));

// Mock only the specific problematic native module that React Native preset doesn't handle
jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeDeviceInfo', () => ({
  __esModule: true,
  default: {
    getConstants: jest.fn(() => ({
      Dimensions: {
        windowPhysicalPixels: {
          width: 1080,
          height: 1920,
          scale: 3,
          fontScale: 1,
        },
        screenPhysicalPixels: {
          width: 1080,
          height: 1920,
          scale: 3,
          fontScale: 1,
        },
      },
    })),
  },
}));

// Trust the react-native preset to handle StyleSheet mocking
// No additional StyleSheet mocking needed - React Native preset handles this automatically

// Firebase packages have been removed from the project
// No Firebase mocks needed anymore

// Suppress specific warnings - using different variable name to avoid conflict
const originalWarnMethod = console.warn;
console.warn = (...args) => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
     args[0].includes('An error occurred in the <Animated(View)> component'))
  ) {
    return;
  }
  originalWarnMethod(...args);
};

// Expo modules are now mocked via moduleNameMapper in jest.config.js

// Global test timeout
jest.setTimeout(10000); 