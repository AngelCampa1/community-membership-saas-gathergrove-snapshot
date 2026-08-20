/**
 * Manual Mock for msw
 *
 * This mock provides Jest-compatible versions of MSW's core utilities.
 * Instead of using the real MSW (which has ESM compatibility issues with JSDOM),
 * we capture the handler info and make it available for our custom fetch mock.
 */

// Handler info structure
export interface MockHandlerInfo {
  method: string;
  url: string;
  resolver: (info: { request: Request; params: Record<string, string> }) => any;
}

// Create handler factory for each HTTP method
const createHandler = (method: string) => {
  return (url: string, resolver: (info: any) => any): MockHandlerInfo => ({
    method,
    url,
    resolver,
  });
};

/**
 * Mock http namespace
 * These return handler info objects that our custom fetch mock can use
 */
export const http = {
  get: createHandler('GET'),
  post: createHandler('POST'),
  put: createHandler('PUT'),
  patch: createHandler('PATCH'),
  delete: createHandler('DELETE'),
  options: createHandler('OPTIONS'),
  head: createHandler('HEAD'),
  all: createHandler('ALL'),
};

/**
 * Mock HttpResponse class
 * Creates actual Response objects for the custom fetch mock
 */
// Special marker for network errors
export const NETWORK_ERROR = Symbol('NETWORK_ERROR');

export const HttpResponse = {
  json: (data: unknown, init?: ResponseInit): Response => {
    return new Response(JSON.stringify(data), {
      status: init?.status || 200,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(new Headers(init?.headers || {}).entries()),
      },
    });
  },
  text: (text: string, init?: ResponseInit): Response => {
    return new Response(text, {
      status: init?.status || 200,
      headers: {
        'Content-Type': 'text/plain',
        ...Object.fromEntries(new Headers(init?.headers || {}).entries()),
      },
    });
  },
  error: (): typeof NETWORK_ERROR => {
    // Return a special marker that the mock fetch will recognize
    return NETWORK_ERROR;
  },
};
