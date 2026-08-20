import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const adminAuthFile = path.join(__dirname, '.auth/admin.json');
const memberAuthFile = path.join(__dirname, '.auth/member.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests serially to avoid session conflicts
  forbidOnly: !!process.env.CI,
  retries: 1, // Retry failed tests once
  workers: 1, // Single worker to avoid parallel session issues
  reporter: [['html'], ['list']],
  timeout: 60000, // 60 second test timeout
  expect: {
    timeout: 10000, // 10 second expect timeout
  },
  use: {
    baseURL: 'http://localhost:3050',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15000, // 15 second action timeout
    navigationTimeout: 30000, // 30 second navigation timeout
  },
  projects: [
    // Setup project - authenticates and saves state
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Admin tests - use admin authentication
    {
      name: 'admin-tests',
      testMatch: /e2e\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: adminAuthFile,
      },
      // Only run tests that need admin auth
      grep: /ADMIN-|MEM-|EVT-|COMM-|SET-|BILL-0[12]|SEC-04/,
    },
    // Billing lockout test - mocks session and billing state, no seeded login required
    {
      name: 'billing-lockout',
      testMatch: /e2e\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
      grep: /BILL-03/,
    },
    // Member tests - use member authentication
    {
      name: 'member-tests',
      testMatch: /e2e\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: memberAuthFile,
      },
      // Only run tests that need member auth
      grep: /MP-|SEC-03/,
    },
    // Tests without authentication
    {
      name: 'no-auth-tests',
      testMatch: /e2e\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
      // Run infrastructure, public pages, and unauthenticated security tests
      grep: /INFRA-|PUB-|AUTH-|SEC-01|SEC-02|SEC-05/,
    },
    // CRM feedback widget integration - uses admin auth
    {
      name: 'crm-feedback-tests',
      testMatch: /crm-feedback-widget\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: adminAuthFile,
      },
    },
  ],
  webServer: [
    {
      command: 'powershell -ExecutionPolicy Bypass -File ../scripts/dev/start-backend-e2e.ps1',
      url: 'http://localhost:8050/health',
      reuseExistingServer: true,
      timeout: 180000,
    },
    {
      command: 'npx cross-env E2E_TESTING=true NEXT_PUBLIC_CRM_WIDGET_KEY=wk_E2E_PLACEHOLDER npm run dev',
      cwd: '../client',
      url: 'http://localhost:3050',
      reuseExistingServer: false,
      timeout: 180000,
    },
  ],
});
