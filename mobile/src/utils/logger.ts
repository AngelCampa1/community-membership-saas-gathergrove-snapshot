/**
 * Centralized logging service for GatherGrove Mobile
 * Prevents console statements from leaking to production
 * Integrates with Application Insights / Firebase Analytics for production monitoring
 */

import * as Sentry from '@sentry/react-native';

type LogCategory = 'app' | 'auth' | 'events' | 'members' | 'notifications' | 'performance' | 'security' | 'ui' | 'network' | 'sso';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  clubId?: string;
  [key: string]: unknown;
}

class Logger {
  /**
   * Debug level logging - only shown in development
   */
  debug(category: LogCategory, message: string, context?: LogContext) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] [${category}] ${message}`, context || '');
    }
  }

  /**
   * Info level logging - shown in development, sent to monitoring in production
   */
  info(category: LogCategory, message: string, context?: LogContext) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info(`[INFO] [${category}] ${message}`, context || '');
    } else {
      // In production, send to analytics
      this.trackEvent(category, message, context);
    }
  }

  /**
   * Warning level logging - shown in development, sent to monitoring in production
   */
  warn(category: LogCategory, message: string, context?: LogContext) {
    if (__DEV__) {
      console.warn(`[WARN] [${category}] ${message}`, context || '');
    } else {
      this.trackEvent(category, message, { ...context, level: 'warning' });
    }
  }

  /**
   * Error level logging - always logged, sent to monitoring in production
   */
  error(category: LogCategory, message: string, error?: Error | unknown, context?: LogContext) {
    const errorObj = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error;

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] [${category}] ${message}`, errorObj, context || '');
    } else {
      this.trackError(category, message, errorObj, context);
    }
  }

  /**
   * Track custom events to analytics
   */
  private trackEvent(category: string, eventName: string, properties?: Record<string, unknown>) {
    try {
      Sentry.addBreadcrumb({
        category,
        message: eventName,
        data: properties,
        level: 'info',
      });
    } catch {
      // Never let telemetry crash the app
    }
  }

  /**
   * Track errors to analytics
   */
  private trackError(category: string, message: string, error: unknown, context?: LogContext) {
    try {
      Sentry.withScope((scope) => {
        scope.setContext('logContext', { category, message, ...context });
        const isErrorLike = error &&
          typeof error === 'object' &&
          ('message' in error || 'stack' in error || (error as { constructor?: { name?: string } }).constructor?.name === 'Error');

        const errorToTrack = isErrorLike
          ? (error as Error)
          : typeof error === 'string'
            ? new Error(error)
            : new Error(JSON.stringify(error));

        Sentry.captureException(errorToTrack);
      });
    } catch {
      // Never let telemetry crash the app
    }
  }

  /**
   * Log performance metrics
   */
  performance(name: string, duration: number, context?: LogContext) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[PERF] ${name}: ${duration}ms`, context || '');
    } else {
      this.trackEvent('performance', name, { duration, ...context });
    }
  }

  /**
   * Log network requests
   */
  network(method: string, url: string, status?: number, duration?: number, context?: LogContext) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      const logFn = status && status >= 400 ? console.error : console.log;
      logFn(`[NETWORK] ${method} ${url}`, { status, duration, ...context });
    } else if (status && status >= 400) {
      this.trackEvent('network', `${method} ${url}`, { status, duration, ...context });
    }
  }
}

export const logger = new Logger();
export default logger;
