/**
 * End-to-End Tests for Member Segmentation Workflows
 * Test complete user journeys from creation to analysis
 */

import { test, expect } from '@playwright/test';
import { setupTestClub, cleanupTestData } from '@/tests/utils/e2e-helpers';

test.describe('Member Segmentation E2E Workflows', () => {
  let testClub: any;
  let adminUser: any;

  test.beforeEach(async ({ page }) => {
    // Setup test data
    const testData = await setupTestClub();
    testClub = testData.club;
    adminUser = testData.admin;

    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', adminUser.email);
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/admin/dashboard');
  });

  test.afterEach(async () => {
    await cleanupTestData(testClub.id);
  });

  test('Complete Custom Fields Workflow', async ({ page }) => {
    // Navigate to custom fields management
    await page.goto(`/admin/members/custom-fields`);
    await expect(page.locator('h1')).toContainText('Custom Fields');

    // Create a text custom field
    await page.click('[data-testid="add-custom-field-button"]');
    await page.fill('[data-testid="field-name-input"]', 'Emergency Contact');
    await page.selectOption('[data-testid="field-type-select"]', 'TEXT');
    await page.check('[data-testid="field-required-checkbox"]');
    await page.click('[data-testid="create-field-button"]');

    // Verify field appears in list
    await expect(page.locator('[data-testid="custom-field-item"]')).toContainText('Emergency Contact');

    // Create a select custom field
    await page.click('[data-testid="add-custom-field-button"]');
    await page.fill('[data-testid="field-name-input"]', 'Membership Level');
    await page.selectOption('[data-testid="field-type-select"]', 'SELECT');
    await page.fill('[data-testid="field-options-input"]', 'Bronze, Silver, Gold, Platinum');
    await page.click('[data-testid="create-field-button"]');

    // Verify both fields exist
    const customFields = page.locator('[data-testid="custom-field-item"]');
    await expect(customFields).toHaveCount(2);

    // Test field editing
    await page.locator('[data-testid="edit-field-button"]').first().click();
    await page.fill('[data-testid="field-name-input"]', 'Primary Emergency Contact');
    await page.click('[data-testid="save-field-button"]');
    await expect(page.locator('[data-testid="custom-field-item"]').first()).toContainText('Primary Emergency Contact');

    // Test field reordering
    const firstField = page.locator('[data-testid="custom-field-item"]').first();
    const secondField = page.locator('[data-testid="custom-field-item"]').nth(1);
    
    await firstField.locator('[data-testid="drag-handle"]').dragTo(secondField);
    
    // Verify order changed
    await expect(page.locator('[data-testid="custom-field-item"]').first()).toContainText('Membership Level');

    // Test field deletion
    await page.locator('[data-testid="delete-field-button"]').first().click();
    await page.locator('[data-testid="confirm-delete-button"]').click();
    await expect(page.locator('[data-testid="custom-field-item"]')).toHaveCount(1);
  });

  test('Complete Member Tagging Workflow', async ({ page }) => {
    // Navigate to tag management
    await page.goto(`/admin/members/tags`);
    await expect(page.locator('h1')).toContainText('Member Tags');

    // Create VIP tag
    await page.click('[data-testid="add-tag-button"]');
    await page.fill('[data-testid="tag-name-input"]', 'VIP Members');
    await page.fill('[data-testid="tag-color-input"]', '#FF6B6B');
    await page.fill('[data-testid="tag-description-input"]', 'High-value club members');
    await page.click('[data-testid="create-tag-button"]');

    // Create New Members tag
    await page.click('[data-testid="add-tag-button"]');
    await page.fill('[data-testid="tag-name-input"]', 'New Members');
    await page.fill('[data-testid="tag-color-input"]', '#4ECDC4');
    await page.fill('[data-testid="tag-description-input"]', 'Recently joined members');
    await page.click('[data-testid="create-tag-button"]');

    // Verify tags appear with correct colors
    await expect(page.locator('[data-testid="tag-item"]')).toHaveCount(2);
    const vipTag = page.locator('[data-testid="tag-item"]').filter({ hasText: 'VIP Members' });
    await expect(vipTag.locator('[data-testid="tag-color-indicator"]')).toHaveCSS('background-color', 'rgb(255, 107, 107)');

    // Navigate to member list to assign tags
    await page.goto(`/admin/members`);
    await expect(page.locator('[data-testid="member-item"]')).toHaveCount.toBeGreaterThan(0);

    // Select first member and assign VIP tag
    await page.locator('[data-testid="member-checkbox"]').first().check();
    await page.click('[data-testid="bulk-actions-button"]');
    await page.click('[data-testid="assign-tags-tab"]');
    await page.click('[data-testid="tag-select"]');
    await page.click('[data-testid="tag-option"][data-tag="vip-members"]');
    await page.click('[data-testid="assign-tags-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Tags assigned successfully');

    // Verify tag appears on member
    await expect(page.locator('[data-testid="member-item"]').first().locator('[data-testid="member-tag"]')).toContainText('VIP Members');

    // Test bulk tag assignment
    await page.locator('[data-testid="select-all-members"]').check();
    await page.click('[data-testid="bulk-actions-button"]');
    await page.click('[data-testid="assign-tags-tab"]');
    await page.click('[data-testid="tag-select"]');
    await page.click('[data-testid="tag-option"][data-tag="new-members"]');
    await page.click('[data-testid="assign-tags-button"]');

    // Verify bulk assignment
    const memberItems = page.locator('[data-testid="member-item"]');
    for (let i = 0; i < await memberItems.count(); i++) {
      await expect(memberItems.nth(i).locator('[data-testid="member-tag"]')).toContainText('New Members');
    }
  });

  test('Complete Member Segmentation Workflow', async ({ page }) => {
    // First, create some test data
    await setupSegmentationTestData(page);

    // Navigate to segments
    await page.goto(`/admin/members/segments`);
    await expect(page.locator('h1')).toContainText('Member Segments');

    // Create a new segment using the segment builder
    await page.click('[data-testid="create-segment-button"]');
    await expect(page.locator('h2')).toContainText('Segment Builder');

    // Set segment name
    await page.fill('[data-testid="segment-name-input"]', 'Active VIP Members');

    // Add first condition: Status = Active
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="field-select"]', 'status');
    await page.selectOption('[data-testid="operator-select"]', 'EQUALS');
    await page.fill('[data-testid="value-input"]', 'Active');

    // Add second condition with AND logic: Join Date > 2024-01-01
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="logical-operator-select"]', 'AND');
    await page.selectOption('[data-testid="field-select"]', 'joinDate');
    await page.selectOption('[data-testid="operator-select"]', 'GREATER_THAN');
    await page.fill('[data-testid="value-input"]', '2024-01-01');

    // Add tag filter
    await page.click('[data-testid="tag-filters-section"]');
    await page.click('[data-testid="include-tags-select"]');
    await page.click('[data-testid="tag-option"][data-tag="vip-members"]');

    // Preview the segment
    await page.click('[data-testid="preview-segment-button"]');
    await expect(page.locator('[data-testid="preview-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-count"]')).toContainText(/\d+ member/);

    // Verify preview shows matching members
    await expect(page.locator('[data-testid="preview-member-item"]')).toHaveCount.toBeGreaterThan(0);

    // Save the segment
    await page.click('[data-testid="save-segment-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Segment created successfully');

    // Verify segment appears in list
    await expect(page.locator('[data-testid="segment-item"]')).toContainText('Active VIP Members');

    // Test segment editing
    await page.locator('[data-testid="edit-segment-button"]').first().click();
    await page.fill('[data-testid="segment-name-input"]', 'Premium Active Members');
    await page.click('[data-testid="save-segment-button"]');
    await expect(page.locator('[data-testid="segment-item"]').first()).toContainText('Premium Active Members');

    // View segment members
    await page.locator('[data-testid="view-segment-members-button"]').first().click();
    await expect(page.locator('h2')).toContainText('Premium Active Members - Members');
    await expect(page.locator('[data-testid="segment-member-item"]')).toHaveCount.toBeGreaterThan(0);

    // Test segment export
    await page.click('[data-testid="export-segment-button"]');
    await page.selectOption('[data-testid="export-format-select"]', 'csv');
    await page.check('[data-testid="include-custom-fields-checkbox"]');
    await page.check('[data-testid="include-tags-checkbox"]');
    await page.click('[data-testid="start-export-button"]');

    // Wait for export to complete
    await expect(page.locator('[data-testid="export-status"]')).toContainText('Export completed', { timeout: 30000 });
    await expect(page.locator('[data-testid="download-export-button"]')).toBeVisible();

    // Test segment duplication
    await page.goto(`/admin/members/segments`);
    await page.locator('[data-testid="duplicate-segment-button"]').first().click();
    await page.fill('[data-testid="new-segment-name-input"]', 'Copy of Premium Active Members');
    await page.click('[data-testid="confirm-duplicate-button"]');
    await expect(page.locator('[data-testid="segment-item"]')).toHaveCount(2);

    // Test segment deletion
    await page.locator('[data-testid="delete-segment-button"]').nth(1).click();
    await page.fill('[data-testid="confirm-delete-input"]', 'DELETE');
    await page.click('[data-testid="confirm-delete-button"]');
    await expect(page.locator('[data-testid="segment-item"]')).toHaveCount(1);
  });

  test('Complete Bulk Operations Workflow', async ({ page }) => {
    await setupBulkOperationsTestData(page);

    // Navigate to members and select multiple members
    await page.goto(`/admin/members`);
    
    // Select first 3 members
    for (let i = 0; i < 3; i++) {
      await page.locator('[data-testid="member-checkbox"]').nth(i).check();
    }

    await expect(page.locator('[data-testid="selected-count"]')).toContainText('3 selected');

    // Open bulk operations panel
    await page.click('[data-testid="bulk-actions-button"]');
    await expect(page.locator('[data-testid="bulk-operations-panel"]')).toBeVisible();

    // Test bulk custom field update
    await page.click('[data-testid="custom-fields-tab"]');
    await page.selectOption('[data-testid="custom-field-select"]', 'emergency-contact');
    await page.fill('[data-testid="field-value-input"]', 'Updated Emergency Contact');
    await page.click('[data-testid="update-fields-button"]');

    // Confirm bulk operation
    await page.click('[data-testid="confirm-bulk-operation-button"]');
    
    // Wait for operation to complete
    await expect(page.locator('[data-testid="bulk-operation-status"]')).toContainText('Completed', { timeout: 15000 });
    await expect(page.locator('[data-testid="operation-summary"]')).toContainText('3 members updated successfully');

    // Test bulk tag assignment
    await page.click('[data-testid="tags-tab"]');
    await page.click('[data-testid="tag-action-select"]');
    await page.click('[data-testid="tag-action-add"]');
    await page.click('[data-testid="tags-select"]');
    await page.click('[data-testid="tag-option"][data-tag="active-members"]');
    await page.click('[data-testid="assign-tags-button"]');

    await expect(page.locator('[data-testid="operation-summary"]')).toContainText('Tags assigned to 3 members');

    // Test bulk status update
    await page.click('[data-testid="member-status-tab"]');
    await page.selectOption('[data-testid="status-select"]', 'Inactive');
    await page.fill('[data-testid="status-reason-input"]', 'Bulk deactivation for testing');
    await page.click('[data-testid="update-status-button"]');

    // Confirm destructive operation
    await page.fill('[data-testid="confirmation-input"]', 'CONFIRM');
    await page.click('[data-testid="confirm-destructive-operation-button"]');

    await expect(page.locator('[data-testid="operation-summary"]')).toContainText('Status updated for 3 members');

    // Verify status changes in member list
    await page.click('[data-testid="close-bulk-operations-button"]');
    for (let i = 0; i < 3; i++) {
      await expect(page.locator('[data-testid="member-status"]').nth(i)).toContainText('Inactive');
    }

    // Test viewing bulk operation history
    await page.goto(`/admin/members/bulk-operations`);
    await expect(page.locator('h1')).toContainText('Bulk Operations History');
    
    // Verify our operations appear in history
    const operationItems = page.locator('[data-testid="bulk-operation-item"]');
    await expect(operationItems).toHaveCount.toBeGreaterThan(0);
    
    // Check first operation details
    await operationItems.first().click();
    await expect(page.locator('[data-testid="operation-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="operation-type"]')).toContainText('UPDATE_MEMBER_STATUS');
    await expect(page.locator('[data-testid="total-records"]')).toContainText('3');
    await expect(page.locator('[data-testid="successful-records"]')).toContainText('3');

    // Test operation retry (for failed records)
    await page.goto(`/admin/members/bulk-operations`);
    
    // Create an operation that will have failures (for testing)
    await createFailedBulkOperation(page);
    
    // Find the failed operation and retry
    const failedOperation = page.locator('[data-testid="bulk-operation-item"]').filter({ hasText: 'FAILED' });
    await failedOperation.click();
    await page.click('[data-testid="retry-failed-button"]');
    await expect(page.locator('[data-testid="retry-confirmation"]')).toContainText('Retry operation created');
  });

  test('Advanced Filtering and Search Workflow', async ({ page }) => {
    await setupAdvancedFilterTestData(page);

    // Navigate to members with advanced filter
    await page.goto(`/admin/members`);
    await page.click('[data-testid="advanced-filter-button"]');

    // Test complex filter building
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="field-select"]', 'joinDate');
    await page.selectOption('[data-testid="operator-select"]', 'BETWEEN');
    await page.fill('[data-testid="value-from-input"]', '2024-01-01');
    await page.fill('[data-testid="value-to-input"]', '2024-06-30');

    // Add custom field condition
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="logical-operator-select"]', 'AND');
    await page.selectOption('[data-testid="field-select"]', 'customField.membershipLevel');
    await page.selectOption('[data-testid="operator-select"]', 'IN');
    await page.fill('[data-testid="value-input"]', 'Gold, Platinum');

    // Add engagement condition
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="logical-operator-select"]', 'AND');
    await page.selectOption('[data-testid="field-select"]', 'engagement.eventAttendance');
    await page.selectOption('[data-testid="operator-select"]', 'GREATER_THAN');
    await page.fill('[data-testid="value-input"]', '5');

    // Add tag filters
    await page.click('[data-testid="tag-filters-toggle"]');
    await page.click('[data-testid="include-tags-select"]');
    await page.click('[data-testid="tag-option"][data-tag="active-members"]');
    await page.selectOption('[data-testid="tag-operation-select"]', 'AND');

    // Apply filters
    await page.click('[data-testid="apply-filters-button"]');

    // Verify filtered results
    await expect(page.locator('[data-testid="filter-results-count"]')).toContainText(/\d+ members found/);
    await expect(page.locator('[data-testid="member-item"]')).toHaveCount.toBeGreaterThan(0);

    // Save filter as preset
    await page.click('[data-testid="save-filter-preset-button"]');
    await page.fill('[data-testid="preset-name-input"]', 'High-Value Active Members');
    await page.fill('[data-testid="preset-description-input"]', 'Gold/Platinum members with high engagement');
    await page.click('[data-testid="save-preset-button"]');

    // Test using saved preset
    await page.click('[data-testid="clear-filters-button"]');
    await page.click('[data-testid="filter-presets-button"]');
    await page.click('[data-testid="preset-item"][data-preset="high-value-active-members"]');

    // Verify preset applied correctly
    await expect(page.locator('[data-testid="active-conditions"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="active-tag-filters"]')).toContainText('active-members');

    // Test filter export
    await page.click('[data-testid="export-filtered-members-button"]');
    await page.selectOption('[data-testid="export-format-select"]', 'xlsx');
    await page.check('[data-testid="include-all-fields-checkbox"]');
    await page.click('[data-testid="start-export-button"]');

    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible({ timeout: 30000 });
  });

  test('Segment Analytics and Reporting Workflow', async ({ page }) => {
    await setupAnalyticsTestData(page);

    // Navigate to segments and select one with data
    await page.goto(`/admin/members/segments`);
    await page.locator('[data-testid="view-analytics-button"]').first().click();

    // Verify analytics dashboard loads
    await expect(page.locator('h1')).toContainText('Segment Analytics');
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();

    // Test member growth chart
    await expect(page.locator('[data-testid="member-growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="growth-trend-indicator"]')).toContainText(/\+?\-?\d+\.?\d*%/);

    // Test engagement metrics
    await expect(page.locator('[data-testid="avg-events-metric"]')).toContainText(/\d+\.?\d*/);
    await expect(page.locator('[data-testid="communication-open-rate"]')).toContainText(/\d+%/);
    await expect(page.locator('[data-testid="last-activity-metric"]')).toContainText(/\d+ days/);

    // Test demographics breakdown
    await page.click('[data-testid="demographics-tab"]');
    await expect(page.locator('[data-testid="age-distribution-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="location-distribution-chart"]')).toBeVisible();

    // Test time range selection
    await page.selectOption('[data-testid="analytics-time-range"]', '90days');
    await page.click('[data-testid="refresh-analytics-button"]');
    
    // Verify data updates
    await expect(page.locator('[data-testid="loading-analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-analytics"]')).not.toBeVisible();

    // Test analytics export
    await page.click('[data-testid="export-analytics-button"]');
    await page.selectOption('[data-testid="analytics-export-format"]', 'pdf');
    await page.check('[data-testid="include-charts-checkbox"]');
    await page.check('[data-testid="include-raw-data-checkbox"]');
    await page.click('[data-testid="generate-report-button"]');

    await expect(page.locator('[data-testid="report-generation-status"]')).toContainText('Generating report...', { timeout: 5000 });
    await expect(page.locator('[data-testid="report-ready"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="download-report-button"]')).toBeVisible();

    // Test scheduled reports
    await page.click('[data-testid="schedule-reports-tab"]');
    await page.click('[data-testid="create-scheduled-report-button"]');
    
    await page.fill('[data-testid="report-name-input"]', 'Weekly VIP Member Report');
    await page.selectOption('[data-testid="report-frequency-select"]', 'weekly');
    await page.selectOption('[data-testid="report-day-select"]', 'monday');
    await page.fill('[data-testid="recipient-emails-input"]', 'admin@example.com');
    
    await page.click('[data-testid="create-schedule-button"]');
    await expect(page.locator('[data-testid="scheduled-report-item"]')).toContainText('Weekly VIP Member Report');

    // Test segment comparison
    await page.goto(`/admin/analytics/segment-comparison`);
    
    // Select segments to compare
    await page.click('[data-testid="segment-select-1"]');
    await page.click('[data-testid="segment-option"][data-segment-id="vip-members"]');
    
    await page.click('[data-testid="segment-select-2"]');
    await page.click('[data-testid="segment-option"][data-segment-id="new-members"]');
    
    await page.click('[data-testid="compare-segments-button"]');

    // Verify comparison results
    await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="engagement-comparison"]')).toBeVisible();
    await expect(page.locator('[data-testid="growth-comparison"]')).toBeVisible();
  });

  // Helper functions for test data setup
  async function setupSegmentationTestData(page: any) {
    // Create test members with various attributes
    const testMembers = [
      { name: 'John Doe', email: 'john@example.com', status: 'Active', joinDate: '2024-02-15' },
      { name: 'Jane Smith', email: 'jane@example.com', status: 'Active', joinDate: '2024-03-01' },
      { name: 'Bob Johnson', email: 'bob@example.com', status: 'Inactive', joinDate: '2023-12-15' }
    ];

    for (const member of testMembers) {
      // API call to create test member
      await page.request.post(`/api/clubs/${testClub.id}/members`, {
        data: member
      });
    }

    // Create test custom fields and tags
    await page.request.post(`/api/clubs/${testClub.id}/custom-fields`, {
      data: { fieldName: 'Emergency Contact', fieldType: 'TEXT', isRequired: true }
    });

    await page.request.post(`/api/clubs/${testClub.id}/member-tags`, {
      data: { tagName: 'VIP Members', tagColor: '#FF6B6B' }
    });
  }

  async function setupBulkOperationsTestData(page: any) {
    // Create more test members for bulk operations
    const bulkTestMembers = Array.from({ length: 10 }, (_, i) => ({
      name: `Test Member ${i + 1}`,
      email: `test${i + 1}@example.com`,
      status: 'Active',
      joinDate: `2024-0${Math.floor(i / 3) + 1}-${String((i % 30) + 1).padStart(2, '0')}`
    }));

    for (const member of bulkTestMembers) {
      await page.request.post(`/api/clubs/${testClub.id}/members`, {
        data: member
      });
    }
  }

  async function setupAdvancedFilterTestData(page: any) {
    // Create members with custom field data and engagement metrics
    // Implementation would involve API calls to setup comprehensive test data
  }

  async function setupAnalyticsTestData(page: any) {
    // Create historical data for analytics testing
    // Implementation would involve API calls to setup time-series data
  }

  async function createFailedBulkOperation(page: any) {
    // Create a bulk operation that will have some failures for testing retry functionality
    // Implementation would involve creating members with invalid data or constraints
  }
});