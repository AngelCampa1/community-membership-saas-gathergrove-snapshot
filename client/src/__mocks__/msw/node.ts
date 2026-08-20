/**
 * Manual Mock for msw/node
 *
 * This mock provides Jest-compatible versions of MSW's node utilities
 * without requiring the actual ESM .mjs file which Jest can't parse.
 *
 * IMPORTANT: This is a NO-OP mock. MSW is disabled because of ESM compatibility issues.
 * Tests use the fallback fetch mock defined in setupTests.ts instead.
 */

// Basic handler type - MSW handlers are opaque to us
type RequestHandler = Record<string, unknown>;

interface SetupServer {
  listen: (options?: { onUnhandledRequest?: string }) => void;
  close: () => void;
  resetHandlers: () => void;
  use: (...handlers: RequestHandler[]) => void;
}

/**
 * Mock implementation of setupServer
 * Creates a NO-OP mock server that does nothing
 */
export const setupServer = (...handlers: RequestHandler[]): SetupServer => {
  return {
    listen: (options?: { onUnhandledRequest?: string }) => {
      // NO-OP: MSW is disabled, using fetch mock instead
    },

    close: () => {
      // NO-OP
    },

    resetHandlers: () => {
      // NO-OP
    },

    use: (...newHandlers: RequestHandler[]) => {
      // NO-OP
    },
  };
};

/**
 * Mock http and HttpResponse
 * These are NO-OP functions since MSW is disabled
 */
export const http = {
  get: (...args: any[]) => ({}),
  post: (...args: any[]) => ({}),
  put: (...args: any[]) => ({}),
  patch: (...args: any[]) => ({}),
  delete: (...args: any[]) => ({}),
  options: (...args: any[]) => ({}),
  head: (...args: any[]) => ({}),
  all: (...args: any[]) => ({}),
};

export const HttpResponse = {
  json: (data: any, init?: any) => data,
  text: (text: string, init?: any) => text,
  error: () => new Error('HTTP Error'),
};
