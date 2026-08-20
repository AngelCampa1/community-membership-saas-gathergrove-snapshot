/**
 * Error Boundary Factory - Perfect Error Handling Patterns
 * 
 * Implements comprehensive error boundary patterns with recovery strategies,
 * logging, and user-friendly fallback interfaces.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallbackProps, ErrorBoundaryProps } from './architectural-patterns';
import { ErrorHandler } from './errorHandler';
import { trackError } from './sentry';

// ============================================================================
// ERROR BOUNDARY STATE
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  lastErrorTime: number;
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  RENDER = 'render',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown',
}

export interface ErrorClassification {
  severity: ErrorSeverity;
  category: ErrorCategory;
  recoverable: boolean;
  userMessage: string;
  technicalMessage: string;
}

// ============================================================================
// ERROR CLASSIFIERS
// ============================================================================

function classifyError(error: Error): ErrorClassification {
  const message = (error.message || '').toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return {
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.NETWORK,
      recoverable: true,
      userMessage: 'Connection issue. Please check your internet and try again.',
      technicalMessage: error.message,
    };
  }

  // Permission errors
  if (message.includes('permission') || message.includes('unauthorized')) {
    return {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.PERMISSION,
      recoverable: false,
      userMessage: 'You don\'t have permission to access this resource.',
      technicalMessage: error.message,
    };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid')) {
    return {
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.VALIDATION,
      recoverable: true,
      userMessage: 'Please check your input and try again.',
      technicalMessage: error.message,
    };
  }

  // Render errors
  if (stack.includes('react') || stack.includes('render')) {
    return {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.RENDER,
      recoverable: true,
      userMessage: 'Something went wrong displaying this content.',
      technicalMessage: error.message,
    };
  }

  // Default classification
  return {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.UNKNOWN,
    recoverable: true,
    userMessage: 'An unexpected error occurred.',
    technicalMessage: error.message,
  };
}

// ============================================================================
// ERROR FALLBACK COMPONENTS
// ============================================================================

/**
 * Minimal error fallback for inline components
 */
export function MinimalErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const classification = classifyError(error);

  return (
    <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-destructive/60" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-destructive">{classification.userMessage}</p>
          </div>
        </div>
        {classification.recoverable && (
          <button
            onClick={resetError}
            className="text-sm text-destructive hover:text-destructive/80 underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Full-page error fallback for critical errors
 */
export function FullPageErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const classification = classifyError(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-destructive">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Oops! Something went wrong
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {classification.userMessage}
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          {classification.recoverable && (
            <button
              onClick={resetError}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="group relative w-full flex justify-center py-2 px-4 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            Go to Homepage
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6">
            <summary className="text-sm text-muted-foreground cursor-pointer">
              Technical Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-muted-foreground bg-muted p-3 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Card-based error fallback for component sections
 */
export function CardErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const classification = classifyError(error);

  return (
    <div className="bg-card shadow rounded-lg p-6 border border-destructive/20">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 text-destructive mb-4">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Unable to load content
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {classification.userMessage}
        </p>
        {classification.recoverable && (
          <button
            onClick={resetError}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-full text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ENHANCED ERROR BOUNDARY
// ============================================================================

export class EnhancedErrorBoundary extends Component<
  ErrorBoundaryProps & {
    fallback?: React.ComponentType<ErrorFallbackProps>;
    maxRetries?: number;
    resetTimeout?: number;
    isolate?: boolean;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  },
  ErrorBoundaryState
> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps & {
    fallback?: React.ComponentType<ErrorFallbackProps>;
    maxRetries?: number;
    resetTimeout?: number;
    isolate?: boolean;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9),
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const classification = classifyError(error);
    
    // Log error
    this.logError(error, errorInfo, classification);
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
    
    // Auto-retry for recoverable errors
    if (classification.recoverable && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleReset();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private logError(error: Error, errorInfo: ErrorInfo, classification: ErrorClassification) {
    // Track in Application Insights
    trackError(error, {
      errorBoundary: true,
      classification: classification.category,
      severity: classification.severity,
      recoverable: classification.recoverable,
      retryCount: this.state.retryCount,
      componentStack: errorInfo.componentStack,
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Classification:', classification);
      console.groupEnd();
    }

    // Log to external service
    ErrorHandler.handleApiError(error, {
      context: 'Error Boundary',
      action: 'Component error caught',
    });
  }

  private scheduleReset = () => {
    const timeout = this.props.resetTimeout || 5000;
    
    this.resetTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
        lastErrorTime: 0,
      }));
    }, timeout);
  };

  private resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      lastErrorTime: 0,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || MinimalErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// ERROR BOUNDARY FACTORIES
// ============================================================================

/**
 * Create page-level error boundary
 */
export function createPageErrorBoundary(
  options?: {
    fallback?: React.ComponentType<ErrorFallbackProps>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
) {
  return function PageErrorBoundary({ children }: { children: ReactNode }) {
    return (
      <EnhancedErrorBoundary
        fallback={options?.fallback || FullPageErrorFallback}
        onError={options?.onError}
        maxRetries={2}
        resetTimeout={10000}
      >
        {children}
      </EnhancedErrorBoundary>
    );
  };
}

/**
 * Create component-level error boundary
 */
export function createComponentErrorBoundary(
  options?: {
    fallback?: React.ComponentType<ErrorFallbackProps>;
    maxRetries?: number;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
) {
  return function ComponentErrorBoundary({ children }: { children: ReactNode }) {
    return (
      <EnhancedErrorBoundary
        fallback={options?.fallback || CardErrorFallback}
        onError={options?.onError}
        maxRetries={options?.maxRetries || 3}
        resetTimeout={5000}
        isolate
      >
        {children}
      </EnhancedErrorBoundary>
    );
  };
}

/**
 * HOC for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary fallback={fallback}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// ============================================================================
// ERROR BOUNDARY UTILS
// ============================================================================

export const ErrorBoundaryUtils = {
  classifyError,
  createPageErrorBoundary,
  createComponentErrorBoundary,
  withErrorBoundary,
  MinimalErrorFallback,
  FullPageErrorFallback,
  CardErrorFallback,
  EnhancedErrorBoundary,
} as const;

export default ErrorBoundaryUtils;