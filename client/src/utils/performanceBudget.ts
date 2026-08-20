/**
 * Performance Budget Enforcement
 * 
 * Defines and enforces performance budgets for bundle size,
 * Core Web Vitals, and resource loading times.
 */

import { performanceMonitor } from './performanceMonitor';

interface PerformanceBudgetLimits {
  // Bundle size limits (KB)
  bundleSize: {
    initial: number;
    total: number;
    vendor: number;
    css: number;
  };
  
  // Core Web Vitals limits (ms or score)
  coreWebVitals: {
    fcp: number;  // First Contentful Paint
    lcp: number;  // Largest Contentful Paint
    fid: number;  // First Input Delay
    cls: number;  // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
    tti: number;  // Time to Interactive
  };
  
  // Resource loading limits (ms)
  resources: {
    javascript: number;
    css: number;
    images: number;
    fonts: number;
    api: number;
  };
  
  // Memory limits (MB)
  memory: {
    initial: number;
    peak: number;
    growth: number; // Per minute
  };
  
  // Network limits
  network: {
    requests: number;    // Total requests
    transferSize: number; // Total transfer size (KB)
  };
}

interface BudgetViolation {
  metric: string;
  current: number;
  limit: number;
  severity: 'warning' | 'error';
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface BudgetReport {
  passed: boolean;
  score: number; // 0-100
  violations: BudgetViolation[];
  summary: {
    total: number;
    warnings: number;
    errors: number;
  };
}

class PerformanceBudgetEnforcer {
  private limits: PerformanceBudgetLimits;
  private violations: BudgetViolation[] = [];

  constructor(customLimits?: Partial<PerformanceBudgetLimits>) {
    this.limits = {
      bundleSize: {
        initial: 250,  // 250KB
        total: 1024,   // 1MB
        vendor: 512,   // 512KB
        css: 100       // 100KB
      },
      coreWebVitals: {
        fcp: 1800,   // 1.8s
        lcp: 2500,   // 2.5s
        fid: 100,    // 100ms
        cls: 0.1,    // 0.1
        ttfb: 800,   // 800ms
        tti: 3800    // 3.8s
      },
      resources: {
        javascript: 1000, // 1s
        css: 500,         // 500ms
        images: 2000,     // 2s
        fonts: 1000,      // 1s
        api: 5000         // 5s
      },
      memory: {
        initial: 50,  // 50MB
        peak: 100,    // 100MB
        growth: 10    // 10MB per minute
      },
      network: {
        requests: 50,    // 50 requests
        transferSize: 2048 // 2MB
      },
      ...customLimits
    };
  }

  /**
   * Check all performance budgets
   */
  public async checkBudgets(): Promise<BudgetReport> {
    this.violations = [];

    // Check Core Web Vitals
    await this.checkCoreWebVitals();
    
    // Check resource performance
    await this.checkResourcePerformance();
    
    // Check bundle size
    await this.checkBundleSize();
    
    // Check memory usage
    await this.checkMemoryUsage();
    
    // Check network performance
    await this.checkNetworkPerformance();

    return this.generateReport();
  }

  /**
   * Check Core Web Vitals against budget
   */
  private async checkCoreWebVitals(): Promise<void> {
    const summary = performanceMonitor.getSummary();
    const { coreWebVitals } = summary;

    // First Contentful Paint
    if (coreWebVitals.fcp) {
      this.checkMetric(
        'Core Web Vitals - FCP',
        coreWebVitals.fcp.value,
        this.limits.coreWebVitals.fcp,
        'User experience degrades significantly with slow initial content rendering.',
        'Optimize critical rendering path, reduce blocking resources, enable text compression.'
      );
    }

    // Largest Contentful Paint
    if (coreWebVitals.lcp) {
      this.checkMetric(
        'Core Web Vitals - LCP',
        coreWebVitals.lcp.value,
        this.limits.coreWebVitals.lcp,
        'Poor LCP affects perceived loading performance and SEO rankings.',
        'Optimize largest element loading, use better image formats, improve server response times.'
      );
    }

    // First Input Delay
    if (coreWebVitals.fid) {
      this.checkMetric(
        'Core Web Vitals - FID',
        coreWebVitals.fid.value,
        this.limits.coreWebVitals.fid,
        'High FID creates poor interactivity and user frustration.',
        'Reduce JavaScript execution time, use code splitting, optimize event handlers.'
      );
    }

    // Cumulative Layout Shift
    if (coreWebVitals.cls) {
      this.checkMetric(
        'Core Web Vitals - CLS',
        coreWebVitals.cls.value,
        this.limits.coreWebVitals.cls,
        'Layout shifts cause poor user experience and accidental clicks.',
        'Add size attributes to images, avoid dynamically injected content, use transform animations.'
      );
    }

    // Time to First Byte
    if (coreWebVitals.ttfb) {
      this.checkMetric(
        'Core Web Vitals - TTFB',
        coreWebVitals.ttfb.value,
        this.limits.coreWebVitals.ttfb,
        'Slow TTFB indicates server performance issues.',
        'Optimize server response time, use CDN, enable caching, upgrade hosting.'
      );
    }
  }

  /**
   * Check resource loading performance
   */
  private async checkResourcePerformance(): Promise<void> {
    const metrics = performanceMonitor.getMetrics();

    // Group resources by type
    const resourceMetrics = metrics.filter(m => m.name.startsWith('resource.'));

    // Map metric names to limit keys
    type ResourceLimitKey = keyof PerformanceBudgetLimits['resources'];
    const resourceTypeMap: Record<string, { limitKey: ResourceLimitKey; displayName: string }> = {
      'script': { limitKey: 'javascript', displayName: 'script' },
      'stylesheet': { limitKey: 'css', displayName: 'stylesheet' },
      'image': { limitKey: 'images', displayName: 'image' },
      'font': { limitKey: 'fonts', displayName: 'font' },
      'api': { limitKey: 'api', displayName: 'api' },
    };

    Object.entries(resourceTypeMap).forEach(([metricType, config]) => {
      const typeMetrics = resourceMetrics.filter(m => m.name === `resource.${metricType}`);
      if (typeMetrics.length > 0) {
        const avgDuration = typeMetrics.reduce((sum, m) => sum + m.value, 0) / typeMetrics.length;
        const limit = this.limits.resources[config.limitKey];

        this.checkMetric(
          `Resource Performance - ${config.displayName}`,
          avgDuration,
          limit,
          `Slow ${config.displayName} loading affects page performance and user experience.`,
          this.getResourceOptimizationRecommendation(metricType)
        );
      }
    });
  }

  /**
   * Check bundle size budget
   */
  private async checkBundleSize(): Promise<void> {
    // This would typically come from webpack-bundle-analyzer or similar
    // For now, we'll simulate with Navigation API data
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const totalSize = navigation.transferSize / 1024; // Convert to KB
      
      this.checkMetric(
        'Bundle Size - Total',
        totalSize,
        this.limits.bundleSize.total,
        'Large bundle sizes increase loading times and reduce performance.',
        'Implement code splitting, tree shaking, and dynamic imports. Remove unused dependencies.'
      );
    }

    // Check for bundle size via performance entries
    const bundleMetric = performanceMonitor.getLatestMetric('bundle.size');
    if (bundleMetric) {
      this.checkMetric(
        'Bundle Size - Initial',
        bundleMetric.value,
        this.limits.bundleSize.initial,
        'Large initial bundle affects time to interactive.',
        'Split code into smaller chunks, lazy load non-critical features.'
      );
    }
  }

  /**
   * Check memory usage budget
   */
  private async checkMemoryUsage(): Promise<void> {
    const memoryMetrics = performanceMonitor.getMetricsByName('memory.used');
    
    if (memoryMetrics.length > 0) {
      const latestMemory = memoryMetrics[memoryMetrics.length - 1];
      const peakMemory = Math.max(...memoryMetrics.map(m => m.value));
      
      this.checkMetric(
        'Memory Usage - Current',
        latestMemory.value,
        this.limits.memory.initial,
        'High memory usage can cause performance issues and crashes.',
        'Optimize component re-renders, fix memory leaks, use React.memo and useMemo.'
      );

      this.checkMetric(
        'Memory Usage - Peak',
        peakMemory,
        this.limits.memory.peak,
        'Memory spikes indicate potential memory leaks or inefficient code.',
        'Profile memory usage, optimize data structures, implement proper cleanup.'
      );

      // Check memory growth rate
      if (memoryMetrics.length >= 2) {
        const firstMemory = memoryMetrics[0];
        const timeSpan = (latestMemory.timestamp - firstMemory.timestamp) / 60000; // minutes
        const growthRate = (latestMemory.value - firstMemory.value) / timeSpan;
        
        if (growthRate > 0) {
          this.checkMetric(
            'Memory Usage - Growth Rate',
            growthRate,
            this.limits.memory.growth,
            'Continuous memory growth indicates memory leaks.',
            'Identify and fix memory leaks, improve garbage collection efficiency.'
          );
        }
      }
    }
  }

  /**
   * Check network performance budget
   */
  private async checkNetworkPerformance(): Promise<void> {
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    // Check total requests
    this.checkMetric(
      'Network - Total Requests',
      resourceEntries.length,
      this.limits.network.requests,
      'Too many requests increase loading time and server load.',
      'Combine resources, use sprites, implement resource bundling.'
    );

    // Check total transfer size
    const totalTransferSize = resourceEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024; // KB
    
    this.checkMetric(
      'Network - Total Transfer Size',
      totalTransferSize,
      this.limits.network.transferSize,
      'Large transfer sizes increase loading time and bandwidth usage.',
      'Enable compression, optimize images, minify resources.'
    );
  }

  /**
   * Check individual metric against budget
   */
  private checkMetric(
    name: string,
    current: number,
    limit: number,
    impact: string,
    recommendation: string
  ): void {
    if (current > limit) {
      const severity = current >= limit * 1.5 ? 'error' : 'warning';
      const impactLevel = current >= limit * 2 ? 'high' : current >= limit * 1.3 ? 'medium' : 'low';

      this.violations.push({
        metric: name,
        current,
        limit,
        severity,
        impact: impactLevel,
        recommendation: `${impact} ${recommendation}`
      });
    }
  }

  /**
   * Get resource-specific optimization recommendations
   */
  private getResourceOptimizationRecommendation(type: string): string {
    const recommendations = {
      script: 'Minify JavaScript, use code splitting, enable compression, consider moving to CDN.',
      stylesheet: 'Minify CSS, remove unused styles, use critical CSS, enable compression.',
      image: 'Optimize image formats (WebP, AVIF), implement lazy loading, use responsive images.',
      font: 'Use font-display: swap, preload critical fonts, subset fonts, use modern formats.',
      api: 'Optimize API responses, implement caching, use compression, reduce payload size.'
    };
    
    return recommendations[type as keyof typeof recommendations] || 'Optimize resource loading and caching.';
  }

  /**
   * Generate performance budget report
   */
  private generateReport(): BudgetReport {
    const warnings = this.violations.filter(v => v.severity === 'warning').length;
    const errors = this.violations.filter(v => v.severity === 'error').length;
    const total = this.violations.length;
    
    // Calculate score (100 - penalties)
    let score = 100;
    score -= warnings * 5;  // 5 points per warning
    score -= errors * 15;   // 15 points per error
    score = Math.max(0, score);
    
    const passed = errors === 0 && warnings <= 2; // Allow up to 2 warnings

    return {
      passed,
      score,
      violations: this.violations,
      summary: {
        total,
        warnings,
        errors
      }
    };
  }

  /**
   * Get performance budget limits
   */
  public getLimits(): PerformanceBudgetLimits {
    return { ...this.limits };
  }

  /**
   * Update performance budget limits
   */
  public updateLimits(newLimits: Partial<PerformanceBudgetLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
  }

  /**
   * Export budget report as JSON
   */
  public async exportReport(): Promise<string> {
    const report = await this.checkBudgets();
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      limits: this.limits,
      report
    }, null, 2);
  }
}

// Create singleton instance
export const performanceBudget = new PerformanceBudgetEnforcer();

// Export for testing with custom limits
export { PerformanceBudgetEnforcer };

export default performanceBudget;