/**
 * Comprehensive Error Boundary Component
 * 
 * Provides robust error handling with recovery options,
 * error reporting, and graceful fallbacks.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  level?: 'page' | 'component' | 'feature';
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
}

/**
 * Error logging service
 */
class ErrorLogger {
  static log(error: Error, errorInfo: ErrorInfo, level: string = 'component') {
    // Use structured logger for production monitoring
    logger.error('ui', 'Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });

    // Keep console.error for development debugging
    if (process.env.NODE_ENV !== 'production') {
      console.group('🚨 Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }
}

/**
 * Default error fallback components
 */
const ErrorFallbacks = {
  page: (error: Error, retry: () => void) => (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="max-w-md w-full bg-card shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-foreground">Application Error</h3>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-sm text-muted-foreground cursor-pointer">Error Details</summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        <div className="flex space-x-3">
          <Button onClick={retry} variant="default" size="sm">
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  ),

  component: (error: Error, retry: () => void) => (
    <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-destructive">Component Error</h3>
          <p className="mt-1 text-sm text-destructive-foreground">
            This component encountered an error and couldn't be displayed.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs text-destructive cursor-pointer">Error Details</summary>
              <pre className="mt-1 text-xs bg-destructive/10 p-2 rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          <div className="mt-3">
            <Button onClick={retry} variant="outline" size="sm">
              Retry Component
            </Button>
          </div>
        </div>
      </div>
    </div>
  ),

  feature: (error: Error, retry: () => void) => (
    <div className="p-6 border border-warning/20 bg-warning/10 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-warning">Feature Unavailable</h3>
          <p className="mt-1 text-sm text-warning-foreground">
            This feature is temporarily unavailable. You can continue using other parts of the application.
          </p>
          <div className="mt-3">
            <Button onClick={retry} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
};

/**
 * Main Error Boundary Class
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    this.setState({
      error,
      errorInfo
    });

    // Log error
    ErrorLogger.log(error, errorInfo, level);
    
    // Call custom error handler
    onError?.(error, errorInfo);

    // Auto-retry for certain types of errors
    if (this.shouldAutoRetry(error)) {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.children !== this.props.children) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => prevProps.resetKeys![index] !== key
      );
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  shouldAutoRetry = (error: Error): boolean => {
    // Auto-retry for network errors, chunk loading errors, etc.
    return (
      error.message.includes('Loading chunk') ||
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading CSS chunk')
    );
  };

  scheduleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.resetTimeoutId = window.setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: prevState.retryCount + 1
        }));
      }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
    }
  };

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, level = 'component', isolate } = this.props;

    if (hasError && error) {
      // Custom fallback
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.resetErrorBoundary);
        }
        return fallback;
      }

      // Default fallback based on level
      const DefaultFallback = ErrorFallbacks[level];
      const fallbackElement = DefaultFallback(error, this.resetErrorBoundary);

      // Isolate error boundary to prevent cascading failures
      if (isolate) {
        return (
          <div style={{ isolation: 'isolate' }}>
            {fallbackElement}
          </div>
        );
      }

      return fallbackElement;
    }

    return children;
  }
}

/**
 * Higher-order component for adding error boundaries
 */
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, 'children'> = {}
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for handling async errors in functional components
 */
export function useErrorHandler() {
  return React.useCallback((error: Error) => {
    // Throw error to be caught by nearest error boundary
    throw error;
  }, []);
}

/**
 * Hook for safe async operations
 */
export function useSafeAsync<T, E = Error>() {
  const [state, setState] = React.useState<{
    loading: boolean;
    data: T | null;
    error: E | null;
  }>({
    loading: false,
    data: null,
    error: null
  });

  const execute = React.useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ loading: true, data: null, error: null });
    
    try {
      const result = await asyncFunction();
      setState({ loading: false, data: result, error: null });
      return result;
    } catch (error) {
      setState({ loading: false, data: null, error: error as E });
      throw error;
    }
  }, []);

  const reset = React.useCallback(() => {
    setState({ loading: false, data: null, error: null });
  }, []);

  return { ...state, execute, reset };
}

export default ErrorBoundary;