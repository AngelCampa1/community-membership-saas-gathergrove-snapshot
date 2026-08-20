import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ErrorMessage,
  NetworkError,
  NotFoundError,
  PermissionError,
  ValidationError,
  ServerError,
  PaymentError,
  FieldError,
  InlineError,
} from '../error-message';
import { ApiErrorClass, ErrorTypes } from '@/types/errors';

describe('ErrorMessage', () => {
  describe('ErrorMessage Component', () => {
    describe('Rendering', () => {
      it('should render without crashing', () => {
        render(<ErrorMessage error="Test error" />);
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      it('should not render when error and children are undefined', () => {
        const { container } = render(<ErrorMessage />);
        expect(container.firstChild).toBeNull();
      });

      it('should render with string error', () => {
        render(<ErrorMessage error="String error message" />);
        expect(screen.getByText('String error message')).toBeInTheDocument();
      });

      it('should render with Error object', () => {
        const error = new Error('Error object message');
        render(<ErrorMessage error={error} />);
        expect(screen.getByText('Error object message')).toBeInTheDocument();
      });

      it('should render with ApiErrorClass', () => {
        const apiError = new ApiErrorClass('API error', ErrorTypes.NETWORK_ERROR);
        render(<ErrorMessage error={apiError} />);
        expect(screen.getByText('API error')).toBeInTheDocument();
      });

      it('should render children', () => {
        render(
          <ErrorMessage error="Error">
            <div>Additional info</div>
          </ErrorMessage>
        );
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Additional info')).toBeInTheDocument();
      });
    });

    describe('Variants', () => {
      it('should render default variant', () => {
        render(<ErrorMessage error="Error" variant="default" />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      it('should render destructive variant by default', () => {
        render(<ErrorMessage error="Error" />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      it('should render warning variant', () => {
        render(<ErrorMessage error="Warning" variant="warning" />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Warning')).toBeInTheDocument();
      });
    });

    describe('Sizes', () => {
      it('should render small size', () => {
        render(<ErrorMessage error="Error" size="sm" />);
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      it('should render medium size by default', () => {
        render(<ErrorMessage error="Error" />);
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      it('should render large size', () => {
        render(<ErrorMessage error="Error" size="lg" />);
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
    });

    describe('Icons', () => {
      it('should show icon by default', () => {
        const { container } = render(<ErrorMessage error="Error" />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });

      it('should hide icon when showIcon is false', () => {
        const { container } = render(<ErrorMessage error="Error" showIcon={false} />);
        const svg = container.querySelector('svg');
        expect(svg).not.toBeInTheDocument();
      });

      it('should render appropriate icon for error type', () => {
        const apiError = new ApiErrorClass('Network error', ErrorTypes.NETWORK_ERROR);
        const { container } = render(<ErrorMessage error={apiError} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });

      it('should render default icon for unknown error', () => {
        const { container } = render(<ErrorMessage error="Unknown error" />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    describe('Titles', () => {
      it('should render custom title', () => {
        render(<ErrorMessage error="Error" title="Custom Title" />);
        expect(screen.getByText('Custom Title')).toBeInTheDocument();
      });

      it('should render error type title for ApiErrorClass', () => {
        const apiError = new ApiErrorClass('Error message', ErrorTypes.AUTHENTICATION_ERROR);
        render(<ErrorMessage error={apiError} />);
        expect(screen.getByText('Error message')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      it('should use custom title when provided', () => {
        render(<ErrorMessage error="Error message" title="Custom Override" />);
        expect(screen.getByText('Custom Override')).toBeInTheDocument();
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });
    });

    describe('Retry Functionality', () => {
      it('should not show retry button by default', () => {
        render(<ErrorMessage error="Error" onRetry={jest.fn()} />);
        expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
      });

      it('should show retry button when showRetry is true', () => {
        render(<ErrorMessage error="Error" showRetry={true} onRetry={jest.fn()} />);
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      it('should call onRetry when retry button is clicked', async () => {
        const handleRetry = jest.fn();
        const user = userEvent.setup();

        render(<ErrorMessage error="Error" showRetry={true} onRetry={handleRetry} />);
        await user.click(screen.getByText('Try Again'));

        expect(handleRetry).toHaveBeenCalledTimes(1);
      });

      it('should use custom retry text', () => {
        render(<ErrorMessage error="Error" showRetry={true} onRetry={jest.fn()} retryText="Retry Now" />);
        expect(screen.getByText('Retry Now')).toBeInTheDocument();
      });

      it('should not show retry button without onRetry handler', () => {
        render(<ErrorMessage error="Error" showRetry={true} />);
        expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
      });
    });

    describe('Error Parsing', () => {
      it('should parse ApiErrorClass correctly', () => {
        const apiError = new ApiErrorClass('API error', ErrorTypes.VALIDATION_ERROR);
        render(<ErrorMessage error={apiError} />);
        expect(screen.getByText('API error')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      it('should parse Error object', () => {
        const error = new Error('Standard error');
        render(<ErrorMessage error={error} />);
        expect(screen.getByText('Standard error')).toBeInTheDocument();
      });

      it('should parse string error', () => {
        render(<ErrorMessage error="String error" />);
        expect(screen.getByText('String error')).toBeInTheDocument();
      });

      it('should handle unknown error type', () => {
        render(<ErrorMessage error={{ unknown: 'object' }} />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    describe('Custom Props', () => {
      it('should apply custom className', () => {
        const { container } = render(<ErrorMessage error="Error" className="custom-error" />);
        const alert = container.querySelector('.custom-error');
        expect(alert).toBeInTheDocument();
      });

      it('should render with role alert', () => {
        render(<ErrorMessage error="Error" />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('NetworkError Component', () => {
    it('should render network error message', () => {
      render(<NetworkError />);
      expect(screen.getByText(/Unable to connect/i)).toBeInTheDocument();
    });

    it('should show retry button', () => {
      render(<NetworkError onRetry={jest.fn()} />);
      expect(screen.getByText('Retry Connection')).toBeInTheDocument();
    });

    it('should call onRetry when clicked', async () => {
      const handleRetry = jest.fn();
      const user = userEvent.setup();

      render(<NetworkError onRetry={handleRetry} />);
      await user.click(screen.getByText('Retry Connection'));

      expect(handleRetry).toHaveBeenCalled();
    });
  });

  describe('NotFoundError Component', () => {
    it('should render not found error', () => {
      render(<NotFoundError />);
      expect(screen.getByText(/could not be found/i)).toBeInTheDocument();
    });

    it('should use custom resource name', () => {
      render(<NotFoundError resource="user" />);
      expect(screen.getByText(/user could not be found/i)).toBeInTheDocument();
    });

    it('should render with warning variant', () => {
      render(<NotFoundError />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/could not be found/i)).toBeInTheDocument();
    });

    it('should show Not Found title', () => {
      render(<NotFoundError />);
      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });
  });

  describe('PermissionError Component', () => {
    it('should render permission error', () => {
      render(<PermissionError />);
      expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
    });

    it('should use custom action', () => {
      render(<PermissionError action="delete this item" />);
      expect(screen.getByText(/delete this item/i)).toBeInTheDocument();
    });

    it('should show Access Denied title', () => {
      render(<PermissionError />);
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('ValidationError Component', () => {
    it('should render validation error with errors', () => {
      render(<ValidationError errors={['Error 1']} />);
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render error list', () => {
      render(<ValidationError errors={['Error 1', 'Error 2', 'Error 3']} />);
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(screen.getByText('Error 3')).toBeInTheDocument();
    });

    it('should render title when errors provided', () => {
      render(<ValidationError errors={['Error 1']} />);
      // ValidationError has a default title that's always shown
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render with warning variant when errors provided', () => {
      render(<ValidationError errors={['Error 1']} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('ServerError Component', () => {
    it('should render server error message', () => {
      render(<ServerError />);
      expect(screen.getByText(/went wrong on our end/i)).toBeInTheDocument();
    });

    it('should show retry button', () => {
      render(<ServerError onRetry={jest.fn()} />);
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should call onRetry when clicked', async () => {
      const handleRetry = jest.fn();
      const user = userEvent.setup();

      render(<ServerError onRetry={handleRetry} />);
      await user.click(screen.getByText('Try Again'));

      expect(handleRetry).toHaveBeenCalled();
    });
  });

  describe('PaymentError Component', () => {
    it('should render payment error message', () => {
      render(<PaymentError />);
      expect(screen.getByText(/processing your payment/i)).toBeInTheDocument();
    });

    it('should show retry button', () => {
      render(<PaymentError onRetry={jest.fn()} />);
      expect(screen.getByText('Retry Payment')).toBeInTheDocument();
    });

    it('should call onRetry when clicked', async () => {
      const handleRetry = jest.fn();
      const user = userEvent.setup();

      render(<PaymentError onRetry={handleRetry} />);
      await user.click(screen.getByText('Retry Payment'));

      expect(handleRetry).toHaveBeenCalled();
    });
  });

  describe('FieldError Component', () => {
    it('should render field error', () => {
      render(<FieldError error="Field is required" />);
      expect(screen.getByText('Field is required')).toBeInTheDocument();
    });

    it('should not render when error is undefined', () => {
      const { container } = render(<FieldError />);
      expect(container.firstChild).toBeNull();
    });

    it('should apply custom className', () => {
      render(<FieldError error="Error" className="custom-field" />);
      const error = screen.getByText('Error');
      expect(error).toHaveClass('custom-field');
    });

    it('should have destructive text color', () => {
      render(<FieldError error="Error" />);
      const error = screen.getByText('Error');
      expect(error).toHaveClass('text-destructive');
    });
  });

  describe('InlineError Component', () => {
    it('should render inline error', () => {
      render(<InlineError error="Inline error message" />);
      expect(screen.getByText('Inline error message')).toBeInTheDocument();
    });

    it('should not render when error is undefined', () => {
      const { container } = render(<InlineError />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with icon', () => {
      const { container } = render(<InlineError error="Error" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-3');
      expect(svg).toHaveClass('w-3');
    });

    it('should apply custom className', () => {
      const { container } = render(<InlineError error="Error" className="custom-inline" />);
      const span = container.querySelector('.custom-inline');
      expect(span).toBeInTheDocument();
    });

    it('should have inline-flex display', () => {
      const { container } = render(<InlineError error="Error" />);
      const span = container.querySelector('.inline-flex');
      expect(span).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with all error types in sequence', () => {
      const { rerender } = render(<NetworkError onRetry={jest.fn()} />);
      expect(screen.getByText(/Unable to connect/i)).toBeInTheDocument();

      rerender(<NotFoundError resource="page" />);
      expect(screen.getByText(/page could not be found/i)).toBeInTheDocument();

      rerender(<ServerError onRetry={jest.fn()} />);
      expect(screen.getByText(/went wrong on our end/i)).toBeInTheDocument();
    });

    it('should handle multiple specialized errors on same page', () => {
      render(
        <div>
          <FieldError error="Email is required" />
          <InlineError error="Password too short" />
        </div>
      );

      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password too short')).toBeInTheDocument();
    });
  });
});
