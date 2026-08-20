// Mock for @sentry/react-native for testing
// Provides jest.fn() stubs for all Sentry APIs used by the app

module.exports = {
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  withScope: jest.fn((cb) => cb({ setContext: jest.fn(), setTag: jest.fn(), setExtra: jest.fn() })),
  setContext: jest.fn(),
  setTag: jest.fn(),
  wrap: jest.fn((component) => component),
  nativeCrash: jest.fn(),
  configureScope: jest.fn((cb) => cb({ setUser: jest.fn(), setTag: jest.fn() })),
};
