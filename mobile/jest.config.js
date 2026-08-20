/**
 * HIERARCHICAL HIVE MIND JEST CONFIGURATION - CRITICAL WINDOW FIX
 * Coordinated solution to prevent React Native window redefinition error
 */

module.exports = {
  testEnvironment: 'jsdom',
  
  // Only look for tests in the mobile directory
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}'
  ],
  
  // CRITICAL FIX: Custom setup to prevent React Native window collision
  setupFiles: [
    '<rootDir>/jest-rn-window-fix.js',
    '<rootDir>/jest.mobile-mocks.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.testing-library-setup.js'
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/coverage/',
    '/.expo/',
    '/tests/e2e/', // Exclude Playwright tests from Jest
    '<rootDir>/../', // Exclude other project directories
    '<rootDir>/../client/',
    '<rootDir>/../backend/',
    '<rootDir>/../docs/',
  ],
  
  // Custom transforms
  transform: {
    '\\.[jt]sx?$': ['babel-jest', {
      presets: [
        ['babel-preset-expo', { 
          unstable_transformImportMeta: true,
          web: { 
            useTransformReactJSXExperimental: true,
            disableImportExportTransform: true,
          }
        }]
      ],
      plugins: [
        ['module-resolver', {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/navigation': './src/navigation',
            '@/services': './src/services',
            '@/hooks': './src/hooks',
            '@/types': './src/types',
            '@/utils': './src/utils',
            '@/constants': './src/constants',
            '@/config': './src/config',
            '@/contexts': './src/contexts',
          },
        }]
      ]
    }]
  },
  
  // Custom resolver for @/ alias in jest.mock()
  resolver: '<rootDir>/jest.resolver.js',

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',

    // MSW module resolution - Jest doesn't handle package.json exports well
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
    '^@mswjs/interceptors/(.*)$': '<rootDir>/node_modules/@mswjs/interceptors/$1',

    // Mock React Native completely
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^react-native/(.*)$': '<rootDir>/__mocks__/react-native.js',
    
    // Mock Vector Icons
    '^react-native-vector-icons/(.*)$': '<rootDir>/__mocks__/react-native-vector-icons.js',
    '^@expo/vector-icons/(.*)$': '<rootDir>/__mocks__/expo-vector-icons.js',
    '^@expo/vector-icons$': '<rootDir>/__mocks__/expo-vector-icons.js',
    
    // CRITICAL: Mock React Native Safe Area Context
    '^react-native-safe-area-context$': '<rootDir>/__mocks__/react-native-safe-area-context.js',
    
    // Mock QR Code component
    '^react-native-qrcode-svg$': '<rootDir>/__mocks__/react-native-qrcode-svg.js',
    
    // Mock other problematic modules
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
    '^@react-native-community/netinfo$': '<rootDir>/__mocks__/@react-native-community/netinfo.js',
    '^react-native-keychain$': '<rootDir>/__mocks__/keychain.js',
    '^@react-navigation/native$': '<rootDir>/__mocks__/navigation.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
    '^expo-device$': '<rootDir>/__mocks__/expo-device.js',
    '^expo-camera$': '<rootDir>/__mocks__/expo-camera.js',
    '^expo-haptics$': '<rootDir>/__mocks__/expo-haptics.js',
    '^expo-apple-authentication$': '<rootDir>/__mocks__/expo-apple-authentication.js',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^expo$': '<rootDir>/__mocks__/expo.js',

    // Mock Google Sign-In
    '^@react-native-google-signin/google-signin$': '<rootDir>/__mocks__/@react-native-google-signin/google-signin.js',

    // NOTE: Services (memberService, eventService, authService) are NOT globally mocked.
    // Tests use real services with HTTP mocking at the boundary (fetch mock).
    // Only useAuth hook is mocked for convenience in jest.mobile-mocks.js.

    // Mock Sentry SDK and other native dependencies
    '^react-native-device-info$': '<rootDir>/__mocks__/react-native-device-info.js',
    '^@sentry/react-native$': '<rootDir>/__mocks__/@sentry/react-native.js',
  },
  
  // Transform ignore patterns - HIVE MIND OPTIMIZED
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-google-signin|@react-navigation|expo|@expo|@testing-library|msw|@mswjs|until-async|@bundled-es-modules)/)',
  ],
  
  // CRITICAL: Override React Native's default setup that causes window conflicts
  preset: null, // Disable any preset that might load React Native setup
  
  // Manually specify what we need instead of using React Native preset
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/constants/**/*',
    '!src/__mocks__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      statements: 65,  // Current: 66.23% (mobile industry standard: 60-70%)
      branches: 55,     // Current: 58.64% (allows for complex conditionals)
      functions: 55,    // Current: 55.99% (realistic for mobile apps)
      lines: 65,        // Current: 66.89% (matches statement threshold)
    },
  },
  
  testTimeout: 10000,

  // MOBILE TEST FIX: Improved async handling
  // Changed from 1 to allow parallel execution and prevent OOM with large test suites
  // Each worker gets its own memory space, preventing accumulation
  maxWorkers: '50%', // Use 50% of CPU cores (typically 2-4 workers)

  // Better error handling
  verbose: false,
  detectOpenHandles: false,
  forceExit: true,

  // Prevent memory leaks by resetting modules between test files
  resetModules: true,
  restoreMocks: true,
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Mock everything
  clearMocks: true,
  resetMocks: true,
};