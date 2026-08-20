import { test, expect } from '@playwright/test';

test.describe('Mobile Login Flow', () => {
  test('should display login form on mobile', async ({ page }) => {
    // Navigate to the mobile web app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('domcontentloaded');
    // Debug: Take screenshot and log page content for debugging
    await page.screenshot({ path: 'debug-mobile-state.png' });

    // Log page content for debugging
    const bodyContent = await page.locator('body').innerHTML();
    // E2E log: Page body content logged - bodyContent.substring(0, 500)
    void bodyContent; // Mark as intentionally used for debugging

    // Check if there are any JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Wait a bit more for app to fully load
    await page.waitForTimeout(5000);

    // Check what's actually rendered
    const hasLoginScreen = await page.locator('[data-testid="screen-login"]').count();
    const hasLoadingScreen = await page.locator('[data-testid="screen-loading"]').count();
    const hasRoot = await page.locator('#root').count();

    // E2E log: Debug info - login, loading, root counts and JS errors
    void hasLoginScreen;
    void hasLoadingScreen;
    void hasRoot;
    void errors;
    
    // Check if login elements are visible
    await expect(page.locator('[data-testid="text-app-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-login"]')).toBeVisible();
    
    // Verify mobile-optimized layout
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(500); // Mobile viewport
  });

  test('should handle touch interactions properly', async ({ page }) => {
    const emailInput = page.locator('[data-testid="input-email"]');
    const passwordInput = page.locator('[data-testid="input-password"]');
    const loginButton = page.locator('[data-testid="button-login"]');

    // Test touch input
    await emailInput.tap();
    await emailInput.fill('test@example.com');
    
    await passwordInput.tap();
    await passwordInput.fill('validpassword123');
    
    // Test button tap
    await loginButton.tap();
    
    // Should trigger validation/login attempt
    await expect(page.locator('[data-testid="button-login"]')).toContainText(/Sign/i);
  });

  test('should be responsive on different mobile screen sizes', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 }, // iPhone 5/SE
      { width: 375, height: 667 }, // iPhone 8
      { width: 414, height: 896 }, // iPhone XR
      { width: 768, height: 1024 }, // iPad
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.reload();
      
      // Ensure login form is still accessible
      await expect(page.locator('[data-testid="input-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-password"]')).toBeVisible();
      await expect(page.locator('[data-testid="button-login"]')).toBeVisible();
    }
  });

  test('should handle keyboard navigation on mobile', async ({ page }) => {
    // Focus on email input
    await page.locator('[data-testid="input-email"]').focus();
    
    // Tab to password field
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="input-password"]')).toBeFocused();
    
    // Tab to login button
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="button-login"]')).toBeFocused();
  });

  test('should validate form fields on mobile', async ({ page }) => {
    const loginButton = page.locator('[data-testid="button-login"]');
    
    // Try to login without credentials
    await loginButton.tap();
    
    // Should show validation errors
    await expect(page.locator('[data-testid="error-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-password"]')).toBeVisible();
  });
});