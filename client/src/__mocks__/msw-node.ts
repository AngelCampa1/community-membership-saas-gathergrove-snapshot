/**
 * Manual Mock for msw/node
 *
 * Provides Jest-compatible setupServer for MSW.
 */

// Create a simple server mock
const handlers: any[] = [];

const server = {
  listen: jest.fn(),
  close: jest.fn(),
  resetHandlers: jest.fn(() => {
    // Clear runtime handlers when reset is called
  }),
  use: jest.fn((...newHandlers: any[]) => {
    // Add handlers to the array
    handlers.push(...newHandlers);
  }),
};

export const setupServer = jest.fn((...initialHandlers: any[]) => {
  handlers.length = 0;
  handlers.push(...initialHandlers);
  return server;
});

export default { setupServer };
