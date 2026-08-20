import { test, expect } from '@playwright/test';

test.describe('Mobile Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for testing
    await page.addInitScript(() => {
      // Add mock user session
      window.localStorage.setItem('userToken', 'mock-token');
      window.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'Member'
      }));
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display dashboard navigation on mobile', async ({ page }) => {
    // Check for main dashboard elements
    await expect(page.locator('[data-testid="screen-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-welcome"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-user-name"]')).toBeVisible();
  });

  test('should be swipeable on mobile devices', async ({ page }) => {
    // Test mobile dashboard scroll functionality
    const dashboard = page.locator('[data-testid="screen-dashboard"]');
    await expect(dashboard).toBeVisible();
    
    // Test touch interactions on action cards
    const eventsAction = page.locator('[data-testid="action-events"]');
    await expect(eventsAction).toBeVisible();
    await eventsAction.tap();
  });

  test('should display member information correctly', async ({ page }) => {
    // Check member profile display  
    await expect(page.locator('[data-testid="text-user-name"]')).toContainText('Test User');
    await expect(page.locator('[data-testid="text-club-info"]')).toBeVisible();
  });

  test('should handle logout on mobile', async ({ page }) => {
    // Find and tap logout button
    const logoutButton = page.locator('[data-testid="button-logout"]');
    await logoutButton.tap();
    
    // Should navigate to login screen
    await expect(page.locator('[data-testid="screen-login"]')).toBeVisible();
  });
});