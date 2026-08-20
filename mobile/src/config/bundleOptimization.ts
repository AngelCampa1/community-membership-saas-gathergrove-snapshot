/**
 * Bundle Optimization Configuration
 * Defines code splitting, lazy loading, and bundle optimization strategies
 */

import { Platform } from 'react-native';
import * as React from 'react';

/**
 * Google Analytics gtag function type
 */
interface GtagFunction {
  (command: 'event', eventName: string, eventParams?: Record<string, unknown>): void;
  (command: string, ...args: unknown[]): void;
}

/**
 * Window with gtag extension
 */
interface WindowWithGtag extends Window {
  gtag?: GtagFunction;
}

/**
 * Bundle chunk metadata
 */
export interface BundleChunk {
  name: string;
  size: number;
}

/**
 * Bundle analysis result
 */
export interface BundleAnalysis {
  totalSize: number;
  chunks: BundleChunk[];
  warnings: string[];
}

/**
 * Performance metrics for bundle monitoring
 */
export interface BundlePerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

export interface LazyLoadConfig {
  threshold: number;
  rootMargin: string;
  enablePreload: boolean;
}

export interface BundleOptimizationConfig {
  enableCodeSplitting: boolean;
  enableLazyLoading: boolean;
  chunkSizeWarning: number; // KB
  maxAssetSize: number; // KB
  lazyLoadConfig: LazyLoadConfig;
  preloadCriticalRoutes: string[];
  deferredComponents: string[];
  excludeFromBundle: string[];
}

/**
 * Get platform-specific optimization configuration
 */
export const getBundleOptimizationConfig = (): BundleOptimizationConfig => {
  const isWeb = Platform.OS === 'web';
  
  return {
    enableCodeSplitting: isWeb,
    enableLazyLoading: isWeb,
    chunkSizeWarning: 244, // 244KB recommended by web.dev
    maxAssetSize: 512, // 512KB max asset size
    
    lazyLoadConfig: {
      threshold: 0.1, // Load when 10% visible
      rootMargin: '50px', // Start loading 50px early
      enablePreload: true,
    },
    
    // Critical routes to preload
    preloadCriticalRoutes: [
      '/dashboard',
      '/events',
      '/profile',
    ],
    
    // Components to lazy load
    deferredComponents: [
      'PayDuesScreen',
      'EventDetailsScreen',
      'EditProfileScreen',
      'MembershipCardScreen',
      'DirectorySettingsScreen',
      'ThemeSettingsScreen',
      'ForgotPasswordScreen',
      'ResetPasswordScreen',
    ],
    
    // Libraries to exclude from main bundle (use CDN or dynamic imports)
    excludeFromBundle: [
      'react-native-vector-icons',
      'react-native-qrcode-svg',
    ],
  };
};

/**
 * Lazy load component with optimization
 */
export const createLazyComponent = <P = Record<string, unknown>>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>
): React.LazyExoticComponent<React.ComponentType<P>> => {
  if (Platform.OS !== 'web') {
    // On native platforms, return the component directly for now
    // In a real implementation, you might use a different lazy loading strategy
    return React.lazy(importFunc);
  }

  const LazyComponent = React.lazy(() => {
    // Add artificial delay in development to test loading states
    if (__DEV__) {
      return new Promise<{ default: React.ComponentType<P> }>(resolve => {
        setTimeout(() => {
          importFunc().then((module) => resolve(module));
        }, 200);
      });
    }

    return importFunc();
  });

  return LazyComponent;
};

/**
 * Preload component for faster navigation
 */
export const preloadComponent = <P = Record<string, unknown>>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  componentName?: string
): Promise<void> => {
  if (Platform.OS !== 'web') {
    return Promise.resolve();
  }

  return importFunc()
    .then(() => {
      // Bundle optimization: ('[BundleOptimization] Component preloaded successfully');
    })
    .catch((error) => {
      const { logger } = require('../utils/logger');
      logger.error('performance', 'Bundle optimization preload failed', error as Error, { componentName: componentName || 'unknown' });
    });
};

/**
 * Dynamic import with retry logic
 */
export const dynamicImport = async <T>(
  importFunc: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await importFunc();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

/**
 * Bundle analyzer helper for development
 */
export const analyzeBundleSize = async (): Promise<BundleAnalysis> => {
  if (!__DEV__ || Platform.OS !== 'web') {
    return { totalSize: 0, chunks: [], warnings: [] };
  }

  try {
    // This would integrate with your bundler's analysis tools
    // For now, return mock data for development
    const mockAnalysis: BundleAnalysis = {
      totalSize: 850, // KB
      chunks: [
        { name: 'main', size: 245 },
        { name: 'vendor', size: 421 },
        { name: 'common', size: 134 },
        { name: 'async-components', size: 50 },
      ],
      warnings: [],
    };

    // Add warnings for large chunks
    const config = getBundleOptimizationConfig();
    mockAnalysis.chunks.forEach((chunk: BundleChunk) => {
      if (chunk.size > config.chunkSizeWarning) {
        mockAnalysis.warnings.push(
          `Chunk '${chunk.name}' (${chunk.size}KB) exceeds recommended size of ${config.chunkSizeWarning}KB`
        );
      }
    });

    if (mockAnalysis.totalSize > config.maxAssetSize) {
      mockAnalysis.warnings.push(
        `Total bundle size (${mockAnalysis.totalSize}KB) exceeds maximum recommended size of ${config.maxAssetSize}KB`
      );
    }

    return mockAnalysis;
  } catch (error) {
    return { totalSize: 0, chunks: [], warnings: ['Analysis failed'] };
  }
};

/**
 * Performance monitoring for bundle optimization
 */
export const monitorBundlePerformance = (): void => {
  if (Platform.OS !== 'web' || !('performance' in window)) {
    return;
  }

  // Monitor loading performance
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    const metrics: BundlePerformanceMetrics = {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
    };

    // Get paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });


    // Bundle optimization: ('Bundle performance metrics:', metrics);

    // Track with analytics if available
    const windowWithGtag = window as WindowWithGtag;
    if (typeof window !== 'undefined' && 'gtag' in window && typeof windowWithGtag.gtag === 'function') {
      windowWithGtag.gtag?.('event', 'bundle_performance', {
        event_category: 'Performance',
        custom_map: {
          dom_content_loaded: metrics.domContentLoaded,
          load_complete: metrics.loadComplete,
          first_paint: metrics.firstPaint,
          first_contentful_paint: metrics.firstContentfulPaint,
        },
      });
    }
  });

  // Monitor resource loading
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'resource') {
        const resourceEntry = entry as PerformanceResourceTiming;

        if (resourceEntry.transferSize > 100000) { // 100KB+
          // Bundle optimization: Large resource detected
          // name: resourceEntry.name
          // size: Math.round(resourceEntry.transferSize / 1024) KB
          // duration: Math.round(resourceEntry.duration) ms
        }
      }
    });
  });

  observer.observe({ entryTypes: ['resource'] });
};

/**
 * Service worker cache optimization
 */
export const optimizeServiceWorkerCache = async (): Promise<void> => {
  if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Configure cache strategies based on bundle optimization
    const config = getBundleOptimizationConfig();
    
    if (registration.active) {
      registration.active.postMessage({
        type: 'OPTIMIZE_CACHE',
        config: {
          preloadRoutes: config.preloadCriticalRoutes,
          maxCacheSize: config.maxAssetSize * 1024, // Convert to bytes
          cacheStrategy: 'stale-while-revalidate',
        },
      });
    }

  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('performance', 'Service worker cache optimization failed', error);
  }
};

// Auto-initialize performance monitoring in development
if (__DEV__ && Platform.OS === 'web') {
  monitorBundlePerformance();
}

export default getBundleOptimizationConfig;