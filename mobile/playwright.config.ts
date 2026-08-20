import { defineConfig, devices } from '@playwright/test';

/**
 * Mobile Web Testing Configuration with Playwright
 * 
 * This configuration enables testing of the mobile web version of the app
 * across different mobile devices and browsers.
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.EXPO_WEB_URL || 'http://localhost:19006',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on retry */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers on mobile viewports */
  projects: [
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Galaxy S5'],
        browserName: 'chromium'
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        browserName: 'webkit'
      },
    },
    {
      name: 'Mobile Firefox',
      use: {
        ...devices['Galaxy S5'],
        browserName: 'firefox'
      },
    },
    {
      name: 'Tablet Chrome',
      use: {
        ...devices['iPad Pro'],
        browserName: 'chromium'
      },
    },
    {
      name: 'Tablet Safari',
      use: {
        ...devices['iPad Pro'],
        browserName: 'webkit'
      },
    },
    /* Desktop browsers for comparison */
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 } // Simulate mobile viewport
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npx expo start --web --port 19006',
    url: 'http://localhost:19006',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  /* Global test timeout */
  timeout: 60000,
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 10000,
  },

  /* Test directory configuration */
  testIgnore: [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
});