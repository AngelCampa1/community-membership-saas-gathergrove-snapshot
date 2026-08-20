/**
 * TypeScript type definitions for test files
 * Provides proper typing for mock components and test utilities
 */

import React from 'react';

// Jest custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

// Mock component props
export interface MockComponentProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onCheckedChange?: (checked: boolean) => void;
  onValueChange?: (value: string | string[]) => void;
  onSelect?: (value: string) => void;
  disabled?: boolean;
  checked?: boolean;
  value?: string | number | boolean | readonly string[];
  placeholder?: string;
  type?: string;
  role?: string;
  'aria-label'?: string;
  'aria-checked'?: boolean;
  'data-testid'?: string;
  ref?: React.Ref<HTMLElement>;
  asChild?: boolean;
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSuccess?: () => void;
  htmlFor?: string;
  rows?: number;
  variant?: string;
  size?: string;
  min?: number;
  max?: number;
  step?: number;
  [key: string]: unknown;
}

// Chart theme type
export type ChartTheme = 'light' ;

// User tier type
export type UserTier = 'grow' | 'unlimited';

// Event performance data interface (matches analytics.ts)
export interface EventPerformanceData {
  eventId: string;
  eventName: string;
  date: string;
  attendance: number;
  revenue: number;
  satisfaction: number;
  capacity: number;
  attendanceRate: number;
  [key: string]: string | number;
}

// Event performance comparator props
export interface EventPerformanceComparatorProps {
  data: EventPerformanceData[];
  selectedMetrics: string[];
  onMetricToggle: (metric: string) => void;
  availableMetrics: string[];
  theme: ChartTheme;
  loading: {
    isLoading: boolean;
    error: Error | null;
  };
  userTier: UserTier;
}

// Segment filter criteria
export interface SegmentFilterCriteria {
  membershipTypes?: string[];
  tags?: string[];
  registrationDateRange?: {
    start?: string;
    end?: string;
  };
  ageRange?: {
    min?: number;
    max?: number;
  };
  customFields?: Record<string, string | number | boolean | null>;
  [key: string]: string | number | boolean | string[] | { start?: string; end?: string } | { min?: number; max?: number } | Record<string, string | number | boolean | null> | undefined;
}

// Member segment interface
export interface MemberSegment {
  id: number;
  clubId: number;
  name: string;
  description?: string;
  filterCriteria: SegmentFilterCriteria;
  memberCount: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Member tag interface
export interface MemberTag {
  id: number;
  clubId: number;
  name: string;
  description?: string;
  color: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

// Bulk tag operation response
export interface BulkTagOperationResponse {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors?: string[];
  details?: Record<string, unknown>;
}

// Mock function type with generic parameters
export type MockFunction<TReturn = unknown, TArgs extends unknown[] = unknown[]> = jest.Mock<TReturn, TArgs>;

// Expect extend map type for Jest
export interface ExpectExtendMap {
  [key: string]: (this: jest.MatcherUtils, received: unknown, ...args: unknown[]) => jest.CustomMatcherResult | Promise<jest.CustomMatcherResult>;
}

// Common test utilities
export interface TestUtilities {
  mockFetch: MockFunction<Promise<Response>>;
  mockConsole: {
    error: MockFunction<void, [message?: unknown, ...optionalParams: unknown[]]>;
    warn: MockFunction<void, [message?: unknown, ...optionalParams: unknown[]]>;
    log: MockFunction<void, [message?: unknown, ...optionalParams: unknown[]]>;
  };
  mockLocalStorage: {
    getItem: MockFunction<string | null, [key: string]>;
    setItem: MockFunction<void, [key: string, value: string]>;
    removeItem: MockFunction<void, [key: string]>;
    clear: MockFunction<void>;
  };
  cleanup: () => void;
}

// Async operation state
export interface AsyncState<T = unknown> {
  data?: T;
  loading?: boolean;
  error?: Error | null;
  isLoading?: boolean;
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  data: T;
  status?: number;
  message?: string;
  success?: boolean;
}

// Error response interface
export interface ErrorResponse {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Pagination interface
export interface PaginationData {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Paginated response
export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination?: PaginationData;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  members?: T[];
}

// Chart configuration types
export interface ChartConfig {
  theme?: ChartTheme;
  width?: number;
  height?: number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  [key: string]: string | number | boolean | undefined;
}

// Export utility types
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;