/**
 * WORKING JEST CONFIGURATION - FINAL SOLUTION
 * This configuration actually works by avoiding all React Native conflicts
 */

module.exports = {
  testEnvironment: 'jsdom',
  
  // NO setup files that cause conflicts
  setupFilesAfterEnv: [
    '<rootDir>/jest.testing-library-setup.js'
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/coverage/',
    '/.expo/',
  ],
  
  // Custom transforms
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    
    // Mock React Native completely
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^react-native/(.*)$': '<rootDir>/__mocks__/react-native.js',
    
    // Mock Vector Icons
    '^react-native-vector-icons/(.*)$': '<rootDir>/__mocks__/react-native-vector-icons.js',
    
    // Mock other problematic modules
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
    '^react-native-keychain$': '<rootDir>/__mocks__/keychain.js',
    '^@react-navigation/native$': '<rootDir>/__mocks__/navigation.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
    '^expo-device$': '<rootDir>/__mocks__/expo-device.js',
    '^expo$': '<rootDir>/__mocks__/expo.js',
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo)/)',
  ],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/constants/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  testTimeout: 15000,
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Mock everything
  clearMocks: true,
  resetMocks: true,
};