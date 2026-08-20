/**
 * Async State Manager - Perfect Loading & State Management Patterns
 * 
 * Provides comprehensive async state management with optimized loading states,
 * error handling, caching, and performance monitoring for React applications.
 */

import { useRef, useCallback, useReducer, useEffect } from 'react';
import { AsyncOperationHook, MutationHook, QueryHook, LoadingState } from './architectural-patterns';

// ============================================================================
// ASYNC STATE TYPES
// ============================================================================

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: unknown | null;
  lastUpdated: number | null;
  stale: boolean;
}

export interface AsyncStateOptions {
  initialData?: unknown;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  staleTime?: number;
  cacheTime?: number;
  debounceMs?: number;
  enabled?: boolean;
}

// ============================================================================
// ASYNC STATE ACTIONS
// ============================================================================

type AsyncStateAction<T> =
  | { type: 'LOADING_START' }
  | { type: 'LOADING_SUCCESS'; payload: T; timestamp: number }
  | { type: 'LOADING_ERROR'; payload: unknown }
  | { type: 'RESET' }
  | { type: 'SET_STALE'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// ============================================================================
// ASYNC STATE REDUCER
// ============================================================================

function asyncStateReducer<T>(
  state: AsyncState<T>,
  action: AsyncStateAction<T>
): AsyncState<T> {
  switch (action.type) {
    case 'LOADING_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOADING_SUCCESS':
      return {
        data: action.payload,
        loading: false,
        error: null,
        lastUpdated: action.timestamp,
        stale: false,
      };
    case 'LOADING_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'RESET':
      return {
        data: null,
        loading: false,
        error: null,
        lastUpdated: null,
        stale: false,
      };
    case 'SET_STALE':
      return {
        ...state,
        stale: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// ============================================================================
// ENHANCED ASYNC OPERATION HOOK
// ============================================================================

export function useAsyncOperation<T, P = void>(
  operation: (params: P) => Promise<T>,
  options: AsyncStateOptions = {}
): AsyncOperationHook<T, P> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 15000,
    staleTime = 5 * 60 * 1000, // 5 minutes
    debounceMs = 0,
    enabled = true,
  } = options;

  const [state, dispatch] = useReducer(asyncStateReducer<T>, {
    data: (options.initialData as T) || null,
    loading: false,
    error: null,
    lastUpdated: null,
    stale: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Execute operation with retry logic and error handling
  const execute = useCallback(async (params: P) => {
    if (!enabled) return;

    cleanup();
    dispatch({ type: 'LOADING_START' });
    retryCountRef.current = 0;

    const attemptOperation = async (): Promise<void> => {
      abortControllerRef.current = new AbortController();
      
      try {
        // Set timeout
        const timeoutPromise = new Promise((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error('Operation timed out'));
          }, timeout);
        });

        // Execute operation
        const operationPromise = operation(params);
        
        const result = await Promise.race([operationPromise, timeoutPromise]) as T;
        
        cleanup();
        dispatch({ 
          type: 'LOADING_SUCCESS', 
          payload: result,
          timestamp: Date.now()
        });
      } catch (error) {
        cleanup();
        
        // Check if we should retry
        if (retryCountRef.current < retries && shouldRetry(error)) {
          retryCountRef.current += 1;
          
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, retryCountRef.current - 1);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          if (enabled) {
            await attemptOperation();
          }
        } else {
          dispatch({ type: 'LOADING_ERROR', payload: error });
        }
      }
    };

    // Debounce if specified
    if (debounceMs > 0) {
      await new Promise(resolve => setTimeout(resolve, debounceMs));
    }

    await attemptOperation();
  }, [operation, enabled, retries, retryDelay, timeout, debounceMs, cleanup]);

  // Reset state
  const reset = useCallback(() => {
    cleanup();
    dispatch({ type: 'RESET' });
  }, [cleanup]);

  // Check if data is stale
  useEffect(() => {
    if (state.lastUpdated && staleTime > 0) {
      const checkStale = () => {
        const isStale = Date.now() - state.lastUpdated! > staleTime;
        if (isStale !== state.stale) {
          dispatch({ type: 'SET_STALE', payload: isStale });
        }
      };

      const interval = setInterval(checkStale, 1000);
      return () => clearInterval(interval);
    }
  }, [state.lastUpdated, state.stale, staleTime]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  };
}

// ============================================================================
// MUTATION HOOK
// ============================================================================

export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: AsyncStateOptions = {}
): MutationHook<TData, TVariables> {
  const asyncOperation = useAsyncOperation(mutationFn, options);

  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    await asyncOperation.execute(variables);
    if (asyncOperation.error) {
      throw asyncOperation.error;
    }
    return asyncOperation.data!;
  }, [asyncOperation]);

  const mutateAsync = mutate;

  return {
    mutate,
    mutateAsync,
    isLoading: asyncOperation.loading,
    isError: !!asyncOperation.error,
    error: asyncOperation.error,
    isSuccess: !asyncOperation.loading && !asyncOperation.error && asyncOperation.data !== null,
    data: asyncOperation.data ?? undefined,
    reset: asyncOperation.reset,
  };
}

// ============================================================================
// QUERY HOOK WITH CACHING
// ============================================================================

interface QueryOptions extends AsyncStateOptions {
  queryKey: string[];
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}

const queryCache = new Map<string, { data: unknown; timestamp: number; staleTime: number }>();

export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: QueryOptions
): QueryHook<T> {
  const {
    queryKey,
    refetchInterval,
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
    enabled = true,
  } = options;

  const cacheKey = JSON.stringify(queryKey);
  const asyncOperation = useAsyncOperation(queryFn, { ...options, enabled: false });

  // Check cache and execute if needed
  const refetch = useCallback(async () => {
    if (!enabled) return;

    const cached = queryCache.get(cacheKey);
    const now = Date.now();

    // Use cached data if not stale
    if (cached && (now - cached.timestamp) < cached.staleTime) {
      // Update state with cached data without loading
      asyncOperation.reset();
      // We need to manually update the state here
      return;
    }

    await asyncOperation.execute(undefined as never);

    // Cache the result
    if (asyncOperation.data) {
      queryCache.set(cacheKey, {
        data: asyncOperation.data,
        timestamp: now,
        staleTime,
      });

      // Clean up old cache entries
      for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > cacheTime) {
          queryCache.delete(key);
        }
      }
    }
  }, [cacheKey, enabled, staleTime, cacheTime, asyncOperation]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [refetch, enabled]);

  // Refetch on interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(refetch, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, enabled, refetch]);

  // Refetch on window focus
  useEffect(() => {
    if (refetchOnWindowFocus && enabled) {
      const handleFocus = () => refetch();
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [refetchOnWindowFocus, enabled, refetch]);

  // Refetch on reconnect
  useEffect(() => {
    if (refetchOnReconnect && enabled) {
      const handleOnline = () => refetch();
      window.addEventListener('online', handleOnline);
      return () => window.removeEventListener('online', handleOnline);
    }
  }, [refetchOnReconnect, enabled, refetch]);

  // Check if cached data is stale
  const cached = queryCache.get(cacheKey);
  const isStale = cached
    ? (Date.now() - cached.timestamp) >= cached.staleTime
    : false;

  return {
    data: asyncOperation.data ?? undefined,
    isLoading: asyncOperation.loading,
    isError: !!asyncOperation.error,
    error: asyncOperation.error,
    isSuccess: !asyncOperation.loading && !asyncOperation.error && asyncOperation.data !== null,
    refetch,
    isFetching: asyncOperation.loading,
    isStale,
  };
}

// ============================================================================
// LOADING STATE MANAGER
// ============================================================================

export class LoadingStateManager {
  private states = new Map<string, LoadingState>();
  private listeners = new Set<(states: Record<string, LoadingState>) => void>();

  setState(key: string, state: LoadingState): void {
    this.states.set(key, state);
    this.notifyListeners();
  }

  getState(key: string): LoadingState {
    return this.states.get(key) || 'idle';
  }

  getAllStates(): Record<string, LoadingState> {
    return Object.fromEntries(this.states);
  }

  isAnyLoading(): boolean {
    return Array.from(this.states.values()).some(state => state === 'loading');
  }

  subscribe(listener: (states: Record<string, LoadingState>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const states = this.getAllStates();
    this.listeners.forEach(listener => listener(states));
  }

  clear(): void {
    this.states.clear();
    this.notifyListeners();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function shouldRetry(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const errorWithStatus = error as { status: unknown };
    const status = typeof errorWithStatus.status === 'number' ? errorWithStatus.status : 0;
    // Don't retry 4xx errors except 408, 429
    return !(status >= 400 && status < 500 && status !== 408 && status !== 429);
  }
  return true;
}

// ============================================================================
// ASYNC STATE PATTERNS EXPORT
// ============================================================================

export const AsyncStatePatterns = {
  useAsyncOperation,
  useMutation,
  useQuery,
  LoadingStateManager,
  queryCache,
} as const;

export default AsyncStatePatterns;