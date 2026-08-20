/**
 * Web Test Template for GatherGrove E2E Testing
 * 
 * Purpose: Comprehensive web testing template using Playwright
 * Platforms: Web (Desktop, Tablet, Mobile viewports)
 * Complexity: Medium
 * Last Updated: 2025-09-10
 * Author: HIVE MIND Coder Delta
 * 
 * Features:
 * - Multi-viewport testing support
 * - Page Object Model integration
 * - Intelligent retry mechanisms
 * - Performance monitoring
 * - Accessibility validation
 * - Screenshot and video capture
 * - Network monitoring
 * - Browser compatibility testing
 */

import { test, expect, devices } from '@playwright/test';
import { TestLogger } from '../../utilities/test-helpers';
import { TestDataFactory } from '../../utilities/data-generators';
import { AssertionHelpers } from '../../utilities/assertion-helpers';
import { PageObjectManager } from '../../page-objects/base-page';

/**
 * Base Web Test Class
 * Extend this class for specific feature testing
 */
export class WebTestTemplate {
    constructor(config = {}) {
        this.config = {
            feature: config.feature || 'unknown-feature',
            priority: config.priority || 'medium',
            tags: config.tags || [],
            timeout: config.timeout || 30000,
            retries: config.retries || 2,
            viewports: config.viewports || ['desktop', 'tablet', 'mobile'],
            browsers: config.browsers || ['chromium'],
            baseUrl: config.baseUrl || process.env.BASE_URL || 'http://localhost:3000',
            ...config
        };
        
        this.logger = new TestLogger(this.config.feature);
        this.dataFactory = new TestDataFactory();
        this.assertions = new AssertionHelpers();
    }

    /**
     * Generate test configurations for multiple viewports and browsers
     */
    getTestConfigurations() {
        const configurations = [];
        
        for (const browser of this.config.browsers) {
            for (const viewport of this.config.viewports) {
                configurations.push({
                    browser,
                    viewport,
                    device: this.getDeviceConfig(viewport),
                    name: `${browser}-${viewport}`
                });
            }
        }
        
        return configurations;
    }

    /**
     * Get device configuration for viewport
     */
    getDeviceConfig(viewport) {
        const deviceConfigs = {
            desktop: { viewport: { width: 1920, height: 1080 } },
            tablet: devices['iPad Pro'],
            mobile: devices['iPhone 12']
        };
        
        return deviceConfigs[viewport] || deviceConfigs.desktop;
    }

    /**
     * Setup test environment and data
     * Override this method in specific test implementations
     */
    async setupTestEnvironment(page, context) {
        // Default setup - override in subclasses
        await this.logger.log('Setting up test environment');
        
        // Setup page monitoring
        await this.setupPageMonitoring(page);
        
        // Setup network monitoring
        await this.setupNetworkMonitoring(page);
        
        // Setup performance monitoring
        await this.setupPerformanceMonitoring(page);
        
        return {
            pages: new PageObjectManager(page, context),
            testData: await this.generateTestData(),
            startTime: Date.now()
        };
    }

    /**
     * Generate test data for the feature
     * Override this method in specific test implementations
     */
    async generateTestData() {
        return await this.dataFactory.generateTestData(this.config.feature);
    }

    /**
     * Setup page monitoring for errors and console logs
     */
    async setupPageMonitoring(page) {
        page.on('pageerror', (error) => {
            this.logger.error('Page error:', error.message);
        });

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                this.logger.error('Console error:', msg.text());
            }
        });

        page.on('requestfailed', (request) => {
            this.logger.warn('Failed request:', request.url());
        });
    }

    /**
     * Setup network monitoring
     */
    async setupNetworkMonitoring(page) {
        const networkLogs = [];
        
        page.on('request', (request) => {
            networkLogs.push({
                type: 'request',
                url: request.url(),
                method: request.method(),
                timestamp: Date.now()
            });
        });

        page.on('response', (response) => {
            networkLogs.push({
                type: 'response',
                url: response.url(),
                status: response.status(),
                timestamp: Date.now()
            });
        });

        // Store network logs for later analysis
        page.networkLogs = networkLogs;
    }

    /**
     * Setup performance monitoring
     */
    async setupPerformanceMonitoring(page) {
        // Performance observer setup
        await page.addInitScript(() => {
            window.performanceMetrics = {
                loadStart: Date.now(),
                metrics: []
            };
            
            // Capture performance metrics
            window.addEventListener('load', () => {
                window.performanceMetrics.loadEnd = Date.now();
                window.performanceMetrics.loadTime = 
                    window.performanceMetrics.loadEnd - window.performanceMetrics.loadStart;
            });
        });
    }

    /**
     * Cleanup after test execution
     */
    async cleanupTestEnvironment(page, context, testInfo) {
        try {
            // Capture artifacts on failure
            if (testInfo && testInfo.status !== 'passed') {
                await this.captureTestArtifacts(page, testInfo);
            }
            
            // Log performance metrics
            await this.logPerformanceMetrics(page);
            
            // Log network activity
            await this.logNetworkActivity(page);
            
            // Cleanup test data if needed
            await this.cleanupTestData();
            
            await this.logger.log('Test cleanup completed');
            
        } catch (error) {
            await this.logger.error('Cleanup error:', error.message);
        }
    }

    /**
     * Capture test artifacts (screenshots, videos, etc.)
     */
    async captureTestArtifacts(page, testInfo) {
        try {
            // Screenshot
            const screenshot = await page.screenshot({ 
                path: `test-results/${testInfo.title}-screenshot.png`,
                fullPage: true 
            });
            
            // Page source
            const pageSource = await page.content();
            require('fs').writeFileSync(
                `test-results/${testInfo.title}-page-source.html`, 
                pageSource
            );
            
            // Network logs
            if (page.networkLogs) {
                require('fs').writeFileSync(
                    `test-results/${testInfo.title}-network-logs.json`,
                    JSON.stringify(page.networkLogs, null, 2)
                );
            }
            
        } catch (error) {
            await this.logger.error('Failed to capture artifacts:', error.message);
        }
    }

    /**
     * Log performance metrics
     */
    async logPerformanceMetrics(page) {
        try {
            const metrics = await page.evaluate(() => window.performanceMetrics);
            
            if (metrics && metrics.loadTime) {
                await this.logger.log(`Page load time: ${metrics.loadTime}ms`);
                
                // Assert performance thresholds
                if (this.config.performanceThresholds) {
                    expect(metrics.loadTime).toBeLessThan(
                        this.config.performanceThresholds.maxLoadTime || 3000
                    );
                }
            }
        } catch (error) {
            await this.logger.error('Failed to log performance metrics:', error.message);
        }
    }

    /**
     * Log network activity
     */
    async logNetworkActivity(page) {
        try {
            if (page.networkLogs) {
                const requests = page.networkLogs.filter(log => log.type === 'request');
                const responses = page.networkLogs.filter(log => log.type === 'response');
                const failedRequests = responses.filter(log => log.status >= 400);
                
                await this.logger.log(`Network activity: ${requests.length} requests, ${failedRequests.length} failures`);
                
                if (failedRequests.length > 0) {
                    await this.logger.warn('Failed requests:', failedRequests);
                }
            }
        } catch (error) {
            await this.logger.error('Failed to log network activity:', error.message);
        }
    }

    /**
     * Cleanup test data
     * Override this method in specific test implementations
     */
    async cleanupTestData() {
        // Default implementation - override in subclasses
        await this.logger.log('Cleaning up test data');
    }

    /**
     * Run accessibility tests
     */
    async runAccessibilityTests(page) {
        try {
            // Inject axe-core for accessibility testing
            await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4.4.2/axe.min.js' });
            
            // Run axe accessibility tests
            const accessibilityResults = await page.evaluate(() => {
                return new Promise((resolve) => {
                    axe.run((err, results) => {
                        if (err) throw err;
                        resolve(results);
                    });
                });
            });
            
            // Assert no violations
            expect(accessibilityResults.violations.length).toBe(0);
            
            await this.logger.log(`Accessibility test passed: ${accessibilityResults.passes.length} checks`);
            
        } catch (error) {
            await this.logger.error('Accessibility test failed:', error.message);
            throw error;
        }
    }

    /**
     * Wait for page to be ready
     */
    async waitForPageReady(page, options = {}) {
        const timeout = options.timeout || this.config.timeout;
        
        try {
            // Wait for network to be idle
            await page.waitForLoadState('networkidle', { timeout });
            
            // Wait for any custom ready indicators
            if (options.readySelector) {
                await page.waitForSelector(options.readySelector, { timeout });
            }
            
            // Wait for JavaScript to be ready
            if (options.waitForJS) {
                await page.waitForFunction(() => document.readyState === 'complete', { timeout });
            }
            
            await this.logger.log('Page ready');
            
        } catch (error) {
            await this.logger.error('Page ready timeout:', error.message);
            throw error;
        }
    }

    /**
     * Execute with retry logic
     */
    async executeWithRetry(action, options = {}) {
        const maxRetries = options.retries || this.config.retries;
        const retryDelay = options.retryDelay || 1000;
        
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await action();
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    await this.logger.warn(`Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms:`, error.message);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }
        
        throw lastError;
    }
}

/**
 * Example Feature Test Implementation
 * Copy and modify this pattern for specific features
 */
export class ExampleFeatureTest extends WebTestTemplate {
    constructor() {
        super({
            feature: 'example-feature',
            priority: 'high',
            tags: ['@smoke', '@regression'],
            performanceThresholds: {
                maxLoadTime: 3000
            }
        });
    }

    async generateTestData() {
        return {
            user: await this.dataFactory.createUser('standard'),
            club: await this.dataFactory.createClub('basic'),
            testScenarios: await this.dataFactory.createScenarios('example-feature')
        };
    }

    async cleanupTestData() {
        // Cleanup example feature test data
        await super.cleanupTestData();
    }
}

/**
 * Test Suite Definition Template
 * Use this pattern to create test suites for specific features
 */
test.describe('Feature Test Suite Template', () => {
    let testTemplate;
    let testEnvironment;
    
    test.beforeAll(async () => {
        testTemplate = new ExampleFeatureTest();
    });

    test.beforeEach(async ({ page, context }) => {
        testEnvironment = await testTemplate.setupTestEnvironment(page, context);
        
        // Navigate to the application
        await page.goto(testTemplate.config.baseUrl);
        await testTemplate.waitForPageReady(page);
    });

    test.afterEach(async ({ page, context }, testInfo) => {
        await testTemplate.cleanupTestEnvironment(page, context, testInfo);
    });

    // Test configurations for multiple viewports
    for (const config of new ExampleFeatureTest().getTestConfigurations()) {
        test.describe(`${config.name} viewport`, () => {
            test.use(config.device);

            test(`Should perform happy path scenario @smoke @high`, async ({ page }) => {
                // TODO: Implement your happy path test steps here
                const { pages, testData } = testEnvironment;
                
                // Example test steps:
                // 1. Navigate to feature page
                await pages.navigation.navigateToFeature();
                
                // 2. Perform primary action
                await pages.featurePage.performPrimaryAction(testData.user);
                
                // 3. Verify expected outcome
                await expect(pages.featurePage.successMessage).toBeVisible();
                
                // 4. Run accessibility tests
                await testTemplate.runAccessibilityTests(page);
            });

            test(`Should handle error conditions @regression @medium`, async ({ page }) => {
                // TODO: Implement your error handling test here
                const { pages, testData } = testEnvironment;
                
                // Test error scenarios with retry logic
                await testTemplate.executeWithRetry(async () => {
                    await pages.featurePage.performInvalidAction();
                    await expect(pages.featurePage.errorMessage).toBeVisible();
                });
            });

            test(`Should meet performance requirements @performance @low`, async ({ page }) => {
                // TODO: Implement your performance test here
                const { pages, testData } = testEnvironment;
                
                const startTime = Date.now();
                await pages.featurePage.performAction(testData.testScenarios.performance);
                const endTime = Date.now();
                
                const duration = endTime - startTime;
                expect(duration).toBeLessThan(testTemplate.config.performanceThresholds.maxLoadTime);
            });
        });
    }
});

/**
 * Export for use in other test files
 */
export { WebTestTemplate as default };

/**
 * Usage Example:
 * 
 * import { WebTestTemplate } from '../templates/test-cases/web-test-template';
 * 
 * class MyFeatureTest extends WebTestTemplate {
 *   constructor() {
 *     super({
 *       feature: 'my-feature',
 *       priority: 'high',
 *       tags: ['@smoke', '@my-feature'],
 *       performanceThresholds: { maxLoadTime: 2000 }
 *     });
 *   }
 * 
 *   async generateTestData() {
 *     return await this.dataFactory.generateTestData('my-feature');
 *   }
 * }
 * 
 * const myTest = new MyFeatureTest();
 * // Use myTest in your test scenarios
 */