/**
 * Mobile Playwright Test Suite for GatherGrove
 * Cross-platform mobile testing using Playwright with device emulation
 */

import { test, expect, devices, Page, BrowserContext } from '@playwright/test';
import { MobileTestingFramework, MobileTestConfig, MobileTestUtils } from './mobile-testing-framework';

// Configure test timeout for mobile testing
test.setTimeout(60000);

// Test data
const TEST_USER = {
  email: 'mobile.test@gathergrove.club',
  password: 'TestPassword123!',
  invalidEmail: 'invalid-email',
  invalidPassword: '123'
};

const TEST_URLS = {
  web: 'http://localhost:3000',
  mobileWeb: 'http://localhost:19006', // Expo web
  login: '/login',
  dashboard: '/app/dashboard',
  profile: '/app/profile'
};

// Device configurations for testing
const mobileDevices = MobileTestingFramework.getMobileDevices();

// Run tests on multiple devices
mobileDevices.forEach(device => {
  test.describe(`Mobile Tests - ${device.deviceName}`, () => {
    let context: BrowserContext;
    let page: Page;

    test.beforeEach(async ({ browser }) => {
      context = await browser.newContext({
        ...devices[device.deviceName] || {
          viewport: device.viewport,
          userAgent: device.userAgent,
          isMobile: device.isMobile,
          hasTouch: device.hasTouch,
        }
      });
      
      page = await context.newPage();
      
      // Configure mobile-specific settings
      await MobileTestingFramework.configureMobileContext(context, device);
    });

    test.afterEach(async () => {
      await context.close();
    });

    test.describe('Authentication Flow', () => {
      test('should display mobile-optimized login form', async () => {
        await page.goto(`${TEST_URLS.web}${TEST_URLS.login}`);
        
        // Wait for page to load
        await page.waitForLoadState('domcontentloaded');
        
        // Check if login form is displayed
        const loginForm = page.locator('[data-testid="login-form"]');
        await expect(loginForm).toBeVisible();
        
        // Verify mobile-optimized elements
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        const submitButton = page.locator('button[type="submit"]');
        
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(submitButton).toBeVisible();
        
        // Check input field sizes (should be touch-friendly)
        const emailBox = await emailInput.boundingBox();
        const passwordBox = await passwordInput.boundingBox();
        const submitBox = await submitButton.boundingBox();
        
        expect(emailBox?.height).toBeGreaterThanOrEqual(44); // iOS minimum
        expect(passwordBox?.height).toBeGreaterThanOrEqual(44);
        expect(submitBox?.height).toBeGreaterThanOrEqual(44);
      });

      test('should validate form fields with mobile-friendly errors', async () => {
        await page.goto(`${TEST_URLS.web}${TEST_URLS.login}`);
        
        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.tap();
        
        // Check for validation errors
        const emailError = page.locator('[data-testid="error-email"]');
        const passwordError = page.locator('[data-testid="error-password"]');
        
        await expect(emailError).toBeVisible();
        await expect(passwordError).toBeVisible();
        
        // Test invalid email
        const emailInput = page.locator('input[type="email"]');
        await emailInput.fill(TEST_USER.invalidEmail);
        await submitButton.tap();
        
        const emailValidationError = page.locator(':text("Invalid email format")');
        await expect(emailValidationError).toBeVisible();
      });

      test('should handle keyboard overlay correctly', async () => {
        await page.goto(`${TEST_URLS.web}${TEST_URLS.login}`);
        
        const emailInput = page.locator('input[type="email"]');
        const submitButton = page.locator('button[type="submit"]');
        
        // Get initial positions
        const initialSubmitPosition = await submitButton.boundingBox();
        
        // Focus on input (should trigger virtual keyboard)
        await emailInput.focus();
        
        // On mobile web, check if submit button is still accessible
        const finalSubmitPosition = await submitButton.boundingBox();
        expect(finalSubmitPosition).toBeTruthy();
        
        // Verify input is still visible and functional
        await emailInput.fill(TEST_USER.email);
        const inputValue = await emailInput.inputValue();
        expect(inputValue).toBe(TEST_USER.email);
      });

      test('should support touch interactions', async () => {
        await page.goto(`${TEST_URLS.web}${TEST_URLS.login}`);
        
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        
        // Test tap interactions
        await emailInput.tap();
        await expect(emailInput).toBeFocused();
        
        await passwordInput.tap();
        await expect(passwordInput).toBeFocused();
        
        // Test form submission with valid data
        await emailInput.fill(TEST_USER.email);
        await passwordInput.fill(TEST_USER.password);
        
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.tap();
        
        // Should attempt login (might redirect or show error for test user)
        await page.waitForTimeout(2000);
      });
    });

    test.describe('Navigation and Layout', () => {
      test('should display responsive navigation', async () => {
        await page.goto(TEST_URLS.web);
        
        // Check for mobile navigation elements
        const mobileMenu = page.locator('[data-testid="mobile-menu"], [aria-label="Menu"], .hamburger-menu, [data-testid="nav-toggle"]');
        
        // On mobile, should have hamburger menu or mobile-specific navigation
        if (device.viewport.width < 768) {
          await expect(mobileMenu).toBeVisible();
        }
        
        // Check header is properly sized
        const header = page.locator('header, [data-testid="header"], nav[role="banner"]');
        const headerBox = await header.boundingBox();
        
        if (headerBox) {
          expect(headerBox.width).toBeLessThanOrEqual(device.viewport.width);
        }
      });

      test('should handle swipe gestures for navigation', async () => {
        await page.goto(TEST_URLS.web);
        
        // Test horizontal swipe (if applicable)
        const mainContent = page.locator('main, [data-testid="main-content"]');
        
        if (await mainContent.count() > 0) {
          const contentBox = await mainContent.boundingBox();
          
          if (contentBox) {
            // Simulate swipe gesture
            await page.mouse.move(contentBox.x + 50, contentBox.y + 50);
            await page.mouse.down();
            await page.mouse.move(contentBox.x + contentBox.width - 50, contentBox.y + 50);
            await page.mouse.up();
          }
        }
      });

      test('should maintain proper viewport scaling', async () => {
        await page.goto(TEST_URLS.web);
        
        // Check viewport meta tag
        const viewportMeta = page.locator('meta[name="viewport"]');
        const viewportContent = await viewportMeta.getAttribute('content');
        
        expect(viewportContent).toContain('width=device-width');
        expect(viewportContent).toContain('initial-scale=1');
        
        // Verify no horizontal scrolling
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // Allow small margin
      });
    });

    test.describe('Performance and Loading', () => {
      test('should load within acceptable time limits', async () => {
        const startTime = Date.now();
        await page.goto(TEST_URLS.web);
        await page.waitForLoadState('domcontentloaded');
        const loadTime = Date.now() - startTime;
        
        // Mobile pages should load within 3 seconds on good connection
        expect(loadTime).toBeLessThan(5000);
        
        // Measure additional performance metrics
        const metrics = await MobileTestUtils.measureLoadPerformance(page);
        expect(metrics.loadTime).toBeLessThan(5000);
      });

      test('should handle slow network conditions', async () => {
        // Simulate slow 3G connection
        await MobileTestUtils.simulateSlowNetwork(context);
        
        await page.goto(TEST_URLS.web);
        
        // Should show loading indicators
        const loadingIndicators = page.locator('[data-testid="loading"], .loading, .spinner');
        
        // Check if content eventually loads
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        const mainContent = page.locator('main, [data-testid="main-content"]');
        await expect(mainContent).toBeVisible();
      });
    });

    test.describe('Accessibility', () => {
      test('should support keyboard navigation', async () => {
        await page.goto(`${TEST_URLS.web}${TEST_URLS.login}`);
        
        const keyboardNavWorking = await MobileTestUtils.testKeyboardNavigation(page);
        expect(keyboardNavWorking).toBe(true);
      });

      test('should have proper ARIA labels and roles', async () => {
        await page.goto(TEST_URLS.web);
        
        // Check for main navigation
        const nav = page.locator('nav[role="navigation"], [aria-label*="navigation"]');
        await expect(nav).toBeVisible();
        
        // Check for main content
        const main = page.locator('main, [role="main"]');
        await expect(main).toBeVisible();
        
        // Check for form labels
        const formInputs = page.locator('input[type="email"], input[type="password"]');
        const inputCount = await formInputs.count();
        
        for (let i = 0; i < inputCount; i++) {
          const input = formInputs.nth(i);
          const hasLabel = await input.evaluate(el => {
            const id = el.id;
            const ariaLabel = el.getAttribute('aria-label');
            const placeholder = el.getAttribute('placeholder');
            const associatedLabel = document.querySelector(`label[for="${id}"]`);
            
            return !!(ariaLabel || placeholder || associatedLabel);
          });
          
          expect(hasLabel).toBe(true);
        }
      });

      test('should meet color contrast requirements', async () => {
        await page.goto(TEST_URLS.web);
        
        // This would integrate with axe-core for real testing
        const accessibilityResults = await MobileTestUtils.checkAccessibility(page);
        
        // Check for major accessibility violations
        const contrastViolations = accessibilityResults.violations.filter(
          v => v.id.includes('color-contrast')
        );
        
        expect(contrastViolations.length).toBe(0);
      });
    });

    test.describe('Device-Specific Features', () => {
      test('should handle orientation changes', async () => {
        await page.goto(TEST_URLS.web);
        
        // Test portrait mode (default)
        let viewport = page.viewportSize();
        expect(viewport?.height).toBeGreaterThan(viewport?.width || 0);
        
        // Switch to landscape
        await page.setViewportSize({
          width: device.viewport.height,
          height: device.viewport.width
        });
        
        // Verify layout adapts
        await page.waitForTimeout(500); // Allow for reflow
        
        const content = page.locator('main, [data-testid="main-content"]');
        await expect(content).toBeVisible();
        
        // Switch back to portrait
        await page.setViewportSize(device.viewport);
      });

      test('should support touch gestures', async () => {
        await page.goto(TEST_URLS.web);
        
        // Test tap gesture
        const buttons = page.locator('button, [role="button"]');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          const firstButton = buttons.first();
          const touchSuccess = await MobileTestUtils.testTouchInteraction(page, 'button');
          expect(touchSuccess).toBe(true);
        }
      });
    });

    test.describe('Cross-Platform Consistency', () => {
      test('should maintain consistent styling across mobile web and app', async () => {
        await page.goto(TEST_URLS.web);
        
        // Check for consistent branding elements
        const logo = page.locator('[data-testid="logo"], .logo, [alt*="logo" i]');
        
        if (await logo.count() > 0) {
          await expect(logo).toBeVisible();
          
          // Verify logo is properly sized for mobile
          const logoBox = await logo.boundingBox();
          if (logoBox) {
            expect(logoBox.height).toBeGreaterThan(20);
            expect(logoBox.height).toBeLessThan(80);
          }
        }
        
        // Check for consistent color scheme
        const primaryButtons = page.locator('button[type="submit"], .btn-primary, [data-testid*="primary"]');
        
        if (await primaryButtons.count() > 0) {
          const buttonStyles = await primaryButtons.first().evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              backgroundColor: styles.backgroundColor,
              color: styles.color,
              borderRadius: styles.borderRadius
            };
          });
          
          // Verify consistent styling (would compare against design tokens)
          expect(buttonStyles.backgroundColor).toBeTruthy();
          expect(buttonStyles.color).toBeTruthy();
        }
      });
    });
  });
});

// Utility function to run specific test scenarios
export async function runMobileTestScenarios() {
  const criticalScenarios = MobileTestingFramework.getTestScenarios({ priority: 'critical' });
  
  console.log(`Running ${criticalScenarios.length} critical mobile test scenarios:`);
  criticalScenarios.forEach(scenario => {
    console.log(`- ${scenario.name}: ${scenario.description}`);
  });
  
  // This would execute the actual test scenarios
  // Implementation would depend on test runner integration
}

// Export test configuration for other test files
export { mobileDevices, TEST_USER, TEST_URLS };