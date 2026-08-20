/**
 * Advanced Lazy Loading Wrapper Component
 * 
 * Provides intelligent lazy loading with intersection observer,
 * fallback support, and performance monitoring.
 */

import React, { Suspense, lazy, ComponentType, ReactElement, useState, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '@/lib/logger';

interface LazyLoadWrapperProps {
  children: ReactElement;
  fallback?: ReactElement;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  retryCount?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  'data-testid'?: string;
}

interface LazyComponentCache {
  [key: string]: React.LazyExoticComponent<ComponentType<any>>;
}

// Global cache for lazy components to prevent re-imports
const componentCache: LazyComponentCache = {};

/**
 * Creates a lazy component with caching and error handling
 */
export function createLazyComponent<T = Record<string, unknown>>(
  importFunction: () => Promise<{ default: ComponentType<T> }>,
  componentName: string
): React.LazyExoticComponent<ComponentType<T>> {
  if (componentCache[componentName]) {
    return componentCache[componentName] as React.LazyExoticComponent<ComponentType<T>>;
  }

  const LazyComponent = lazy(async () => {
    try {
      const componentModule = await importFunction();
      return componentModule;
    } catch (error) {
      logger.error('ui', `Failed to load lazy component: ${componentName}`, { error, componentName });
      // Return a fallback component that shows the error
      return {
        default: () => (
          <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
            <h3 className="text-destructive font-semibold">Component Load Error</h3>
            <p className="text-destructive-foreground text-sm">Failed to load {componentName}</p>
          </div>
        )
      };
    }
  });

  componentCache[componentName] = LazyComponent as React.LazyExoticComponent<ComponentType<any>>;
  return LazyComponent;
}

/**
 * Intersection Observer hook for lazy loading
 */
function useIntersectionObserver(
  threshold: number = 0.1,
  rootMargin: string = '50px'
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);

  return { ref: setRef, isIntersecting };
}

/**
 * Enhanced Loading Component with skeleton
 */
const LazyLoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse ${className || ''}`}>
    <div className="bg-muted rounded-lg h-32 w-full mb-4"></div>
    <div className="space-y-2">
      <div className="bg-muted rounded h-4 w-3/4"></div>
      <div className="bg-muted rounded h-4 w-1/2"></div>
    </div>
  </div>
);

/**
 * Retry Logic Component
 */
interface RetryWrapperProps {
  children: ReactElement;
  retryCount: number;
  onError?: (error: Error) => void;
}

const RetryWrapper: React.FC<RetryWrapperProps> = ({ 
  children, 
  retryCount, 
  onError 
}) => {
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const handleRetry = () => {
    if (attempts < retryCount) {
      setAttempts(prev => prev + 1);
      setError(null);
    }
  };

  const handleError = (err: Error) => {
    setError(err);
    onError?.(err);
  };

  if (error && attempts >= retryCount) {
    return (
      <div className="p-4 border border-warning/20 bg-warning/10 rounded-lg">
        <h3 className="text-warning font-semibold">Component Unavailable</h3>
        <p className="text-warning-foreground text-sm">
          Failed to load after {retryCount} attempts
        </p>
        <button
          onClick={handleRetry}
          className="mt-2 px-3 py-1 bg-warning text-white rounded text-sm hover:bg-warning/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleError} fallback={null}>
      {children}
    </ErrorBoundary>
  );
};

/**
 * Main LazyLoadWrapper Component
 */
export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  fallback,
  delay = 0,
  threshold = 0.1,
  rootMargin = '50px',
  retryCount = 3,
  onLoad,
  onError,
  className,
  'data-testid': testId
}) => {
  const { ref, isIntersecting } = useIntersectionObserver(threshold, rootMargin);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (isIntersecting) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          setShouldLoad(true);
          onLoad?.();
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setShouldLoad(true);
        onLoad?.();
      }
    }
  }, [isIntersecting, delay, onLoad]);

  const defaultFallback = fallback || <LazyLoadingSkeleton className={className} />;

  return (
    <div ref={ref} className={className} data-testid={testId}>
      {shouldLoad ? (
        <RetryWrapper retryCount={retryCount} onError={onError}>
          <Suspense fallback={defaultFallback}>
            {children}
          </Suspense>
        </RetryWrapper>
      ) : (
        defaultFallback
      )}
    </div>
  );
};

/**
 * Higher-order component for lazy loading
 */
export function withLazyLoad<T extends object>(
  Component: ComponentType<T>,
  options: Partial<LazyLoadWrapperProps> = {}
) {
  const LazyComponent = (props: T) => (
    <LazyLoadWrapper {...options}>
      <Component {...props} />
    </LazyLoadWrapper>
  );
  LazyComponent.displayName = `LazyLoad(${Component.displayName || Component.name})`;
  return LazyComponent;
}

/**
 * Hook for dynamic imports with caching
 */
export function useDynamicImport<T>(
  importFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [state, setState] = useState<{
    loading: boolean;
    data: T | null;
    error: Error | null;
  }>({
    loading: false,
    data: null,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    setState(prev => ({ ...prev, loading: true, error: null }));

    importFunction()
      .then(data => {
        if (!cancelled) {
          setState({ loading: false, data, error: null });
        }
      })
      .catch(error => {
        if (!cancelled) {
          setState({ loading: false, data: null, error });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dependencies array is intentionally dynamic, importFunction is stable from parent
  }, dependencies);

  return state;
}

export default LazyLoadWrapper;