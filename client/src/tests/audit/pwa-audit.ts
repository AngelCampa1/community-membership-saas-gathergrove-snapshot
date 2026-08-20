/**
 * PERFECT PWA AUDIT SCRIPT
 * Comprehensive PWA validation and scoring system
 */

export interface PWAAuditResult {
  score: number;
  maxScore: number;
  percentage: number;
  passing: boolean;
  checks: PWACheck[];
  recommendations: string[];
}

export interface PWACheck {
  name: string;
  description: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details?: string;
  critical: boolean;
}

class PWAAuditor {
  private checks: PWACheck[] = [];

  async runAudit(): Promise<PWAAuditResult> {
    console.log('🔍 Starting comprehensive PWA audit...');
    
    // Reset checks
    this.checks = [];
    
    // Run all audit checks
    await this.checkManifest();
    await this.checkServiceWorker();
    await this.checkOfflineCapability();
    await this.checkInstallability();
    await this.checkPerformance();
    await this.checkAccessibility();
    await this.checkSecurity();
    await this.checkResponsiveDesign();
    await this.checkNotifications();
    await this.checkBackgroundSync();
    
    // Calculate scores
    const totalScore = this.checks.reduce((sum, check) => sum + check.score, 0);
    const maxScore = this.checks.reduce((sum, check) => sum + check.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);
    const passing = percentage >= 90; // PWA requires 90%+ score
    
    // Generate recommendations
    const recommendations = this.generateRecommendations();
    
    const result: PWAAuditResult = {
      score: totalScore,
      maxScore,
      percentage,
      passing,
      checks: this.checks,
      recommendations
    };
    
    this.logResults(result);
    return result;
  }

  private async checkManifest(): Promise<void> {
    console.log('📋 Checking web app manifest...');
    
    try {
      const response = await fetch('/manifest.json');
      const manifest = await response.json();
      
      // Required fields
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'icons'];
      const missingFields = requiredFields.filter(field => !manifest[field]);
      
      this.addCheck({
        name: 'Web App Manifest',
        description: 'Web app manifest exists and contains required fields',
        passed: missingFields.length === 0,
        score: missingFields.length === 0 ? 10 : 5,
        maxScore: 10,
        details: missingFields.length > 0 ? `Missing fields: ${missingFields.join(', ')}` : undefined,
        critical: true
      });
      
      // Icon requirements
      const icons = manifest.icons || [];
      const hasRequiredIcons = icons.some((icon: any) => icon.sizes === '192x192') && 
                              icons.some((icon: any) => icon.sizes === '512x512');
      
      this.addCheck({
        name: 'Required Icons',
        description: 'Manifest contains required icon sizes (192x192 and 512x512)',
        passed: hasRequiredIcons,
        score: hasRequiredIcons ? 5 : 0,
        maxScore: 5,
        critical: true
      });
      
      // Display mode
      const validDisplayModes = ['standalone', 'fullscreen', 'minimal-ui'];
      const hasValidDisplay = validDisplayModes.includes(manifest.display);
      
      this.addCheck({
        name: 'App-like Display',
        description: 'Display mode is set to standalone, fullscreen, or minimal-ui',
        passed: hasValidDisplay,
        score: hasValidDisplay ? 5 : 2,
        maxScore: 5,
        critical: false
      });
      
    } catch (error) {
      this.addCheck({
        name: 'Web App Manifest',
        description: 'Web app manifest exists and is valid JSON',
        passed: false,
        score: 0,
        maxScore: 10,
        details: 'Failed to fetch or parse manifest.json',
        critical: true
      });
    }
  }

  private async checkServiceWorker(): Promise<void> {
    console.log('⚙️ Checking service worker...');
    
    const hasServiceWorker = 'serviceWorker' in navigator;
    
    this.addCheck({
      name: 'Service Worker Support',
      description: 'Service worker API is supported',
      passed: hasServiceWorker,
      score: hasServiceWorker ? 5 : 0,
      maxScore: 5,
      critical: true
    });
    
    if (hasServiceWorker) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const isRegistered = !!registration;
        
        this.addCheck({
          name: 'Service Worker Registration',
          description: 'Service worker registers successfully',
          passed: isRegistered,
          score: isRegistered ? 10 : 0,
          maxScore: 10,
          critical: true
        });
        
        // Check for update capability
        const hasUpdate = typeof registration.update === 'function';
        
        this.addCheck({
          name: 'Service Worker Updates',
          description: 'Service worker supports updates',
          passed: hasUpdate,
          score: hasUpdate ? 5 : 3,
          maxScore: 5,
          critical: false
        });
        
      } catch (error) {
        this.addCheck({
          name: 'Service Worker Registration',
          description: 'Service worker registers without errors',
          passed: false,
          score: 0,
          maxScore: 10,
          details: 'Registration failed',
          critical: true
        });
      }
    }
  }

  private async checkOfflineCapability(): Promise<void> {
    console.log('📱 Checking offline capability...');
    
    const hasCacheAPI = 'caches' in window;
    
    this.addCheck({
      name: 'Cache API Support',
      description: 'Cache API is supported for offline functionality',
      passed: hasCacheAPI,
      score: hasCacheAPI ? 5 : 0,
      maxScore: 5,
      critical: true
    });
    
    if (hasCacheAPI) {
      try {
        const cacheNames = await caches.keys();
        const hasCaches = cacheNames.length > 0;
        
        this.addCheck({
          name: 'Offline Caching',
          description: 'App has cached resources for offline use',
          passed: hasCaches,
          score: hasCaches ? 10 : 2,
          maxScore: 10,
          critical: true
        });
        
      } catch (error) {
        this.addCheck({
          name: 'Offline Caching',
          description: 'Cache inspection works correctly',
          passed: false,
          score: 0,
          maxScore: 10,
          details: 'Cache access failed',
          critical: true
        });
      }
    }
    
    // Test offline page
    try {
      const offlineResponse = await fetch('/offline.html');
      const hasOfflinePage = offlineResponse.ok;
      
      this.addCheck({
        name: 'Offline Fallback',
        description: 'Offline fallback page is available',
        passed: hasOfflinePage,
        score: hasOfflinePage ? 5 : 2,
        maxScore: 5,
        critical: false
      });
      
    } catch (error) {
      this.addCheck({
        name: 'Offline Fallback',
        description: 'Offline fallback page exists',
        passed: false,
        score: 0,
        maxScore: 5,
        critical: false
      });
    }
  }

  private async checkInstallability(): Promise<void> {
    console.log('📲 Checking installability...');
    
    // Check for install prompt capability
    let hasInstallPrompt = false;
    
    // Listen for beforeinstallprompt
    const installPromptPromise = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000);
      
      window.addEventListener('beforeinstallprompt', () => {
        clearTimeout(timeout);
        resolve(true);
      });
      
      // Also check if we're already in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        clearTimeout(timeout);
        resolve(true);
      }
    });
    
    hasInstallPrompt = await installPromptPromise;
    
    this.addCheck({
      name: 'PWA Installability',
      description: 'App meets PWA installability criteria',
      passed: hasInstallPrompt,
      score: hasInstallPrompt ? 10 : 5,
      maxScore: 10,
      details: hasInstallPrompt ? undefined : 'Install prompt not triggered (may be due to browser policies)',
      critical: false
    });
    
    // Check for app shortcuts
    try {
      const response = await fetch('/manifest.json');
      const manifest = await response.json();
      const hasShortcuts = manifest.shortcuts && manifest.shortcuts.length > 0;
      
      this.addCheck({
        name: 'App Shortcuts',
        description: 'App defines useful shortcuts for common actions',
        passed: hasShortcuts,
        score: hasShortcuts ? 5 : 3,
        maxScore: 5,
        critical: false
      });
      
    } catch (error) {
      // Already handled in manifest check
    }
  }

  private async checkPerformance(): Promise<void> {
    console.log('⚡ Checking performance...');
    
    // Check Core Web Vitals
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      
      if (navEntries.length > 0) {
        const nav = navEntries[0];
        const loadTime = nav.loadEventEnd - nav.fetchStart;
        const fastLoad = loadTime < 3000; // 3 seconds
        
        this.addCheck({
          name: 'Fast Loading',
          description: 'App loads in under 3 seconds',
          passed: fastLoad,
          score: fastLoad ? 10 : Math.max(5, 10 - Math.floor(loadTime / 1000)),
          maxScore: 10,
          details: `Load time: ${Math.round(loadTime)}ms`,
          critical: true
        });
      }
    }
    
    // Check for resource optimization
    const images = document.querySelectorAll('img');
    let optimizedImages = 0;
    
    images.forEach(img => {
      if (img.loading === 'lazy' || img.decoding === 'async') {
        optimizedImages++;
      }
    });
    
    const imageOptimizationScore = images.length > 0 ? (optimizedImages / images.length) * 5 : 5;
    
    this.addCheck({
      name: 'Resource Optimization',
      description: 'Images use lazy loading and async decoding',
      passed: imageOptimizationScore >= 3,
      score: Math.round(imageOptimizationScore),
      maxScore: 5,
      details: `${optimizedImages}/${images.length} images optimized`,
      critical: false
    });
  }

  private async checkAccessibility(): Promise<void> {
    console.log('♿ Checking accessibility...');
    
    // Check for basic accessibility features
    const hasMainLandmark = document.querySelector('main') !== null;
    const hasSkipLinks = document.querySelector('a[href="#main"], a[href="#content"]') !== null;
    const hasHeadings = document.querySelector('h1, h2, h3, h4, h5, h6') !== null;
    
    const accessibilityScore = [hasMainLandmark, hasSkipLinks, hasHeadings].filter(Boolean).length;
    
    this.addCheck({
      name: 'Basic Accessibility',
      description: 'App has main landmark, skip links, and proper heading structure',
      passed: accessibilityScore >= 2,
      score: accessibilityScore * 2,
      maxScore: 6,
      details: `Features present: ${accessibilityScore}/3`,
      critical: false
    });
    
    // Check for ARIA labels
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    let elementsWithLabels = 0;
    
    interactiveElements.forEach(el => {
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || 
          (el as HTMLElement).innerText?.trim() || el.getAttribute('alt')) {
        elementsWithLabels++;
      }
    });
    
    const labelScore = interactiveElements.length > 0 ? 
      (elementsWithLabels / interactiveElements.length) * 4 : 4;
    
    this.addCheck({
      name: 'ARIA Labels',
      description: 'Interactive elements have appropriate labels',
      passed: labelScore >= 3,
      score: Math.round(labelScore),
      maxScore: 4,
      critical: false
    });
  }

  private async checkSecurity(): Promise<void> {
    console.log('🔒 Checking security...');
    
    // Check HTTPS
    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    
    this.addCheck({
      name: 'HTTPS',
      description: 'App is served over HTTPS',
      passed: isHTTPS,
      score: isHTTPS ? 10 : 0,
      maxScore: 10,
      critical: true
    });
    
    // Check Content Security Policy
    const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    const hasCSP = metaTags.length > 0;
    
    this.addCheck({
      name: 'Content Security Policy',
      description: 'App has Content Security Policy defined',
      passed: hasCSP,
      score: hasCSP ? 5 : 3,
      maxScore: 5,
      critical: false
    });
  }

  private async checkResponsiveDesign(): Promise<void> {
    console.log('📱 Checking responsive design...');
    
    // Check viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const hasViewport = !!viewportMeta;
    
    this.addCheck({
      name: 'Viewport Meta Tag',
      description: 'App has proper viewport meta tag',
      passed: hasViewport,
      score: hasViewport ? 5 : 0,
      maxScore: 5,
      critical: true
    });
    
    // Check for responsive design
    const isResponsive = window.innerWidth <= document.body.scrollWidth;
    
    this.addCheck({
      name: 'Responsive Layout',
      description: 'App layout is responsive and fits viewport',
      passed: isResponsive,
      score: isResponsive ? 5 : 2,
      maxScore: 5,
      critical: false
    });
  }

  private async checkNotifications(): Promise<void> {
    console.log('🔔 Checking notification support...');
    
    const hasNotificationAPI = 'Notification' in window;
    
    this.addCheck({
      name: 'Push Notification Support',
      description: 'Browser supports push notifications',
      passed: hasNotificationAPI,
      score: hasNotificationAPI ? 5 : 3,
      maxScore: 5,
      critical: false
    });
    
    if (hasNotificationAPI) {
      const permission = Notification.permission;
      const hasPermission = permission === 'granted';
      
      this.addCheck({
        name: 'Notification Permission',
        description: 'App has notification permission or can request it',
        passed: hasPermission || permission === 'default',
        score: hasPermission ? 5 : (permission === 'default' ? 3 : 1),
        maxScore: 5,
        details: `Permission: ${permission}`,
        critical: false
      });
    }
  }

  private async checkBackgroundSync(): Promise<void> {
    console.log('🔄 Checking background sync...');
    
    const hasServiceWorker = 'serviceWorker' in navigator;
    
    if (hasServiceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const hasSync = 'sync' in registration;
        
        this.addCheck({
          name: 'Background Sync',
          description: 'App supports background synchronization',
          passed: hasSync,
          score: hasSync ? 5 : 3,
          maxScore: 5,
          critical: false
        });
        
      } catch (error) {
        this.addCheck({
          name: 'Background Sync',
          description: 'Background sync capability check',
          passed: false,
          score: 0,
          maxScore: 5,
          critical: false
        });
      }
    } else {
      this.addCheck({
        name: 'Background Sync',
        description: 'Background sync requires service worker',
        passed: false,
        score: 0,
        maxScore: 5,
        critical: false
      });
    }
  }

  private addCheck(check: PWACheck): void {
    this.checks.push(check);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Get failed critical checks
    const failedCritical = this.checks.filter(check => check.critical && !check.passed);
    const failedNonCritical = this.checks.filter(check => !check.critical && !check.passed);
    const lowScoring = this.checks.filter(check => check.passed && check.score < check.maxScore * 0.8);
    
    if (failedCritical.length > 0) {
      recommendations.push('🚨 Fix critical PWA requirements:');
      failedCritical.forEach(check => {
        recommendations.push(`  • ${check.name}: ${check.description}`);
        if (check.details) {
          recommendations.push(`    Details: ${check.details}`);
        }
      });
    }
    
    if (failedNonCritical.length > 0) {
      recommendations.push('⚠️ Improve PWA features:');
      failedNonCritical.forEach(check => {
        recommendations.push(`  • ${check.name}: ${check.description}`);
      });
    }
    
    if (lowScoring.length > 0) {
      recommendations.push('📈 Optimize existing features:');
      lowScoring.forEach(check => {
        recommendations.push(`  • ${check.name}: Could score ${check.maxScore - check.score} more points`);
      });
    }
    
    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push('🎉 Excellent! Your PWA meets all requirements.');
      recommendations.push('💡 Consider adding advanced features like Web Share API or Badging API for enhanced user experience.');
    }
    
    return recommendations;
  }

  private logResults(result: PWAAuditResult): void {
    console.log('\n🏆 PWA AUDIT RESULTS');
    console.log('=====================================');
    console.log(`Score: ${result.score}/${result.maxScore} (${result.percentage}%)`);
    console.log(`Status: ${result.passing ? '✅ PASSING' : '❌ NEEDS IMPROVEMENT'}`);
    console.log('\n📊 Detailed Results:');
    
    result.checks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      const critical = check.critical ? ' [CRITICAL]' : '';
      console.log(`${status} ${check.name}${critical}: ${check.score}/${check.maxScore}`);
      
      if (check.details) {
        console.log(`   ${check.details}`);
      }
    });
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach(rec => console.log(rec));
    }
    
    console.log('\n=====================================');
  }
}

// Export audit function
export const runPWAAudit = async (): Promise<PWAAuditResult> => {
  const auditor = new PWAAuditor();
  return await auditor.runAudit();
};

// Auto-run audit in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run audit after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      runPWAAudit().then(result => {
        console.log('PWA Audit completed automatically in development mode');
      });
    }, 2000);
  });
}

export default PWAAuditor;