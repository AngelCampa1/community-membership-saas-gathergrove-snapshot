import React, { ReactNode } from 'react';
import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Enhanced test utilities for stable testing

/**
 * Creates a new QueryClient with optimized settings for testing
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        networkMode: 'offlineFirst', // Prevent network requests
      },
      mutations: {
        retry: false,
        networkMode: 'offlineFirst',
      },
    },
  });
};

/**
 * Test wrapper with QueryClient provider
 */
export const TestWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Custom render with automatic QueryClient wrapper and cleanup
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const result = render(ui, {
    wrapper: TestWrapper,
    ...options,
  });
  
  // Return enhanced result with cleanup guarantee
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) => {
      return result.rerender(rerenderUi);
    }
  };
};

/**
 * Enhanced waitFor with better error handling and timeouts
 */
export const waitForElement = async (
  callback: () => void | Promise<void>,
  options?: {
    timeout?: number;
    interval?: number;
    onTimeout?: (error: Error) => void;
  }
) => {
  const { timeout = 10000, interval = 50, onTimeout } = options || {};

  try {
    await waitFor(callback, {
      timeout,
      interval,
    });
  } catch (error) {
    if (onTimeout && error instanceof Error) {
      onTimeout(error);
    }
    throw error;
  }
};

/**
 * Wait for loading states to complete
 */
export const waitForLoadingToComplete = async (timeout = 10000) => {
  await waitFor(
    () => {
      const loadingElements = screen.queryAllByText(/loading/i);
      const spinners = screen.queryAllByTestId(/loading|spinner/i);
      expect(loadingElements.length + spinners.length).toBe(0);
    },
    { timeout }
  );
};

/**
 * Enhanced text matcher that handles broken up text
 */
export const createTextMatcher = (text: string) => {
  return (content: string, element: Element | null) => {
    const hasText = (node: Element | null): boolean => {
      if (!node) return false;
      
      // Check if the element itself contains the text
      if (node.textContent?.includes(text)) return true;
      
      // Check child elements
      const children = Array.from(node.children);
      return children.some(child => hasText(child as Element));
    };
    
    return hasText(element);
  };
};

/**
 * Find elements with flexible text matching
 */
export const findByFlexibleText = (text: string) => {
  return screen.findByText(createTextMatcher(text));
};

export const getByFlexibleText = (text: string) => {
  return screen.getByText(createTextMatcher(text));
};

export const queryByFlexibleText = (text: string) => {
  return screen.queryByText(createTextMatcher(text));
};

/**
 * Mock data generators with realistic values
 */
export const generateMockEvent = (overrides: Partial<any> = {}) => ({
  id: Math.floor(Math.random() * 10000),
  clubId: 1,
  name: 'Test Event',
  eventDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  location: 'Test Location',
  description: 'Test Description',
  attendeeCount: Math.floor(Math.random() * 50),
  totalRsvpCount: Math.floor(Math.random() * 60),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const generateMockEvents = (count: number) => {
  return Array.from({ length: count }, (_, index) => 
    generateMockEvent({
      id: index + 1,
      name: `Test Event ${index + 1}`,
    })
  );
};

export const generateMockEventData = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    eventId: index + 1,
    eventName: `Event ${index + 1}`,
    eventDate: new Date(Date.now() + (index * 24 * 60 * 60 * 1000)).toISOString(),
    expectedAttendance: 20 + Math.floor(Math.random() * 30),
    actualAttendance: 15 + Math.floor(Math.random() * 25),
    attendanceRate: 75 + Math.floor(Math.random() * 20),
    category: ['Meeting', 'Workshop', 'Social'][index % 3],
    eventType: ['meeting', 'workshop', 'social'][index % 3],
    duration: 60 + Math.floor(Math.random() * 120),
    location: `Location ${index + 1}`,
  }));
};

/**
 * Async test helper with timeout protection
 */
export const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  timeoutMessage?: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(timeoutMessage || `Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      );
    })
  ]);
};

/**
 * Mock implementation helper for consistent service mocking
 */
export const createMockService = <T extends Record<string, any>,>(
  serviceName: string,
  methods: Partial<T>
): jest.Mocked<T> => {
  const mockService = {} as jest.Mocked<T>;
  
  Object.keys(methods).forEach(key => {
    (mockService as any)[key] = jest.fn().mockImplementation(methods[key]);
  });
  
  // Add any missing methods as rejected promises
  return new Proxy(mockService, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as keyof T];
      }
      return jest.fn().mockRejectedValue(new Error(`${serviceName}.${String(prop)} not mocked`));
    }
  });
};

/**
 * Component test helper with error boundary
 */
export class TestErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TestErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          <h2>Test Error Boundary</h2>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export const renderWithErrorBoundary = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  return renderWithProviders(
    <TestErrorBoundary>{ui}</TestErrorBoundary>,
    options
  );
};

/**
 * Creates a properly typed Response mock for testing
 * Fixes TypeScript compatibility issues with fetch mocking
 */
export const createMockResponse = (data: any, options: Partial<Response> = {}): Response => {
  const mockResponse: Response = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    url: '',
    redirected: false,
    type: 'basic',
    body: null,
    bodyUsed: false,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    clone: jest.fn().mockReturnValue(this),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    blob: jest.fn().mockResolvedValue(new Blob()),
    formData: jest.fn().mockResolvedValue(new FormData()),
    bytes: jest.fn().mockResolvedValue(new Uint8Array()), // Required property for Response type
    ...options
  } as Response;

  return mockResponse;
};

/**
 * Creates a mock error Response for testing error scenarios
 */
export const createMockErrorResponse = (
  status: number,
  statusText: string,
  errorData?: any
): Response => {
  return createMockResponse(errorData || { error: statusText }, {
    ok: false,
    status,
    statusText,
  });
};

/**
 * Utility to mock fetch with proper Response types
 */
export const mockFetchResponse = (data: any, options?: Partial<Response>) => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  mockFetch.mockResolvedValueOnce(createMockResponse(data, options));
  return mockFetch;
};

/**
 * Utility to mock fetch error responses
 */
export const mockFetchError = (status: number, statusText: string, errorData?: any) => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  mockFetch.mockResolvedValueOnce(createMockErrorResponse(status, statusText, errorData));
  return mockFetch;
};