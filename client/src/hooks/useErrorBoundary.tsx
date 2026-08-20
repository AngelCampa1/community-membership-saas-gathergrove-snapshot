import { useState, useCallback } from 'react';
import { ErrorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export function useErrorBoundary() {
  const [errorState, setErrorState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
    errorInfo: null
  });

  const handleError = useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    logger.error('ui', 'Component error caught in error boundary', { error, errorInfo });

    setErrorState({
      hasError: true,
      error,
      errorInfo: errorInfo || null
    });

    // Report error to error handling service
    ErrorHandler.showErrorToast(error, 'Something went wrong. The page will be reset.');
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }, []);

  const resetError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }, []);

  const retryWithReset = useCallback((retryAction?: () => void | Promise<void>) => {
    resetError();
    if (retryAction) {
      try {
        const result = retryAction();
        if (result instanceof Promise) {
          result.catch((error) => {
            logger.error('ui', 'Retry action failed in error boundary', { error });
            ErrorHandler.showErrorToast(error, 'Retry failed. Please try again.');
          });
        }
      } catch (error) {
        logger.error('ui', 'Retry action failed in error boundary', { error });
        ErrorHandler.showErrorToast(error, 'Retry failed. Please try again.');
      }
    }
  }, [resetError]);

  return {
    ...errorState,
    handleError,
    resetError,
    retryWithReset
  };
} 