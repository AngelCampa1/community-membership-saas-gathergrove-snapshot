/**
 * Performance Monitoring Utilities
 * 
 * Comprehensive performance monitoring system for tracking
 * application metrics, Core Web Vitals, and user experience.
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  id: string;
  navigationType?: string;
}

interface PerformanceBudget {
  fcp: number; // First Contentful Paint (ms)
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte (ms)
  bundleSize: number; // Bundle size (KB)
  memoryUsage: number; // Memory usage (MB)
}

interface _ResourceTiming {
  name: string;
  type: string;
  size: number;
  duration: number;
  transferSize: number;
  startTime: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private budget: PerformanceBudget;
  private callbacks: Array<(metric: PerformanceMetric) => void> = [];
  private isInitialized = false;

  constructor(budget?: Partial<PerformanceBudget>) {
    this.budget = {
      fcp: 1800, // 1.8s
      lcp: 2500, // 2.5s
      fid: 100,  // 100ms
      cls: 0.1,  // 0.1
      ttfb: 800, // 800ms
      bundleSize: 1024, // 1MB
      memoryUsage: 50,   // 50MB
      ...budget
    };
  }

  /**
   * Initialize performance monitoring
   */
  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.setupWebVitals();
    this.setupResourceTiming();
    this.setupNavigationTiming();
    this.setupMemoryMonitoring();
    this.setupCustomMetrics();

    this.isInitialized = true;

    // SECURITY FIX: Only log in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Performance Monitor initialized');
    }
  }

  /**
   * Setup Web Vitals monitoring
   */
  private setupWebVitals(): void {
    // Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));
  }

  /**
   * Setup resource timing monitoring
   */
  private setupResourceTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      
      entries.forEach(entry => {
        const metric: PerformanceMetric = {
          name: `resource.${this.getResourceType(entry.name)}`,
          value: entry.duration,
          rating: this.getRating('resource', entry.duration),
          timestamp: Date.now(),
          id: entry.name,
          navigationType: entry.initiatorType
        };

        this.addMetric(metric);
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  /**
   * Setup navigation timing monitoring
   */
  private setupNavigationTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceNavigationTiming[];
      
      entries.forEach(entry => {
        // DOM Content Loaded
        const dclMetric: PerformanceMetric = {
          name: 'navigation.domContentLoaded',
          value: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
          rating: this.getRating('dcl', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart),
          timestamp: Date.now(),
          id: 'navigation',
          navigationType: entry.type
        };

        // Load Event
        const loadMetric: PerformanceMetric = {
          name: 'navigation.load',
          value: entry.loadEventEnd - entry.loadEventStart,
          rating: this.getRating('load', entry.loadEventEnd - entry.loadEventStart),
          timestamp: Date.now(),
          id: 'navigation',
          navigationType: entry.type
        };

        this.addMetric(dclMetric);
        this.addMetric(loadMetric);
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1048576; // Convert to MB

      const metric: PerformanceMetric = {
        name: 'memory.used',
        value: usedMB,
        rating: this.getRating('memory', usedMB),
        timestamp: Date.now(),
        id: 'memory'
      };

      this.addMetric(metric);
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  /**
   * Setup custom performance metrics
   */
  private setupCustomMetrics(): void {
    // Time to Interactive (TTI) approximation
    this.measureTTI();
    
    // Long Task monitoring
    this.setupLongTaskMonitoring();
    
    // Bundle size monitoring
    this.measureBundleSize();
  }

  /**
   * Approximate Time to Interactive measurement
   */
  private measureTTI(): void {
    let lastLongTaskTime = 0;
    let isInteractive = false;

    const checkInteractive = () => {
      const now = performance.now();
      
      // If no long tasks in the last 5 seconds, consider interactive
      if (now - lastLongTaskTime > 5000 && !isInteractive) {
        isInteractive = true;
        
        const metric: PerformanceMetric = {
          name: 'tti',
          value: now,
          rating: this.getRating('tti', now),
          timestamp: Date.now(),
          id: 'tti'
        };

        this.addMetric(metric);
      }
    };

    // Update last long task time
    const updateLongTaskTime = () => {
      lastLongTaskTime = performance.now();
    };

    // Listen for long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(() => {
        updateLongTaskTime();
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }

    // Check periodically
    const interval = setInterval(checkInteractive, 1000);
    
    // Clean up after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
    }, 30000);
  }

  /**
   * Setup long task monitoring
   */
  private setupLongTaskMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        const metric: PerformanceMetric = {
          name: 'longtask',
          value: entry.duration,
          rating: 'poor', // Long tasks are always poor
          timestamp: Date.now(),
          id: 'longtask'
        };

        this.addMetric(metric);
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
    this.observers.push(observer);
  }

  /**
   * Measure bundle size
   */
  private measureBundleSize(): void {
    if (!navigator.serviceWorker) return;

    // Use Navigation API to estimate bundle size
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const bundleSize = navigation.transferSize / 1024; // Convert to KB

      const metric: PerformanceMetric = {
        name: 'bundle.size',
        value: bundleSize,
        rating: this.getRating('bundle', bundleSize),
        timestamp: Date.now(),
        id: 'bundle'
      };

      this.addMetric(metric);
    }
  }

  /**
   * Handle Web Vitals metrics
   */
  private handleMetric(metric: any): void {
    const performanceMetric: PerformanceMetric = {
      name: metric.name.toLowerCase(),
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      id: metric.id,
      navigationType: metric.navigationType
    };

    this.addMetric(performanceMetric);
  }

  /**
   * Add metric to collection
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Notify callbacks
    this.callbacks.forEach(callback => callback(metric));

    // Log poor metrics in development
    if (process.env.NODE_ENV === 'development' && metric.rating === 'poor') {
      console.warn(`🐌 Poor performance: ${metric.name} = ${metric.value}`, metric);
    }

    // Limit stored metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  /**
   * Get performance rating based on metric and value
   */
  private getRating(metricType: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    switch (metricType) {
      case 'fcp':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'ttfb':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      case 'tti':
        return value <= 3800 ? 'good' : value <= 7300 ? 'needs-improvement' : 'poor';
      case 'resource':
        return value <= 200 ? 'good' : value <= 1000 ? 'needs-improvement' : 'poor';
      case 'dcl':
      case 'load':
        return value <= 1000 ? 'good' : value <= 2000 ? 'needs-improvement' : 'poor';
      case 'memory':
        return value <= 50 ? 'good' : value <= 100 ? 'needs-improvement' : 'poor';
      case 'bundle':
        return value <= 1024 ? 'good' : value <= 2048 ? 'needs-improvement' : 'poor';
      default:
        return 'good';
    }
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Get all metrics
   */
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Get latest metric by name
   */
  public getLatestMetric(name: string): PerformanceMetric | undefined {
    const metrics = this.getMetricsByName(name);
    return metrics[metrics.length - 1];
  }

  /**
   * Get performance summary
   */
  public getSummary(): {
    coreWebVitals: Record<string, PerformanceMetric | undefined>;
    budgetStatus: Record<string, boolean>;
    poorMetrics: PerformanceMetric[];
    totalMetrics: number;
  } {
    const coreWebVitals = {
      fcp: this.getLatestMetric('fcp'),
      lcp: this.getLatestMetric('lcp'),
      fid: this.getLatestMetric('fid'),
      cls: this.getLatestMetric('cls'),
      ttfb: this.getLatestMetric('ttfb')
    };

    const budgetStatus = {
      fcp: (coreWebVitals.fcp?.value ?? 0) <= this.budget.fcp,
      lcp: (coreWebVitals.lcp?.value ?? 0) <= this.budget.lcp,
      fid: (coreWebVitals.fid?.value ?? 0) <= this.budget.fid,
      cls: (coreWebVitals.cls?.value ?? 0) <= this.budget.cls,
      ttfb: (coreWebVitals.ttfb?.value ?? 0) <= this.budget.ttfb
    };

    const poorMetrics = this.metrics.filter(metric => metric.rating === 'poor');

    return {
      coreWebVitals,
      budgetStatus,
      poorMetrics,
      totalMetrics: this.metrics.length
    };
  }

  /**
   * Subscribe to metric updates
   */
  public subscribe(callback: (metric: PerformanceMetric) => void): () => void {
    this.callbacks.push(callback);
    
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Export metrics as JSON
   */
  public exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getSummary(),
      budget: this.budget,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }, null, 2);
  }

  /**
   * Clean up observers
   */
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.callbacks = [];
    this.metrics = [];
    this.isInitialized = false;
  }
}

// Export class for testing
export { PerformanceMonitor };

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Initialize after page load
  if (document.readyState === 'complete') {
    performanceMonitor.init();
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.init();
    });
  }
}

export default performanceMonitor;