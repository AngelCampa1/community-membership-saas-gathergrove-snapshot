/**
 * Test Server Setup
 * Configures Mock Service Worker (MSW) for integration testing
 *
 * This allows us to test actual service code with mocked HTTP responses
 * without hitting the real backend API.
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/constants';

/**
 * Mock request handlers for API endpoints
 * These can be extended/overridden in individual test files
 */
export const handlers = [
  // Default handlers - return 404 for unmocked endpoints
  http.get(`${API_CONFIG.BASE_URL}/*`, () => {
    return HttpResponse.json(
      { message: 'Endpoint not mocked in test' },
      { status: 404 }
    );
  }),

  http.post(`${API_CONFIG.BASE_URL}/*`, () => {
    return HttpResponse.json(
      { message: 'Endpoint not mocked in test' },
      { status: 404 }
    );
  }),

  http.put(`${API_CONFIG.BASE_URL}/*`, () => {
    return HttpResponse.json(
      { message: 'Endpoint not mocked in test' },
      { status: 404 }
    );
  }),

  http.delete(`${API_CONFIG.BASE_URL}/*`, () => {
    return HttpResponse.json(
      { message: 'Endpoint not mocked in test' },
      { status: 404 }
    );
  }),
];

/**
 * Create the mock server instance
 * This intercepts HTTP requests during tests
 */
export const server = setupServer(...handlers);

/**
 * Setup function to be called in test files
 * Starts server before tests, resets between tests, closes after tests
 */
export function setupTestServer() {
  // Start server before all tests
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: 'warn', // Warn about unhandled requests
    });
  });

  // Reset handlers after each test
  afterEach(() => {
    server.resetHandlers();
  });

  // Close server after all tests
  afterAll(() => {
    server.close();
  });
}

/**
 * Helper to create network error responses
 */
export function createNetworkError() {
  return HttpResponse.error();
}

/**
 * Helper to create timeout responses
 */
export function createTimeoutResponse() {
  return new Promise(() => {
    // Never resolves - simulates timeout
  });
}

/**
 * Helper to create delayed responses
 */
export function createDelayedResponse<T>(data: T, delayMs: number, status = 200) {
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return HttpResponse.json(data, { status });
  };
}

/**
 * Helper to create error responses with specific status codes
 */
export function createErrorResponse(status: number, message: string) {
  return HttpResponse.json({ message }, { status });
}

/**
 * Helper to simulate rate limiting
 */
export function createRateLimitResponse() {
  return HttpResponse.json(
    { message: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    }
  );
}

/**
 * Helper to simulate server errors
 */
export function createServerErrorResponse(message = 'Internal server error') {
  return HttpResponse.json({ message }, { status: 500 });
}

/**
 * Helper to simulate unauthorized responses
 */
export function createUnauthorizedResponse(message = 'Unauthorized') {
  return HttpResponse.json({ message }, { status: 401 });
}

/**
 * Helper to simulate forbidden responses
 */
export function createForbiddenResponse(message = 'Forbidden') {
  return HttpResponse.json({ message }, { status: 403 });
}

/**
 * Helper to simulate not found responses
 */
export function createNotFoundResponse(message = 'Not found') {
  return HttpResponse.json({ message }, { status: 404 });
}

export default server;
