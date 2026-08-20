/**
 * Test Utilities for GatherGrove Client Tests
 * Provides common testing patterns and utilities to prevent hanging tests
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['User'],
  ...overrides,
});

export const createMockClub = (overrides = {}) => ({
  id: 1,
  name: 'Test Club',
  tier: 'Premium',
  memberCount: 150,
  ...overrides,
});

export const createMockMember = (overrides = {}) => ({
  id: 1,
  clubId: 1,
  fullName: 'Test Member',
  email: 'member@example.com',
  status: 'Active',
  ...overrides,
});

export const createMockEvent = (overrides = {}) => ({
  id: 1,
  clubId: 1,
  title: 'Test Event',
  startDate: new Date().toISOString(),
  status: 'Active',
  ...overrides,
});

// Query client factory with test-optimized settings
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
    // Removed logger - not part of QueryClientConfig interface
  });

// Enhanced test wrapper with cleanup
interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  queryClient 
}) => {
  const client = queryClient || createTestQueryClient();

  React.useEffect(() => {
    return () => {
      if (client && typeof client.clear === 'function') {
        client.clear();
      } else if (client && typeof client.invalidateQueries === 'function') {
        client.invalidateQueries();
      }
    };
  }, [client]);

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
};

// Custom render function with default wrapper
export const renderWithProviders = (
  ui: React.ReactElement,
  {
    queryClient,
    ...renderOptions
  }: RenderOptions & { queryClient?: QueryClient } = {}
) => {
  const client = queryClient || createTestQueryClient();
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper queryClient={client}>{children}</TestWrapper>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: client,
  };
};

// Mock API response factory
export const createMockApiResponse = (data: any, status = 200) => ({
  data,
  status,
  statusText: status < 400 ? 'OK' : 'Error',
  headers: {},
  config: {} as any,
});

// Mock API error factory
export const createMockApiError = (status: number, message: string) => {
  const error: any = new Error(message);
  error.response = {
    status,
    data: { message },
    headers: {},
  };
  return error;
};

// Test cleanup utilities
export const setupTestCleanup = () => {
  const cleanupFunctions: (() => void)[] = [];

  const addCleanup = (fn: () => void) => {
    cleanupFunctions.push(fn);
  };

  const runCleanup = () => {
    cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    });
    cleanupFunctions.length = 0;
  };

  return { addCleanup, runCleanup };
};

// Async test utilities
export const waitForTime = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Fast-forward all timers and promise resolution
export const flushPromises = () => 
  new Promise(resolve => setImmediate(resolve));

// Test environment validation
export const isTestEnvironment = () => 
  process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

// Mock localStorage for tests
export const createMockStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    get length() {
      return Object.keys(storage).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    }),
  };
};

// Test timeout wrapper to prevent hanging tests
export const withTimeout = <T,>(promise: Promise<T>, timeoutMs = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Test timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

const testUtils = {
  createMockUser,
  createMockClub,
  createMockMember,
  createMockEvent,
  createTestQueryClient,
  TestWrapper,
  renderWithProviders,
  createMockApiResponse,
  createMockApiError,
  setupTestCleanup,
  waitForTime,
  flushPromises,
  isTestEnvironment,
  createMockStorage,
  withTimeout,
};

export default testUtils;