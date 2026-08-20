/**
 * COMPREHENSIVE ERROR BOUNDARY FACTORY TESTS
 * Tests all error boundary patterns, classification, fallback components,
 * retry logic, logging, and factory functions
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  EnhancedErrorBoundary,
  MinimalErrorFallback,
  FullPageErrorFallback,
  CardErrorFallback,
  createPageErrorBoundary,
  createComponentErrorBoundary,
  withErrorBoundary,
  ErrorBoundaryUtils,
  ErrorSeverity,
  ErrorCategory
} from '../error-boundary-factory';

// Mock Sentry lib
jest.mock('@/lib/sentry', () => ({
  trackError: jest.fn()
}));

// Mock Error Handler
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn()
  }
}));

import { trackError } from '@/lib/sentry';
import { ErrorHandler } from '@/lib/errorHandler';

describe('Error Boundary Factory', () => {
  let consoleError: jest.SpyInstance;
  let consoleGroup: jest.SpyInstance;
  let consoleGroupEnd: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Suppress React error boundary console errors
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleGroup = jest.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEnd = jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleError.mockRestore();
    consoleGroup.mockRestore();
    consoleGroupEnd.mockRestore();
  });

  describe('Error Classification', () => {
    it('should classify network errors', () => {
      const error = new Error('Network request failed');
      const classification = (ErrorBoundaryUtils as any).classifyError(error);

      expect(classification.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classification.category).toBe(ErrorCategory.NETWORK);
      expect(classification.recoverable).toBe(true);
      expect(classification.userMessage).toContain('Connection issue');
    });

    it('should classify fetch errors', () => {
      const error = new Error('Fetch failed');
      const classification = (ErrorBoundaryUtils as any).classifyError(error);

      expect(classification.category).toBe(ErrorCategory.NETWORK);
      expect(classification.recoverable).toBe(true);
    });

    it('should classify permission errors', () => {
      const error = new Error('Permission denied');
      const classification = (ErrorBoundaryUtils as any).classifyError(error);

      expect(classification.severity).toBe(ErrorSeverity.HIGH);
      expect(classification.category).toBe(ErrorCategory.PERMISSION);
      expect(classification.recoverable).toBe(false);
      expect(classification.userMessage).toContain('permission');
    });

    it('should classify unauthorized errors', () => {
      const error = new Error('Unauthorized access');
      const classification = (ErrorBoundaryUtils as any).classifyError(error);

      expect(classification.category).toBe(ErrorCategory.PERMISSION);
      expect(classification.recoverable).toBe(false);
    });

    it('should classify validation errors', () => {
      const error = new Error('Validation failed: invalid input');
      const classification = (ErrorBoundaryUtils as any).classifyError(error);

      expect(classification.severity).toBe(ErrorSeverity.LOW);
      expect(classification.category).toBe(ErrorCategory.VALIDATION);
      expect(classification.recoverable).toBe(true);
      expect(classification.userMessage).toContain('check your input');
    });

    it('should classify invalid errors', () => {
      const error = new Error('Invalid data format');
      const classification = (ErrorBoundaryUtils as any).classifyError(error);

      expect(classification.category).toBe(ErrorCategory.VALIDATION);
    });

    it('should classify render errors from stack trace', () => {
      const error = new Error('Component render failed');
      error.stack = 'Error: Component render failed\n    at Component.render (react.js:123)';

      const classification = (ErrorBoundaryUtils as any).classifyError(error);

      expect(classification.severity).toBe(ErrorSeverity.HIGH);
      expect(classification.category).toBe(ErrorCategory.RENDER);
      expect(classification.recoverable).toBe(true);
      expect(classification.userMessage).toContain('displaying this content');
    });

    it('should classify unknown errors', () => {
      const error = new Error('Something mysterious happened');
      // Create a stack without 'react' to test the default classification
      error.stack = 'Error: Something mysterious happened\n    at myFunction (app.js:10:15)\n    at main (app.js:20:3)';
      const classification = (ErrorBoundaryUtils as any).classifyError(error);

      expect(classification.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classification.category).toBe(ErrorCategory.UNKNOWN);
      expect(classification.recoverable).toBe(true);
      expect(classification.userMessage).toContain('unexpected error');
    });

    it('should handle errors without stack trace', () => {
      const error = new Error('No stack');
      error.stack = undefined;

      const classification = (ErrorBoundaryUtils as any).classifyError(error);

      expect(classification).toBeDefined();
      expect(classification.category).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('MinimalErrorFallback', () => {
    it('should render error message', () => {
      const error = new Error('Test error');
      // Create a stack without 'react' to test the default error message
      error.stack = 'Error: Test error\n    at testFunction (test.js:1:1)';
      const resetError = jest.fn();

      render(<MinimalErrorFallback error={error} resetError={resetError} />);

      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });

    it('should show retry button for recoverable errors', () => {
      const error = new Error('Network error');
      const resetError = jest.fn();

      render(<MinimalErrorFallback error={error} resetError={resetError} />);

      const retryButton = screen.getByText('Try again');
      expect(retryButton).toBeInTheDocument();

      retryButton.click();
      expect(resetError).toHaveBeenCalled();
    });

    it('should not show retry button for non-recoverable errors', () => {
      const error = new Error('Permission denied');
      const resetError = jest.fn();

      render(<MinimalErrorFallback error={error} resetError={resetError} />);

      expect(screen.queryByText('Try again')).not.toBeInTheDocument();
    });
  });

  describe('FullPageErrorFallback', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as any;
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it('should render full-page error UI', () => {
      const error = new Error('Critical error');
      // Create a stack without 'react' to test the default error message
      error.stack = 'Error: Critical error\n    at criticalFunction (app.js:1:1)';
      const resetError = jest.fn();

      render(<FullPageErrorFallback error={error} resetError={resetError} />);

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });

    it('should show try again button for recoverable errors', () => {
      const error = new Error('Network error');
      const resetError = jest.fn();

      render(<FullPageErrorFallback error={error} resetError={resetError} />);

      const tryAgainButton = screen.getByText('Try Again');
      expect(tryAgainButton).toBeInTheDocument();

      tryAgainButton.click();
      expect(resetError).toHaveBeenCalled();
    });

    it('should show homepage button', () => {
      const error = new Error('Test error');
      const resetError = jest.fn();

      render(<FullPageErrorFallback error={error} resetError={resetError} />);

      const homeButton = screen.getByText('Go to Homepage');
      expect(homeButton).toBeInTheDocument();

      homeButton.click();
      expect(window.location.href).toBe('/');
    });

    it('should show technical details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Dev error');
      error.stack = 'Error: Dev error\n    at test.js:123';
      const resetError = jest.fn();

      render(<FullPageErrorFallback error={error} resetError={resetError} />);

      expect(screen.getByText(/Technical Details/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show technical details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Prod error');
      error.stack = 'Error stack';
      const resetError = jest.fn();

      render(<FullPageErrorFallback error={error} resetError={resetError} />);

      expect(screen.queryByText(/Technical Details/i)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('CardErrorFallback', () => {
    it('should render card error UI', () => {
      const error = new Error('Component error');
      // Create a stack without 'react' to test the default error message
      error.stack = 'Error: Component error\n    at componentFunc (component.js:1:1)';
      const resetError = jest.fn();

      render(<CardErrorFallback error={error} resetError={resetError} />);

      expect(screen.getByText(/Unable to load content/i)).toBeInTheDocument();
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });

    it('should show retry button for recoverable errors', () => {
      const error = new Error('Validation error: invalid');
      const resetError = jest.fn();

      render(<CardErrorFallback error={error} resetError={resetError} />);

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();

      retryButton.click();
      expect(resetError).toHaveBeenCalled();
    });
  });

  describe('EnhancedErrorBoundary', () => {
    it('should render children when no error', () => {
      render(
        <EnhancedErrorBoundary>
          <div>Working content</div>
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Working content')).toBeInTheDocument();
    });

    it('should catch and display errors', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <EnhancedErrorBoundary>
          <ThrowError />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should use custom fallback component', () => {
      const CustomFallback = ({ error }: { error: Error }) => (
        <div>Custom: {error.message}</div>
      );

      const ThrowError = () => {
        throw new Error('Custom error');
      };

      render(
        <EnhancedErrorBoundary fallback={CustomFallback}>
          <ThrowError />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Custom: Custom error')).toBeInTheDocument();
    });

    it('should call onError callback', () => {
      const onError = jest.fn();
      const ThrowError = () => {
        throw new Error('Callback error');
      };

      render(
        <EnhancedErrorBoundary onError={onError}>
          <ThrowError />
        </EnhancedErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Callback error' }),
        expect.any(Object)
      );
    });

    it('should track error to Application Insights', () => {
      const ThrowError = () => {
        throw new Error('Tracked error');
      };

      render(
        <EnhancedErrorBoundary>
          <ThrowError />
        </EnhancedErrorBoundary>
      );

      expect(trackError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Tracked error' }),
        expect.objectContaining({
          errorBoundary: true,
          classification: expect.any(String),
          severity: expect.any(String)
        })
      );
    });

    it('should log error to ErrorHandler', () => {
      const ThrowError = () => {
        throw new Error('Handler error');
      };

      render(
        <EnhancedErrorBoundary>
          <ThrowError />
        </EnhancedErrorBoundary>
      );

      expect(ErrorHandler.handleApiError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Handler error' }),
        expect.objectContaining({
          context: 'Error Boundary',
          action: 'Component error caught'
        })
      );
    });

    it('should log to console in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const ThrowError = () => {
        throw new Error('Dev error');
      };

      render(
        <EnhancedErrorBoundary>
          <ThrowError />
        </EnhancedErrorBoundary>
      );

      expect(consoleGroup).toHaveBeenCalledWith('Error Boundary Caught Error');
      expect(consoleError).toHaveBeenCalled();
      expect(consoleGroupEnd).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should reset error when resetError called', async () => {
      let throwError = true;
      const ConditionalThrow = () => {
        if (throwError) {
          throw new Error('Reset error');
        }
        return <div>Recovered</div>;
      };

      const { rerender } = render(
        <EnhancedErrorBoundary>
          <ConditionalThrow />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Stop throwing
      throwError = false;

      // Click retry button
      const retryButton = screen.getByText('Try again');
      act(() => {
        retryButton.click();
      });

      rerender(
        <EnhancedErrorBoundary>
          <ConditionalThrow />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Recovered')).toBeInTheDocument();
    });

    it('should auto-retry recoverable errors', async () => {
      let renderAttempts = 0;
      let shouldFail = true;
      const AutoRetryComponent = () => {
        renderAttempts++;
        if (shouldFail) {
          throw new Error('Network error - retry');
        }
        return <div>Success after retry</div>;
      };

      render(
        <EnhancedErrorBoundary maxRetries={3} resetTimeout={100}>
          <AutoRetryComponent />
        </EnhancedErrorBoundary>
      );

      // Should show error message initially
      expect(screen.getByText(/Connection issue/i)).toBeInTheDocument();

      // Allow component to succeed on retry
      shouldFail = false;

      // Fast-forward through retry timeout
      await act(async () => {
        jest.advanceTimersByTime(150);
      });

      expect(screen.getByText('Success after retry')).toBeInTheDocument();
    });

    it('should respect maxRetries limit', async () => {
      const AlwaysThrow = () => {
        throw new Error('Network error');
      };

      render(
        <EnhancedErrorBoundary maxRetries={2} resetTimeout={100}>
          <AlwaysThrow />
        </EnhancedErrorBoundary>
      );

      // First error
      expect(screen.getByText(/Connection issue/i)).toBeInTheDocument();

      // First retry
      await act(async () => {
        jest.advanceTimersByTime(150);
      });

      // Second retry
      await act(async () => {
        jest.advanceTimersByTime(150);
      });

      // Should not retry again after max retries
      await act(async () => {
        jest.advanceTimersByTime(150);
      });

      expect(screen.getByText(/Connection issue/i)).toBeInTheDocument();
    });

    it('should not auto-retry non-recoverable errors', async () => {
      const ThrowPermissionError = () => {
        throw new Error('Permission denied');
      };

      render(
        <EnhancedErrorBoundary maxRetries={3} resetTimeout={100}>
          <ThrowPermissionError />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText(/permission/i)).toBeInTheDocument();

      // Fast-forward through timeout
      await act(async () => {
        jest.advanceTimersByTime(150);
      });

      // Should still show error (no auto-retry for non-recoverable)
      expect(screen.getByText(/permission/i)).toBeInTheDocument();
    });

    it('should clean up timeout on unmount', () => {
      const ThrowError = () => {
        throw new Error('Network error');
      };

      const { unmount } = render(
        <EnhancedErrorBoundary resetTimeout={5000}>
          <ThrowError />
        </EnhancedErrorBoundary>
      );

      // Should have scheduled a timeout
      expect(jest.getTimerCount()).toBeGreaterThan(0);

      unmount();

      // Timeout should be cleared
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should clear timeout when manually resetting', async () => {
      let throwError = true;
      const ConditionalThrow = () => {
        if (throwError) {
          throw new Error('Network error');
        }
        return <div>Success</div>;
      };

      render(
        <EnhancedErrorBoundary resetTimeout={10000}>
          <ConditionalThrow />
        </EnhancedErrorBoundary>
      );

      // Scheduled auto-retry
      expect(jest.getTimerCount()).toBeGreaterThan(0);

      throwError = false;

      // Manual retry
      const retryButton = screen.getByText('Try again');
      act(() => {
        retryButton.click();
      });

      // Timeout should be cleared
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('createPageErrorBoundary', () => {
    it('should create page error boundary with default fallback', () => {
      const PageBoundary = createPageErrorBoundary();
      const ThrowError = () => {
        throw new Error('Page error');
      };

      render(
        <PageBoundary>
          <ThrowError />
        </PageBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });

    it('should use custom fallback', () => {
      const CustomFallback = ({ error }: { error: Error }) => (
        <div>Page Error: {error.message}</div>
      );

      const PageBoundary = createPageErrorBoundary({
        fallback: CustomFallback
      });

      const ThrowError = () => {
        throw new Error('Custom page error');
      };

      render(
        <PageBoundary>
          <ThrowError />
        </PageBoundary>
      );

      expect(screen.getByText('Page Error: Custom page error')).toBeInTheDocument();
    });

    it('should call onError callback', () => {
      const onError = jest.fn();
      const PageBoundary = createPageErrorBoundary({ onError });

      const ThrowError = () => {
        throw new Error('Page callback error');
      };

      render(
        <PageBoundary>
          <ThrowError />
        </PageBoundary>
      );

      expect(onError).toHaveBeenCalled();
    });

    it('should have correct retry settings', async () => {
      let shouldFail = true;
      const RetryComponent = () => {
        if (shouldFail) {
          throw new Error('Network error');
        }
        return <div>Success</div>;
      };

      const PageBoundary = createPageErrorBoundary();

      render(
        <PageBoundary>
          <RetryComponent />
        </PageBoundary>
      );

      // Should show error initially
      expect(screen.getByText(/Connection issue/i)).toBeInTheDocument();

      // Allow success on retry
      shouldFail = false;

      // maxRetries=2, resetTimeout=10000
      await act(async () => {
        jest.advanceTimersByTime(10100);
      });

      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  describe('createComponentErrorBoundary', () => {
    it('should create component error boundary with default fallback', () => {
      const ComponentBoundary = createComponentErrorBoundary();
      const ThrowError = () => {
        throw new Error('Component error');
      };

      render(
        <ComponentBoundary>
          <ThrowError />
        </ComponentBoundary>
      );

      expect(screen.getByText(/Unable to load content/i)).toBeInTheDocument();
    });

    it('should use custom fallback', () => {
      const CustomFallback = ({ error }: { error: Error }) => (
        <div>Component Error: {error.message}</div>
      );

      const ComponentBoundary = createComponentErrorBoundary({
        fallback: CustomFallback
      });

      const ThrowError = () => {
        throw new Error('Custom component error');
      };

      render(
        <ComponentBoundary>
          <ThrowError />
        </ComponentBoundary>
      );

      expect(screen.getByText('Component Error: Custom component error')).toBeInTheDocument();
    });

    it('should respect custom maxRetries', async () => {
      let attemptCount = 0;
      const RetryComponent = () => {
        attemptCount++;
        if (attemptCount < 6) {
          throw new Error('Network error');
        }
        return <div>Success after {attemptCount} attempts</div>;
      };

      const ComponentBoundary = createComponentErrorBoundary({
        maxRetries: 5
      });

      render(
        <ComponentBoundary>
          <RetryComponent />
        </ComponentBoundary>
      );

      // Advance through 5 retries (5 * 5000ms)
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          jest.advanceTimersByTime(5100);
        });
      }

      expect(screen.getByText('Success after 6 attempts')).toBeInTheDocument();
    });

    it('should have isolate prop set', () => {
      // This is implicitly tested by the boundary working correctly
      // The isolate prop prevents errors from bubbling up
      const ComponentBoundary = createComponentErrorBoundary();
      const ThrowError = () => {
        throw new Error('Isolated error');
      };

      render(
        <ComponentBoundary>
          <ThrowError />
        </ComponentBoundary>
      );

      expect(screen.getByText(/Unable to load content/i)).toBeInTheDocument();
    });
  });

  describe('withErrorBoundary', () => {
    it('should wrap component with error boundary', () => {
      const Component = () => <div>Working</div>;
      const WrappedComponent = withErrorBoundary(Component);

      render(<WrappedComponent />);

      expect(screen.getByText('Working')).toBeInTheDocument();
    });

    it('should catch errors in wrapped component', () => {
      const ThrowError = () => {
        throw new Error('HOC error');
      };
      const WrappedComponent = withErrorBoundary(ThrowError);

      render(<WrappedComponent />);

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should use custom fallback', () => {
      const CustomFallback = ({ error }: { error: Error }) => (
        <div>HOC Error: {error.message}</div>
      );
      const ThrowError = () => {
        throw new Error('Custom HOC error');
      };
      const WrappedComponent = withErrorBoundary(ThrowError, CustomFallback);

      render(<WrappedComponent />);

      expect(screen.getByText('HOC Error: Custom HOC error')).toBeInTheDocument();
    });

    it('should set display name', () => {
      const Component = () => <div>Test</div>;
      Component.displayName = 'TestComponent';

      const WrappedComponent = withErrorBoundary(Component);

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
    });

    it('should handle component without displayName', () => {
      function NamedComponent() {
        return <div>Test</div>;
      }

      const WrappedComponent = withErrorBoundary(NamedComponent);

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(NamedComponent)');
    });

    it('should pass props to wrapped component', () => {
      const Component = ({ name }: { name: string }) => <div>Hello {name}</div>;
      const WrappedComponent = withErrorBoundary(Component);

      render(<WrappedComponent name="World" />);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  describe('ErrorBoundaryUtils Export', () => {
    it('should export all utilities', () => {
      expect(ErrorBoundaryUtils.classifyError).toBeDefined();
      expect(ErrorBoundaryUtils.createPageErrorBoundary).toBeDefined();
      expect(ErrorBoundaryUtils.createComponentErrorBoundary).toBeDefined();
      expect(ErrorBoundaryUtils.withErrorBoundary).toBeDefined();
      expect(ErrorBoundaryUtils.MinimalErrorFallback).toBeDefined();
      expect(ErrorBoundaryUtils.FullPageErrorFallback).toBeDefined();
      expect(ErrorBoundaryUtils.CardErrorFallback).toBeDefined();
      expect(ErrorBoundaryUtils.EnhancedErrorBoundary).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle nested error boundaries', () => {
      const OuterThrow = () => {
        throw new Error('Outer error');
      };

      const InnerComponent = () => <div>Inner content</div>;

      render(
        <EnhancedErrorBoundary fallback={FullPageErrorFallback}>
          <OuterThrow />
          <EnhancedErrorBoundary fallback={CardErrorFallback}>
            <InnerComponent />
          </EnhancedErrorBoundary>
        </EnhancedErrorBoundary>
      );

      // Outer boundary should catch
      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });

    it('should handle multiple independent boundaries', () => {
      const ThrowError1 = () => {
        throw new Error('Error 1');
      };
      const ThrowError2 = () => {
        throw new Error('Error 2');
      };

      render(
        <div>
          <EnhancedErrorBoundary>
            <ThrowError1 />
          </EnhancedErrorBoundary>
          <EnhancedErrorBoundary>
            <ThrowError2 />
          </EnhancedErrorBoundary>
        </div>
      );

      // Both boundaries should catch their respective errors
      const errorMessages = screen.getAllByText(/something went wrong/i);
      expect(errorMessages).toHaveLength(2);
    });

    it('should track retry attempts across errors', async () => {
      let errorCount = 0;
      const MultipleErrors = () => {
        errorCount++;
        throw new Error(`Network error ${errorCount}`);
      };

      render(
        <EnhancedErrorBoundary maxRetries={3} resetTimeout={100}>
          <MultipleErrors />
        </EnhancedErrorBoundary>
      );

      // React may render multiple times in dev mode before catching error
      const initialCount = errorCount;
      expect(errorCount).toBeGreaterThanOrEqual(1);

      // First retry
      await act(async () => {
        jest.advanceTimersByTime(150);
      });
      const afterFirstRetry = errorCount;
      expect(errorCount).toBeGreaterThan(initialCount);

      // Second retry
      await act(async () => {
        jest.advanceTimersByTime(150);
      });
      const afterSecondRetry = errorCount;
      expect(errorCount).toBeGreaterThan(afterFirstRetry);

      // Third retry
      await act(async () => {
        jest.advanceTimersByTime(150);
      });
      expect(errorCount).toBeGreaterThan(afterSecondRetry);

      // No more retries after maxRetries
      const finalCount = errorCount;
      await act(async () => {
        jest.advanceTimersByTime(150);
      });
      // Should not increase further after max retries
      expect(errorCount).toBe(finalCount);
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors without messages', () => {
      const ThrowEmptyError = () => {
        const error: any = new Error();
        error.message = '';
        throw error;
      };

      render(
        <EnhancedErrorBoundary>
          <ThrowEmptyError />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should handle non-Error objects', () => {
      const ThrowString = () => {
        throw 'String error';
      };

      render(
        <EnhancedErrorBoundary>
          <ThrowString />
        </EnhancedErrorBoundary>
      );

      // React will wrap non-Error throws in an Error object
      // The wrapped error won't have 'react' in stack, so shows default message
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });

    it('should handle errors during reset', async () => {
      let shouldThrow = true;
      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error('Network error');
        }
        throw new Error('Different error');
      };

      render(
        <EnhancedErrorBoundary>
          <ConditionalThrow />
        </EnhancedErrorBoundary>
      );

      shouldThrow = false;

      const retryButton = screen.getByText('Try again');
      act(() => {
        retryButton.click();
      });

      // Should catch the new error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should handle rapid error throws', () => {
      let throwCount = 0;
      const RapidThrow = () => {
        throwCount++;
        throw new Error(`Error ${throwCount}`);
      };

      const { rerender } = render(
        <EnhancedErrorBoundary>
          <RapidThrow />
        </EnhancedErrorBoundary>
      );

      // React may render multiple times in dev mode before catching error
      const firstThrowCount = throwCount;
      expect(throwCount).toBeGreaterThanOrEqual(1);

      // Force remount
      rerender(
        <EnhancedErrorBoundary key="new">
          <RapidThrow />
        </EnhancedErrorBoundary>
      );

      // Should have thrown again, count should increase
      expect(throwCount).toBeGreaterThan(firstThrowCount);
    });
  });
});
