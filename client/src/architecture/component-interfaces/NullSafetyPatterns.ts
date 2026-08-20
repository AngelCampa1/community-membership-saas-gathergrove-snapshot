/**
 * ARCHITECTURE DECISION RECORD: Null Safety Patterns
 * 
 * Problem: Inconsistent null/undefined checking patterns causing runtime errors
 * - pathname possibly null in RouteProtection component
 * - data.upcomingEvents.length possibly undefined access
 * - Missing null checks throughout analytics components
 * 
 * Solution: Consistent null safety patterns with utility functions and type guards
 */

// Type-safe pathname handling
export interface SafePathname {
  value: string;
  isValid: boolean;
}

export const createSafePathname = (pathname: string | null | undefined): SafePathname => {
  const value = pathname || '/';
  return {
    value,
    isValid: Boolean(pathname && pathname.length > 0)
  };
};

// Route matching with null safety
export const safeRouteMatching = {
  isPublicRoute: (pathname: string | null, publicRoutes: string[]): boolean => {
    if (!pathname) return false;
    return publicRoutes.some(route => 
      route === "/" ? pathname === "/" : pathname.startsWith(route)
    );
  },
  
  isAdminRoute: (pathname: string | null, adminRoutes: string[]): boolean => {
    if (!pathname) return false;
    return adminRoutes.some(route => pathname.startsWith(route));
  },
  
  isMemberRoute: (pathname: string | null, memberRoutes: string[]): boolean => {
    if (!pathname) return false;
    return memberRoutes.some(route => pathname.startsWith(route));
  },
  
  startsWithRoute: (pathname: string | null, routes: string[]): boolean => {
    if (!pathname) return false;
    return routes.some(route => pathname.startsWith(route));
  }
};

// Safe array access patterns
export const safeArrayAccess = {
  getLength: <T>(array: T[] | undefined | null): number => array?.length || 0,
  
  isEmpty: <T>(array: T[] | undefined | null): boolean => !array || array.length === 0,
  
  getFirstItem: <T>(array: T[] | undefined | null): T | undefined => array?.[0],
  
  getLastItem: <T>(array: T[] | undefined | null): T | undefined => 
    array && array.length > 0 ? array[array.length - 1] : undefined,
  
  safeMap: <T, U>(
    array: T[] | undefined | null, 
    callback: (item: T, index: number) => U
  ): U[] => array?.map(callback) || [],
  
  safeFilter: <T>(
    array: T[] | undefined | null,
    predicate: (item: T) => boolean
  ): T[] => array?.filter(predicate) || [],
  
  safeFind: <T>(
    array: T[] | undefined | null,
    predicate: (item: T) => boolean
  ): T | undefined => array?.find(predicate),
};

// Safe object property access
export const safeObjectAccess = {
  getProperty: <T, K extends keyof T>(
    obj: T | undefined | null, 
    key: K, 
    defaultValue: T[K]
  ): T[K] => obj?.[key] ?? defaultValue,
  
  hasProperty: <T, K extends keyof T>(
    obj: T | undefined | null, 
    key: K
  ): obj is T => Boolean(obj && typeof obj === 'object' && key in obj),
  
  getNestedProperty: <T, K extends keyof T, L extends keyof T[K]>(
    obj: T | undefined | null,
    key: K,
    nestedKey: L,
    defaultValue: T[K][L]
  ): T[K][L] => obj?.[key]?.[nestedKey] ?? defaultValue,
};

// Data validation patterns
export const dataValidation = {
  isValidNumber: (value: unknown): value is number => 
    typeof value === 'number' && !isNaN(value) && isFinite(value),
  
  isValidString: (value: unknown): value is string => 
    typeof value === 'string' && value.length > 0,
  
  isValidDate: (value: unknown): value is Date => 
    value instanceof Date && !isNaN(value.getTime()),
  
  isValidArray: <T>(value: unknown): value is T[] => 
    Array.isArray(value),
  
  isValidObject: (value: unknown): value is Record<string, unknown> => 
    value !== null && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object,
};

// Component state safety patterns
export const componentStateSafety = {
  safeStateUpdate: <T>(
    currentState: T | undefined,
    newState: Partial<T>,
    defaultState: T
  ): T => ({
    ...(currentState || defaultState),
    ...newState
  }),
  
  safeAsyncStateUpdate: <T>(
    setState: React.Dispatch<React.SetStateAction<T>>,
    newState: T,
    validator: (state: T) => boolean
  ): void => {
    if (validator(newState)) {
      setState(newState);
    }
  },
};

import { logger } from '@/lib/logger';

// Error boundary patterns
export const errorBoundaryPatterns = {
  safeRender: <T>(
    data: T | undefined | null,
    renderFunction: (data: T) => React.ReactNode,
    fallback: React.ReactNode = null
  ): React.ReactNode => {
    if (!data) return fallback;
    try {
      return renderFunction(data);
    } catch (error) {
      logger.error('ui', 'Safe render error in NullSafetyPatterns', { error });
      return fallback;
    }
  },

  safeAsyncOperation: async <T>(
    operation: () => Promise<T>,
    errorHandler: (error: Error) => T,
    _defaultValue: T
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      logger.error('ui', 'Safe async operation error in NullSafetyPatterns', { error });
      return errorHandler(error instanceof Error ? error : new Error('Unknown error'));
    }
  },
};

// Loading state patterns
export const loadingStatePatterns = {
  createLoadingState: <T>(
    isLoading: boolean,
    data: T | undefined | null,
    error: string | null = null
  ) => ({
    isLoading,
    data,
    error,
    hasData: Boolean(data),
    hasError: Boolean(error),
    isReady: !isLoading && Boolean(data) && !error,
  }),
  
  handleAsyncState: <T>(
    asyncResult: {
      data?: T;
      loading?: boolean;
      error?: string | null;
    }
  ) => ({
    data: asyncResult.data || null,
    isLoading: asyncResult.loading || false,
    error: asyncResult.error || null,
    isEmpty: !asyncResult.data,
    isError: Boolean(asyncResult.error),
    isSuccess: Boolean(asyncResult.data) && !asyncResult.error && !asyncResult.loading,
  }),
};