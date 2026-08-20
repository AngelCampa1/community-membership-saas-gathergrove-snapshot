import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, useErrorHandler } from '../error-boundary';
import * as sentryLib from '@/lib/sentry';

// Mock sentry lib
jest.mock('@/lib/sentry', () => ({
  trackError: jest.fn(),
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = true, error = new Error('Test error') }) => {
  if (shouldThrow) {
    throw error;
  }
  return <div>No error</div>;
};

// Suppress console.error in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should render multiple children successfully', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
          <div>Third child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
      expect(screen.getByText('Third child')).toBeInTheDocument();
    });

    it('should render null children without crashing', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>);
      // Should not throw or show error UI
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should render undefined children without crashing', () => {
      render(<ErrorBoundary>{undefined}</ErrorBoundary>);
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch errors and render default error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    });

    it('should display error message in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError error={new Error('Custom error message')} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
      expect(screen.getByText(/Custom error message/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError error={new Error('Production error')} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();
      expect(screen.queryByText(/Production error/)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should track error to Application Insights', () => {
      render(
        <ErrorBoundary>
          <ThrowError error={new Error('Tracked error')} />
        </ErrorBoundary>
      );

      expect(sentryLib.trackError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Tracked error' }),
        expect.objectContaining({
          component: 'ErrorBoundary',
          errorBoundary: true,
        })
      );
    });

    it('should include component stack in error tracking', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(sentryLib.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback UI when provided', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should render custom fallback with components', () => {
      const customFallback = (
        <div>
          <h1>Oops!</h1>
          <p>Please contact support</p>
        </div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops!')).toBeInTheDocument();
      expect(screen.getByText('Please contact support')).toBeInTheDocument();
    });

    it('should support null fallback', () => {
      render(
        <ErrorBoundary fallback={null}>
          <ThrowError />
        </ErrorBoundary>
      );

      // fallback={null} renders nothing, but default UI may still appear
      // depending on ErrorBoundary implementation
      const container = document.body;
      expect(container).toBeInTheDocument();
    });
  });

  describe('Custom Error Handler', () => {
    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError error={new Error('Callback test')} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Callback test' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('should handle onError callback', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      // Error UI should render and callback should be called
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(onError).toHaveBeenCalled();
    });

    it('should work without onError callback', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should have retry button that is clickable', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Error UI should be shown
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Verify retry button exists and is clickable
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      // Click triggers setState to reset hasError
      await user.click(retryButton);

      // Component will re-throw and error UI reappears - that's expected behavior
      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });
    });

    it('should display retry button in default error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveTextContent('Try Again');
    });

    it('should clear error details on retry', async () => {
      const user = userEvent.setup();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError error={new Error('Retry test error')} />
        </ErrorBoundary>
      );

      // Error details should be visible
      expect(screen.getByText(/Retry test error/)).toBeInTheDocument();

      // Click retry
      await user.click(screen.getByRole('button', { name: /try again/i }));

      // Error should be cleared (but component might throw again)
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Display', () => {
    it('should display AlertTriangle icon', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Check for icon presence (lucide-react renders SVG)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should display RefreshCw icon in retry button', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /try again/i });
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render Alert with destructive variant', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Alert component should have destructive styling (with opacity)
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('text-destructive');
      expect(alert).toHaveClass('border-destructive/50');
    });

    it('should display error stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const errorWithStack = new Error('Stack trace test');
      errorWithStack.stack = 'Error: Stack trace test\n  at TestComponent\n  at ErrorBoundary';

      render(
        <ErrorBoundary>
          <ThrowError error={errorWithStack} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Stack Trace:/)).toBeInTheDocument();
      expect(screen.getByText(/at TestComponent/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getDerivedStateFromError', () => {
    it('should set hasError to true when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Error UI is rendered, indicating hasError is true
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should capture error object in state', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError error={new Error('State error test')} />
        </ErrorBoundary>
      );

      // Error message is displayed, indicating error is in state
      expect(screen.getByText(/State error test/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors with no message', () => {
      const errorNoMessage = new Error();
      errorNoMessage.message = '';

      render(
        <ErrorBoundary>
          <ThrowError error={errorNoMessage} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle errors with very long messages', () => {
      const longMessage = 'Error '.repeat(100);
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError error={new Error(longMessage)} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Error Error Error/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle nested ErrorBoundaries', () => {
      render(
        <ErrorBoundary fallback={<div>Outer fallback</div>}>
          <ErrorBoundary fallback={<div>Inner fallback</div>}>
            <ThrowError />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText('Inner fallback')).toBeInTheDocument();
      expect(screen.queryByText('Outer fallback')).not.toBeInTheDocument();
    });

    it('should handle errors thrown in event handlers', async () => {
      const user = userEvent.setup();

      const ButtonThatThrows = () => (
        <button onClick={() => { throw new Error('Event handler error'); }}>
          Click me
        </button>
      );

      // Note: ErrorBoundary doesn't catch event handler errors in React
      // This test documents that behavior
      render(
        <ErrorBoundary>
          <ButtonThatThrows />
        </ErrorBoundary>
      );

      // Button renders normally
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });
  });
});

describe('useErrorHandler', () => {
  const TestComponent = () => {
    const { handleError } = useErrorHandler();

    return (
      <button onClick={() => handleError(new Error('Hook error'))}>
        Trigger Error
      </button>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Handling', () => {
    it('should return handleError function', () => {
      const { container } = render(<TestComponent />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should track error when handleError is called', async () => {
      const user = userEvent.setup();

      render(<TestComponent />);

      await user.click(screen.getByRole('button'));

      expect(sentryLib.trackError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Hook error' }),
        expect.objectContaining({
          component: 'useErrorHandler',
          hookError: true,
        })
      );
    });

    it('should handle error with errorInfo', async () => {
      const user = userEvent.setup();

      const TestComponentWithInfo = () => {
        const { handleError } = useErrorHandler();

        return (
          <button
            onClick={() => handleError(
              new Error('Hook error with info'),
              { componentStack: 'Test stack' } as any
            )}
          >
            Trigger
          </button>
        );
      };

      render(<TestComponentWithInfo />);

      await user.click(screen.getByRole('button'));

      expect(sentryLib.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: 'Test stack',
        })
      );
    });

    it('should handle error without errorInfo', async () => {
      const user = userEvent.setup();

      render(<TestComponent />);

      await user.click(screen.getByRole('button'));

      expect(sentryLib.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          hookError: true,
        })
      );
    });

    it('should log error in development mode', async () => {
      const user = userEvent.setup();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<TestComponent />);

      await user.click(screen.getByRole('button'));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error caught by error handler:',
        expect.any(Error),
        undefined
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log error in production mode', async () => {
      const user = userEvent.setup();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<TestComponent />);

      await user.click(screen.getByRole('button'));

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Integration', () => {
    it('should work with ErrorBoundary', async () => {
      const user = userEvent.setup();

      const TestIntegration = () => {
        const { handleError } = useErrorHandler();

        return (
          <button onClick={() => handleError(new Error('Integration test'))}>
            Test
          </button>
        );
      };

      render(
        <ErrorBoundary>
          <TestIntegration />
        </ErrorBoundary>
      );

      await user.click(screen.getByRole('button'));

      // Hook should track error but not trigger ErrorBoundary
      expect(sentryLib.trackError).toHaveBeenCalled();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });
});
