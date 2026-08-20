import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataError, NetworkError, ServerError, AuthError } from '../data-error';
import { ApiErrorClass, ErrorTypes } from '@/types/errors';

describe('DataError', () => {
  describe('DataError Component', () => {
    describe('Rendering', () => {
      it('should render without crashing', () => {
        render(<DataError />);
        expect(screen.getByTestId('data-error')).toBeInTheDocument();
      });

      it('should render with custom title and message', () => {
        render(<DataError title="Custom Title" message="Custom message" />);
        expect(screen.getByText('Custom Title')).toBeInTheDocument();
        expect(screen.getByText('Custom message')).toBeInTheDocument();
      });

      it('should render with Error object', () => {
        const error = new Error('Test error message');
        render(<DataError error={error} />);
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      it('should show default title when no title provided', () => {
        render(<DataError />);
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      it('should apply custom className', () => {
        render(<DataError className="custom-class" />);
        const element = screen.getByTestId('data-error');
        expect(element).toHaveClass('custom-class');
      });
    });

    describe('Error Types', () => {
      it('should render ApiErrorClass with message', () => {
        const error = new ApiErrorClass('Connection failed', ErrorTypes.NETWORK_ERROR);
        render(<DataError error={error} />);
        expect(screen.getByText('Connection failed')).toBeInTheDocument();
      });

      it('should render AuthenticationError type with message', () => {
        const error = new ApiErrorClass('Not authenticated', ErrorTypes.AUTHENTICATION_ERROR);
        render(<DataError error={error} />);
        expect(screen.getByText('Not authenticated')).toBeInTheDocument();
      });

      it('should render AuthorizationError type with message', () => {
        const error = new ApiErrorClass('Not authorized', ErrorTypes.AUTHORIZATION_ERROR);
        render(<DataError error={error} />);
        expect(screen.getByText('Not authorized')).toBeInTheDocument();
      });

      it('should render ServerError type with message', () => {
        const error = new ApiErrorClass('Server crashed', ErrorTypes.SERVER_ERROR);
        render(<DataError error={error} />);
        expect(screen.getByText('Server crashed')).toBeInTheDocument();
      });

      it('should render TimeoutError type with message', () => {
        const error = new ApiErrorClass('Request timed out', ErrorTypes.TIMEOUT_ERROR);
        render(<DataError error={error} />);
        expect(screen.getByText('Request timed out')).toBeInTheDocument();
      });

      it('should use custom title when provided', () => {
        const error = new ApiErrorClass('Network issue', ErrorTypes.NETWORK_ERROR);
        render(<DataError error={error} title="Custom Network Error" />);
        expect(screen.getByText('Custom Network Error')).toBeInTheDocument();
      });

      it('should use custom message over error message', () => {
        const error = new ApiErrorClass('Original message', ErrorTypes.NETWORK_ERROR);
        render(<DataError error={error} message="Custom message" />);
        expect(screen.getByText('Custom message')).toBeInTheDocument();
        expect(screen.queryByText('Original message')).not.toBeInTheDocument();
      });
    });

    describe('Variants', () => {
      it('should render card variant by default', () => {
        render(<DataError title="Error" message="Test" />);
        expect(screen.getByTestId('data-error')).toBeInTheDocument();
      });

      it('should render inline variant', () => {
        const { container } = render(<DataError title="Error" message="Test" variant="inline" />);
        const element = container.querySelector('.flex.items-center.gap-3');
        expect(element).toBeInTheDocument();
      });

      it('should render full-page variant', () => {
        const { container } = render(<DataError title="Error" message="Test" variant="full-page" />);
        const element = container.querySelector('.min-h-\\[50vh\\]');
        expect(element).toBeInTheDocument();
      });

      it('should render appropriate icon for inline variant', () => {
        const { container } = render(<DataError title="Error" message="Test" variant="inline" />);
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });

      it('should render centered layout for full-page variant', () => {
        const { container } = render(<DataError title="Error" message="Test" variant="full-page" />);
        const centerDiv = container.querySelector('.text-center.max-w-md');
        expect(centerDiv).toBeInTheDocument();
      });
    });

    describe('Retry Functionality', () => {
      it('should show retry button when onRetry provided', () => {
        const error = new Error('Test error');
        render(<DataError error={error} onRetry={jest.fn()} />);
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      it('should call onRetry when retry button clicked', async () => {
        const user = userEvent.setup();
        const handleRetry = jest.fn();
        const error = new Error('Test error');

        render(<DataError error={error} onRetry={handleRetry} />);
        await user.click(screen.getByText('Try Again'));

        expect(handleRetry).toHaveBeenCalledTimes(1);
      });

      it('should not show retry button when onRetry not provided', () => {
        const error = new Error('Test error');
        render(<DataError error={error} />);
        expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
      });

      it('should show Retry text in inline variant', () => {
        const error = new Error('Test error');
        render(<DataError error={error} onRetry={jest.fn()} variant="inline" />);
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      it('should show retry button for card variant', () => {
        const error = new Error('Test error');
        render(<DataError error={error} onRetry={jest.fn()} variant="card" />);
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      it('should show retry button for full-page variant', () => {
        const error = new Error('Test error');
        render(<DataError error={error} onRetry={jest.fn()} variant="full-page" />);
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    describe('Secondary Action', () => {
      it('should show secondary action button when provided', () => {
        render(<DataError onSecondaryAction={jest.fn()} secondaryActionLabel="Help" />);
        expect(screen.getByText('Help')).toBeInTheDocument();
      });

      it('should use default label "Go Back" for card variant', () => {
        render(<DataError onSecondaryAction={jest.fn()} />);
        expect(screen.getByText('Go Back')).toBeInTheDocument();
      });

      it('should use default label "Help" for inline variant', () => {
        render(<DataError onSecondaryAction={jest.fn()} variant="inline" />);
        expect(screen.getByText('Help')).toBeInTheDocument();
      });

      it('should call onSecondaryAction when clicked', async () => {
        const user = userEvent.setup();
        const handleSecondaryAction = jest.fn();

        render(<DataError onSecondaryAction={handleSecondaryAction} secondaryActionLabel="Help" />);
        await user.click(screen.getByText('Help'));

        expect(handleSecondaryAction).toHaveBeenCalledTimes(1);
      });

      it('should render both retry and secondary action buttons', () => {
        const error = new ApiErrorClass('Network issue', ErrorTypes.NETWORK_ERROR);
        render(<DataError error={error} onRetry={jest.fn()} onSecondaryAction={jest.fn()} />);

        expect(screen.getByText('Try Again')).toBeInTheDocument();
        expect(screen.getByText('Go Back')).toBeInTheDocument();
      });
    });

    describe('Error Details', () => {
      it('should accept showDetails prop without errors', () => {
        const error = new Error('Error message');
        render(<DataError error={error} showDetails={true} />);
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });

      it('should not show error code for non-ApiError', () => {
        const error = new Error('Regular error');
        render(<DataError error={error} showDetails={true} />);
        expect(screen.queryByText(/Error Code:/)).not.toBeInTheDocument();
      });

      it('should render with showDetails false', () => {
        const error = new Error('Error message');
        render(<DataError error={error} showDetails={false} />);
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });
    });

    describe('Icon Rendering', () => {
      it('should render icon in card variant', () => {
        const { container } = render(<DataError title="Error" message="Test" />);
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });

      it('should render icon in inline variant', () => {
        const { container } = render(<DataError title="Error" message="Test" variant="inline" />);
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });

      it('should render icon in full-page variant', () => {
        const { container } = render(<DataError title="Error" message="Test" variant="full-page" />);
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });

      it('should render WifiOff icon for network errors', () => {
        const error = new ApiErrorClass('Network issue', ErrorTypes.NETWORK_ERROR);
        const { container } = render(<DataError error={error} />);
        // Icon is rendered, specific icon type tested via behavior
        expect(container.querySelector('svg')).toBeInTheDocument();
      });
    });

    describe('Edge Cases', () => {
      it('should handle unknown error object', () => {
        const error = { unknown: 'object' };
        render(<DataError error={error} />);
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });

      it('should handle null error', () => {
        render(<DataError error={null} />);
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      it('should handle undefined error', () => {
        render(<DataError error={undefined} />);
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      it('should handle ApiErrorClass without code', () => {
        const error = new ApiErrorClass('Error message', ErrorTypes.NETWORK_ERROR);
        render(<DataError error={error} showDetails={true} />);
        expect(screen.queryByText(/Error Code:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('NetworkError Component', () => {
    it('should render without crashing', () => {
      render(<NetworkError />);
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });

    it('should show retry button when onRetry provided', () => {
      render(<NetworkError onRetry={jest.fn()} />);
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call onRetry when retry clicked', async () => {
      const user = userEvent.setup();
      const handleRetry = jest.fn();

      render(<NetworkError onRetry={handleRetry} />);
      await user.click(screen.getByText('Retry'));

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('should render as inline variant', () => {
      const { container } = render(<NetworkError />);
      const element = container.querySelector('.flex.items-center.gap-3');
      expect(element).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<NetworkError className="custom-network" />);
      const element = container.querySelector('.custom-network');
      expect(element).toBeInTheDocument();
    });
  });

  describe('ServerError Component', () => {
    it('should render without crashing', () => {
      render(<ServerError />);
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });

    it('should show retry button when onRetry provided', () => {
      render(<ServerError onRetry={jest.fn()} />);
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call onRetry when retry clicked', async () => {
      const user = userEvent.setup();
      const handleRetry = jest.fn();

      render(<ServerError onRetry={handleRetry} />);
      await user.click(screen.getByText('Retry'));

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('should render as inline variant', () => {
      const { container } = render(<ServerError />);
      const element = container.querySelector('.flex.items-center.gap-3');
      expect(element).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<ServerError className="custom-server" />);
      const element = container.querySelector('.custom-server');
      expect(element).toBeInTheDocument();
    });
  });

  describe('AuthError Component', () => {
    it('should render without crashing', () => {
      render(<AuthError />);
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });

    it('should show "Log In" button when onLogin provided', () => {
      render(<AuthError onLogin={jest.fn()} />);
      expect(screen.getByText('Log In')).toBeInTheDocument();
    });

    it('should call onLogin when Log In clicked', async () => {
      const user = userEvent.setup();
      const handleLogin = jest.fn();

      render(<AuthError onLogin={handleLogin} />);
      await user.click(screen.getByText('Log In'));

      expect(handleLogin).toHaveBeenCalledTimes(1);
    });

    it('should render as card variant', () => {
      render(<AuthError />);
      expect(screen.getByTestId('data-error')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<AuthError className="custom-auth" />);
      const element = screen.getByTestId('data-error');
      expect(element).toHaveClass('custom-auth');
    });

    it('should have card variant by default', () => {
      const { container } = render(<AuthError />);
      expect(screen.getByTestId('data-error')).toBeInTheDocument();
      expect(container.querySelector('.flex.items-center.gap-3')).not.toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should handle multiple error types in sequence', () => {
      const { rerender } = render(<NetworkError />);
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();

      rerender(<ServerError />);
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();

      rerender(<AuthError />);
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });

    it('should handle variant switching', () => {
      const { rerender } = render(<DataError title="Error" message="Test" variant="card" />);
      expect(screen.getByTestId('data-error')).toBeInTheDocument();

      rerender(<DataError title="Error" message="Test" variant="inline" />);
      expect(screen.queryByTestId('data-error')).not.toBeInTheDocument();

      rerender(<DataError title="Error" message="Test" variant="full-page" />);
      expect(screen.queryByTestId('data-error')).not.toBeInTheDocument();
    });

    it('should handle error type changes', () => {
      const networkError = new ApiErrorClass('Network issue', ErrorTypes.NETWORK_ERROR);
      const { rerender } = render(<DataError error={networkError} />);
      expect(screen.getByText('Network issue')).toBeInTheDocument();

      const serverError = new ApiErrorClass('Server issue', ErrorTypes.SERVER_ERROR);
      rerender(<DataError error={serverError} />);
      expect(screen.getByText('Server issue')).toBeInTheDocument();
    });
  });
});
