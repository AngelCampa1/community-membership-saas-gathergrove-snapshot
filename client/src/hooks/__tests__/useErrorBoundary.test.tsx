/**
 * Tests for useErrorBoundary.tsx - Error boundary hook
 * Following boundary mocking pattern: mock only ErrorHandler, logger
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useErrorBoundary } from '../useErrorBoundary';
import { ErrorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

// Mock external dependencies (boundaries only)
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
    showWarningToast: jest.fn(),
    showInfoToast: jest.fn(),
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
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('useErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useErrorBoundary());

      expect(result.current.hasError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.errorInfo).toBeNull();
    });
  });

  describe('handleError()', () => {
    it('sets error state with error and errorInfo', () => {
      const { result } = renderHook(() => useErrorBoundary());
      const testError = new Error('Test error');
      const testErrorInfo: React.ErrorInfo = {
        componentStack: 'at Component (test.tsx:10)',
      };

      act(() => {
        result.current.handleError(testError, testErrorInfo);
      });

      expect(result.current.hasError).toBe(true);
      expect(result.current.error).toBe(testError);
      expect(result.current.errorInfo).toBe(testErrorInfo);
    });

    it('sets error state with just error (no errorInfo)', () => {
      const { result } = renderHook(() => useErrorBoundary());
      const testError = new Error('Test error without info');

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.hasError).toBe(true);
      expect(result.current.error).toBe(testError);
      expect(result.current.errorInfo).toBeNull();
    });

    it('logs error with logger', () => {
      const { result } = renderHook(() => useErrorBoundary());
      const testError = new Error('Test error');
      const testErrorInfo: React.ErrorInfo = {
        componentStack: 'at Component (test.tsx:10)',
      };

      act(() => {
        result.current.handleError(testError, testErrorInfo);
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'ui',
        'Component error caught in error boundary',
        { error: testError, errorInfo: testErrorInfo }
      );
    });

    it('shows error toast', () => {
      const { result } = renderHook(() => useErrorBoundary());
      const testError = new Error('Test error');

      act(() => {
        result.current.handleError(testError);
      });

      expect(mockErrorHandler.showErrorToast).toHaveBeenCalledWith(
        testError,
        'Something went wrong. The page will be reset.'
      );
    });
  });

  describe('resetError()', () => {
    it('clears all error state', () => {
      const { result } = renderHook(() => useErrorBoundary());
      const testError = new Error('Test error');
      const testErrorInfo: React.ErrorInfo = {
        componentStack: 'at Component (test.tsx:10)',
      };

      // First set an error
      act(() => {
        result.current.handleError(testError, testErrorInfo);
      });

      expect(result.current.hasError).toBe(true);

      // Then reset
      act(() => {
        result.current.resetError();
      });

      expect(result.current.hasError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.errorInfo).toBeNull();
    });
  });

  describe('retryWithReset()', () => {
    it('resets error state when called without retry action', () => {
      const { result } = renderHook(() => useErrorBoundary());
      const testError = new Error('Test error');

      // Set error first
      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.hasError).toBe(true);

      // Retry without action
      act(() => {
        result.current.retryWithReset();
      });

      expect(result.current.hasError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('calls synchronous retry action successfully', () => {
      const { result } = renderHook(() => useErrorBoundary());
      const retryAction = jest.fn();

      act(() => {
        result.current.retryWithReset(retryAction);
      });

      expect(retryAction).toHaveBeenCalledTimes(1);
      expect(result.current.hasError).toBe(false);
    });

    it('handles successful async retry action', async () => {
      const { result } = renderHook(() => useErrorBoundary());
      const retryAction = jest.fn().mockResolvedValue('success');

      await act(async () => {
        result.current.retryWithReset(retryAction);
      });

      expect(retryAction).toHaveBeenCalledTimes(1);
      expect(result.current.hasError).toBe(false);
    });

    it('handles failed synchronous retry action', () => {
      const { result } = renderHook(() => useErrorBoundary());
      const retryError = new Error('Retry failed');
      const retryAction = jest.fn().mockImplementation(() => {
        throw retryError;
      });

      act(() => {
        result.current.retryWithReset(retryAction);
      });

      expect(retryAction).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'ui',
        'Retry action failed in error boundary',
        { error: retryError }
      );
      expect(mockErrorHandler.showErrorToast).toHaveBeenCalledWith(
        retryError,
        'Retry failed. Please try again.'
      );
    });

    it('handles failed async retry action', async () => {
      const { result } = renderHook(() => useErrorBoundary());
      const retryError = new Error('Async retry failed');
      const retryAction = jest.fn().mockRejectedValue(retryError);

      await act(async () => {
        result.current.retryWithReset(retryAction);
      });

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'ui',
          'Retry action failed in error boundary',
          { error: retryError }
        );
      });

      expect(mockErrorHandler.showErrorToast).toHaveBeenCalledWith(
        retryError,
        'Retry failed. Please try again.'
      );
    });

    it('calls resetError then runs retry action', () => {
      const { result } = renderHook(() => useErrorBoundary());
      const testError = new Error('Initial error');
      const retryAction = jest.fn();

      // Set error first
      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.hasError).toBe(true);

      // Retry should reset and call action
      act(() => {
        result.current.retryWithReset(retryAction);
      });

      expect(retryAction).toHaveBeenCalledTimes(1);
      expect(result.current.hasError).toBe(false);
    });
  });
});
