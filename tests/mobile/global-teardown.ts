/**
 * Global Teardown for Mobile Testing
 * Cleans up test environment and generates final reports
 */

import { FullConfig } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('🧹 Cleaning up Mobile Testing Environment');

  const resultsDir = path.join(__dirname, 'mobile-test-results');

  try {
    // Update test metrics with completion time
    const metricsPath = path.join(resultsDir, 'test-metrics.json');
    
    if (await fs.access(metricsPath).then(() => true).catch(() => false)) {
      const metrics = JSON.parse(await fs.readFile(metricsPath, 'utf-8'));
      metrics.endTime = new Date().toISOString();
      metrics.duration = new Date().getTime() - new Date(metrics.startTime).getTime();
      
      await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
    }

    // Generate summary report
    await generateSummaryReport(resultsDir);

    console.log('📊 Test results available in: mobile-test-results/');
    console.log('📱 Mobile testing summary generated');

  } catch (error) {
    console.error('❌ Error during teardown:', error);
  }

  console.log('✅ Mobile testing environment cleanup complete');
}

async function generateSummaryReport(resultsDir: string): Promise<void> {
  try {
    const summary = {
      timestamp: new Date().toISOString(),
      testingSuite: 'GatherGrove Mobile Testing',
      description: 'Comprehensive mobile testing across multiple devices and scenarios',
      coverage: {
        devices: ['iPhone 12', 'iPhone SE', 'Samsung Galaxy S21', 'iPad'],
        platforms: ['iOS Safari', 'iOS Chrome', 'Android Chrome'],
        categories: [
          'Authentication Flow',
          'Navigation & Layout',
          'Performance & Loading',
          'Accessibility',
          'Cross-platform Consistency',
          'Bug Detection'
        ]
      },
      features: [
        'Device emulation testing',
        'Touch interaction validation',
        'Responsive design verification',
        'Performance monitoring',
        'Accessibility compliance',
        'Bug detection automation',
        'Cross-platform consistency checks'
      ],
      recommendations: [
        'Run mobile tests on every PR',
        'Monitor performance metrics regularly',
        'Address accessibility issues promptly',
        'Test on real devices periodically',
        'Keep mobile test scenarios updated'
      ]
    };

    await fs.writeFile(
      path.join(resultsDir, 'mobile-testing-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // Generate markdown report
    const markdownReport = `
# GatherGrove Mobile Testing Report

Generated: ${summary.timestamp}

## Overview
Comprehensive mobile testing suite covering authentication, navigation, performance, accessibility, and cross-platform consistency.

## Test Coverage

### Devices Tested
${summary.coverage.devices.map(device => `- ${device}`).join('\n')}

### Platforms Tested
${summary.coverage.platforms.map(platform => `- ${platform}`).join('\n')}

### Test Categories
${summary.coverage.categories.map(category => `- ${category}`).join('\n')}

## Features
${summary.features.map(feature => `- ${feature}`).join('\n')}

## Recommendations
${summary.recommendations.map(rec => `- ${rec}`).join('\n')}

## Files Generated
- \`mobile-test-results.json\` - Detailed test results
- \`mobile-junit-results.xml\` - JUnit format results for CI/CD
- \`screenshots/\` - Failure screenshots and evidence
- \`test-metrics.json\` - Performance and timing metrics

## Next Steps
1. Review failed tests and address issues
2. Update test scenarios based on new features
3. Integrate mobile testing into CI/CD pipeline
4. Schedule regular mobile device testing sessions
`;

    await fs.writeFile(
      path.join(resultsDir, 'MOBILE-TESTING-REPORT.md'),
      markdownReport
    );

  } catch (error) {
    console.error('Error generating summary report:', error);
  }
}

export default globalTeardown;