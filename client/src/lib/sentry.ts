/**
 * Sentry telemetry wrapper for GatherGrove frontend
 *
 * Provides the same interface as the former Application Insights module
 * so all callers can be updated with minimal changes.
 * Sentry is a no-op when NEXT_PUBLIC_SENTRY_DSN is not set (dev/test).
 */

type SentryModule = typeof import('@sentry/nextjs');

let sentryModulePromise: Promise<SentryModule> | null = null;
const testSentryModule: SentryModule | null = process.env.NODE_ENV === 'test'
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require('@sentry/nextjs') as SentryModule
  : null;

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

  if (testSentryModule) {
    try {
      callback(testSentryModule);
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

/**
 * Set the authenticated user context so all subsequent events are tagged
 * with the user's identity.
 */
export function setUserContext(
  userId: string,
  accountId?: string,
  properties?: Record<string, unknown>
): void {
  withSentry((Sentry) => {
    Sentry.setUser({
      id: userId,
      // accountId maps to the "username" field in Sentry for grouping
      username: accountId,
      ...properties,
    });
  });
}

/**
 * Clear the authenticated user context (on logout).
 */
export function clearUserContext(): void {
  withSentry((Sentry) => {
    Sentry.setUser(null);
  });
}

/**
 * Track a named event with optional properties.
 * Maps to a Sentry breadcrumb so events appear in error context.
 */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  withSentry((Sentry) => {
    Sentry.addBreadcrumb({
      category: 'event',
      message: name,
      data: properties,
      level: 'info',
    });
  });
}

/**
 * Capture an exception in Sentry.
 */
export function trackError(
  error: Error | unknown,
  properties?: Record<string, unknown>
): void {
  withSentry((Sentry) => {
    Sentry.withScope((scope) => {
      if (properties) {
        scope.setContext('errorContext', properties);
      }
      Sentry.captureException(error);
    });
  });
}

/**
 * Track an API call as a breadcrumb.
 */
export function trackApiCall(
  url: string,
  method: string,
  statusCode: number,
  duration: number,
  properties?: Record<string, unknown>
): void {
  withSentry((Sentry) => {
    Sentry.addBreadcrumb({
      category: 'http',
      message: `${method} ${url}`,
      data: {
        url,
        method,
        status_code: statusCode,
        duration,
        ...properties,
      },
      level: statusCode >= 400 ? 'error' : 'info',
    });
  });
}
