/**
 * FINAL WORKING JEST CONFIGURATION - HIVE MIND SOLUTION
 * Successfully resolves all React Native conflicts and runs tests
 */

module.exports = {
  testEnvironment: 'jsdom',
  
  // Global setup
  globals: {
    '__DEV__': true,
    'process.env': {
      NODE_ENV: 'test',
    },
  },
  
  setupFilesAfterEnv: [
    '<rootDir>/jest.testing-library-setup.js'
  ],
  
  // Exclude Playwright tests from Jest
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/coverage/',
    '/.expo/',
    '/tests/e2e/',  // Exclude Playwright E2E tests
  ],
  
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  
  // Complete module mocking
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    
    // React Native
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^react-native/(.*)$': '<rootDir>/__mocks__/react-native.js',
    
    // Vector Icons
    '^react-native-vector-icons/(.*)$': '<rootDir>/__mocks__/vector-icons.js',
    
    // Storage and Navigation
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
    '^react-native-keychain$': '<rootDir>/__mocks__/keychain.js',
    '^@react-navigation/native$': '<rootDir>/__mocks__/navigation.js',
    '^react-native-safe-area-context$': '<rootDir>/__mocks__/safe-area.js',
    
    // Expo
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
    '^expo-device$': '<rootDir>/__mocks__/expo-device.js',
    '^expo$': '<rootDir>/__mocks__/expo.js',
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|react-native-vector-icons)/)',
  ],
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/constants/**/*',
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  testTimeout: 15000,
  maxWorkers: 2, // Prevent resource exhaustion
  
  clearMocks: true,
  resetMocks: true,
};