/**
 * Mobile Bug Detection System
 * Automated detection of common mobile-specific bugs and issues
 */

import { Page, BrowserContext } from '@playwright/test';

export interface MobileBug {
  id: string;
  category: 'layout' | 'interaction' | 'performance' | 'accessibility' | 'functionality';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reproduction: string;
  evidence: {
    screenshots: string[];
    metrics?: any;
    consoleLogs?: string[];
  };
  affectedDevices: string[];
  platform: 'mobile-web' | 'mobile-app' | 'both';
}

export class MobileBugDetector {
  private page: Page;
  private context: BrowserContext;
  private detectedBugs: MobileBug[] = [];
  private consoleLogs: string[] = [];

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    
    // Set up console log monitoring
    this.page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        this.consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });
  }

  /**
   * Detect horizontal scrolling issues (common mobile bug)
   */
  async detectHorizontalScrolling(): Promise<MobileBug | null> {
    try {
      const hasHorizontalScroll = await this.page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      if (hasHorizontalScroll) {
        const screenshot = await this.page.screenshot({ fullPage: true });
        
        return {
          id: 'horizontal-scroll-' + Date.now(),
          category: 'layout',
          severity: 'high',
          title: 'Horizontal scrolling detected',
          description: 'Page content extends beyond viewport width, causing horizontal scrolling on mobile devices',
          reproduction: '1. Open page on mobile device\n2. Observe horizontal scrollbar or ability to scroll horizontally',
          evidence: {
            screenshots: [screenshot.toString('base64')],
            metrics: {
              bodyScrollWidth: await this.page.evaluate(() => document.body.scrollWidth),
              viewportWidth: await this.page.evaluate(() => window.innerWidth)
            }
          },
          affectedDevices: ['all mobile devices'],
          platform: 'mobile-web'
        };
      }
    } catch (error) {
      console.error('Error detecting horizontal scrolling:', error);
    }
    return null;
  }

  /**
   * Detect touch target size issues
   */
  async detectTouchTargetIssues(): Promise<MobileBug[]> {
    const bugs: MobileBug[] = [];
    
    try {
      const touchTargets = await this.page.locator('button, a, input[type="submit"], input[type="button"], [role="button"], [onclick]').all();
      
      for (let i = 0; i < touchTargets.length; i++) {
        const element = touchTargets[i];
        const box = await element.boundingBox();
        
        if (box && (box.width < 44 || box.height < 44)) {
          const elementInfo = await element.evaluate((el) => ({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            text: el.textContent?.trim() || ''
          }));

          bugs.push({
            id: `touch-target-${i}-${Date.now()}`,
            category: 'interaction',
            severity: 'medium',
            title: 'Touch target too small',
            description: `Touch target is ${box.width}x${box.height}px, below the recommended 44x44px minimum`,
            reproduction: `1. Navigate to element: ${elementInfo.tagName}${elementInfo.id ? '#' + elementInfo.id : ''}${elementInfo.className ? '.' + elementInfo.className : ''}\n2. Observe small touch target size`,
            evidence: {
              screenshots: [await this.page.screenshot()],
              metrics: {
                width: box.width,
                height: box.height,
                element: elementInfo
              }
            },
            affectedDevices: ['all mobile devices'],
            platform: 'mobile-web'
          });
        }
      }
    } catch (error) {
      console.error('Error detecting touch target issues:', error);
    }
    
    return bugs;
  }

  /**
   * Detect viewport meta tag issues
   */
  async detectViewportIssues(): Promise<MobileBug | null> {
    try {
      const viewportMeta = await this.page.locator('meta[name="viewport"]').getAttribute('content');
      
      if (!viewportMeta) {
        return {
          id: 'missing-viewport-' + Date.now(),
          category: 'layout',
          severity: 'critical',
          title: 'Missing viewport meta tag',
          description: 'Page is missing viewport meta tag, which can cause scaling issues on mobile devices',
          reproduction: '1. Open page on mobile device\n2. Observe content may appear zoomed out or improperly scaled',
          evidence: {
            screenshots: [await this.page.screenshot()]
          },
          affectedDevices: ['all mobile devices'],
          platform: 'mobile-web'
        };
      }

      // Check for problematic viewport settings
      const hasInitialScale = viewportMeta.includes('initial-scale=1');
      const hasWidthDeviceWidth = viewportMeta.includes('width=device-width');
      
      if (!hasInitialScale || !hasWidthDeviceWidth) {
        return {
          id: 'viewport-config-' + Date.now(),
          category: 'layout',
          severity: 'high',
          title: 'Suboptimal viewport configuration',
          description: 'Viewport meta tag is missing essential properties for mobile optimization',
          reproduction: '1. Open page on mobile device\n2. May observe scaling or layout issues',
          evidence: {
            screenshots: [await this.page.screenshot()],
            metrics: { currentViewport: viewportMeta }
          },
          affectedDevices: ['all mobile devices'],
          platform: 'mobile-web'
        };
      }
    } catch (error) {
      console.error('Error detecting viewport issues:', error);
    }
    
    return null;
  }

  /**
   * Detect keyboard overlay issues
   */
  async detectKeyboardOverlayIssues(): Promise<MobileBug[]> {
    const bugs: MobileBug[] = [];
    
    try {
      const inputs = await this.page.locator('input[type="text"], input[type="email"], input[type="password"], textarea').all();
      
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        
        // Focus on input to trigger virtual keyboard
        await input.focus();
        await this.page.waitForTimeout(500); // Wait for keyboard animation
        
        // Check if submit button or important elements are still accessible
        const submitButton = this.page.locator('button[type="submit"]').first();
        const isSubmitVisible = await submitButton.isVisible();
        
        if (!isSubmitVisible) {
          bugs.push({
            id: `keyboard-overlay-${i}-${Date.now()}`,
            category: 'interaction',
            severity: 'high',
            title: 'Submit button hidden by virtual keyboard',
            description: 'Virtual keyboard overlay hides the submit button, preventing form submission',
            reproduction: '1. Focus on input field\n2. Observe submit button becomes inaccessible',
            evidence: {
              screenshots: [await this.page.screenshot()]
            },
            affectedDevices: ['mobile devices with virtual keyboards'],
            platform: 'mobile-web'
          });
        }
        
        // Blur the input to dismiss keyboard
        await input.blur();
        await this.page.waitForTimeout(300);
      }
    } catch (error) {
      console.error('Error detecting keyboard overlay issues:', error);
    }
    
    return bugs;
  }

  /**
   * Detect performance issues
   */
  async detectPerformanceIssues(): Promise<MobileBug[]> {
    const bugs: MobileBug[] = [];
    
    try {
      // Measure load performance
      const startTime = Date.now();
      await this.page.reload();
      await this.page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;
      
      if (loadTime > 5000) {
        bugs.push({
          id: 'slow-load-' + Date.now(),
          category: 'performance',
          severity: 'high',
          title: 'Slow page load time',
          description: `Page takes ${loadTime}ms to load, which is too slow for mobile users`,
          reproduction: '1. Open page on mobile device\n2. Observe slow loading',
          evidence: {
            screenshots: [await this.page.screenshot()],
            metrics: { loadTime }
          },
          affectedDevices: ['all mobile devices'],
          platform: 'mobile-web'
        });
      }

      // Check for large images without optimization
      const images = await this.page.locator('img').all();
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const src = await img.getAttribute('src');
        const naturalDimensions = await img.evaluate((el: HTMLImageElement) => ({
          naturalWidth: el.naturalWidth,
          naturalHeight: el.naturalHeight
        }));
        
        // Check if image is very large
        if (naturalDimensions.naturalWidth > 2000 || naturalDimensions.naturalHeight > 2000) {
          bugs.push({
            id: `large-image-${i}-${Date.now()}`,
            category: 'performance',
            severity: 'medium',
            title: 'Large unoptimized image detected',
            description: `Image ${src} is ${naturalDimensions.naturalWidth}x${naturalDimensions.naturalHeight}px, which may slow loading on mobile`,
            reproduction: '1. Load page on slow mobile connection\n2. Observe slow image loading',
            evidence: {
              screenshots: [await this.page.screenshot()],
              metrics: naturalDimensions
            },
            affectedDevices: ['mobile devices on slow connections'],
            platform: 'mobile-web'
          });
        }
      }
    } catch (error) {
      console.error('Error detecting performance issues:', error);
    }
    
    return bugs;
  }

  /**
   * Detect accessibility issues
   */
  async detectAccessibilityIssues(): Promise<MobileBug[]> {
    const bugs: MobileBug[] = [];
    
    try {
      // Check for missing alt attributes on images
      const imagesWithoutAlt = await this.page.locator('img:not([alt])').count();
      if (imagesWithoutAlt > 0) {
        bugs.push({
          id: 'missing-alt-' + Date.now(),
          category: 'accessibility',
          severity: 'medium',
          title: 'Images missing alt attributes',
          description: `${imagesWithoutAlt} images are missing alt attributes, affecting screen reader users`,
          reproduction: '1. Use screen reader on mobile device\n2. Navigate to images without descriptions',
          evidence: {
            screenshots: [await this.page.screenshot()],
            metrics: { imagesWithoutAlt }
          },
          affectedDevices: ['all mobile devices with screen readers'],
          platform: 'mobile-web'
        });
      }

      // Check for form labels
      const inputsWithoutLabels = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
        let count = 0;
        
        inputs.forEach((input: any) => {
          const hasLabel = input.labels && input.labels.length > 0;
          const hasAriaLabel = input.getAttribute('aria-label');
          const hasPlaceholder = input.getAttribute('placeholder');
          
          if (!hasLabel && !hasAriaLabel && !hasPlaceholder) {
            count++;
          }
        });
        
        return count;
      });

      if (inputsWithoutLabels > 0) {
        bugs.push({
          id: 'missing-labels-' + Date.now(),
          category: 'accessibility',
          severity: 'high',
          title: 'Form inputs missing labels',
          description: `${inputsWithoutLabels} form inputs are missing proper labels, affecting screen reader navigation`,
          reproduction: '1. Use screen reader on mobile device\n2. Navigate through form inputs\n3. Observe missing descriptions',
          evidence: {
            screenshots: [await this.page.screenshot()],
            metrics: { inputsWithoutLabels }
          },
          affectedDevices: ['all mobile devices with screen readers'],
          platform: 'mobile-web'
        });
      }
    } catch (error) {
      console.error('Error detecting accessibility issues:', error);
    }
    
    return bugs;
  }

  /**
   * Run comprehensive bug detection
   */
  async runAllDetections(): Promise<MobileBug[]> {
    console.log('Running comprehensive mobile bug detection...');
    
    const bugs: MobileBug[] = [];
    
    // Run all detection methods
    const horizontalScrollBug = await this.detectHorizontalScrolling();
    if (horizontalScrollBug) bugs.push(horizontalScrollBug);
    
    bugs.push(...await this.detectTouchTargetIssues());
    
    const viewportBug = await this.detectViewportIssues();
    if (viewportBug) bugs.push(viewportBug);
    
    bugs.push(...await this.detectKeyboardOverlayIssues());
    bugs.push(...await this.detectPerformanceIssues());
    bugs.push(...await this.detectAccessibilityIssues());
    
    this.detectedBugs = bugs;
    console.log(`Detected ${bugs.length} mobile issues`);
    
    return bugs;
  }

  /**
   * Generate bug report
   */
  generateBugReport(): string {
    const criticalBugs = this.detectedBugs.filter(bug => bug.severity === 'critical');
    const highBugs = this.detectedBugs.filter(bug => bug.severity === 'high');
    const mediumBugs = this.detectedBugs.filter(bug => bug.severity === 'medium');
    const lowBugs = this.detectedBugs.filter(bug => bug.severity === 'low');

    let report = `
# Mobile Bug Detection Report
Generated: ${new Date().toISOString()}

## Summary
- Total Issues: ${this.detectedBugs.length}
- Critical: ${criticalBugs.length}
- High: ${highBugs.length}
- Medium: ${mediumBugs.length}
- Low: ${lowBugs.length}

## Critical Issues (Fix Immediately)
`;
    
    criticalBugs.forEach(bug => {
      report += `
### ${bug.title}
- **Category:** ${bug.category}
- **Description:** ${bug.description}
- **Affected Devices:** ${bug.affectedDevices.join(', ')}
- **Platform:** ${bug.platform}

**Reproduction Steps:**
${bug.reproduction}
`;
    });

    report += `\n## High Priority Issues\n`;
    highBugs.forEach(bug => {
      report += `
### ${bug.title}
- **Category:** ${bug.category}
- **Description:** ${bug.description}
- **Platform:** ${bug.platform}
`;
    });

    report += `\n## Medium Priority Issues\n`;
    mediumBugs.forEach(bug => {
      report += `
### ${bug.title}
- **Category:** ${bug.category}
- **Description:** ${bug.description}
`;
    });

    if (this.consoleLogs.length > 0) {
      report += `\n## Console Errors/Warnings\n`;
      this.consoleLogs.forEach(log => {
        report += `- ${log}\n`;
      });
    }

    report += `\n## Recommendations\n`;
    if (criticalBugs.length > 0) {
      report += `- Address ${criticalBugs.length} critical issues immediately before production release\n`;
    }
    if (highBugs.length > 0) {
      report += `- Fix ${highBugs.length} high priority issues for better mobile user experience\n`;
    }
    if (mediumBugs.length > 0) {
      report += `- Consider addressing ${mediumBugs.length} medium priority issues in next sprint\n`;
    }
    
    report += `- Implement automated mobile testing in CI/CD pipeline\n`;
    report += `- Regular mobile device testing across different screen sizes\n`;
    report += `- Performance monitoring for mobile users\n`;

    return report;
  }

  /**
   * Get bugs by category
   */
  getBugsByCategory(category: MobileBug['category']): MobileBug[] {
    return this.detectedBugs.filter(bug => bug.category === category);
  }

  /**
   * Get bugs by severity
   */
  getBugsBySeverity(severity: MobileBug['severity']): MobileBug[] {
    return this.detectedBugs.filter(bug => bug.severity === severity);
  }
}

export default MobileBugDetector;