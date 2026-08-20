/**
 * Global Setup for Mobile Testing
 * Initializes test environment and prepares for mobile testing
 */

import { FullConfig } from '@playwright/test';
import { chromium, Browser } from 'playwright';

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🚀 Setting up Mobile Testing Environment');

  // Create a browser instance for setup
  const browser: Browser = await chromium.launch();

  try {
    // Verify test URLs are accessible
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('📡 Checking web server availability...');
    try {
      await page.goto('http://localhost:3000', { timeout: 30000 });
      console.log('✅ Web client server is accessible');
    } catch (error) {
      console.warn('⚠️ Web client server may not be running on localhost:3000');
    }

    try {
      await page.goto('http://localhost:19006', { timeout: 30000 });
      console.log('✅ Mobile Expo server is accessible');
    } catch (error) {
      console.warn('⚠️ Mobile Expo server may not be running on localhost:19006');
    }

    // Set up test data if needed
    console.log('📝 Preparing test data...');
    
    // Create test directories
    const fs = require('fs');
    const path = require('path');
    
    const resultsDir = path.join(__dirname, 'mobile-test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const screenshotsDir = path.join(resultsDir, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Initialize test metrics
    const testMetrics = {
      startTime: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      configuration: {
        totalProjects: config.projects?.length || 0,
        baseURL: 'http://localhost:3000',
        mobileURL: 'http://localhost:19006'
      }
    };

    fs.writeFileSync(
      path.join(resultsDir, 'test-metrics.json'),
      JSON.stringify(testMetrics, null, 2)
    );

    await context.close();

  } finally {
    await browser.close();
  }

  console.log('✅ Mobile testing environment setup complete');
}

export default globalSetup;