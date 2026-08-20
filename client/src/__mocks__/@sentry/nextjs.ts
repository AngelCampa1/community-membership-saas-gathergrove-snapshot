// Mock for @sentry/nextjs — used in Jest test environment
// The real package requires Next.js server runtime not available in Jest.

export const init = jest.fn();
export const captureException = jest.fn();
export const captureMessage = jest.fn();
export const setUser = jest.fn();
export const setTag = jest.fn();
export const setContext = jest.fn();
export const addBreadcrumb = jest.fn();
export const flush = jest.fn().mockResolvedValue(true);
export const withScope = jest.fn((cb: (scope: unknown) => void) =>
  cb({ setTag: jest.fn(), setContext: jest.fn(), setExtras: jest.fn() })
);
export const replayIntegration = jest.fn(() => ({}));
export const browserTracingIntegration = jest.fn(() => ({}));
export const withSentryConfig = jest.fn((config: unknown) => config);
