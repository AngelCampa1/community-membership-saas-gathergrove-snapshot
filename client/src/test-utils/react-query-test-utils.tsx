import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Re-export mockData for convenience
export * from './mockData';

/**
 * React Query Test Utils
 * 
 * Provides standardized React Query mocking and test setup for consistent
 * test behavior across the segmentation and member management components.
 */

export interface MockQueryOptions {
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  data?: any;
  isSuccess?: boolean;
  isFetching?: boolean;
  refetch?: jest.Mock;
}

/**
 * Creates a comprehensive mock useQuery return object with all required properties
 */
export const createMockUseQuery = (options: MockQueryOptions = {}) => {
  const {
    isLoading = false,
    isError = false,
    error = null,
    data = undefined,
    isSuccess = !isLoading && !isError && data !== undefined,
    isFetching = false,
    refetch = jest.fn().mockResolvedValue({ data })
  } = options;

  return {
    data,
    isLoading,
    isError,
    error,
    isSuccess,
    isFetching,
    refetch,
    status: isLoading ? 'loading' : isError ? 'error' : isSuccess ? 'success' : 'idle',
    fetchStatus: isFetching ? 'fetching' : 'idle',
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: isError ? Date.now() : 0,
    errorUpdateCount: isError ? 1 : 0,
    failureCount: isError ? 1 : 0,
    failureReason: error,
    isFetched: !isLoading,
    isFetchedAfterMount: !isLoading,
    isInitialLoading: isLoading,
    isLoadingError: isError && isLoading,
    isPending: isLoading,
    isPaused: false,
    isEnabled: true,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    promise: Promise.resolve(data),
  };
};

/**
 * Creates a comprehensive mock useMutation return object
 */
export const createMockUseMutation = (options: Partial<{
  mutate: jest.Mock;
  mutateAsync: jest.Mock;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  data: any;
  error: Error | null;
}> = {}) => {
  const {
    mutate = jest.fn(),
    mutateAsync = jest.fn().mockResolvedValue({}),
    isPending = false,
    isError = false,
    isSuccess = false,
    data = undefined,
    error = null
  } = options;

  return {
    mutate,
    mutateAsync,
    isPending,
    isError,
    isSuccess,
    isIdle: !isPending && !isError && !isSuccess,
    data,
    error,
    reset: jest.fn(),
    status: isPending ? 'pending' : isError ? 'error' : isSuccess ? 'success' : 'idle',
    submittedAt: isSuccess ? Date.now() : 0,
    variables: undefined,
    context: undefined,
    failureCount: isError ? 1 : 0,
    failureReason: error,
    isPaused: false,
  };
};

/**
 * Creates a test QueryClient with optimized settings for testing
 */
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
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
        gcTime: 0,
      },
    },
  });
};

/**
 * Enhanced render function with React Query provider
 */
export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
) => {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
};