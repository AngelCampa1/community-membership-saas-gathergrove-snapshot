import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enabled?: boolean;
}

// Web Vitals metric type
interface WebVitalsMetric {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  name: string;
  delta: number;
  id: string;
}

// Web Vitals library interface
interface WebVitalsLibrary {
  getCLS: (callback: (metric: WebVitalsMetric) => void) => void;
  getFID: (callback: (metric: WebVitalsMetric) => void) => void;
  getFCP: (callback: (metric: WebVitalsMetric) => void) => void;
  getLCP: (callback: (metric: WebVitalsMetric) => void) => void;
  getTTFB: (callback: (metric: WebVitalsMetric) => void) => void;
}

// Performance Entry types
interface LCPEntry extends PerformanceEntry {
  element?: Element;
  renderTime: number;
  loadTime: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: Array<{
    node?: Node;
    currentRect: DOMRectReadOnly;
    previousRect: DOMRectReadOnly;
  }>;
}

// Window interface extension
declare global {
  interface Window {
    webVitals?: WebVitalsLibrary;
    gtag?: (
      command: string,
      eventName: string,
      params: Record<string, string | number | Record<string, string>>
    ) => void;
  }
}

/**
 * Performance monitoring component for Core Web Vitals
 * Measures and reports key performance metrics for Lighthouse optimization
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onMetricsUpdate,
  enabled = true,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;

    let webVitalsLoaded = false;

    // Load web-vitals library dynamically
    const loadWebVitals = async () => {
      try {
        // Check if web-vitals is already loaded
        if (window.webVitals) {
          webVitalsLoaded = true;
          initializeMetrics();
          return;
        }

        // Load web-vitals from CDN
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js';
        script.onload = () => {
          webVitalsLoaded = true;
          initializeMetrics();
        };
        script.onerror = () => {
          logger.warn('performance', 'Failed to load web-vitals library');
        };
        document.head.appendChild(script);
      } catch (error) {
        logger.warn('performance', 'Error loading web-vitals', { error });
      }
    };

    // Initialize metrics collection
    const initializeMetrics = () => {
      if (!webVitalsLoaded || !window.webVitals) return;

      const { getCLS, getFID, getFCP, getLCP, getTTFB } = window.webVitals;

      // Collect First Contentful Paint
      getFCP((metric: WebVitalsMetric) => {
        setMetrics(prev => {
          const newMetrics = { ...prev, fcp: metric.value };
          onMetricsUpdate?.(newMetrics);
          return newMetrics;
        });

        // Send to analytics
        sendToAnalytics('FCP', metric.value, metric.rating);
      });

      // Collect Largest Contentful Paint
      getLCP((metric: WebVitalsMetric) => {
        setMetrics(prev => {
          const newMetrics = { ...prev, lcp: metric.value };
          onMetricsUpdate?.(newMetrics);
          return newMetrics;
        });

        sendToAnalytics('LCP', metric.value, metric.rating);
      });

      // Collect First Input Delay
      getFID((metric: WebVitalsMetric) => {
        setMetrics(prev => {
          const newMetrics = { ...prev, fid: metric.value };
          onMetricsUpdate?.(newMetrics);
          return newMetrics;
        });

        sendToAnalytics('FID', metric.value, metric.rating);
      });

      // Collect Cumulative Layout Shift
      getCLS((metric: WebVitalsMetric) => {
        setMetrics(prev => {
          const newMetrics = { ...prev, cls: metric.value };
          onMetricsUpdate?.(newMetrics);
          return newMetrics;
        });

        sendToAnalytics('CLS', metric.value, metric.rating);
      });

      // Collect Time to First Byte
      getTTFB((metric: WebVitalsMetric) => {
        setMetrics(prev => {
          const newMetrics = { ...prev, ttfb: metric.value };
          onMetricsUpdate?.(newMetrics);
          return newMetrics;
        });

        sendToAnalytics('TTFB', metric.value, metric.rating);
      });
    };

    // Send metrics to analytics
    const sendToAnalytics = (name: string, value: number, rating: string) => {
      // Send to Google Analytics 4 if available
      if (window.gtag) {
        window.gtag('event', name, {
          event_category: 'Web Vitals',
          event_label: rating,
          value: Math.round(value),
          custom_map: { metric_name: name }
        });
      }

      // Send to custom analytics endpoint
      try {
        fetch('/api/analytics/web-vitals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            value,
            rating,
            url: window.location.href,
            timestamp: Date.now(),
          }),
        }).catch((error) => {
          logger.warn('performance', 'Failed to send analytics data', { error });
        });
      } catch (error) {
        logger.warn('performance', 'Error sending analytics', { error });
      }
    };

    // Additional performance monitoring
    const monitorPerformance = () => {
      // Monitor long tasks
      if ('PerformanceObserver' in window) {
        try {
          const longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) {
                logger.warn('performance', `Long task detected: ${entry.duration}ms`, { duration: entry.duration });
                sendToAnalytics('LongTask', entry.duration, 'poor');
              }
            }
          });
          longTaskObserver.observe({ type: 'longtask', buffered: true });

          // Monitor largest contentful paint element
          const lcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const lastEntry = entry as LCPEntry;
              // LCP element tracking for performance optimization
              if (lastEntry.element && __DEV__) {
                // Development-only element tracking
              }
            }
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

          // Monitor layout shifts
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const layoutShift = entry as LayoutShiftEntry;
              if (!layoutShift.hadRecentInput && layoutShift.value > 0.1) {
                logger.warn('performance', 'Significant layout shift detected', { layoutShiftValue: layoutShift.value });
              }
            }
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });

        } catch (error) {
          logger.warn('performance', 'Error setting up performance observers', { error });
        }
      }

      // Monitor navigation timing
      if ('navigation' in performance) {
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navTiming) {
          const domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart;
          const loadComplete = navTiming.loadEventEnd - navTiming.loadEventStart;
          
          sendToAnalytics('DOMContentLoaded', domContentLoaded, domContentLoaded < 1600 ? 'good' : 'poor');
          sendToAnalytics('LoadComplete', loadComplete, loadComplete < 2500 ? 'good' : 'poor');
        }
      }
    };

    // Start monitoring
    loadWebVitals();
    monitorPerformance();

    return () => {
      // Cleanup observers if needed
    };
  }, [enabled, onMetricsUpdate]);

  // Performance budget warnings
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const checkPerformanceBudget = () => {
      const warnings: string[] = [];

      if (metrics.fcp && metrics.fcp > 1800) {
        warnings.push(`FCP is ${metrics.fcp}ms (target: <1800ms)`);
      }

      if (metrics.lcp && metrics.lcp > 2500) {
        warnings.push(`LCP is ${metrics.lcp}ms (target: <2500ms)`);
      }

      if (metrics.fid && metrics.fid > 100) {
        warnings.push(`FID is ${metrics.fid}ms (target: <100ms)`);
      }

      if (metrics.cls && metrics.cls > 0.1) {
        warnings.push(`CLS is ${metrics.cls} (target: <0.1)`);
      }

      if (warnings.length > 0) {
        logger.warn('performance', 'Performance budget violations', { warnings, metrics });
      }
    };

    checkPerformanceBudget();
  }, [metrics]);

  // Component doesn't render anything visible
  return null;
};

export default PerformanceMonitor;

// Utility function to manually trigger performance measurement
export const measurePerformance = (): Promise<PerformanceMetrics> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || !window.webVitals) {
      resolve({});
      return;
    }

    const metrics: PerformanceMetrics = {};
    let collectedCount = 0;
    const expectedMetrics = 5;

    const checkComplete = () => {
      collectedCount++;
      if (collectedCount >= expectedMetrics) {
        resolve(metrics);
      }
    };

    const { getCLS, getFID, getFCP, getLCP, getTTFB } = window.webVitals;

    getFCP((metric: WebVitalsMetric) => {
      metrics.fcp = metric.value;
      checkComplete();
    });

    getLCP((metric: WebVitalsMetric) => {
      metrics.lcp = metric.value;
      checkComplete();
    });

    getFID((metric: WebVitalsMetric) => {
      metrics.fid = metric.value;
      checkComplete();
    });

    getCLS((metric: WebVitalsMetric) => {
      metrics.cls = metric.value;
      checkComplete();
    });

    getTTFB((metric: WebVitalsMetric) => {
      metrics.ttfb = metric.value;
      checkComplete();
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      resolve(metrics);
    }, 5000);
  });
};