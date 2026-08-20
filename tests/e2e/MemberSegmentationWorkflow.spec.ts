import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';

test.describe('Member Segmentation End-to-End Workflow', () => {
  let page: Page;
  let context: BrowserContext;

  // Test data
  const testClub = {
    name: 'E2E Test Club',
    email: 'e2e.admin@gathergrove.club',
    password: 'TestPassword123!'
  };

  const testSegment = {
    name: 'Active High Engagement Members',
    description: 'Members who are active and have high engagement scores',
    filters: {
      status: 'Active',
      engagementLevel: 'high',
      joinedAfter: '2023-01-01'
    }
  };

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    // Setup test environment
    await setupTestEnvironment();
  });

  test.afterEach(async () => {
    await cleanupTestData();
    await context.close();
  });

  async function setupTestEnvironment() {
    // Navigate to login page
    await page.goto('/login');

    // Login with unlimited tier account
    await page.fill('[data-testid="email-input"]', testClub.email);
    await page.fill('[data-testid="password-input"]', testClub.password);
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });

    // Ensure we have unlimited tier access
    const billingIndicator = page.locator('[data-testid="tier-indicator"]');
    await expect(billingIndicator).toContainText('Unlimited');
  }

  async function cleanupTestData() {
    // Navigate to segments page and cleanup test segments
    await page.goto('/admin/members/segments');
    
    // Delete any test segments that were created
    const testSegmentCards = page.locator(`[data-testid*="segment-"][data-testid*="${testSegment.name}"]`);
    const count = await testSegmentCards.count();
    
    for (let i = 0; i < count; i++) {
      const deleteButton = testSegmentCards.nth(i).locator('[data-testid*="delete-segment"]');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.click('[data-testid="confirm-delete"]');
        await page.waitForSelector('[data-testid="success-toast"]');
      }
    }
  }

  test('Complete segment creation workflow', async () => {
    // Navigate to member segmentation page
    await page.goto('/admin/members/segments');
    
    // Verify page loads correctly
    await expect(page.locator('h1')).toContainText('Member Segmentation');
    
    // Check if unlimited tier features are available
    const createButton = page.locator('[data-testid="create-segment-button"]');
    await expect(createButton).toBeVisible();
    await expect(createButton).not.toBeDisabled();

    // Click create segment button
    await createButton.click();

    // Verify create dialog opens
    const dialog = page.locator('[data-testid="create-segment-dialog"]');
    await expect(dialog).toBeVisible();
    
    // Fill in segment details
    await page.fill('[data-testid="segment-name-input"]', testSegment.name);
    await page.fill('[data-testid="segment-description-input"]', testSegment.description);

    // Configure filter criteria
    await page.selectOption('[data-testid="status-filter"]', testSegment.filters.status);
    await page.selectOption('[data-testid="engagement-filter"]', testSegment.filters.engagementLevel);
    
    // Set date range filter
    await page.fill('[data-testid="join-date-from"]', testSegment.filters.joinedAfter);

    // Preview segment before creating
    await page.click('[data-testid="preview-segment-button"]');
    
    // Verify preview loads
    const previewSection = page.locator('[data-testid="segment-preview"]');
    await expect(previewSection).toBeVisible();
    
    // Check preview results
    const memberCount = page.locator('[data-testid="preview-member-count"]');
    await expect(memberCount).toBeVisible();
    
    const countText = await memberCount.textContent();
    expect(parseInt(countText || '0')).toBeGreaterThanOrEqual(0);

    // Verify preview shows sample members if any exist
    const previewMembers = page.locator('[data-testid="preview-member-list"] [data-testid*="member-"]');
    const previewMemberCount = await previewMembers.count();
    
    if (previewMemberCount > 0) {
      // Verify member information is displayed
      const firstMember = previewMembers.first();
      await expect(firstMember.locator('[data-testid="member-name"]')).toBeVisible();
      await expect(firstMember.locator('[data-testid="member-email"]')).toBeVisible();
      await expect(firstMember.locator('[data-testid="member-status"]')).toBeVisible();
    }

    // Create the segment
    await page.click('[data-testid="create-segment-submit"]');

    // Verify segment creation success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Segment created successfully');

    // Verify dialog closes
    await expect(dialog).not.toBeVisible();

    // Verify segment appears in the list
    const segmentCard = page.locator(`[data-testid*="segment-"][data-segment-name="${testSegment.name}"]`);
    await expect(segmentCard).toBeVisible();
    
    // Verify segment details in card
    await expect(segmentCard.locator('[data-testid="segment-name"]')).toContainText(testSegment.name);
    await expect(segmentCard.locator('[data-testid="segment-description"]')).toContainText(testSegment.description);
    await expect(segmentCard.locator('[data-testid="segment-status"]')).toContainText('Active');
  });

  test('View segment members workflow', async () => {
    // First create a segment (reuse from previous test)
    await page.goto('/admin/members/segments');
    await createTestSegment();

    // Find and click the segment
    const segmentCard = page.locator(`[data-testid*="segment-"][data-segment-name="${testSegment.name}"]`);
    await expect(segmentCard).toBeVisible();

    // Click view members button
    await segmentCard.locator('[data-testid*="view-segment"]').click();

    // Verify members dialog opens
    const membersDialog = page.locator('[data-testid="segment-members-dialog"]');
    await expect(membersDialog).toBeVisible();
    
    // Verify dialog title
    await expect(membersDialog.locator('h2')).toContainText(`${testSegment.name} - Members`);

    // Check member list
    const membersList = page.locator('[data-testid="segment-members-list"]');
    await expect(membersList).toBeVisible();

    // Verify pagination if there are many members
    const paginationInfo = page.locator('[data-testid="pagination-info"]');
    if (await paginationInfo.isVisible()) {
      expect(await paginationInfo.textContent()).toMatch(/Page \d+ of \d+/);
    }

    // Verify member details are displayed
    const memberRows = page.locator('[data-testid="member-row"]');
    const memberCount = await memberRows.count();
    
    if (memberCount > 0) {
      const firstMember = memberRows.first();
      await expect(firstMember.locator('[data-testid="member-name"]')).toBeVisible();
      await expect(firstMember.locator('[data-testid="member-email"]')).toBeVisible();
      await expect(firstMember.locator('[data-testid="member-join-date"]')).toBeVisible();
      await expect(firstMember.locator('[data-testid="member-engagement-level"]')).toBeVisible();
    }

    // Test pagination if applicable
    const nextPageButton = page.locator('[data-testid="next-page-button"]');
    if (await nextPageButton.isEnabled()) {
      await nextPageButton.click();
      await expect(paginationInfo).toContainText('Page 2');
    }

    // Close the dialog
    await page.click('[data-testid="close-members-dialog"]');
    await expect(membersDialog).not.toBeVisible();
  });

  test('Edit segment workflow', async () => {
    // Create a test segment first
    await page.goto('/admin/members/segments');
    await createTestSegment();

    // Find the segment and click edit
    const segmentCard = page.locator(`[data-testid*="segment-"][data-segment-name="${testSegment.name}"]`);
    await segmentCard.locator('[data-testid*="edit-segment"]').click();

    // Verify edit dialog opens
    const editDialog = page.locator('[data-testid="edit-segment-dialog"]');
    await expect(editDialog).toBeVisible();

    // Verify form is pre-populated
    const nameInput = page.locator('[data-testid="segment-name-input"]');
    await expect(nameInput).toHaveValue(testSegment.name);

    // Update segment details
    const updatedName = `${testSegment.name} - Updated`;
    const updatedDescription = 'Updated description for testing';
    
    await nameInput.fill(updatedName);
    await page.fill('[data-testid="segment-description-input"]', updatedDescription);

    // Change filter criteria
    await page.selectOption('[data-testid="engagement-filter"]', 'medium');

    // Preview updated segment
    await page.click('[data-testid="preview-segment-button"]');
    
    // Verify preview updates
    const previewSection = page.locator('[data-testid="segment-preview"]');
    await expect(previewSection).toBeVisible();

    // Save changes
    await page.click('[data-testid="update-segment-submit"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Segment updated successfully');

    // Verify dialog closes
    await expect(editDialog).not.toBeVisible();

    // Verify updated segment in list
    const updatedSegmentCard = page.locator(`[data-testid*="segment-"][data-segment-name="${updatedName}"]`);
    await expect(updatedSegmentCard).toBeVisible();
    await expect(updatedSegmentCard.locator('[data-testid="segment-description"]')).toContainText(updatedDescription);
  });

  test('Delete segment workflow', async () => {
    // Create a test segment first
    await page.goto('/admin/members/segments');
    await createTestSegment();

    // Find the segment and click delete
    const segmentCard = page.locator(`[data-testid*="segment-"][data-segment-name="${testSegment.name}"]`);
    await segmentCard.locator('[data-testid*="delete-segment"]').click();

    // Verify confirmation dialog appears
    const confirmDialog = page.locator('[data-testid="delete-confirmation-dialog"]');
    await expect(confirmDialog).toBeVisible();
    
    // Verify warning message
    await expect(confirmDialog).toContainText('Are you sure you want to delete');
    await expect(confirmDialog).toContainText(testSegment.name);

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Segment deleted successfully');

    // Verify segment is removed from list
    await expect(segmentCard).not.toBeVisible();
  });

  test('Bulk operations workflow', async () => {
    // Create a test segment with members
    await page.goto('/admin/members/segments');
    await createTestSegment();

    // View segment members
    const segmentCard = page.locator(`[data-testid*="segment-"][data-segment-name="${testSegment.name}"]`);
    await segmentCard.locator('[data-testid*="view-segment"]').click();

    const membersDialog = page.locator('[data-testid="segment-members-dialog"]');
    await expect(membersDialog).toBeVisible();

    // Select multiple members
    const memberCheckboxes = page.locator('[data-testid*="member-checkbox"]');
    const memberCount = await memberCheckboxes.count();
    
    if (memberCount > 0) {
      // Select first few members
      const selectCount = Math.min(3, memberCount);
      for (let i = 0; i < selectCount; i++) {
        await memberCheckboxes.nth(i).check();
      }

      // Verify bulk actions become available
      const bulkActionsPanel = page.locator('[data-testid="bulk-actions-panel"]');
      await expect(bulkActionsPanel).toBeVisible();

      // Test bulk tag assignment
      await page.click('[data-testid="bulk-add-tags-button"]');
      
      const tagsDialog = page.locator('[data-testid="bulk-tags-dialog"]');
      await expect(tagsDialog).toBeVisible();

      // Select tags to add
      const availableTags = page.locator('[data-testid*="available-tag"]');
      if ((await availableTags.count()) > 0) {
        await availableTags.first().click();
        await page.click('[data-testid="add-tags-submit"]');
        
        await expect(page.locator('[data-testid="success-toast"]')).toContainText('Tags added successfully');
      }

      // Test bulk status update
      await page.click('[data-testid="bulk-update-status-button"]');
      
      const statusDialog = page.locator('[data-testid="bulk-status-dialog"]');
      await expect(statusDialog).toBeVisible();

      await page.selectOption('[data-testid="new-status-select"]', 'Active');
      await page.click('[data-testid="update-status-submit"]');
      
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Status updated successfully');
    }

    // Close members dialog
    await page.click('[data-testid="close-members-dialog"]');
  });

  test('Performance requirements validation', async () => {
    await page.goto('/admin/members/segments');

    // Test segment creation performance
    const createStartTime = Date.now();
    
    await page.click('[data-testid="create-segment-button"]');
    await page.fill('[data-testid="segment-name-input"]', 'Performance Test Segment');
    await page.selectOption('[data-testid="status-filter"]', 'Active');
    await page.click('[data-testid="create-segment-submit"]');
    
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    const createDuration = Date.now() - createStartTime;
    expect(createDuration).toBeLessThan(5000); // Should complete under 5 seconds

    // Test segment query performance
    const queryStartTime = Date.now();
    
    await page.reload();
    await expect(page.locator('[data-testid="segments-list"]')).toBeVisible();
    
    const queryDuration = Date.now() - queryStartTime;
    expect(queryDuration).toBeLessThan(2000); // Should complete under 2 seconds
  });

  test('Error handling and validation', async () => {
    await page.goto('/admin/members/segments');

    // Test validation for empty segment name
    await page.click('[data-testid="create-segment-button"]');
    await page.click('[data-testid="create-segment-submit"]');
    
    // Should show validation error
    const nameInput = page.locator('[data-testid="segment-name-input"]');
    expect(await nameInput.evaluate(el => el.validity.valid)).toBe(false);

    // Test invalid filter criteria
    await page.fill('[data-testid="segment-name-input"]', 'Invalid Filter Test');
    await page.fill('[data-testid="age-min-input"]', '65');
    await page.fill('[data-testid="age-max-input"]', '18'); // Invalid: min > max
    
    await page.click('[data-testid="create-segment-submit"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Age minimum cannot be greater than maximum');

    // Test network error handling
    // Mock network failure
    await page.route('**/api/clubs/*/segments', route => route.abort('failed'));
    
    await page.fill('[data-testid="age-min-input"]', '18');
    await page.fill('[data-testid="age-max-input"]', '65');
    await page.click('[data-testid="create-segment-submit"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-toast"]')).toContainText('Failed to create segment');
  });

  test('Accessibility compliance', async () => {
    await page.goto('/admin/members/segments');

    // Test keyboard navigation
    await page.keyboard.press('Tab'); // Focus on create button
    await page.keyboard.press('Enter'); // Activate create button
    
    const dialog = page.locator('[data-testid="create-segment-dialog"]');
    await expect(dialog).toBeVisible();

    // Test form navigation with keyboard
    await page.keyboard.press('Tab'); // Move to name input
    await page.keyboard.type('Keyboard Test Segment');
    
    await page.keyboard.press('Tab'); // Move to description
    await page.keyboard.type('Test description');

    // Test escape key to close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Test focus management after segment creation
    await createTestSegment();
    
    const segmentCard = page.locator(`[data-testid*="segment-"][data-segment-name="${testSegment.name}"]`);
    await expect(segmentCard).toBeFocused();
  });

  test('Mobile responsive behavior', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/admin/members/segments');

    // Verify mobile layout
    const createButton = page.locator('[data-testid="create-segment-button"]');
    await expect(createButton).toBeVisible();

    // Test mobile create dialog
    await createButton.click();
    
    const dialog = page.locator('[data-testid="create-segment-dialog"]');
    await expect(dialog).toBeVisible();
    
    // Verify dialog is properly sized for mobile
    const dialogBounds = await dialog.boundingBox();
    expect(dialogBounds?.width).toBeLessThanOrEqual(375);

    // Test mobile segment cards
    await page.click('[data-testid="cancel-create-button"]');
    
    if (await page.locator('[data-testid*="segment-"]').first().isVisible()) {
      const segmentCard = page.locator('[data-testid*="segment-"]').first();
      const cardBounds = await segmentCard.boundingBox();
      expect(cardBounds?.width).toBeLessThanOrEqual(375);
    }
  });

  // Helper function to create a test segment
  async function createTestSegment() {
    await page.click('[data-testid="create-segment-button"]');
    
    await page.fill('[data-testid="segment-name-input"]', testSegment.name);
    await page.fill('[data-testid="segment-description-input"]', testSegment.description);
    await page.selectOption('[data-testid="status-filter"]', testSegment.filters.status);
    await page.selectOption('[data-testid="engagement-filter"]', testSegment.filters.engagementLevel);
    
    await page.click('[data-testid="create-segment-submit"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  }
});