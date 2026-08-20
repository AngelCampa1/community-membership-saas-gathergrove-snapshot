/**
 * Tests for useAsyncError.tsx - Async error handling hook
 * Following boundary mocking pattern: mock only ErrorHandler, HookErrorHandler, logger
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsyncError } from '../useAsyncError';
import { ErrorHandler, HookErrorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

// Mock external dependencies (boundaries only)
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
    showWarningToast: jest.fn(),
  },
  HookErrorHandler: {
    handleDataFetchError: jest.fn((error, context) => `Error in ${context}`),
  },
}));
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;
const mockHookErrorHandler = HookErrorHandler as jest.Mocked<typeof HookErrorHandler>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('useAsyncError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useAsyncError());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasError).toBe(false);
      expect(result.current.canRetry).toBe(false);
      expect(result.current.retryAttempts).toBe(0);
      expect(result.current.maxRetries).toBe(3);
    });

    it('accepts custom options', () => {
      const { result } = renderHook(() =>
        useAsyncError({
          context: 'custom-operation',
          showToast: false,
          retryCount: 5,
          retryDelay: 2000,
        })
      );

      expect(result.current.maxRetries).toBe(5);
    });
  });

  describe('executeAsync()', () => {
    it('executes async operation successfully', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const { result } = renderHook(() => useAsyncError());

      let returnValue: string | null = null;
      await act(async () => {
        returnValue = await result.current.executeAsync(mockOperation);
      });

      expect(returnValue).toBe('success');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('shows success toast when successMessage provided', async () => {
      const mockOperation = jest.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsyncError());

      await act(async () => {
        await result.current.executeAsync(mockOperation, 'Operation successful!');
      });

      expect(mockErrorHandler.showSuccessToast).toHaveBeenCalledWith('Operation successful!');
    });

    it('does not show success toast when showToast is false', async () => {
      const mockOperation = jest.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsyncError({ showToast: false }));

      await act(async () => {
        await result.current.executeAsync(mockOperation, 'Success');
      });

      expect(mockErrorHandler.showSuccessToast).not.toHaveBeenCalled();
    });

    it('handles errors and sets error state', async () => {
      const error = new Error('Operation failed');
      const mockOperation = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsyncError({ context: 'test-op' }));

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.executeAsync(mockOperation);
      });

      expect(returnValue).toBeNull();
      expect(result.current.hasError).toBe(true);
      expect(result.current.error).toBe(error);
      expect(result.current.isLoading).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('api', 'Async test-op failed', expect.objectContaining({ error }));
      expect(mockHookErrorHandler.handleDataFetchError).toHaveBeenCalledWith(error, 'test-op');
      expect(mockErrorHandler.showErrorToast).toHaveBeenCalled();
    });

    it('does not show error toast when showToast is false', async () => {
      const error = new Error('Failed');
      const mockOperation = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsyncError({ showToast: false }));

      await act(async () => {
        await result.current.executeAsync(mockOperation);
      });

      expect(result.current.hasError).toBe(true);
      expect(mockErrorHandler.showErrorToast).not.toHaveBeenCalled();
    });

    it('stores last operation for retry', async () => {
      const mockOperation = jest.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsyncError());

      await act(async () => {
        await result.current.executeAsync(mockOperation);
      });

      expect(result.current.canRetry).toBe(true);
    });

    it('sets loading state correctly', async () => {
      let resolveOperation: (value: string) => void;
      const mockOperation = jest.fn(() => new Promise<string>(resolve => {
        resolveOperation = resolve;
      }));

      const { result } = renderHook(() => useAsyncError());

      // Start operation
      act(() => {
        result.current.executeAsync(mockOperation);
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve operation
      await act(async () => {
        resolveOperation!('done');
        await Promise.resolve();
      });

      // Should not be loading
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('clearError()', () => {
    it('clears error state', async () => {
      const error = new Error('Failed');
      const mockOperation = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsyncError());

      // Trigger error
      await act(async () => {
        await result.current.executeAsync(mockOperation);
      });

      expect(result.current.hasError).toBe(true);

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.hasError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.retryAttempts).toBe(0);
    });
  });

  describe('retryLastOperation()', () => {
    it('retries the last failed operation', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce('success');

      const { result } = renderHook(() => useAsyncError({ retryDelay: 10 }));

      // First attempt (fails)
      await act(async () => {
        await result.current.executeAsync(mockOperation);
      });

      expect(result.current.hasError).toBe(true);
      expect(result.current.canRetry).toBe(true);
      expect(result.current.retryAttempts).toBe(0);

      // Retry (succeeds)
      await act(async () => {
        await result.current.retryLastOperation();
      });

      await waitFor(() => {
        expect(result.current.hasError).toBe(false);
        expect(result.current.retryAttempts).toBe(0); // Reset after success
      });

      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockErrorHandler.showSuccessToast).toHaveBeenCalledWith('operation completed successfully after retry.');
    });

    it('shows warning when no operation to retry', async () => {
      const { result } = renderHook(() => useAsyncError());

      await act(async () => {
        await result.current.retryLastOperation();
      });

      expect(mockErrorHandler.showWarningToast).toHaveBeenCalledWith('No operation to retry.');
    });

    it('stops retrying after max attempts', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Always fails'));
      const { result } = renderHook(() => useAsyncError({ retryCount: 2, retryDelay: 10 }));

      // Initial attempt
      await act(async () => {
        await result.current.executeAsync(mockOperation);
      });

      // Retry 1
      await act(async () => {
        await result.current.retryLastOperation();
      });

      await waitFor(() => {
        expect(result.current.retryAttempts).toBe(1);
      });

      // Retry 2
      await act(async () => {
        await result.current.retryLastOperation();
      });

      await waitFor(() => {
        expect(result.current.retryAttempts).toBe(2);
      });

      // Retry 3 - should show max attempts error
      await act(async () => {
        await result.current.retryLastOperation();
      });

      expect(mockErrorHandler.showErrorToast).toHaveBeenCalledWith(
        expect.any(Error),
        'Unable to complete operation after 2 attempts. Please try again later.'
      );
    });

    it('includes delay between retries', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Failed'));
      const { result } = renderHook(() => useAsyncError({ retryDelay: 50 }));

      await act(async () => {
        await result.current.executeAsync(mockOperation);
      });

      // Verify only 1 call before retry
      expect(mockOperation).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.retryLastOperation();
      });

      // After retry completes, should have 2 calls total
      await waitFor(() => {
        expect(mockOperation).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('executeWithRetry()', () => {
    it('succeeds on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const { result } = renderHook(() => useAsyncError());

      let returnValue: string | null = null;
      await act(async () => {
        returnValue = await result.current.executeWithRetry(mockOperation);
      });

      expect(returnValue).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('retries automatically on failure', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockRejectedValueOnce(new Error('Attempt 2'))
        .mockResolvedValueOnce('success');

      const { result } = renderHook(() => useAsyncError({ retryDelay: 10 }));

      await act(async () => {
        await result.current.executeWithRetry(mockOperation, 3);
      });

      await waitFor(() => {
        expect(mockOperation).toHaveBeenCalledTimes(3);
      }, { timeout: 1000 });
    });

    it('returns null after all retries exhausted', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Always fails'));
      const { result } = renderHook(() => useAsyncError({ retryDelay: 10 }));

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.executeWithRetry(mockOperation, 2);
      });

      expect(returnValue).toBeNull();

      await waitFor(() => {
        expect(mockOperation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'api',
        'All retry attempts failed for operation',
        expect.objectContaining({ attempts: 3, maxRetries: 2 })
      );
    });

    it('logs warnings for each retry attempt', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValueOnce('success');

      const { result } = renderHook(() => useAsyncError({ retryDelay: 10 }));

      await act(async () => {
        await result.current.executeWithRetry(mockOperation, 2);
      });

      await waitFor(() => {
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'api',
          'Retry attempt failed for operation',
          expect.objectContaining({ attempts: 1 })
        );
      });
    });
  });

  describe('setLoading()', () => {
    it('manually sets loading state', () => {
      const { result } = renderHook(() => useAsyncError());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('canRetry flag', () => {
    it('is false when no operation has been executed', () => {
      const { result } = renderHook(() => useAsyncError());

      expect(result.current.canRetry).toBe(false);
    });

    it('is true when operation is stored and retry limit not reached', async () => {
      const mockOperation = jest.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsyncError({ retryCount: 3 }));

      await act(async () => {
        await result.current.executeAsync(mockOperation);
      });

      expect(result.current.canRetry).toBe(true);
    });

    it('is false when retry limit is reached', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Failed'));
      const { result } = renderHook(() => useAsyncError({ retryCount: 1, retryDelay: 10 }));

      // Initial attempt
      await act(async () => {
        await result.current.executeAsync(mockOperation);
      });

      // Retry once
      await act(async () => {
        await result.current.retryLastOperation();
      });

      // Now retry count is 1, which equals retryCount
      await waitFor(() => {
        expect(result.current.retryAttempts).toBe(1);
        expect(result.current.canRetry).toBe(false);
      });
    });
  });
});
