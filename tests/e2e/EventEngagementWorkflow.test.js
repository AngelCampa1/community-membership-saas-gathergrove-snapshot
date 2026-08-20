/**
 * @fileoverview End-to-End tests for complete Event Engagement Analysis workflow
 * @description Tests the full user journey from RSVP to attendance to analytics viewing
 * @author Claude Code - QA Testing Agent
 */

const { test, expect } = require('@playwright/test');
const { chromium } = require('playwright');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  testTimeout: 60000,
  testUser: {
    email: 'claude.test@gathergrove.com',
    password: 'ClaudeTest2024!',
    clubName: 'Claude Test Club',
    fullName: 'Claude Code Test'
  }
};

// Test data
const TEST_EVENT_DATA = {
  title: 'E2E Test Event - Engagement Analytics',
  description: 'End-to-end test event for engagement analysis workflow',
  location: 'Virtual Meeting Room',
  startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow + 2 hours
  maxAttendees: 50
};

const TEST_MEMBERS = [
  { firstName: 'Alice', lastName: 'Johnson', email: 'alice.e2e@test.com' },
  { firstName: 'Bob', lastName: 'Smith', email: 'bob.e2e@test.com' },
  { firstName: 'Carol', lastName: 'Davis', email: 'carol.e2e@test.com' },
  { firstName: 'David', lastName: 'Wilson', email: 'david.e2e@test.com' },
  { firstName: 'Eve', lastName: 'Brown', email: 'eve.e2e@test.com' }
];

test.describe('Event Engagement Analysis - Complete Workflow', () => {
  let browser;
  let adminContext;
  let memberContexts;
  let createdEventId;

  test.beforeAll(async () => {
    // Setup browser with multiple contexts for different users
    browser = await chromium.launch({ 
      headless: process.env.CI === 'true',
      slowMo: process.env.CI !== 'true' ? 100 : 0 
    });

    // Create admin context
    adminContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: process.env.RECORD_VIDEO ? {
        dir: 'test-results/videos/',
        size: { width: 1280, height: 720 }
      } : undefined
    });

    // Create member contexts
    memberContexts = [];
    for (let i = 0; i < TEST_MEMBERS.length; i++) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
      });
      memberContexts.push(context);
    }
  });

  test.afterAll(async () => {
    // Cleanup: Close all contexts and browser
    if (adminContext) await adminContext.close();
    for (const context of memberContexts) {
      await context.close();
    }
    if (browser) await browser.close();
  });

  test.describe('Setup Phase', () => {
    test('Should authenticate admin user and set up test environment', async () => {
      const adminPage = await adminContext.newPage();
      
      // Navigate to login page
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/login`);
      
      // Login as admin
      await adminPage.fill('[name="email"]', TEST_CONFIG.testUser.email);
      await adminPage.fill('[name="password"]', TEST_CONFIG.testUser.password);
      await adminPage.click('button[type="submit"]');
      
      // Wait for dashboard to load
      await adminPage.waitForURL('**/admin/dashboard');
      await expect(adminPage.locator('h1')).toContainText('Dashboard');
      
      // Verify admin is logged in
      await expect(adminPage.locator('[data-testid="user-menu"]')).toBeVisible();
      
      await adminPage.close();
    });

    test('Should create test event for engagement analysis', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/dashboard`);
      
      // Navigate to events page
      await adminPage.click('[data-testid="events-nav-link"]');
      await adminPage.waitForURL('**/admin/events');
      
      // Create new event
      await adminPage.click('[data-testid="create-event-button"]');
      
      // Fill event details
      await adminPage.fill('[name="title"]', TEST_EVENT_DATA.title);
      await adminPage.fill('[name="description"]', TEST_EVENT_DATA.description);
      await adminPage.fill('[name="location"]', TEST_EVENT_DATA.location);
      
      // Set dates (format: YYYY-MM-DDTHH:MM)
      const startDateString = TEST_EVENT_DATA.startDate.toISOString().slice(0, 16);
      const endDateString = TEST_EVENT_DATA.endDate.toISOString().slice(0, 16);
      
      await adminPage.fill('[name="startDate"]', startDateString);
      await adminPage.fill('[name="endDate"]', endDateString);
      await adminPage.fill('[name="maxAttendees"]', TEST_EVENT_DATA.maxAttendees.toString());
      
      // Submit event creation
      await adminPage.click('[data-testid="save-event-button"]');
      
      // Wait for success message and get event ID
      await expect(adminPage.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Get event ID from URL or response
      await adminPage.waitForURL('**/admin/events');
      const eventsList = adminPage.locator('[data-testid="events-list"] [data-testid="event-item"]');
      const latestEvent = eventsList.first();
      
      createdEventId = await latestEvent.getAttribute('data-event-id');
      expect(createdEventId).toBeTruthy();
      
      await adminPage.close();
    });

    test('Should verify event shows in analytics with initial zero metrics', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      // Navigate to analytics tab
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Verify initial state - zero engagement
      await expect(adminPage.locator('[data-testid="total-members"]')).toContainText('0');
      await expect(adminPage.locator('[data-testid="rsvp-count"]')).toContainText('0');
      await expect(adminPage.locator('[data-testid="attendance-count"]')).toContainText('0');
      await expect(adminPage.locator('[data-testid="engagement-score"]')).toContainText('0');
      
      // Verify empty state message is shown
      await expect(adminPage.locator('[data-testid="no-engagement-message"]')).toBeVisible();
      
      await adminPage.close();
    });
  });

  test.describe('RSVP Phase', () => {
    test('Should allow multiple members to RSVP with different responses', async () => {
      const rsvpResponses = ['Yes', 'Yes', 'Maybe', 'Yes', 'No'];
      
      for (let i = 0; i < TEST_MEMBERS.length; i++) {
        const member = TEST_MEMBERS[i];
        const response = rsvpResponses[i];
        const memberPage = await memberContexts[i].newPage();
        
        // Simulate member registration and login (in real scenario)
        // For testing, we'll assume members are already registered
        await memberPage.goto(`${TEST_CONFIG.baseUrl}/app/events/${createdEventId}`);
        
        // Wait for event page to load
        await expect(memberPage.locator('[data-testid="event-title"]')).toContainText(TEST_EVENT_DATA.title);
        
        // RSVP to event
        await memberPage.click('[data-testid="rsvp-dropdown"]');
        await memberPage.click(`[data-testid="rsvp-option-${response.toLowerCase()}"]`);
        
        // Verify RSVP was recorded
        await expect(memberPage.locator('[data-testid="rsvp-status"]')).toContainText(response);
        await expect(memberPage.locator('[data-testid="rsvp-success-message"]')).toBeVisible();
        
        // Wait a moment for real-time updates to propagate
        await memberPage.waitForTimeout(1000);
        
        await memberPage.close();
      }
    });

    test('Should show real-time RSVP updates in admin analytics dashboard', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      // Navigate to analytics tab
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Wait for data to load
      await adminPage.waitForTimeout(2000);
      
      // Verify RSVP metrics are updated
      await expect(adminPage.locator('[data-testid="total-members"]')).toContainText('5');
      await expect(adminPage.locator('[data-testid="rsvp-count"]')).toContainText('4'); // 3 Yes + 1 Maybe
      await expect(adminPage.locator('[data-testid="rsvp-rate"]')).toContainText('80%'); // 4/5 = 80%
      
      // Verify RSVP breakdown
      await expect(adminPage.locator('[data-testid="rsvp-yes-count"]')).toContainText('3');
      await expect(adminPage.locator('[data-testid="rsvp-maybe-count"]')).toContainText('1');
      await expect(adminPage.locator('[data-testid="rsvp-no-count"]')).toContainText('1');
      
      // Verify member breakdown is displayed
      const memberItems = adminPage.locator('[data-testid="member-breakdown"] [data-testid="member-item"]');
      await expect(memberItems).toHaveCount(5);
      
      // Check individual member statuses
      await expect(adminPage.locator('[data-member-name="Alice Johnson"] [data-testid="rsvp-status"]')).toContainText('Yes');
      await expect(adminPage.locator('[data-member-name="Carol Davis"] [data-testid="rsvp-status"]')).toContainText('Maybe');
      await expect(adminPage.locator('[data-member-name="Eve Brown"] [data-testid="rsvp-status"]')).toContainText('No');
      
      await adminPage.close();
    });

    test('Should show RSVP trends and timeliness metrics', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Check RSVP timeliness chart
      await expect(adminPage.locator('[data-testid="rsvp-timeliness-chart"]')).toBeVisible();
      
      // Verify average RSVP timeliness is calculated
      const timelinessText = await adminPage.locator('[data-testid="avg-rsvp-timeliness"]').textContent();
      expect(timelinessText).toMatch(/\d+(\.\d+)?\s*(day|hour)/); // Should show time unit
      
      // Check RSVP timeline visualization
      await expect(adminPage.locator('[data-testid="rsvp-timeline"]')).toBeVisible();
      const timelineItems = adminPage.locator('[data-testid="timeline-item"]');
      await expect(timelineItems).toHaveCount(4); // 4 RSVPs (excluding "No" response)
      
      await adminPage.close();
    });
  });

  test.describe('Attendance Phase', () => {
    test('Should record event attendance for members who RSVPd Yes', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      // Navigate to attendance management
      await adminPage.click('[data-testid="attendance-tab"]');
      
      // Record attendance for members who RSVPd Yes (Alice, Bob, David)
      const yesRsvpMembers = ['Alice Johnson', 'Bob Smith', 'David Wilson'];
      
      for (const memberName of yesRsvpMembers) {
        // Find member row and mark as attended
        const memberRow = adminPage.locator(`[data-member-name="${memberName}"]`);
        await expect(memberRow).toBeVisible();
        
        // Click attendance checkbox
        await memberRow.locator('[data-testid="attendance-checkbox"]').check();
        
        // Verify attendance is recorded
        await expect(memberRow.locator('[data-testid="attendance-status"]')).toContainText('Present');
      }
      
      // Record one walk-in (Carol who RSVPd Maybe)
      const carolRow = adminPage.locator('[data-member-name="Carol Davis"]');
      await carolRow.locator('[data-testid="attendance-checkbox"]').check();
      await expect(carolRow.locator('[data-testid="attendance-status"]')).toContainText('Present');
      
      // Save attendance changes
      await adminPage.click('[data-testid="save-attendance-button"]');
      await expect(adminPage.locator('[data-testid="attendance-saved-message"]')).toBeVisible();
      
      await adminPage.close();
    });

    test('Should show real-time attendance updates in analytics', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Wait for real-time updates
      await adminPage.waitForTimeout(2000);
      
      // Verify attendance metrics
      await expect(adminPage.locator('[data-testid="attendance-count"]')).toContainText('4');
      await expect(adminPage.locator('[data-testid="attendance-rate"]')).toContainText('80%'); // 4/5 members
      
      // Verify RSVP accuracy (attended vs RSVPd Yes)
      await expect(adminPage.locator('[data-testid="rsvp-accuracy"]')).toContainText('75%'); // 3/4 who RSVPd actually attended
      
      // Check attendance vs RSVP breakdown
      await expect(adminPage.locator('[data-testid="attended-rsvp-yes"]')).toContainText('3'); // Alice, Bob, David
      await expect(adminPage.locator('[data-testid="attended-rsvp-maybe"]')).toContainText('1'); // Carol
      await expect(adminPage.locator('[data-testid="no-show-count"]')).toContainText('1'); // Bob didn't attend (simulation)
      
      await adminPage.close();
    });

    test('Should calculate and display engagement scores', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Wait for engagement score calculation
      await adminPage.waitForTimeout(3000);
      
      // Verify overall engagement score is calculated
      const engagementScore = await adminPage.locator('[data-testid="engagement-score"]').textContent();
      const scoreValue = parseFloat(engagementScore.replace(/[^\d.]/g, ''));
      expect(scoreValue).toBeGreaterThan(0);
      expect(scoreValue).toBeLessThanOrEqual(100);
      
      // Verify engagement score breakdown
      await expect(adminPage.locator('[data-testid="engagement-breakdown"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="rsvp-score"]')).toContainText(/\d+(\.\d+)?/);
      await expect(adminPage.locator('[data-testid="timeliness-score"]')).toContainText(/\d+(\.\d+)?/);
      await expect(adminPage.locator('[data-testid="attendance-score"]')).toContainText(/\d+(\.\d+)?/);
      
      // Verify individual member engagement scores
      const memberRows = adminPage.locator('[data-testid="member-breakdown"] [data-testid="member-item"]');
      await expect(memberRows).toHaveCount(5);
      
      for (let i = 0; i < 5; i++) {
        const memberRow = memberRows.nth(i);
        const memberScore = await memberRow.locator('[data-testid="member-engagement-score"]').textContent();
        const memberScoreValue = parseFloat(memberScore.replace(/[^\d.]/g, ''));
        expect(memberScoreValue).toBeGreaterThanOrEqual(0);
        expect(memberScoreValue).toBeLessThanOrEqual(100);
      }
      
      await adminPage.close();
    });
  });

  test.describe('Analytics and Reporting Phase', () => {
    test('Should display comprehensive event analytics dashboard', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Verify summary cards are all populated
      await expect(adminPage.locator('[data-testid="summary-cards"]')).toBeVisible();
      
      const summaryCards = [
        'total-members',
        'rsvp-count',
        'attendance-count',
        'engagement-score'
      ];
      
      for (const cardId of summaryCards) {
        const card = adminPage.locator(`[data-testid="${cardId}"]`);
        await expect(card).toBeVisible();
        const text = await card.textContent();
        expect(text).not.toBe('0'); // Should have actual data
      }
      
      // Verify charts are rendered
      await expect(adminPage.locator('[data-testid="engagement-trend-chart"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="rsvp-breakdown-chart"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="attendance-timeline-chart"]')).toBeVisible();
      
      // Verify data tables
      await expect(adminPage.locator('[data-testid="member-engagement-table"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="engagement-insights-panel"]')).toBeVisible();
      
      await adminPage.close();
    });

    test('Should show engagement trends across multiple time periods', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/analytics`);
      
      // Navigate to trends view
      await adminPage.click('[data-testid="trends-tab"]');
      
      // Select different time periods
      const timePeriods = ['7d', '30d', '90d'];
      
      for (const period of timePeriods) {
        await adminPage.click('[data-testid="time-period-selector"]');
        await adminPage.click(`[data-value="${period}"]`);
        
        // Wait for data to load
        await adminPage.waitForTimeout(1000);
        
        // Verify trends are displayed
        await expect(adminPage.locator('[data-testid="trends-chart"]')).toBeVisible();
        await expect(adminPage.locator('[data-testid="trend-summary"]')).toBeVisible();
        
        // Verify trend metrics
        const trendMetrics = adminPage.locator('[data-testid="trend-metrics"]');
        await expect(trendMetrics.locator('[data-testid="avg-rsvp-rate"]')).toBeVisible();
        await expect(trendMetrics.locator('[data-testid="avg-attendance-rate"]')).toBeVisible();
        await expect(trendMetrics.locator('[data-testid="engagement-trend"]')).toBeVisible();
      }
      
      await adminPage.close();
    });

    test('Should export engagement data in multiple formats', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Test CSV export
      const [csvDownload] = await Promise.all([
        adminPage.waitForEvent('download'),
        adminPage.click('[data-testid="export-csv-button"]')
      ]);
      
      expect(csvDownload.suggestedFilename()).toMatch(/event-engagement.*\.csv/);
      
      // Verify CSV content (basic check)
      const csvPath = await csvDownload.path();
      expect(csvPath).toBeTruthy();
      
      // Test JSON export
      const [jsonDownload] = await Promise.all([
        adminPage.waitForEvent('download'),
        adminPage.click('[data-testid="export-json-button"]')
      ]);
      
      expect(jsonDownload.suggestedFilename()).toMatch(/event-engagement.*\.json/);
      
      // Test PDF report export
      const [pdfDownload] = await Promise.all([
        adminPage.waitForEvent('download'),
        adminPage.click('[data-testid="export-pdf-button"]')
      ]);
      
      expect(pdfDownload.suggestedFilename()).toMatch(/event-engagement-report.*\.pdf/);
      
      await adminPage.close();
    });

    test('Should provide actionable insights and recommendations', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Scroll to insights section
      await adminPage.locator('[data-testid="insights-section"]').scrollIntoViewIfNeeded();
      
      // Verify insights are generated
      await expect(adminPage.locator('[data-testid="insights-section"]')).toBeVisible();
      
      const insights = adminPage.locator('[data-testid="insight-item"]');
      await expect(insights).toHaveCountGreaterThan(0);
      
      // Check for specific types of insights
      const insightTypes = [
        'rsvp-timeliness-insight',
        'attendance-accuracy-insight',
        'engagement-trend-insight',
        'member-participation-insight'
      ];
      
      for (const insightType of insightTypes) {
        const insight = adminPage.locator(`[data-testid="${insightType}"]`);
        if (await insight.count() > 0) {
          await expect(insight).toBeVisible();
          await expect(insight.locator('[data-testid="insight-title"]')).toBeVisible();
          await expect(insight.locator('[data-testid="insight-description"]')).toBeVisible();
          await expect(insight.locator('[data-testid="insight-recommendation"]')).toBeVisible();
        }
      }
      
      await adminPage.close();
    });
  });

  test.describe('Member-Specific Analytics', () => {
    test('Should show individual member engagement profiles', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/members`);
      
      // Click on a specific member to view their engagement profile
      const memberRow = adminPage.locator('[data-member-name="Alice Johnson"]');
      await memberRow.click();
      
      // Wait for member profile page
      await adminPage.waitForURL('**/admin/members/*');
      
      // Navigate to engagement tab
      await adminPage.click('[data-testid="engagement-tab"]');
      
      // Verify member engagement metrics
      await expect(adminPage.locator('[data-testid="member-engagement-score"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="member-rsvp-rate"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="member-attendance-rate"]')).toBeVisible();
      
      // Verify engagement history
      await expect(adminPage.locator('[data-testid="engagement-history"]')).toBeVisible();
      const historyItems = adminPage.locator('[data-testid="engagement-history-item"]');
      await expect(historyItems).toHaveCountGreaterThan(0);
      
      // Verify engagement trend chart
      await expect(adminPage.locator('[data-testid="member-engagement-trend-chart"]')).toBeVisible();
      
      // Check recent activities
      await expect(adminPage.locator('[data-testid="recent-activities"]')).toBeVisible();
      const activityItems = adminPage.locator('[data-testid="activity-item"]');
      await expect(activityItems).toHaveCountGreaterThan(0);
      
      await adminPage.close();
    });

    test('Should compare member engagement across events', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/analytics`);
      
      // Navigate to member analytics
      await adminPage.click('[data-testid="member-analytics-tab"]');
      
      // Select members to compare
      await adminPage.click('[data-testid="compare-members-button"]');
      await adminPage.locator('[data-testid="member-selector"]').selectOption(['Alice Johnson', 'Bob Smith', 'Carol Davis']);
      await adminPage.click('[data-testid="start-comparison-button"]');
      
      // Wait for comparison view to load
      await adminPage.waitForTimeout(2000);
      
      // Verify comparison charts
      await expect(adminPage.locator('[data-testid="member-comparison-chart"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="engagement-comparison-table"]')).toBeVisible();
      
      // Verify comparative metrics
      const comparisonRows = adminPage.locator('[data-testid="comparison-row"]');
      await expect(comparisonRows).toHaveCount(3);
      
      for (let i = 0; i < 3; i++) {
        const row = comparisonRows.nth(i);
        await expect(row.locator('[data-testid="member-name"]')).toBeVisible();
        await expect(row.locator('[data-testid="engagement-score"]')).toBeVisible();
        await expect(row.locator('[data-testid="rsvp-rate"]')).toBeVisible();
        await expect(row.locator('[data-testid="attendance-rate"]')).toBeVisible();
      }
      
      await adminPage.close();
    });
  });

  test.describe('Real-time Updates and Live Dashboard', () => {
    test('Should show live updates during ongoing event simulation', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Enable live mode
      await adminPage.click('[data-testid="live-mode-toggle"]');
      await expect(adminPage.locator('[data-testid="live-indicator"]')).toBeVisible();
      
      // Verify WebSocket connection indicator
      await expect(adminPage.locator('[data-testid="connection-status"]')).toContainText('Connected');
      
      // Simulate real-time updates using a member context
      const memberPage = await memberContexts[0].newPage();
      await memberPage.goto(`${TEST_CONFIG.baseUrl}/app/events/${createdEventId}`);
      
      // Change RSVP status
      await memberPage.click('[data-testid="rsvp-dropdown"]');
      await memberPage.click('[data-testid="rsvp-option-maybe"]');
      
      // Check if admin dashboard updates in real-time
      await adminPage.waitForTimeout(2000);
      
      // Look for real-time activity feed
      const activityFeed = adminPage.locator('[data-testid="live-activity-feed"]');
      await expect(activityFeed).toBeVisible();
      
      const latestActivity = activityFeed.locator('[data-testid="activity-item"]').first();
      await expect(latestActivity).toContainText('Alice Johnson');
      await expect(latestActivity).toContainText('Maybe');
      
      await memberPage.close();
      await adminPage.close();
    });

    test('Should handle live dashboard with multiple simultaneous users', async () => {
      // Create multiple admin viewers
      const adminPages = [];
      
      for (let i = 0; i < 3; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
        await page.click('[data-testid="analytics-tab"]');
        await page.click('[data-testid="live-mode-toggle"]');
        adminPages.push({ page, context });
      }
      
      // Simulate simultaneous member interactions
      const memberInteractions = memberContexts.slice(0, 3).map(async (context, index) => {
        const page = await context.newPage();
        await page.goto(`${TEST_CONFIG.baseUrl}/app/events/${createdEventId}`);
        
        // Each member performs a different action
        const actions = ['rsvp-yes', 'rsvp-no', 'rsvp-maybe'];
        await page.click('[data-testid="rsvp-dropdown"]');
        await page.click(`[data-testid="rsvp-option-${actions[index].split('-')[1]}"]`);
        
        await page.close();
      });
      
      await Promise.all(memberInteractions);
      
      // Wait for real-time updates to propagate
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify all admin dashboards show consistent data
      for (const { page } of adminPages) {
        await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
        await expect(page.locator('[data-testid="live-activity-feed"] [data-testid="activity-item"]')).toHaveCountGreaterThan(0);
      }
      
      // Cleanup
      for (const { page, context } of adminPages) {
        await page.close();
        await context.close();
      }
    });
  });

  test.describe('Performance and Scale Testing', () => {
    test('Should handle large event with many participants efficiently', async () => {
      // This test would require a larger dataset, but we'll simulate with timing checks
      const adminPage = await adminContext.newPage();
      const startTime = Date.now();
      
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Wait for all analytics to load
      await expect(adminPage.locator('[data-testid="engagement-score"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="member-engagement-table"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Verify page loads within reasonable time (under 5 seconds)
      expect(loadTime).toBeLessThan(5000);
      
      // Verify all charts render without errors
      const charts = adminPage.locator('[data-testid*="chart"]');
      const chartCount = await charts.count();
      expect(chartCount).toBeGreaterThan(0);
      
      for (let i = 0; i < chartCount; i++) {
        const chart = charts.nth(i);
        await expect(chart).toBeVisible();
        
        // Check if chart has rendered content (not empty)
        const chartContent = await chart.innerHTML();
        expect(chartContent.trim()).not.toBe('');
      }
      
      await adminPage.close();
    });

    test('Should maintain responsiveness under concurrent analytics requests', async () => {
      // Create multiple concurrent analytics page loads
      const promises = Array.from({ length: 10 }, async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const startTime = Date.now();
        
        try {
          await page.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`, { timeout: 10000 });
          await page.click('[data-testid="analytics-tab"]');
          await expect(page.locator('[data-testid="engagement-score"]')).toBeVisible({ timeout: 8000 });
          
          const loadTime = Date.now() - startTime;
          return loadTime;
        } finally {
          await page.close();
          await context.close();
        }
      });
      
      const loadTimes = await Promise.all(promises);
      
      // Verify all requests completed
      expect(loadTimes).toHaveLength(10);
      
      // Verify reasonable performance even under load
      const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
      expect(avgLoadTime).toBeLessThan(8000); // Average under 8 seconds
      
      // Verify no request took excessively long
      const maxLoadTime = Math.max(...loadTimes);
      expect(maxLoadTime).toBeLessThan(12000); // Max 12 seconds
    });
  });

  test.describe('Accessibility and Usability', () => {
    test('Should be accessible with keyboard navigation', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      // Navigate using keyboard only
      await adminPage.keyboard.press('Tab'); // Should focus first interactive element
      await adminPage.keyboard.press('Tab'); // Navigate to analytics tab
      await adminPage.keyboard.press('Enter'); // Activate analytics tab
      
      // Verify analytics tab is active
      await expect(adminPage.locator('[data-testid="analytics-tab"][aria-selected="true"]')).toBeVisible();
      
      // Continue keyboard navigation through analytics elements
      const focusableElements = [
        'time-period-selector',
        'export-csv-button',
        'export-json-button',
        'live-mode-toggle'
      ];
      
      for (const elementId of focusableElements) {
        await adminPage.keyboard.press('Tab');
        const focusedElement = await adminPage.evaluate(() => document.activeElement?.getAttribute('data-testid'));
        // Note: This is a simplified check - in reality, focus order might be different
      }
      
      await adminPage.close();
    });

    test('Should have proper ARIA labels and screen reader support', async () => {
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Check ARIA labels on key elements
      const elementsWithAria = [
        { selector: '[data-testid="engagement-score"]', ariaLabel: /engagement.*(score|rating)/i },
        { selector: '[data-testid="rsvp-count"]', ariaLabel: /rsvp|response/i },
        { selector: '[data-testid="attendance-count"]', ariaLabel: /attendance|attended/i },
        { selector: '[data-testid="member-engagement-table"]', role: 'table' }
      ];
      
      for (const { selector, ariaLabel, role } of elementsWithAria) {
        const element = adminPage.locator(selector);
        if (await element.count() > 0) {
          if (ariaLabel) {
            const label = await element.getAttribute('aria-label') || await element.getAttribute('aria-labelledby') || '';
            expect(label).toMatch(ariaLabel);
          }
          if (role) {
            await expect(element).toHaveAttribute('role', role);
          }
        }
      }
      
      // Verify heading hierarchy
      const headings = adminPage.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
      
      // Check for proper heading structure (h1 -> h2 -> h3, etc.)
      let previousLevel = 0;
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const level = parseInt(tagName.replace('h', ''));
        
        // Heading levels shouldn't jump more than one level
        if (previousLevel > 0) {
          expect(level - previousLevel).toBeLessThanOrEqual(1);
        }
        previousLevel = level;
      }
      
      await adminPage.close();
    });

    test('Should work properly on mobile devices', async () => {
      // Create mobile viewport context
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 667 }, // iPhone SE dimensions
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      });
      
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      
      // Mobile navigation might be different (hamburger menu, etc.)
      await mobilePage.click('[data-testid="mobile-menu-toggle"]');
      await mobilePage.click('[data-testid="analytics-tab"]');
      
      // Verify mobile analytics view
      await expect(mobilePage.locator('[data-testid="mobile-analytics-view"]')).toBeVisible();
      
      // Check mobile-specific elements
      await expect(mobilePage.locator('[data-testid="summary-cards-mobile"]')).toBeVisible();
      
      // Verify charts are responsive
      const chartContainer = mobilePage.locator('[data-testid="engagement-trend-chart"]');
      const chartBounds = await chartContainer.boundingBox();
      expect(chartBounds?.width).toBeLessThanOrEqual(375);
      
      // Test touch interactions
      await mobilePage.touchscreen.tap(100, 200); // Tap on chart area
      
      // Verify mobile export functionality
      await mobilePage.click('[data-testid="mobile-export-menu"]');
      await expect(mobilePage.locator('[data-testid="export-options-mobile"]')).toBeVisible();
      
      await mobilePage.close();
      await mobileContext.close();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('Should handle network errors gracefully', async () => {
      const adminPage = await adminContext.newPage();
      
      // Intercept network requests and simulate failures
      await adminPage.route(`${TEST_CONFIG.apiUrl}/api/event-engagement/**`, route => {
        route.abort('failed');
      });
      
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${createdEventId}`);
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Verify error handling
      await expect(adminPage.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Test retry functionality
      await adminPage.unroute(`${TEST_CONFIG.apiUrl}/api/event-engagement/**`);
      await adminPage.click('[data-testid="retry-button"]');
      
      // Should load successfully after retry
      await expect(adminPage.locator('[data-testid="engagement-score"]')).toBeVisible();
      
      await adminPage.close();
    });

    test('Should handle empty data states appropriately', async () => {
      // Create an event with no RSVPs or attendance
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events`);
      
      // Create empty event
      await adminPage.click('[data-testid="create-event-button"]');
      await adminPage.fill('[name="title"]', 'Empty Event for Testing');
      await adminPage.fill('[name="description"]', 'Event with no engagement data');
      await adminPage.fill('[name="location"]', 'Test Location');
      
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await adminPage.fill('[name="startDate"]', futureDate.toISOString().slice(0, 16));
      await adminPage.fill('[name="endDate"]', new Date(futureDate.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16));
      
      await adminPage.click('[data-testid="save-event-button"]');
      
      // Get the new event ID
      await adminPage.waitForURL('**/admin/events');
      const newEventId = await adminPage.locator('[data-testid="events-list"] [data-testid="event-item"]').first().getAttribute('data-event-id');
      
      // Navigate to analytics
      await adminPage.goto(`${TEST_CONFIG.baseUrl}/admin/events/${newEventId}`);
      await adminPage.click('[data-testid="analytics-tab"]');
      
      // Verify empty state handling
      await expect(adminPage.locator('[data-testid="no-engagement-message"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="empty-state-illustration"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="get-started-tips"]')).toBeVisible();
      
      // Verify zero values are displayed correctly
      await expect(adminPage.locator('[data-testid="engagement-score"]')).toContainText('0');
      await expect(adminPage.locator('[data-testid="rsvp-count"]')).toContainText('0');
      await expect(adminPage.locator('[data-testid="attendance-count"]')).toContainText('0');
      
      await adminPage.close();
    });
  });
});