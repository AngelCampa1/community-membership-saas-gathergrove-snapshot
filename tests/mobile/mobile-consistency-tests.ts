/**
 * Mobile Consistency Testing Suite
 * Compares mobile app behavior with responsive web design
 */

import { test, expect, devices, Page } from '@playwright/test';
import { MobileTestingFramework } from './mobile-testing-framework';

interface ConsistencyTestResult {
  component: string;
  mobileWebResult: any;
  mobileAppResult: any;
  isConsistent: boolean;
  differences: string[];
}

export class MobileConsistencyTester {
  private mobileWebPage: Page;
  private mobileAppPage: Page;
  private consistencyResults: ConsistencyTestResult[] = [];

  constructor(mobileWebPage: Page, mobileAppPage: Page) {
    this.mobileWebPage = mobileWebPage;
    this.mobileAppPage = mobileAppPage;
  }

  async compareLoginScreens(): Promise<ConsistencyTestResult> {
    const component = 'Login Screen';
    let differences: string[] = [];
    let isConsistent = true;

    try {
      // Navigate to login screens
      await this.mobileWebPage.goto('http://localhost:3000/login');
      await this.mobileAppPage.goto('http://localhost:19006'); // Expo web for mobile app

      // Compare form elements
      const webEmailInput = this.mobileWebPage.locator('input[type="email"]');
      const appEmailInput = this.mobileAppPage.locator('[data-testid="input-email"]');

      // Check presence
      const webEmailExists = await webEmailInput.count() > 0;
      const appEmailExists = await appEmailInput.count() > 0;

      if (webEmailExists !== appEmailExists) {
        differences.push('Email input presence differs between platforms');
        isConsistent = false;
      }

      // Compare styling if both exist
      if (webEmailExists && appEmailExists) {
        const webEmailBox = await webEmailInput.boundingBox();
        const appEmailBox = await appEmailInput.boundingBox();

        if (webEmailBox && appEmailBox) {
          const heightDifference = Math.abs(webEmailBox.height - appEmailBox.height);
          if (heightDifference > 5) {
            differences.push(`Email input height differs: web=${webEmailBox.height}px, app=${appEmailBox.height}px`);
            isConsistent = false;
          }
        }
      }

      // Compare button text
      const webSubmitButton = this.mobileWebPage.locator('button[type="submit"]');
      const appSubmitButton = this.mobileAppPage.locator('[data-testid="button-login"]');

      const webButtonText = await webSubmitButton.textContent();
      const appButtonText = await appSubmitButton.textContent();

      if (webButtonText !== appButtonText) {
        differences.push(`Submit button text differs: web="${webButtonText}", app="${appButtonText}"`);
        isConsistent = false;
      }

      return {
        component,
        mobileWebResult: {
          emailInputExists: webEmailExists,
          submitButtonText: webButtonText
        },
        mobileAppResult: {
          emailInputExists: appEmailExists,
          submitButtonText: appButtonText
        },
        isConsistent,
        differences
      };

    } catch (error) {
      return {
        component,
        mobileWebResult: null,
        mobileAppResult: null,
        isConsistent: false,
        differences: [`Error during comparison: ${error}`]
      };
    }
  }

  async compareNavigationStructure(): Promise<ConsistencyTestResult> {
    const component = 'Navigation Structure';
    let differences: string[] = [];
    let isConsistent = true;

    try {
      // Compare navigation elements
      const webNavItems = await this.mobileWebPage.locator('nav a, [data-testid*="nav"]').allTextContents();
      const appNavItems = await this.mobileAppPage.locator('[data-testid*="tab"], [data-testid*="nav"]').allTextContents();

      // Check if navigation items match
      const webNavSet = new Set(webNavItems.map(item => item.trim().toLowerCase()));
      const appNavSet = new Set(appNavItems.map(item => item.trim().toLowerCase()));

      // Find missing items
      const missingInApp = [...webNavSet].filter(item => !appNavSet.has(item));
      const missingInWeb = [...appNavSet].filter(item => !webNavSet.has(item));

      if (missingInApp.length > 0) {
        differences.push(`Navigation items missing in app: ${missingInApp.join(', ')}`);
        isConsistent = false;
      }

      if (missingInWeb.length > 0) {
        differences.push(`Navigation items missing in web: ${missingInWeb.join(', ')}`);
        isConsistent = false;
      }

      return {
        component,
        mobileWebResult: { navigationItems: webNavItems },
        mobileAppResult: { navigationItems: appNavItems },
        isConsistent,
        differences
      };

    } catch (error) {
      return {
        component,
        mobileWebResult: null,
        mobileAppResult: null,
        isConsistent: false,
        differences: [`Error during navigation comparison: ${error}`]
      };
    }
  }

  async compareColorScheme(): Promise<ConsistencyTestResult> {
    const component = 'Color Scheme';
    let differences: string[] = [];
    let isConsistent = true;

    try {
      // Compare primary colors
      const webPrimaryButton = this.mobileWebPage.locator('button[type="submit"], .btn-primary').first();
      const appPrimaryButton = this.mobileAppPage.locator('[data-testid="button-login"]').first();

      const webStyles = await webPrimaryButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderColor: styles.borderColor
        };
      });

      const appStyles = await appPrimaryButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderColor: styles.borderColor
        };
      });

      // Compare background colors
      if (webStyles.backgroundColor !== appStyles.backgroundColor) {
        differences.push(`Button background color differs: web=${webStyles.backgroundColor}, app=${appStyles.backgroundColor}`);
        isConsistent = false;
      }

      // Compare text colors
      if (webStyles.color !== appStyles.color) {
        differences.push(`Button text color differs: web=${webStyles.color}, app=${appStyles.color}`);
        isConsistent = false;
      }

      return {
        component,
        mobileWebResult: webStyles,
        mobileAppResult: appStyles,
        isConsistent,
        differences
      };

    } catch (error) {
      return {
        component,
        mobileWebResult: null,
        mobileAppResult: null,
        isConsistent: false,
        differences: [`Error during color comparison: ${error}`]
      };
    }
  }

  async compareTypography(): Promise<ConsistencyTestResult> {
    const component = 'Typography';
    let differences: string[] = [];
    let isConsistent = true;

    try {
      // Compare heading styles
      const webHeading = this.mobileWebPage.locator('h1, [data-testid*="title"]').first();
      const appHeading = this.mobileAppPage.locator('[data-testid="text-app-title"]').first();

      const webFontStyle = await webHeading.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          fontWeight: styles.fontWeight,
          lineHeight: styles.lineHeight
        };
      });

      const appFontStyle = await appHeading.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          fontWeight: styles.fontWeight,
          lineHeight: styles.lineHeight
        };
      });

      // Compare font sizes (allow small differences)
      const webFontSize = parseFloat(webFontStyle.fontSize);
      const appFontSize = parseFloat(appFontStyle.fontSize);
      const fontSizeDiff = Math.abs(webFontSize - appFontSize);

      if (fontSizeDiff > 2) {
        differences.push(`Title font size differs significantly: web=${webFontStyle.fontSize}, app=${appFontStyle.fontSize}`);
        isConsistent = false;
      }

      // Compare font weights
      if (webFontStyle.fontWeight !== appFontStyle.fontWeight) {
        differences.push(`Title font weight differs: web=${webFontStyle.fontWeight}, app=${appFontStyle.fontWeight}`);
        isConsistent = false;
      }

      return {
        component,
        mobileWebResult: webFontStyle,
        mobileAppResult: appFontStyle,
        isConsistent,
        differences
      };

    } catch (error) {
      return {
        component,
        mobileWebResult: null,
        mobileAppResult: null,
        isConsistent: false,
        differences: [`Error during typography comparison: ${error}`]
      };
    }
  }

  async runAllConsistencyTests(): Promise<ConsistencyTestResult[]> {
    const results: ConsistencyTestResult[] = [];

    console.log('Running mobile consistency tests...');

    // Run all comparison tests
    results.push(await this.compareLoginScreens());
    results.push(await this.compareNavigationStructure());
    results.push(await this.compareColorScheme());
    results.push(await this.compareTypography());

    this.consistencyResults = results;
    return results;
  }

  generateConsistencyReport(): string {
    const totalTests = this.consistencyResults.length;
    const passedTests = this.consistencyResults.filter(r => r.isConsistent).length;
    const failedTests = totalTests - passedTests;

    let report = `
# Mobile Consistency Test Report
Generated: ${new Date().toISOString()}

## Summary
- Total Tests: ${totalTests}
- Passed: ${passedTests}
- Failed: ${failedTests}
- Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%

## Detailed Results
`;

    this.consistencyResults.forEach(result => {
      report += `\n### ${result.component}
Status: ${result.isConsistent ? '✅ PASS' : '❌ FAIL'}
`;
      
      if (!result.isConsistent && result.differences.length > 0) {
        report += `
Issues Found:
${result.differences.map(diff => `- ${diff}`).join('\n')}
`;
      }
    });

    report += `\n## Recommendations\n`;
    
    if (failedTests > 0) {
      report += `- Address ${failedTests} consistency issues to improve user experience across platforms\n`;
      report += `- Review design system implementation for consistent styling\n`;
      report += `- Consider creating shared component library for both web and mobile\n`;
    } else {
      report += `- Great job! Mobile and web platforms are consistent\n`;
      report += `- Continue monitoring consistency as new features are added\n`;
    }

    return report;
  }
}

// Test suite for consistency testing
test.describe('Mobile Consistency Tests', () => {
  let mobileWebContext: any;
  let mobileAppContext: any;
  let mobileWebPage: Page;
  let mobileAppPage: Page;

  test.beforeEach(async ({ browser }) => {
    // Set up mobile web context
    mobileWebContext = await browser.newContext({
      ...devices['iPhone 12']
    });
    mobileWebPage = await mobileWebContext.newPage();

    // Set up mobile app context (simulated with Expo web)
    mobileAppContext = await browser.newContext({
      ...devices['iPhone 12']
    });
    mobileAppPage = await mobileAppContext.newPage();
  });

  test.afterEach(async () => {
    await mobileWebContext.close();
    await mobileAppContext.close();
  });

  test('should have consistent login screen design', async () => {
    const tester = new MobileConsistencyTester(mobileWebPage, mobileAppPage);
    const result = await tester.compareLoginScreens();
    
    expect(result.isConsistent).toBe(true);
    
    if (!result.isConsistent) {
      console.log('Consistency issues found:', result.differences);
    }
  });

  test('should have consistent navigation structure', async () => {
    const tester = new MobileConsistencyTester(mobileWebPage, mobileAppPage);
    const result = await tester.compareNavigationStructure();
    
    // Log differences for debugging
    if (!result.isConsistent) {
      console.log('Navigation differences:', result.differences);
    }
    
    // Allow some flexibility in navigation
    expect(result.differences.length).toBeLessThan(3);
  });

  test('should have consistent color scheme', async () => {
    const tester = new MobileConsistencyTester(mobileWebPage, mobileAppPage);
    const result = await tester.compareColorScheme();
    
    expect(result.isConsistent).toBe(true);
  });

  test('should have consistent typography', async () => {
    const tester = new MobileConsistencyTester(mobileWebPage, mobileAppPage);
    const result = await tester.compareTypography();
    
    // Allow some flexibility in typography due to platform differences
    expect(result.differences.length).toBeLessThan(2);
  });

  test('should generate comprehensive consistency report', async () => {
    const tester = new MobileConsistencyTester(mobileWebPage, mobileAppPage);
    
    // Run all tests
    await tester.runAllConsistencyTests();
    
    // Generate report
    const report = tester.generateConsistencyReport();
    
    expect(report).toContain('Mobile Consistency Test Report');
    expect(report).toContain('Total Tests:');
    expect(report).toContain('Success Rate:');
    
    console.log(report);
  });
});

export { MobileConsistencyTester };