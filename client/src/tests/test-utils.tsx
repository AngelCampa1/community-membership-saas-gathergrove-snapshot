/**
 * @fileoverview Test utilities and helpers for consistent test setup
 * @description Provides wrapper components and utilities for testing
 * @author Claude Code - QA Testing Agent
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, AuthContextType } from '../hooks/useAuth';
import { UserSession } from '../services/authService';

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialEntries?: string[];
}

export function TestWrapper({ 
  children, 
  queryClient,
  initialEntries: _initialEntries = ['/']
}: TestWrapperProps) {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Disable cache for tests
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={testQueryClient}>
        <AuthProvider>
          <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
            {children}
          </React.Suspense>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, initialEntries, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper queryClient={queryClient} initialEntries={initialEntries}>
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock API response helper
export function mockApiResponse(data: any, options: { 
  status?: number; 
  delay?: number; 
  ok?: boolean 
} = {}) {
  const { status = 200, delay = 0, ok = true } = options;
  
  const response = {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => ({ success: ok, data, ...(ok ? {} : { error: 'API Error' }) }),
    text: async () => typeof data === 'string' ? data : JSON.stringify(data)
  };

  if (delay > 0) {
    return new Promise((resolve) => setTimeout(() => resolve(response), delay));
  }
  
  return Promise.resolve(response);
}

// Mock API error helper
export function mockApiError(status: number = 500, _message: string = 'API Error') {
  return mockApiResponse(null, { status, ok: false });
}

// Accessibility test helpers
export function expectAccessibleElement(element: HTMLElement, options: {
  role?: string;
  label?: string | RegExp;
  describedBy?: boolean;
} = {}) {
  const { role, label, describedBy } = options;

  if (role) {
    expect(element).toHaveAttribute('role', role);
  }

  if (label) {
    const ariaLabel = element.getAttribute('aria-label');
    const _labelledBy = element.getAttribute('aria-labelledby');
    
    if (typeof label === 'string') {
      expect(ariaLabel || '').toContain(label);
    } else {
      expect(ariaLabel || '').toMatch(label);
    }
  }

  if (describedBy) {
    const describedByAttr = element.getAttribute('aria-describedby');
    if (describedByAttr) {
      const descriptionElement = document.getElementById(describedByAttr);
      expect(descriptionElement).toBeInTheDocument();
    }
  }
}

// Chart testing helpers
export function expectChartAccessibility(chartElement: HTMLElement) {
  // Check basic chart accessibility
  expect(chartElement).toHaveAttribute('role', 'img');
  expect(chartElement).toHaveAttribute('aria-label');
  
  const ariaLabel = chartElement.getAttribute('aria-label');
  expect(ariaLabel).toMatch(/chart|graph|visualization/i);
  
  // Check for alternative text content
  const srContent = chartElement.querySelector('.sr-only');
  if (srContent) {
    expect(srContent.textContent).toBeTruthy();
  }
}

// Wait for async operations helper
export async function waitForAsyncOperations() {
  // Wait for any pending promises to resolve
  await new Promise(resolve => setTimeout(resolve, 0));
}

// Clean up helper for after tests
export function cleanupTest() {
  // Clear any timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  
  // Clear mocks
  jest.clearAllMocks();
  
  // Force garbage collection if available
  if (typeof global.gc === 'function') {
    global.gc();
  }
}

// Mock setup helpers
export function setupMockFetch() {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  return mockFetch;
}

export function resetMockFetch() {
  if (global.fetch && typeof (global.fetch as jest.Mock).mockClear === 'function') {
    (global.fetch as jest.Mock).mockClear();
  }
}

// Error suppression for tests
export function suppressConsoleErrors(patterns: (string | RegExp)[] = []) {
  const originalError = console.error;
  
  beforeAll(() => {
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      const shouldSuppress = patterns.some(pattern => {
        if (typeof pattern === 'string') {
          return message.includes(pattern);
        }
        return pattern.test(message);
      });
      
      if (!shouldSuppress) {
        originalError.call(console, ...args);
      }
    };
  });

  afterAll(() => {
    console.error = originalError;
  });
}

// ============================================
// Mock User and Auth Context Factory Helpers
// ============================================

/**
 * Creates a properly typed mock UserSession object
 * @param overrides - Optional overrides for user properties
 */
export function createMockUser(overrides: Partial<UserSession> = {}): UserSession {
  return {
    userId: 1,
    fullName: 'Test User',
    email: 'test@example.com',
    clubId: 1,
    clubName: 'Test Club',
    clubTier: 'Unlimited',
    role: 'Admin',
    isOnboardingCompleted: true,
    ...overrides
  };
}

/**
 * Creates a properly typed mock AuthContextType object
 * @param userOverrides - Optional overrides for user properties
 * @param contextOverrides - Optional overrides for auth context properties
 */
export function createMockAuthContext(
  userOverrides: Partial<UserSession> | null = {},
  contextOverrides: Partial<AuthContextType> = {}
): AuthContextType {
  const user = userOverrides === null ? null : createMockUser(userOverrides);

  return {
    user,
    loading: false,
    error: null,
    login: jest.fn().mockResolvedValue({ success: true }),
    logout: jest.fn().mockResolvedValue(undefined),
    register: jest.fn().mockResolvedValue({ success: true }),
    refreshSession: jest.fn().mockResolvedValue(undefined),
    completeOnboarding: jest.fn().mockResolvedValue(undefined),
    clearError: jest.fn(),
    retryLastOperation: jest.fn().mockResolvedValue(undefined),
    ...contextOverrides
  };
}

/**
 * Creates a mock auth context for unauthenticated users
 */
export function createMockUnauthenticatedContext(): AuthContextType {
  return createMockAuthContext(null, {
    user: null,
    loading: false,
    error: null
  });
}

// Export everything as default for convenience
const testUtilsExports = {
  TestWrapper,
  renderWithProviders,
  mockApiResponse,
  mockApiError,
  expectAccessibleElement,
  expectChartAccessibility,
  waitForAsyncOperations,
  cleanupTest,
  setupMockFetch,
  resetMockFetch,
  suppressConsoleErrors,
  createMockUser,
  createMockAuthContext,
  createMockUnauthenticatedContext
};

export default testUtilsExports;