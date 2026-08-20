/**
 * End-to-End Tests for Critical User Journeys
 * Tests complete user workflows across the application
 */

import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  test.describe('Club Administrator Journey', () => {
    test('complete club setup and member management flow', async ({ page }) => {
      // 1. Registration and Login
      await page.goto('/register');
      await page.fill('[name="fullName"]', 'Admin User');
      await page.fill('[name="email"]', 'admin@testclub.com');
      await page.fill('[name="password"]', 'SecureP@ssw0rd123!');
      await page.fill('[name="clubName"]', 'Test Club');
      await page.click('button[type="submit"]');

      // Wait for setup wizard
      await expect(page).toHaveURL(/.*onboarding/);
      
      // 2. Complete Setup Wizard
      // Welcome step
      await expect(page.locator('h1')).toContainText('Welcome');
      await page.click('button:has-text("Get Started")');

      // Membership types step
      await page.fill('[name="membershipTypeName"]', 'Regular Member');
      await page.fill('[name="duesAmount"]', '50');
      await page.selectOption('[name="duesFrequency"]', 'monthly');
      await page.click('button:has-text("Continue")');

      // Add first member step
      await page.fill('[name="fullName"]', 'John Doe');
      await page.fill('[name="email"]', 'john@example.com');
      await page.fill('[name="phone"]', '+1-555-123-4567');
      await page.check('[name="hasSmsConsent"]');
      await page.click('button:has-text("Add Member")');

      // Complete setup
      await page.click('button:has-text("Finish Setup")');

      // 3. Verify Dashboard Access
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('[data-testid="club-name"]')).toContainText('Test Club');
      await expect(page.locator('[data-testid="member-count"]')).toContainText('1');
    });

    test('member invitation and payment flow', async ({ page }) => {
      // Assume admin is logged in
      await page.goto('/admin/dashboard');
      
      // 1. Navigate to Members Page
      await page.click('[data-testid="nav-members"]');
      await expect(page).toHaveURL(/.*members/);

      // 2. Add New Member
      await page.click('button:has-text("Add Member")');
      await page.fill('[name="fullName"]', 'Jane Smith');
      await page.fill('[name="email"]', 'jane@example.com');
      await page.fill('[name="phoneNumber"]', '+1-555-987-6543');
      await page.selectOption('[name="membershipTypeId"]', '1');
      await page.click('button:has-text("Save Member")');

      // Wait for success notification
      await expect(page.locator('.toast')).toContainText('Member added successfully');

      // 3. Record Payment
      await page.click('[data-testid="member-actions-jane@example.com"] button');
      await page.click('text="Record Payment"');
      await page.fill('[name="amount"]', '50');
      await page.selectOption('[name="paymentMethod"]', 'cash');
      await page.fill('[name="notes"]', 'Monthly dues payment');
      await page.click('button:has-text("Record Payment")');

      // Verify payment recorded
      await expect(page.locator('.toast')).toContainText('Payment recorded');
      await expect(page.locator('[data-testid="member-status-jane@example.com"]'))
        .toContainText('Paid');
    });

    test('event creation and RSVP management', async ({ page }) => {
      await page.goto('/admin/events');

      // 1. Create Event
      await page.click('button:has-text("Create Event")');
      await page.fill('[name="title"]', 'Monthly Club Meeting');
      await page.fill('[name="description"]', 'Regular monthly meeting for all members');
      await page.fill('[name="dateTime"]', '2024-02-15T19:00');
      await page.fill('[name="location"]', 'Community Center');
      await page.fill('[name="maxAttendees"]', '50');
      await page.click('button:has-text("Create Event")');

      // Verify event created
      await expect(page.locator('.toast')).toContainText('Event created');
      await expect(page.locator('[data-testid="event-title"]'))
        .toContainText('Monthly Club Meeting');

      // 2. Send Invitations
      await page.click('[data-testid="event-actions"] button');
      await page.click('text="Send Invitations"');
      await page.check('[name="selectAll"]'); // Select all members
      await page.click('button:has-text("Send Invitations")');

      // Verify invitations sent
      await expect(page.locator('.toast')).toContainText('Invitations sent');

      // 3. View RSVP Responses
      await page.click('[data-testid="event-rsvps"]');
      await expect(page.locator('[data-testid="rsvp-list"]')).toBeVisible();
    });
  });

  test.describe('Member Journey', () => {
    test('member account activation and profile management', async ({ page, context }) => {
      // 1. Member receives activation email and clicks link
      await page.goto('/activate?token=mock-activation-token');

      // Complete activation
      await page.fill('[name="password"]', 'Member123!');
      await page.fill('[name="confirmPassword"]', 'Member123!');
      await page.click('button:has-text("Activate Account")');

      // 2. Login with new credentials
      await expect(page).toHaveURL(/.*login/);
      await page.fill('[name="email"]', 'member@testclub.com');
      await page.fill('[name="password"]', 'Member123!');
      await page.click('button[type="submit"]');

      // 3. Access Member Dashboard
      await expect(page).toHaveURL(/.*app\/dashboard/);
      await expect(page.locator('h1')).toContainText('Welcome');

      // 4. Update Profile
      await page.click('[data-testid="nav-profile"]');
      await page.fill('[name="phoneNumber"]', '+1-555-999-8888');
      await page.fill('[name="address"]', '123 Main St, City, State 12345');
      await page.click('button:has-text("Save Changes")');

      // Verify profile updated
      await expect(page.locator('.toast')).toContainText('Profile updated');
    });

    test('dues payment flow', async ({ page }) => {
      // Assume member is logged in
      await page.goto('/app/membership');

      // 1. View Membership Status
      await expect(page.locator('[data-testid="membership-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="dues-amount"]')).toContainText('$50');

      // 2. Pay Dues Online
      if (await page.locator('button:has-text("Pay Dues")').isVisible()) {
        await page.click('button:has-text("Pay Dues")');
        
        // Stripe payment form (mocked in test)
        await page.fill('[name="cardNumber"]', '4242424242424242');
        await page.fill('[name="expiry"]', '12/25');
        await page.fill('[name="cvc"]', '123');
        await page.click('button:has-text("Pay Now")');

        // Wait for payment processing
        await page.waitForURL(/.*payment\/success/);
        await expect(page.locator('h1')).toContainText('Payment Successful');
      }

      // 3. View Payment History
      await page.goto('/app/membership');
      await page.click('[data-testid="payment-history"]');
      await expect(page.locator('[data-testid="payment-list"]')).toBeVisible();
    });

    test('event RSVP and attendance', async ({ page }) => {
      await page.goto('/app/events');

      // 1. View Upcoming Events
      await expect(page.locator('[data-testid="events-list"]')).toBeVisible();

      // 2. RSVP to Event
      await page.click('[data-testid="event-card"]:first-child');
      await expect(page.locator('[data-testid="event-details"]')).toBeVisible();
      
      await page.click('button:has-text("RSVP Yes")');
      await expect(page.locator('.toast')).toContainText('RSVP recorded');
      await expect(page.locator('[data-testid="rsvp-status"]')).toContainText('Yes');

      // 3. Change RSVP
      await page.click('button:has-text("Change RSVP")');
      await page.click('button:has-text("Maybe")');
      await expect(page.locator('.toast')).toContainText('RSVP updated');
    });
  });

  test.describe('Communication Workflows', () => {
    test('admin sends bulk communications', async ({ page }) => {
      await page.goto('/admin/communications');

      // 1. Send Bulk Email
      await page.click('button:has-text("New Communication")');
      await page.selectOption('[name="type"]', 'email');
      await page.fill('[name="subject"]', 'Important Club Update');
      await page.fill('[name="message"]', 'This is an important update for all members.');
      
      // Select recipients
      await page.check('[name="selectAll"]');
      
      await page.click('button:has-text("Send Email")');
      await expect(page.locator('.toast')).toContainText('Email sent successfully');

      // 2. Send SMS
      await page.click('button:has-text("New Communication")');
      await page.selectOption('[name="type"]', 'sms');
      await page.fill('[name="message"]', 'Quick reminder: Meeting tomorrow at 7 PM');
      
      // Select SMS-enabled members only
      await page.check('[name="smsConsent"]');
      
      await page.click('button:has-text("Send SMS")');
      await expect(page.locator('.toast')).toContainText('SMS sent successfully');
    });

    test('member directory and chat access', async ({ page }) => {
      // Member perspective
      await page.goto('/app/directory');

      // 1. View Member Directory
      await expect(page.locator('[data-testid="directory-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="member-card"]')).toHaveCount.greaterThan(0);

      // 2. Search Directory
      await page.fill('[name="search"]', 'John');
      await expect(page.locator('[data-testid="member-card"]')).toHaveCount(1);

      // 3. Access Chat (if enabled)
      if (await page.locator('[data-testid="nav-chat"]').isVisible()) {
        await page.click('[data-testid="nav-chat"]');
        await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
        
        // Send message
        await page.fill('[name="message"]', 'Hello everyone!');
        await page.click('button:has-text("Send")');
        await expect(page.locator('[data-testid="chat-messages"]'))
          .toContainText('Hello everyone!');
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('mobile member experience', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/app/dashboard');

      // 1. Mobile Navigation
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      await page.click('[data-testid="nav-events-mobile"]');
      await expect(page).toHaveURL(/.*events/);

      // 2. Mobile Event View
      await expect(page.locator('[data-testid="events-list"]')).toBeVisible();
      await page.click('[data-testid="event-card"]:first-child');
      
      // Mobile event details should be responsive
      await expect(page.locator('[data-testid="event-details"]')).toBeVisible();
      await page.click('button:has-text("RSVP Yes")');

      // 3. Mobile Profile Management
      await page.click('[data-testid="mobile-menu-toggle"]');
      await page.click('[data-testid="nav-profile-mobile"]');
      
      await expect(page.locator('[name="phoneNumber"]')).toBeVisible();
      await page.fill('[name="phoneNumber"]', '+1-555-mobile-test');
      await page.click('button:has-text("Save Changes")');
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('handles network failures gracefully', async ({ page }) => {
      await page.goto('/admin/dashboard');

      // Simulate network failure
      await page.route('**/api/**', route => {
        route.abort('failed');
      });

      // Try to load members page
      await page.click('[data-testid="nav-members"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

      // Restore network and retry
      await page.unroute('**/api/**');
      await page.click('[data-testid="retry-button"]');
      
      // Should load successfully
      await expect(page.locator('[data-testid="members-list"]')).toBeVisible();
    });

    test('handles authentication expiration', async ({ page, context }) => {
      await page.goto('/admin/dashboard');

      // Simulate expired token
      await context.addCookies([
        {
          name: 'auth-token',
          value: 'expired-token',
          domain: 'localhost',
          path: '/'
        }
      ]);

      // Try to access protected resource
      await page.click('[data-testid="nav-members"]');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
      await expect(page.locator('[data-testid="session-expired-message"]'))
        .toContainText('Your session has expired');
    });
  });

  test.describe('Performance Validation', () => {
    test('critical pages load within performance budgets', async ({ page }) => {
      const performanceResults: number[] = [];

      const criticalPages = [
        '/admin/dashboard',
        '/admin/members',
        '/admin/events',
        '/app/dashboard',
        '/app/events'
      ];

      for (const url of criticalPages) {
        const startTime = Date.now();
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const endTime = Date.now();
        
        const loadTime = endTime - startTime;
        performanceResults.push(loadTime);
        
        // Each page should load within 3 seconds
        expect(loadTime).toBeLessThan(3000);
      }

      // Average load time should be reasonable
      const averageLoadTime = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
      expect(averageLoadTime).toBeLessThan(2000);
    });
  });
});