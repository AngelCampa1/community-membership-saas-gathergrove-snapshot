/**
 * Centralized logging service for GatherGrove
 * Prevents console statements from leaking to production
 * Integrates with Sentry for production error monitoring
 */

type _LogLevel = 'debug' | 'info' | 'warn' | 'error'; // For future log level filtering

interface LogContext {
  component?: string;
  action?: string;
  userId?: string | number;
  clubId?: string | number;
  [key: string]: unknown;
}

type SentryModule = typeof import('@sentry/nextjs');

let sentryModulePromise: Promise<SentryModule> | null = null;

function shouldUseSentry(): boolean {
  return process.env.NODE_ENV === 'test' ||
    Boolean(process.env.JEST_WORKER_ID) ||
    (process.env.NODE_ENV === 'production' && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN));
}

function loadSentry(): Promise<SentryModule> {
  sentryModulePromise ??= import('@sentry/nextjs');
  return sentryModulePromise;
}

function withSentry(callback: (sentry: SentryModule) => void): void {
  if (!shouldUseSentry()) {
    return;
  }

  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    try {
      const sentryPackage = '@sentry/' + 'nextjs';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      callback(require(sentryPackage) as SentryModule);
    } catch {
      // Never let telemetry break the app
    }

    return;
  }

  void loadSentry()
    .then((Sentry) => {
      try {
        callback(Sentry);
      } catch {
        // Never let telemetry break the app
      }
    })
    .catch(() => {
      // Never let telemetry break the app
    });
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Debug level logging - only shown in development
   * Supports two calling patterns:
   * - debug(message, context?) - simple debug
   * - debug(category, message, context?) - categorized debug
   */
  debug(messageOrCategory: string, contextOrMessage?: LogContext | string, context?: LogContext) {
    let message: string;
    let category: string | undefined;
    let logContext: LogContext | undefined;

    if (typeof contextOrMessage === 'string') {
      // Called as debug(category, message, context?)
      category = messageOrCategory;
      message = contextOrMessage;
      logContext = context;
    } else {
      // Called as debug(message, context?)
      message = messageOrCategory;
      logContext = contextOrMessage;
    }

    const fullMessage = category ? `[${category}] ${message}` : message;

    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${fullMessage}`, logContext || '');
    }
  }

  /**
   * Info level logging - shown in development, sent to monitoring in production
   * Supports two calling patterns:
   * - info(message, context?) - simple info
   * - info(category, message, context?) - categorized info
   */
  info(messageOrCategory: string, contextOrMessage?: LogContext | string, context?: LogContext) {
    let message: string;
    let category: string | undefined;
    let logContext: LogContext | undefined;

    if (typeof contextOrMessage === 'string') {
      // Called as info(category, message, context?)
      category = messageOrCategory;
      message = contextOrMessage;
      logContext = context;
    } else {
      // Called as info(message, context?)
      message = messageOrCategory;
      logContext = contextOrMessage;
    }

    const fullMessage = category ? `[${category}] ${message}` : message;

    if (this.isDevelopment) {
      console.info(`[INFO] ${fullMessage}`, logContext || '');
    } else if (this.isProduction) {
      withSentry((Sentry) => {
        Sentry.addBreadcrumb({
          category: 'info',
          message: fullMessage,
          data: logContext,
          level: 'info',
        });
      });
    }
  }

  /**
   * Warning level logging - shown in development, sent to monitoring in production
   * Supports two calling patterns:
   * - warn(message, context?) - simple warning
   * - warn(category, message, context?) - categorized warning
   */
  warn(messageOrCategory: string, contextOrMessage?: LogContext | string, context?: LogContext) {
    let message: string;
    let category: string | undefined;
    let logContext: LogContext | undefined;

    if (typeof contextOrMessage === 'string') {
      // Called as warn(category, message, context?)
      category = messageOrCategory;
      message = contextOrMessage;
      logContext = context;
    } else {
      // Called as warn(message, context?)
      message = messageOrCategory;
      logContext = contextOrMessage;
    }

    const fullMessage = category ? `[${category}] ${message}` : message;

    if (this.isDevelopment) {
      console.warn(`[WARN] ${fullMessage}`, logContext || '');
    } else if (this.isProduction) {
      withSentry((Sentry) => {
        Sentry.addBreadcrumb({
          category: 'warning',
          message: fullMessage,
          data: logContext,
          level: 'warning',
        });
      });
    }
  }

  /**
   * Error level logging - always logged and sent to monitoring
   * Supports multiple calling patterns:
   * - error(message) - simple error message
   * - error(message, error) - error with Error object
   * - error(message, context) - error with context
   * - error(message, error, context) - full form
   * - error(category, message, context?) - categorized error (when 2nd arg is string)
   */
  error(messageOrCategory: string, errorOrMessageOrContext?: Error | unknown | string | LogContext, contextOrError?: LogContext | Error | unknown) {
    let message: string;
    let category: string | undefined;
    let errorObj: Error | undefined;
    let logContext: LogContext | undefined;

    if (typeof errorOrMessageOrContext === 'string') {
      // Called as error(category, message, context?)
      category = messageOrCategory;
      message = errorOrMessageOrContext;
      // Third argument could be context or undefined
      if (contextOrError && typeof contextOrError === 'object' && !(contextOrError instanceof Error)) {
        logContext = contextOrError as LogContext;
      } else if (contextOrError instanceof Error) {
        errorObj = contextOrError;
      }
    } else {
      // Called as error(message, ...) - original patterns
      message = messageOrCategory;

      if (errorOrMessageOrContext instanceof Error) {
        errorObj = errorOrMessageOrContext;
        if (contextOrError && typeof contextOrError === 'object' && !(contextOrError instanceof Error)) {
          logContext = contextOrError as LogContext;
        }
      } else if (errorOrMessageOrContext && typeof errorOrMessageOrContext === 'object') {
        // Could be LogContext or an error-like object
        if ('message' in errorOrMessageOrContext && 'stack' in errorOrMessageOrContext) {
          // Looks like an error
          errorObj = new Error(String((errorOrMessageOrContext as { message: string }).message));
        } else {
          // Treat as context
          logContext = errorOrMessageOrContext as LogContext;
        }
      }
    }

    const fullMessage = category ? `[${category}] ${message}` : message;
    const finalError = errorObj || new Error(fullMessage);

    if (this.isDevelopment) {
      if (errorObj) {
        console.error(`[ERROR] ${fullMessage}`, errorObj, logContext || '');
      } else {
        console.error(`[ERROR] ${fullMessage}`, logContext || '');
      }
    }

    if (this.isProduction) {
      withSentry((Sentry) => {
        Sentry.captureException(finalError, {
          extra: {
            message: fullMessage,
            category,
            ...logContext,
          },
        });
      });
    }
  }

  /**
   * Performance tracking
   */
  performance(name: string, duration: number, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[PERF] ${name}: ${duration}ms`, context || '');
    } else if (this.isProduction) {
      withSentry((Sentry) => {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: name,
          data: { duration, ...context },
          level: 'info',
        });
      });
    }
  }

  /**
   * Track user events
   */
  event(eventName: string, properties?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[EVENT] ${eventName}`, properties || '');
    } else if (this.isProduction) {
      withSentry((Sentry) => {
        Sentry.addBreadcrumb({
          category: 'event',
          message: eventName,
          data: properties,
          level: 'info',
        });
      });
    }
  }

  /**
   * Track page views
   */
  pageView(pageName: string, url?: string, properties?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[PAGEVIEW] ${pageName}`, url, properties || '');
    } else if (this.isProduction) {
      withSentry((Sentry) => {
        Sentry.addBreadcrumb({
          category: 'navigation',
          message: pageName,
          data: { url, ...properties },
          level: 'info',
        });
      });
    }
  }

  /**
   * Start a timer for performance tracking
   */
  startTimer(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.performance(name, duration);
    };
  }

  /**
   * Group logs together (development only)
   */
  group(label: string, callback: () => void) {
    if (this.isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }

  /**
   * Log API calls
   */
  api(method: string, url: string, status?: number, duration?: number, context?: LogContext) {
    const message = `${method} ${url}${status ? ` [${status}]` : ''}${duration ? ` (${duration}ms)` : ''}`;

    if (this.isDevelopment) {
      const logFn = status && status >= 400 ? console.error : console.log;
      logFn(`[API] ${message}`, context || '');
    } else if (this.isProduction) {
      withSentry((Sentry) => {
        Sentry.addBreadcrumb({
          category: 'http',
          message,
          data: {
            url,
            method,
            status_code: status,
            duration,
            ...context,
          },
          level: status && status >= 400 ? 'error' : 'info',
        });
      });
    }
  }

  /**
   * Drain the Sentry transport queue (e.g. before page unload).
   * Returns immediately in non-production environments.
   */
  async flush(timeoutMs = 2000): Promise<void> {
    if (shouldUseSentry()) {
      try {
        const Sentry = await loadSentry();
        await Sentry.flush(timeoutMs);
      } catch {
        // Never let telemetry break the app
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for context
export type { LogContext };
