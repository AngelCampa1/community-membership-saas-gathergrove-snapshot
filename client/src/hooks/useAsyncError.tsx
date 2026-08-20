import { useState, useCallback, useRef } from 'react';
import { ErrorHandler, HookErrorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

interface AsyncErrorState {
  isLoading: boolean;
  error: unknown | null;
  hasError: boolean;
}

interface UseAsyncErrorOptions {
  context?: string;
  showToast?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export function useAsyncError(options: UseAsyncErrorOptions = {}) {
  const [state, setState] = useState<AsyncErrorState>({
    isLoading: false,
    error: null,
    hasError: false
  });

  const retryCountRef = useRef(0);
  const lastOperationRef = useRef<(() => Promise<unknown>) | null>(null);

  const { context = 'operation', showToast = true, retryCount = 3, retryDelay = 1000 } = options;

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: unknown) => {
    setState(prev => ({ ...prev, error, hasError: !!error, isLoading: false }));
    
    if (error && showToast) {
      const errorMessage = HookErrorHandler.handleDataFetchError(error, context);
      ErrorHandler.showErrorToast(error, errorMessage);
    }
  }, [context, showToast]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, hasError: false }));
    retryCountRef.current = 0;
  }, []);

  const executeAsync = useCallback(async <T,>(
    asyncOperation: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      // Clear error state but NOT retry count (only clearError() should reset retry count)
      setState(prev => ({ ...prev, error: null, hasError: false }));

      // Store operation for potential retry
      lastOperationRef.current = asyncOperation;

      const result = await asyncOperation();

      if (successMessage && showToast) {
        ErrorHandler.showSuccessToast(successMessage);
      }

      retryCountRef.current = 0;
      return result;
    } catch (error) {
      logger.error('api', `Async ${context} failed`, { error, context });
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [context, showToast, setLoading, setError]);

  const retryLastOperation = useCallback(async () => {
    if (!lastOperationRef.current) {
      ErrorHandler.showWarningToast('No operation to retry.');
      return null;
    }

    if (retryCountRef.current >= retryCount) {
      ErrorHandler.showErrorToast(
        new Error('Maximum retry attempts reached'),
        `Unable to complete ${context} after ${retryCount} attempts. Please try again later.`
      );
      return null;
    }

    retryCountRef.current++;
    
    // Add delay between retries
    if (retryDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    return executeAsync(lastOperationRef.current, `${context} completed successfully after retry.`);
  }, [context, retryCount, retryDelay, executeAsync]);

  const executeWithRetry = useCallback(async <T,>(
    asyncOperation: () => Promise<T>,
    maxRetries: number = retryCount,
    delay: number = retryDelay
  ): Promise<T | null> => {
    let attempts = 0;
    let _lastError: unknown = null;

    while (attempts <= maxRetries) {
      try {
        if (attempts > 0) {
          setLoading(true);
          // Add delay between retries
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          logger.warn('api', `Retry attempt ${attempts} for ${context}`, { attempts, maxRetries, context });
        } else {
          setLoading(true);
          // Clear error state on first attempt
          setState(prev => ({ ...prev, error: null, hasError: false }));
        }

        // Store operation for potential manual retry
        lastOperationRef.current = asyncOperation;

        const result = await asyncOperation();

        setLoading(false);
        retryCountRef.current = 0;
        return result;
      } catch (error) {
        _lastError = error;
        attempts++;

        if (attempts > maxRetries) {
          logger.error('api', `All retry attempts failed for ${context}`, { error, attempts, maxRetries, context });
          setError(error);
          setLoading(false);
          return null;
        }

        logger.warn('api', `Retry attempt failed for ${context}`, { error, attempts, maxRetries, context });
      }
    }

    setLoading(false);
    return null;
  }, [context, retryCount, retryDelay, setLoading, setError]);

  return {
    ...state,
    executeAsync,
    retryLastOperation,
    executeWithRetry,
    clearError,
    setLoading,
    canRetry: !!lastOperationRef.current && retryCountRef.current < retryCount,
    retryAttempts: retryCountRef.current,
    maxRetries: retryCount
  };
} 