/**
 * MSW Server for Node.js (Test Environment)
 *
 * This server runs in Jest tests to intercept HTTP requests.
 * Tests use REAL service code with MSW mocking only HTTP boundaries.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup server with default handlers
export const server = setupServer(...handlers);

// Enable request logging in test environment for debugging
if (process.env.NODE_ENV === 'test') {
  server.events.on('request:start', ({ request }) => {
    // Only log in verbose mode to avoid cluttering test output
    if (process.env.MSW_VERBOSE === 'true') {
      console.log('[MSW]', request.method, request.url);
    }
  });
}
