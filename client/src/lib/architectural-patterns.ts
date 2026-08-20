/**
 * Frontend Architectural Patterns & Constants
 * 
 * This file defines the architectural patterns, constants, and standards
 * used throughout the frontend application for consistency and scalability.
 */

import React from 'react';

// ============================================================================
// ARCHITECTURAL CONSTANTS
// ============================================================================

export const ARCHITECTURE_CONSTANTS = {
  // Component size limits for maintainability
  MAX_COMPONENT_LINES: 500,
  MAX_HOOK_LINES: 200,
  MAX_SERVICE_LINES: 800,
  
  // Performance thresholds
  MAX_RENDER_TIME_MS: 16, // 60fps target
  MAX_API_TIMEOUT_MS: 15000,
  MAX_BUNDLE_SIZE_KB: 250,
  
  // Error handling
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_DEBOUNCE_MS: 300,
  
  // Cache durations
  QUERY_STALE_TIME_MS: 5 * 60 * 1000, // 5 minutes
  QUERY_CACHE_TIME_MS: 10 * 60 * 1000, // 10 minutes
  
  // UI/UX Standards
  TOAST_DURATION_MS: 4000,
  ANIMATION_DURATION_MS: 300,
  LOADING_DEBOUNCE_MS: 150,
} as const;

// ============================================================================
// SERVICE LAYER PATTERNS
// ============================================================================

/**
 * Base service interface that all services should implement
 */
export interface BaseServiceInterface {
  readonly baseUrl: string;
  readonly timeout: number;
}

/**
 * Standard service method return types
 */
export interface ServiceResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Service method options
 */
export interface ServiceOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  signal?: AbortSignal;
}

/**
 * Abstract base service class with common patterns
 */
export abstract class BaseService implements BaseServiceInterface {
  abstract readonly baseUrl: string;
  readonly timeout = ARCHITECTURE_CONSTANTS.MAX_API_TIMEOUT_MS;

  protected buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }

  protected handleServiceError(error: unknown, _context: string): never {
    // Use centralized error handling
    throw error;
  }
}

// ============================================================================
// COMPONENT COMPOSITION PATTERNS
// ============================================================================

/**
 * Base props that all components should support
 */
export interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
}

/**
 * Props for components that can be in loading/error states
 */
export interface AsyncComponentProps extends BaseComponentProps {
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/**
 * Props for components that handle data collections
 */
export interface DataComponentProps<T> extends AsyncComponentProps {
  data?: T[];
  empty?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Standard form component props
 */
export interface FormComponentProps extends BaseComponentProps {
  disabled?: boolean;
  required?: boolean;
  error?: string | string[];
  'aria-describedby'?: string;
}

// ============================================================================
// CONTEXT PATTERNS
// ============================================================================

/**
 * Base context pattern with proper error handling
 */
export function createContext<T>(name: string, defaultValue?: T) {
  const Context = React.createContext<T | undefined>(defaultValue);
  
  function useContext(): T {
    const context = React.useContext(Context);
    if (context === undefined) {
      throw new Error(`use${name} must be used within a ${name}Provider`);
    }
    return context;
  }
  
  return [Context, useContext] as const;
}

/**
 * Async context state pattern
 */
export interface AsyncContextState<T> {
  data: T | null;
  loading: boolean;
  error: unknown | null;
  refresh: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// HOOK PATTERNS
// ============================================================================

/**
 * Standard async operation hook return type
 */
export interface AsyncOperationHook<T, P = void> {
  data: T | null;
  loading: boolean;
  error: unknown | null;
  execute: (params: P) => Promise<void>;
  reset: () => void;
}

/**
 * Standard mutation hook return type
 */
export interface MutationHook<TData, TVariables = void> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  isError: boolean;
  error: unknown | null;
  isSuccess: boolean;
  data: TData | undefined;
  reset: () => void;
}

/**
 * Standard query hook return type
 */
export interface QueryHook<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown | null;
  isSuccess: boolean;
  refetch: () => Promise<void>;
  isFetching: boolean;
  isStale: boolean;
}

// ============================================================================
// ERROR BOUNDARY PATTERNS
// ============================================================================

/**
 * Error boundary component props
 */
export interface ErrorBoundaryProps {
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: React.ReactNode;
}

/**
 * Error fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

// ============================================================================
// LOADING STATE PATTERNS
// ============================================================================

/**
 * Loading state types
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Loading context for nested components
 */
export interface LoadingContext {
  isLoading: boolean;
  loadingStates: Record<string, LoadingState>;
  setLoading: (key: string, state: LoadingState) => void;
}

// ============================================================================
// TYPE SAFETY PATTERNS
// ============================================================================

/**
 * Utility type for making all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Utility type for extracting function parameters
 */
export type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;

/**
 * Utility type for extracting async function return type
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;

/**
 * Strict event handler types
 */
export type EventHandler<T = Element> = (event: React.SyntheticEvent<T>) => void;
export type ChangeHandler<T = HTMLInputElement> = (event: React.ChangeEvent<T>) => void;
export type ClickHandler<T = HTMLButtonElement> = (event: React.MouseEvent<T>) => void;

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Field validation function type
 */
export type FieldValidator<T = string> = (value: T) => string | undefined;

/**
 * Form validation schema
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: FieldValidator<T[K]>[];
};

// ============================================================================
// PERFORMANCE PATTERNS
// ============================================================================

/**
 * Memoization options
 */
export interface MemoOptions {
  maxAge?: number;
  maxSize?: number;
  keySelector?: (...args: any[]) => string;
}

/**
 * Performance monitoring
 */
export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  rerenderCount: number;
  memoryUsage: number;
}

// ============================================================================
// ROUTING PATTERNS
// ============================================================================

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  guards?: RouteGuard[];
  meta?: Record<string, unknown>;
}

/**
 * Route guard function
 */
export type RouteGuard = () => boolean | Promise<boolean>;

// ============================================================================
// STATE MANAGEMENT PATTERNS
// ============================================================================

/**
 * Redux-like action pattern
 */
export interface Action<T = unknown> {
  type: string;
  payload?: T;
  meta?: Record<string, unknown>;
  error?: boolean;
}

/**
 * State slice pattern
 */
export interface StateSlice<T> {
  data: T | null;
  loading: boolean;
  error: unknown | null;
  lastUpdated: number | null;
}

// ============================================================================
// TESTING PATTERNS
// ============================================================================

/**
 * Test utilities interface
 */
export interface TestUtils {
  renderWithProviders: (component: React.ReactElement) => any;
  createMockService: <T>(service: T) => jest.MockedObject<T>;
  waitForAsync: () => Promise<void>;
}

/**
 * Component test props
 */
export interface ComponentTestProps {
  testId?: string;
  mockData?: unknown;
  mockError?: unknown;
  mockLoading?: boolean;
}

export default {
  ARCHITECTURE_CONSTANTS,
  BaseService,
  createContext,
} as const;