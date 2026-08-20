/**
 * Context Factory - Perfect Context Pattern Implementation
 * 
 * Eliminates prop drilling with optimized context patterns and providers
 * that follow React best practices for performance and maintainability.
 */

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useState, 
  useCallback, 
  useMemo, 
  useRef,
  useEffect,
  ReactNode 
} from 'react';
import { AsyncContextState } from './architectural-patterns';

// ============================================================================
// CONTEXT CREATION UTILITIES
// ============================================================================

/**
 * Create a context with proper TypeScript support and error handling
 */
export function createStrictContext<T>(
  name: string,
  defaultValue?: T
): [React.Context<T | undefined>, () => T] {
  const Context = createContext<T | undefined>(defaultValue);
  Context.displayName = `${name}Context`;

  function useStrictContext(): T {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error(`use${name} must be used within a ${name}Provider`);
    }
    return context;
  }

  return [Context, useStrictContext];
}

/**
 * Create a context with optional error boundary
 */
export function createContextWithBoundary<T>(
  name: string,
  _fallbackValue?: T
): [React.Context<T | undefined>, () => T, React.ComponentType<{ children: ReactNode }>] {
  const [Context, useStrictContext] = createStrictContext<T>(name);

  function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
    return (
      <React.Suspense fallback={<div>Loading {name}...</div>}>
        {children}
      </React.Suspense>
    );
  }

  return [Context, useStrictContext, ErrorBoundaryProvider];
}

// ============================================================================
// ASYNC CONTEXT PATTERN
// ============================================================================

/**
 * Action types for async context reducer
 */
type AsyncAction<T> =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'ERROR'; payload: unknown }
  | { type: 'RESET' }
  | { type: 'CLEAR_ERROR' };

/**
 * Async context reducer
 */
function asyncReducer<T>(
  state: AsyncContextState<T>,
  action: AsyncAction<T>
): AsyncContextState<T> {
  switch (action.type) {
    case 'LOADING':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'SUCCESS':
      return {
        data: action.payload,
        loading: false,
        error: null,
        refresh: state.refresh,
        clearError: state.clearError,
      };
    case 'ERROR':
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
        refresh: state.refresh,
        clearError: state.clearError,
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

/**
 * Create async context with loading, error, and data states
 */
export function createAsyncContext<T>(
  name: string,
  fetcher: () => Promise<T>
): [
  React.Context<AsyncContextState<T> | undefined>,
  () => AsyncContextState<T>,
  React.ComponentType<{ children: ReactNode; autoFetch?: boolean }>
] {
  const [Context, useAsyncContext] = createStrictContext<AsyncContextState<T>>(name);

  function AsyncProvider({ children, autoFetch = true }: { children: ReactNode; autoFetch?: boolean }) {
    const [state, dispatch] = useReducer(asyncReducer<T>, {
      data: null,
      loading: false,
      error: null,
    } as AsyncContextState<T>);

    const refresh = useCallback(async () => {
      try {
        dispatch({ type: 'LOADING' });
        const data = await fetcher();
        dispatch({ type: 'SUCCESS', payload: data });
      } catch (error) {
        dispatch({ type: 'ERROR', payload: error });
      }
    }, []);

    const clearError = useCallback(() => {
      dispatch({ type: 'CLEAR_ERROR' });
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo<AsyncContextState<T>>(() => ({
      ...state,
      refresh,
      clearError,
    }), [state, refresh, clearError]);

    // Auto-fetch on mount if enabled
    useEffect(() => {
      if (autoFetch) {
        refresh();
      }
    }, [autoFetch, refresh]);

    return (
      <Context.Provider value={contextValue}>
        {children}
      </Context.Provider>
    );
  }

  return [Context, useAsyncContext, AsyncProvider];
}

// ============================================================================
// STATE MANAGEMENT CONTEXT PATTERN
// ============================================================================

/**
 * Generic state action
 */
export interface StateAction<T = unknown> {
  type: string;
  payload?: T;
}

/**
 * State management context with reducer pattern
 */
export function createStateContext<TState, TAction extends StateAction>(
  name: string,
  reducer: (state: TState, action: TAction) => TState,
  initialState: TState
): [
  React.Context<{ state: TState; dispatch: React.Dispatch<TAction> } | undefined>,
  () => { state: TState; dispatch: React.Dispatch<TAction> },
  React.ComponentType<{ children: ReactNode; initialState?: TState }>
] {
  const [Context, useStateContext] = createStrictContext<{
    state: TState;
    dispatch: React.Dispatch<TAction>;
  }>(name);

  function StateProvider({ 
    children, 
    initialState: providedInitialState 
  }: { 
    children: ReactNode; 
    initialState?: TState;
  }) {
    const [state, dispatch] = useReducer(reducer, providedInitialState || initialState);

    const contextValue = useMemo(() => ({
      state,
      dispatch,
    }), [state, dispatch]);

    return (
      <Context.Provider value={contextValue}>
        {children}
      </Context.Provider>
    );
  }

  return [Context, useStateContext, StateProvider];
}

// ============================================================================
// OPTIMIZED CONTEXT PATTERNS
// ============================================================================

/**
 * Context with performance optimization using refs
 */
export function createOptimizedContext<T>(
  name: string,
  defaultValue: T
): [
  React.Context<{ current: T; listeners: Set<() => void> } | undefined>,
  () => T,
  (value: T) => void,
  React.ComponentType<{ children: ReactNode; initialValue?: T }>
] {
  const [Context, useOptimizedContext] = createStrictContext<{
    current: T;
    listeners: Set<() => void>;
  }>(name);

  function useValue(): T {
    const context = useOptimizedContext();
    const [, forceUpdate] = useState({});
    
    useEffect(() => {
      const listener = () => forceUpdate({});
      context.listeners.add(listener);
      
      return () => {
        context.listeners.delete(listener);
      };
    }, [context]);

    return context.current;
  }

  function useSetValue(): (value: T) => void {
    const context = useOptimizedContext();
    
    return useCallback((value: T) => {
      context.current = value;
      context.listeners.forEach(listener => listener());
    }, [context]);
  }

  function OptimizedProvider({ 
    children, 
    initialValue 
  }: { 
    children: ReactNode; 
    initialValue?: T;
  }) {
    const contextValue = useMemo(() => ({
      current: initialValue || defaultValue,
      listeners: new Set<() => void>(),
    }), [initialValue]);

    return (
      <Context.Provider value={contextValue}>
        {children}
      </Context.Provider>
    );
  }

  return [Context, useValue, useSetValue, OptimizedProvider];
}

// ============================================================================
// COMPOSITION CONTEXT PATTERN
// ============================================================================

/**
 * Compose multiple context providers into a single provider
 */
export function composeProviders(
  ...providers: Array<React.ComponentType<{ children: ReactNode }>>
): React.ComponentType<{ children: ReactNode }> {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduce(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children as React.ReactElement
    );
  };
}

/**
 * Provider configuration for composition
 */
export interface ProviderConfig {
  Provider: React.ComponentType<any>;
  props?: Record<string, unknown>;
}

/**
 * Compose providers with configuration
 */
export function composeProvidersWithConfig(
  configs: ProviderConfig[]
): React.ComponentType<{ children: ReactNode }> {
  return ({ children }: { children: ReactNode }) => {
    return configs.reduce(
      (acc, { Provider, props = {} }) => (
        <Provider {...props}>{acc}</Provider>
      ),
      children as React.ReactElement
    );
  };
}

// ============================================================================
// CONTEXT DEBUGGING UTILITIES
// ============================================================================

/**
 * Debug context with value tracking
 */
export function createDebugContext<T>(
  name: string,
  defaultValue?: T
): [React.Context<T | undefined>, () => T] {
  const [Context, useStrictContext] = createStrictContext<T>(name, defaultValue);

  function useDebugContext(): T {
    const value = useStrictContext();
    
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        console.group(`Context Debug: ${name}`);
        console.log('Current value:', value);
        console.trace('Context accessed from:');
        console.groupEnd();
      }
    }, [value]);

    return value;
  }

  return [Context, useDebugContext];
}

/**
 * Context performance monitor
 */
export function useContextPerformance(contextName: string) {
  const renderCount = useRef(0);
  const lastRender = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRender.current;
    lastRender.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`Context Performance [${contextName}]:`, {
        renderCount: renderCount.current,
        timeSinceLastRender: `${timeSinceLastRender}ms`,
      });
    }
  });
}

// ============================================================================
// CONTEXT PATTERNS EXPORT
// ============================================================================

export const ContextPatterns = {
  createStrictContext,
  createContextWithBoundary,
  createAsyncContext,
  createStateContext,
  createOptimizedContext,
  createDebugContext,
  composeProviders,
  composeProvidersWithConfig,
  useContextPerformance,
} as const;

export default ContextPatterns;