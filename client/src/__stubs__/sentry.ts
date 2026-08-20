// Lightweight stub for @sentry/nextjs when no DSN is configured.
// Prevents bundling ~15 MiB of Sentry + OpenTelemetry into the Cloudflare Worker.

const noop = (..._args: unknown[]) => {};
const noopAsync = (..._args: unknown[]) => Promise.resolve(true);
const noopObj = (..._args: unknown[]) => ({});

export const init = noop;
export const captureException = noop;
export const captureMessage = noop;
export const setUser = noop;
export const setTag = noop;
export const setContext = noop;
export const addBreadcrumb = noop;
export const flush = noopAsync;
export const withScope = (cb: (scope: unknown) => void) =>
  cb({ setTag: noop, setContext: noop, setExtras: noop });
export const replayIntegration = noopObj;
export const browserTracingIntegration = noopObj;
export const withSentryConfig = (_config: unknown) => _config;
