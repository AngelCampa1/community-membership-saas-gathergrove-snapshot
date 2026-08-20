/**
 * Sentry telemetry wrapper for GatherGrove mobile
 *
 * Provides the same interface as the former Application Insights module.
 * Sentry is inert when SENTRY_DSN is not configured (dev/test).
 */

import * as Sentry from '@sentry/react-native';

export { Sentry };

export function initializeSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.APP_ENV || process.env.NODE_ENV,
    tracesSampleRate: process.env.APP_ENV === 'production' ? 0.1 : 1.0,
  });
}

export function setUserContext(
  userId: string,
  properties?: Record<string, unknown>
): void {
  try {
    Sentry.setUser({ id: userId, ...properties });
  } catch {
    // Never let telemetry crash the app
  }
}

export function clearUserContext(): void {
  try {
    Sentry.setUser(null);
  } catch {
    // Never let telemetry crash the app
  }
}

export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  try {
    Sentry.addBreadcrumb({
      category: 'event',
      message: name,
      data: properties,
      level: 'info',
    });
  } catch {
    // Never let telemetry crash the app
  }
}

export function trackError(
  error: Error | unknown,
  properties?: Record<string, unknown>
): void {
  try {
    Sentry.withScope((scope) => {
      if (properties) {
        scope.setContext('errorContext', properties);
      }
      Sentry.captureException(error);
    });
  } catch {
    // Never let telemetry crash the app
  }
}
