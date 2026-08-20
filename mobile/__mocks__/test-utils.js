/**
 * MOBILE TEST FIX: Comprehensive Test Utilities
 * Provides standardized testing utilities for React Native components
 */

import React from 'react'; // Used for JSX elements
import { render, act } from '@testing-library/react-native';
import { jest } from '@jest/globals';

// Import mocks
import { ThemeProvider } from './ThemeContext';
import { useAuth, defaultMockUser } from './useAuth';

/**
 * Enhanced render function with all necessary providers
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    mockAuthState,
    themeProps,
    ...renderOptions
  } = options;

  // Setup auth mock if provided
  if (mockAuthState) {
    useAuth.mockReturnValue(mockAuthState);
  }

  const Wrapper = ({ children }) => 
    React.createElement(ThemeProvider, themeProps, children);

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Async render utility with proper act wrapping
 */
export const renderAsync = async (ui, options = {}) => {
  let result;
  await act(async () => {
    result = renderWithProviders(ui, options);
  });
  return result;
};

/**
 * Mock navigation object for testing
 */
export const createMockNavigation = (overrides = {}) => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
  ...overrides,
});

/**
 * Mock route object for testing
 */
export const createMockRoute = (overrides = {}) => ({
  key: 'test-route',
  name: 'TestScreen',
  params: {},
  ...overrides,
});

/**
 * Complete auth state for successful authentication
 */
export const createMockAuthState = (overrides = {}) => ({
  user: defaultMockUser,
  loading: false,
  error: null,
  login: jest.fn().mockResolvedValue(defaultMockUser),
  logout: jest.fn().mockResolvedValue(undefined),
  checkStoredSession: jest.fn().mockResolvedValue(defaultMockUser),
  clearError: jest.fn(),
  ...overrides,
});

/**
 * Loading auth state
 */
export const createLoadingAuthState = (overrides = {}) => ({
  user: null,
  loading: true,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  checkStoredSession: jest.fn(),
  clearError: jest.fn(),
  ...overrides,
});

/**
 * Error auth state
 */
export const createErrorAuthState = (error = 'Authentication error', overrides = {}) => ({
  user: null,
  loading: false,
  error,
  login: jest.fn().mockRejectedValue(new Error(error)),
  logout: jest.fn(),
  checkStoredSession: jest.fn(),
  clearError: jest.fn(),
  ...overrides,
});

/**
 * Utility to wait for async operations with proper act wrapping
 */
export const waitForAsync = async (callback, options = {}) => {
  const { timeout = 10000 } = options;
  
  return act(async () => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`waitForAsync timed out after ${timeout}ms`));
      }, timeout);

      const checkCondition = async () => {
        try {
          const result = await callback();
          if (result) {
            clearTimeout(timeoutId);
            resolve(result);
          } else {
            setTimeout(checkCondition, 10);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      };

      checkCondition();
    });
  });
};

/**
 * Utility to simulate user interactions with proper async handling
 */
export const simulateUserAction = async (action) => {
  await act(async () => {
    await action();
  });
};

/**
 * Mock API responses for services
 */
export const createMockApiResponse = (data, success = true, message = '') => ({
  data,
  success,
  message,
  status: success ? 200 : 400,
});

/**
 * Setup function to run before each test
 */
export const setupTest = () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset all mock implementations
  if (useAuth.mockReset) {
    useAuth.mockReset();
  }
  
  // Set default auth state
  useAuth.mockReturnValue(createMockAuthState());
};

/**
 * Cleanup function to run after each test
 */
export const cleanupTest = () => {
  jest.clearAllMocks();
};

// Export all utilities
export default {
  renderWithProviders,
  renderAsync,
  createMockNavigation,
  createMockRoute,
  createMockAuthState,
  createLoadingAuthState,
  createErrorAuthState,
  waitForAsync,
  simulateUserAction,
  createMockApiResponse,
  setupTest,
  cleanupTest,
};