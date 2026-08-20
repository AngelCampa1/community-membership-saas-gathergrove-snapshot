const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

/**
 * Jest Configuration - MINIMAL BOUNDARY MOCKING
 *
 * moduleNameMapper should ONLY contain:
 * - Path aliases (required for module resolution)
 * - True external service mocks (Chart.js, export libraries - not available in Node)
 *
 * UI components, services, and hooks use REAL implementations.
 * HTTP calls are intercepted by MSW in setupTests.ts.
 */
const customJestConfig = {
  // Run polyfills BEFORE environment setup (needed for MSW 2.x with JSDOM)
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jest-environment-jsdom',
  // Needed for undici to work properly with JSDOM
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  moduleNameMapper: {
    // Path alias - REQUIRED for module resolution
    '^@/(.*)$': '<rootDir>/src/$1',

    // ==========================================================================
    // EXTERNAL LIBRARY MOCKS - Libraries that don't work in Node/JSDOM
    // ==========================================================================

    // Chart.js ecosystem - requires browser canvas API
    '^chart\\.js$': '<rootDir>/src/__mocks__/chart.js',
    '^react-chartjs-2$': '<rootDir>/src/__mocks__/react-chartjs-2.tsx',
    '^chartjs-adapter-date-fns$': '<rootDir>/src/__mocks__/chartjs-adapter-date-fns.ts',

    // Export libraries - require browser APIs
    '^jspdf$': '<rootDir>/src/__mocks__/jspdf.ts',
    '^exceljs$': '<rootDir>/src/__mocks__/exceljs.ts',
    '^file-saver$': '<rootDir>/src/__mocks__/file-saver.ts',

    // D3 - complex browser dependency
    '^d3$': '<rootDir>/src/__mocks__/d3.ts',

    // Sentry - requires Next.js server runtime not available in Jest
    '^@sentry/nextjs$': '<rootDir>/src/__mocks__/@sentry/nextjs.ts',

    // Toast library - uses portals that need special handling
    '^sonner$': '<rootDir>/src/__mocks__/sonner.ts',

    // MSW mock - provides custom fetch mock for JSDOM compatibility
    '^msw$': '<rootDir>/src/__mocks__/msw.ts',
    '^msw/node$': '<rootDir>/src/__mocks__/msw-node.ts',

    // Radix UI primitives - ESM packages that don't work in JSDOM
    '^@radix-ui/react-alert-dialog$': '<rootDir>/src/__mocks__/@radix-ui/react-alert-dialog.tsx',
    '^@radix-ui/react-avatar$': '<rootDir>/src/__mocks__/@radix-ui/react-avatar.tsx',
    '^@radix-ui/react-checkbox$': '<rootDir>/src/__mocks__/@radix-ui/react-checkbox.tsx',
    '^@radix-ui/react-collapsible$': '<rootDir>/src/__mocks__/@radix-ui/react-collapsible.tsx',
    '^@radix-ui/react-dialog$': '<rootDir>/src/__mocks__/@radix-ui/react-dialog.tsx',
    '^@radix-ui/react-dropdown-menu$': '<rootDir>/src/__mocks__/@radix-ui/react-dropdown-menu.tsx',
    '^@radix-ui/react-label$': '<rootDir>/src/__mocks__/@radix-ui/react-label.tsx',
    '^@radix-ui/react-progress$': '<rootDir>/src/__mocks__/@radix-ui/react-progress.tsx',
    '^@radix-ui/react-radio-group$': '<rootDir>/src/__mocks__/@radix-ui/react-radio-group.tsx',
    '^@radix-ui/react-scroll-area$': '<rootDir>/src/__mocks__/@radix-ui/react-scroll-area.tsx',
    '^@radix-ui/react-select$': '<rootDir>/src/__mocks__/@radix-ui/react-select.tsx',
    '^@radix-ui/react-separator$': '<rootDir>/src/__mocks__/@radix-ui/react-separator.tsx',
    '^@radix-ui/react-slider$': '<rootDir>/src/__mocks__/@radix-ui/react-slider.tsx',
    '^@radix-ui/react-slot$': '<rootDir>/src/__mocks__/@radix-ui/react-slot.tsx',
    '^@radix-ui/react-switch$': '<rootDir>/src/__mocks__/@radix-ui/react-switch.tsx',
    '^@radix-ui/react-tabs$': '<rootDir>/src/__mocks__/@radix-ui/react-tabs.tsx',
  },

  // Resolve haste map naming collision by ignoring .next build artifacts and worktrees
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/.next/standalone/',
    '<rootDir>/../.worktrees/',
  ],

  // Test configuration
  testTimeout: 15000,
  maxWorkers: 4,
  workerIdleMemoryLimit: '512MB',
  verbose: false,
  bail: false,
  detectOpenHandles: false,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  resetModules: true,

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
    '!src/__mocks__/**',
    '!src/mocks/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test matching
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/../.worktrees/',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform ESM packages - allow these to be transformed by Babel
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@radix-ui)/)',
  ],
}

// Fix: next/jest escapes dots in absolute paths (e.g. `.worktrees` → `\.worktrees`),
// breaking glob testMatch patterns in worktree directories. Override testMatch with
// relative patterns after createJestConfig processes the config.
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)()
  config.testMatch = [
    '**/src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '**/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ]
  return config
}
