/**
 * Visual Regression Tests
 * Validates UI components maintain consistent appearance
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  // Configure test settings
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport and disable animations for stable screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  describe('Landing Page Components', () => {
    test('hero section visual consistency', async ({ page }) => {
      await page.goto('/');
      
      // Wait for hero section to load
      await page.waitForSelector('[data-testid="hero-section"]');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of hero section
      const heroSection = page.locator('[data-testid="hero-section"]');
      await expect(heroSection).toHaveScreenshot('hero-section.png');
    });

    test('features section layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="features-section"]');
      
      const featuresSection = page.locator('[data-testid="features-section"]');
      await expect(featuresSection).toHaveScreenshot('features-section.png');
    });

    test('pricing section consistency', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="pricing-section"]');
      
      const pricingSection = page.locator('[data-testid="pricing-section"]');
      await expect(pricingSection).toHaveScreenshot('pricing-section.png');
    });

    test('footer appearance', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('footer');
      
      const footer = page.locator('footer');
      await expect(footer).toHaveScreenshot('footer.png');
    });
  });

  describe('Authentication Forms', () => {
    test('login form visual consistency', async ({ page }) => {
      await page.goto('/login');
      await page.waitForSelector('[data-testid="login-form"]');
      
      const loginForm = page.locator('[data-testid="login-form"]');
      await expect(loginForm).toHaveScreenshot('login-form.png');
    });

    test('login form error state', async ({ page }) => {
      await page.goto('/login');
      await page.waitForSelector('[data-testid="login-form"]');
      
      // Trigger validation errors
      await page.fill('[name="email"]', 'invalid-email');
      await page.fill('[name="password"]', '123');
      await page.click('button[type="submit"]');
      
      // Wait for error messages
      await page.waitForSelector('[data-testid="form-errors"]');
      
      const loginForm = page.locator('[data-testid="login-form"]');
      await expect(loginForm).toHaveScreenshot('login-form-errors.png');
    });

    test('registration form layout', async ({ page }) => {
      await page.goto('/register');
      await page.waitForSelector('[data-testid="registration-form"]');
      
      const registrationForm = page.locator('[data-testid="registration-form"]');
      await expect(registrationForm).toHaveScreenshot('registration-form.png');
    });

    test('forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForSelector('[data-testid="forgot-password-form"]');
      
      const forgotPasswordForm = page.locator('[data-testid="forgot-password-form"]');
      await expect(forgotPasswordForm).toHaveScreenshot('forgot-password-form.png');
    });
  });

  describe('Admin Dashboard Components', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication
      await page.goto('/admin/dashboard');
      // Assume we're logged in as admin for visual tests
    });

    test('dashboard overview layout', async ({ page }) => {
      await page.waitForSelector('[data-testid="dashboard-overview"]');
      
      const dashboard = page.locator('[data-testid="dashboard-overview"]');
      await expect(dashboard).toHaveScreenshot('admin-dashboard.png');
    });

    test('navigation sidebar appearance', async ({ page }) => {
      await page.waitForSelector('[data-testid="admin-sidebar"]');
      
      const sidebar = page.locator('[data-testid="admin-sidebar"]');
      await expect(sidebar).toHaveScreenshot('admin-sidebar.png');
    });

    test('member management table', async ({ page }) => {
      await page.goto('/admin/members');
      await page.waitForSelector('[data-testid="members-table"]');
      
      const membersTable = page.locator('[data-testid="members-table"]');
      await expect(membersTable).toHaveScreenshot('members-table.png');
    });

    test('add member modal', async ({ page }) => {
      await page.goto('/admin/members');
      await page.click('button:has-text("Add Member")');
      await page.waitForSelector('[data-testid="add-member-modal"]');
      
      const modal = page.locator('[data-testid="add-member-modal"]');
      await expect(modal).toHaveScreenshot('add-member-modal.png');
    });

    test('events management page', async ({ page }) => {
      await page.goto('/admin/events');
      await page.waitForSelector('[data-testid="events-management"]');
      
      const eventsPage = page.locator('[data-testid="events-management"]');
      await expect(eventsPage).toHaveScreenshot('events-management.png');
    });

    test('billing page layout', async ({ page }) => {
      await page.goto('/admin/billing');
      await page.waitForSelector('[data-testid="billing-content"]');
      
      const billingPage = page.locator('[data-testid="billing-content"]');
      await expect(billingPage).toHaveScreenshot('billing-page.png');
    });
  });

  describe('Member Dashboard Components', () => {
    test.beforeEach(async ({ page }) => {
      // Mock member authentication
      await page.goto('/app/dashboard');
      // Assume we're logged in as a member
    });

    test('member dashboard overview', async ({ page }) => {
      await page.waitForSelector('[data-testid="member-dashboard"]');
      
      const memberDashboard = page.locator('[data-testid="member-dashboard"]');
      await expect(memberDashboard).toHaveScreenshot('member-dashboard.png');
    });

    test('member profile page', async ({ page }) => {
      await page.goto('/app/profile');
      await page.waitForSelector('[data-testid="member-profile"]');
      
      const profilePage = page.locator('[data-testid="member-profile"]');
      await expect(profilePage).toHaveScreenshot('member-profile.png');
    });

    test('membership status card', async ({ page }) => {
      await page.goto('/app/membership');
      await page.waitForSelector('[data-testid="membership-status"]');
      
      const membershipCard = page.locator('[data-testid="membership-status"]');
      await expect(membershipCard).toHaveScreenshot('membership-status.png');
    });

    test('events list view', async ({ page }) => {
      await page.goto('/app/events');
      await page.waitForSelector('[data-testid="events-list"]');
      
      const eventsList = page.locator('[data-testid="events-list"]');
      await expect(eventsList).toHaveScreenshot('member-events-list.png');
    });

    test('member directory view', async ({ page }) => {
      await page.goto('/app/directory');
      await page.waitForSelector('[data-testid="member-directory"]');
      
      const directory = page.locator('[data-testid="member-directory"]');
      await expect(directory).toHaveScreenshot('member-directory.png');
    });
  });

  describe('Form Components', () => {
    test('input field variations', async ({ page }) => {
      await page.goto('/admin/members');
      await page.click('button:has-text("Add Member")');
      await page.waitForSelector('[data-testid="add-member-modal"]');
      
      // Test different input states
      const modal = page.locator('[data-testid="add-member-modal"]');
      
      // Empty state
      await expect(modal).toHaveScreenshot('form-inputs-empty.png');
      
      // Filled state
      await page.fill('[name="fullName"]', 'John Doe');
      await page.fill('[name="email"]', 'john@example.com');
      await page.fill('[name="phoneNumber"]', '+1-555-123-4567');
      await expect(modal).toHaveScreenshot('form-inputs-filled.png');
      
      // Error state
      await page.fill('[name="email"]', 'invalid-email');
      await page.focus('body'); // Blur by focusing elsewhere
      await page.waitForTimeout(100); // Wait for validation
      await expect(modal).toHaveScreenshot('form-inputs-error.png');
    });

    test('button variations', async ({ page }) => {
      await page.goto('/admin/dashboard');
      
      // Create a test page with different button states
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.setAttribute('data-testid', 'button-variations');
        container.style.padding = '20px';
        container.style.backgroundColor = 'white';
        
        container.innerHTML = `
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn-primary">Primary Button</button>
            <button class="btn-secondary">Secondary Button</button>
            <button class="btn-danger">Delete Button</button>
            <button class="btn-primary" disabled>Disabled Button</button>
            <button class="btn-loading">Loading Button</button>
            <button class="btn-outline">Outline Button</button>
          </div>
        `;
        
        document.body.appendChild(container);
      });
      
      const buttonContainer = page.locator('[data-testid="button-variations"]');
      await expect(buttonContainer).toHaveScreenshot('button-variations.png');
    });

    test('select dropdown appearance', async ({ page }) => {
      await page.goto('/admin/members');
      await page.click('button:has-text("Add Member")');
      await page.waitForSelector('[data-testid="add-member-modal"]');
      
      // Open membership type dropdown
      await page.click('[name="membershipTypeId"]');
      await page.waitForTimeout(100); // Wait for dropdown animation
      
      const modal = page.locator('[data-testid="add-member-modal"]');
      await expect(modal).toHaveScreenshot('select-dropdown-open.png');
    });
  });

  describe('Toast Notifications', () => {
    test('success toast appearance', async ({ page }) => {
      await page.goto('/admin/dashboard');
      
      // Trigger success toast
      await page.evaluate(() => {
        // Mock toast notification
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.setAttribute('data-testid', 'success-toast');
        toast.textContent = 'Operation completed successfully!';
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        document.body.appendChild(toast);
      });
      
      const toast = page.locator('[data-testid="success-toast"]');
      await expect(toast).toHaveScreenshot('success-toast.png');
    });

    test('error toast appearance', async ({ page }) => {
      await page.goto('/admin/dashboard');
      
      await page.evaluate(() => {
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.setAttribute('data-testid', 'error-toast');
        toast.textContent = 'An error occurred. Please try again.';
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        document.body.appendChild(toast);
      });
      
      const toast = page.locator('[data-testid="error-toast"]');
      await expect(toast).toHaveScreenshot('error-toast.png');
    });
  });

  describe('Mobile Responsive Views', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('mobile landing page hero', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="hero-section"]');
      
      const heroSection = page.locator('[data-testid="hero-section"]');
      await expect(heroSection).toHaveScreenshot('mobile-hero-section.png');
    });

    test('mobile navigation menu', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.click('[data-testid="mobile-menu-toggle"]');
      await page.waitForSelector('[data-testid="mobile-menu"]');
      
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toHaveScreenshot('mobile-navigation.png');
    });

    test('mobile member table', async ({ page }) => {
      await page.goto('/admin/members');
      await page.waitForSelector('[data-testid="members-table"]');
      
      const membersTable = page.locator('[data-testid="members-table"]');
      await expect(membersTable).toHaveScreenshot('mobile-members-table.png');
    });

    test('mobile add member form', async ({ page }) => {
      await page.goto('/admin/members');
      await page.click('button:has-text("Add Member")');
      await page.waitForSelector('[data-testid="add-member-modal"]');
      
      const modal = page.locator('[data-testid="add-member-modal"]');
      await expect(modal).toHaveScreenshot('mobile-add-member-form.png');
    });
  });

  describe('Light-Only Mode Variations', () => {
    test.beforeEach(async ({ page }) => {
      // Enable Light-Only Mode
      await page.emulateMedia({ colorScheme: 'dark' });
    });

    test('Light-Only Mode dashboard', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForSelector('[data-testid="dashboard-overview"]');
      
      const dashboard = page.locator('[data-testid="dashboard-overview"]');
      await expect(dashboard).toHaveScreenshot('light-only-dashboard.png');
    });

    test('Light-Only Mode login form', async ({ page }) => {
      await page.goto('/login');
      await page.waitForSelector('[data-testid="login-form"]');
      
      const loginForm = page.locator('[data-testid="login-form"]');
      await expect(loginForm).toHaveScreenshot('light-only-login.png');
    });

    test('Light-Only Mode member table', async ({ page }) => {
      await page.goto('/admin/members');
      await page.waitForSelector('[data-testid="members-table"]');
      
      const membersTable = page.locator('[data-testid="members-table"]');
      await expect(membersTable).toHaveScreenshot('light-only-members-table.png');
    });
  });

  describe('Loading States', () => {
    test('loading skeleton components', async ({ page }) => {
      await page.goto('/admin/dashboard');
      
      // Inject loading skeletons
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.setAttribute('data-testid', 'loading-skeletons');
        container.style.padding = '20px';
        
        container.innerHTML = `
          <div class="skeleton-card">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
          <div class="skeleton-table">
            <div class="skeleton-row">
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
            </div>
          </div>
        `;
        
        document.body.appendChild(container);
      });
      
      const skeletons = page.locator('[data-testid="loading-skeletons"]');
      await expect(skeletons).toHaveScreenshot('loading-skeletons.png');
    });

    test('button loading states', async ({ page }) => {
      await page.goto('/admin/members');
      await page.click('button:has-text("Add Member")');
      await page.waitForSelector('[data-testid="add-member-modal"]');
      
      // Simulate form submission loading state
      await page.fill('[name="fullName"]', 'John Doe');
      await page.fill('[name="email"]', 'john@example.com');
      
      // Add loading state to button
      await page.evaluate(() => {
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
          (submitButton as HTMLButtonElement).disabled = true;
          submitButton.innerHTML = '<span class="spinner"></span> Saving...';
          submitButton.classList.add('loading');
        }
      });
      
      const modal = page.locator('[data-testid="add-member-modal"]');
      await expect(modal).toHaveScreenshot('button-loading-state.png');
    });
  });

  describe('Error States', () => {
    test('404 error page', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForSelector('[data-testid="error-404"]', { timeout: 5000 });
      
      const errorPage = page.locator('[data-testid="error-404"]');
      await expect(errorPage).toHaveScreenshot('404-error-page.png');
    });

    test('network error state', async ({ page }) => {
      await page.goto('/admin/dashboard');
      
      // Mock network error state
      await page.evaluate(() => {
        const errorContainer = document.createElement('div');
        errorContainer.setAttribute('data-testid', 'network-error');
        errorContainer.className = 'error-state';
        errorContainer.innerHTML = `
          <div class="error-icon">⚠️</div>
          <h3>Connection Error</h3>
          <p>Unable to connect to the server. Please check your internet connection.</p>
          <button class="retry-button">Retry</button>
        `;
        
        document.body.appendChild(errorContainer);
      });
      
      const errorState = page.locator('[data-testid="network-error"]');
      await expect(errorState).toHaveScreenshot('network-error-state.png');
    });
  });
});