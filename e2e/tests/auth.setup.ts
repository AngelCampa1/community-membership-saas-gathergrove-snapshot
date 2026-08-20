import { test as setup, expect } from '@playwright/test';
import path from 'path';

const ADMIN_EMAIL = 'admin@test.com';
const MEMBER_EMAIL = 'member@test.com';
const PASSWORD = 'password123';

const adminAuthFile = path.join(__dirname, '../.auth/admin.json');
const memberAuthFile = path.join(__dirname, '../.auth/member.json');

setup('authenticate as admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill in login form
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);

  // Submit and wait for redirect
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 30000 });

  // Wait for page to fully load
  await page.waitForLoadState('networkidle');

  // Save authentication state
  await page.context().storageState({ path: adminAuthFile });
});

setup('authenticate as member', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill in login form
  await page.locator('input[type="email"]').fill(MEMBER_EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);

  // Submit and wait for redirect
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 30000 });

  // Wait for page to fully load
  await page.waitForLoadState('networkidle');

  // Save authentication state
  await page.context().storageState({ path: memberAuthFile });
});
