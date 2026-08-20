/**
 * Performance Monitoring Service
 *
 * This service provides performance tracking capabilities for the mobile app.
 * Integrates with Azure Application Insights for production monitoring.
 */

import * as Sentry from '@sentry/react-native';

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService | null = null;
  private initialized: boolean = false;

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      // Performance monitoring initialized with logging-based approach
      // Firebase Performance can be integrated here in the future if needed
      this.initialized = true;

      if (__DEV__) {
        const { logger } = require('../utils/logger');
        logger.info('performance', 'Performance Monitoring Service initialized');
      }
    } catch (error) {
      const { logger } = require('../utils/logger');
      logger.error('performance', 'Failed to initialize Performance Monitoring', error);
    }
  }

  private setupApiPerformanceTracking(): void {
    const originalFetch = window.fetch;

    window.fetch = async (...args: Parameters<typeof originalFetch>) => {
      const url = args[0];
      const startTime = performance.now();

      // Call original fetch
      const response = await originalFetch(...args);

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Log performance metric (would use Firebase Performance in production)
      if (__DEV__) {
        const { logger } = require('../utils/logger');
        logger.info('performance', `API call took ${responseTime}ms`, { url, status: response.status, responseTime });
      }

      return response;
    };
  }

  // Public methods for performance tracking
  public startTrace(name: string): any {
    const startTime = Date.now();

    if (__DEV__) {
      const { logger } = require('../utils/logger');
      logger.info('performance', `Starting trace: ${name}`);
    }

    return {
      name,
      startTime,
      stop: () => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (!__DEV__) {
          try {
            Sentry.addBreadcrumb({
              category: 'performance',
              message: `Performance.${name}`,
              data: { traceName: name, duration },
              level: 'info',
            });
          } catch {
            // Never let telemetry crash the app
          }
        }
      },
    };
  }

  public recordCustomMetric(name: string, value: number): void {
    if (__DEV__) {
      const { logger } = require('../utils/logger');
      logger.info('performance', `Recording metric: ${name}`, { name, value });
    } else {
      try {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `Performance.${name}`,
          data: { metricName: name, value },
          level: 'info',
        });
      } catch {
        // Never let telemetry crash the app
      }
    }
  }

  public stopTrace(trace: any): void {
    // In production, would use: trace.stop();
    if (__DEV__) {
      const { logger } = require('../utils/logger');
      logger.info('performance', `Stopping trace: ${trace.name}`);
    }
  }

  public logPerformanceIssue(context: string, error: Error): void {
    // In production, would use: perf.recordMetric('performance_issue', {...});
    const { logger } = require('../utils/logger');
    logger.error('performance', `Performance issue in ${context}`, error);
  }

  public collectLoadTimeMetrics(): void {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navEntry) {
      // In production, would use: perf.recordMetric('navigation_load_time', navEntry.duration);
      if (__DEV__) {
        const { logger } = require('../utils/logger');
        logger.info('performance', `Navigation load time: ${navEntry.duration}ms`, { duration: navEntry.duration });
      }
    }
  }

  public collectUserInteractionMetrics(action: string, target: string): void {
    // In production, would use: perf.recordMetric('user_interaction', {...});
    if (__DEV__) {
      const { logger } = require('../utils/logger');
      logger.info('performance', `User interaction: ${action}`, { action, target });
    }
  }
}

export default PerformanceMonitoringService;