/**
 * EMERGENCY NUCLEAR JEST CONFIGURATION
 * This bypasses React Native's problematic window redefinition completely
 * Used as a last resort to get tests running
 */

module.exports = {
  // Use Node environment instead of JSDOM to avoid window conflicts
  testEnvironment: 'node',
  
  // Minimal setup - avoid React Native preset conflicts
  setupFiles: ['<rootDir>/jest.env.setup.js'],
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
  
  // Essential transformations only
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@/navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/constants/(.*)$': '<rootDir>/src/constants/$1',
    
    // Mock React Native and Expo modules
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
    '^expo-device$': '<rootDir>/__mocks__/expo-device.js',
    '^expo$': '<rootDir>/__mocks__/expo.js',
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/constants/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};