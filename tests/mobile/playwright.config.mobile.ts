/**
 * Playwright Configuration for Mobile Testing
 * Specialized configuration for comprehensive mobile testing across devices
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/mobile',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'mobile-test-results' }],
    ['json', { outputFile: 'mobile-test-results.json' }],
    ['junit', { outputFile: 'mobile-junit-results.xml' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  projects: [
    // Mobile Web Testing Projects
    {
      name: 'iPhone 12 Safari',
      use: {
        ...devices['iPhone 12'],
        channel: 'webkit',
      },
    },
    {
      name: 'iPhone 12 Chrome',
      use: {
        ...devices['iPhone 12'],
        channel: 'chromium',
      },
    },
    {
      name: 'iPhone SE Safari',
      use: {
        ...devices['iPhone SE'],
        channel: 'webkit',
      },
    },
    {
      name: 'Samsung Galaxy S21',
      use: {
        ...devices['Galaxy S8'],
        viewport: { width: 360, height: 800 },
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      },
    },
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro'],
        channel: 'webkit',
      },
    },
    {
      name: 'iPad Landscape',
      use: {
        ...devices['iPad Pro landscape'],
        channel: 'webkit',
      },
    },

    // Custom Mobile Device Configurations
    {
      name: 'Small Mobile (320px)',
      use: {
        viewport: { width: 320, height: 568 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15',
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'Large Mobile (414px)',
      use: {
        viewport: { width: 414, height: 896 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },

    // Network Condition Testing
    {
      name: 'Mobile Slow 3G',
      use: {
        ...devices['iPhone 12'],
        launchOptions: {
          args: [
            '--simulate-slow-connection',
            '--force-device-scale-factor=2'
          ]
        },
        contextOptions: {
          offline: false,
          // Simulate slow 3G: 1.5 Mbps down, 750 Kbps up, 40ms RTT
          connectionType: 'cellular3g'
        }
      }
    },

    // Accessibility Testing Project
    {
      name: 'Mobile Accessibility',
      use: {
        ...devices['iPhone 12'],
        // Enable accessibility testing
        contextOptions: {
          colorScheme: 'dark',
          reducedMotion: 'reduce',
          forcedColors: 'active'
        }
      }
    },

    // Cross-platform Consistency Testing
    {
      name: 'iOS Safari Consistency',
      use: {
        ...devices['iPhone 12'],
        channel: 'webkit',
      },
    },
    {
      name: 'Android Chrome Consistency',
      use: {
        ...devices['Galaxy S8'],
        channel: 'chromium',
      },
    }
  ],

  // Global test setup and teardown
  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),

  // Test timeout configuration
  timeout: 60000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      mode: 'css',
      animations: 'disabled',
    },
  },

  // Web server for testing
  webServer: [
    {
      command: 'npm start',
      cwd: '../client',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'npm run web',
      cwd: '../mobile',
      port: 19006,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    }
  ],

  // Output directory for test results
  outputDir: 'mobile-test-results/',
  
  // Test matching patterns
  testMatch: [
    '**/mobile-playwright-tests.ts',
    '**/mobile-consistency-tests.ts',
    '**/automated-mobile-testing.ts'
  ],

  // Test ignore patterns
  testIgnore: [
    '**/node_modules/**',
    '**/coverage/**',
    '**/build/**'
  ],

  // Mobile-specific metadata
  metadata: {
    testType: 'mobile',
    platforms: ['iOS', 'Android', 'Web'],
    coverage: ['authentication', 'navigation', 'performance', 'accessibility', 'consistency'],
    devices: ['iPhone 12', 'iPhone SE', 'Galaxy S21', 'iPad'],
    browsers: ['Safari', 'Chrome', 'WebKit']
  }
});