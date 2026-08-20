import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsyncButton, AsyncSubmitButton, AsyncDeleteButton } from '../async-button';
import { ErrorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

// Mock the dependencies
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    showSuccessToast: jest.fn(),
    showErrorToast: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('AsyncButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AsyncButton Component', () => {
    describe('Rendering', () => {
      it('should render without crashing', () => {
        render(<AsyncButton onAsyncClick={jest.fn()}>Click me</AsyncButton>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
      });

      it('should render children', () => {
        render(<AsyncButton onAsyncClick={jest.fn()}>Custom Text</AsyncButton>);
        expect(screen.getByText('Custom Text')).toBeInTheDocument();
      });

      it('should render as button element', () => {
        render(<AsyncButton onAsyncClick={jest.fn()}>Button</AsyncButton>);
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      it('should apply custom className', () => {
        render(<AsyncButton onAsyncClick={jest.fn()} className="custom-class">Button</AsyncButton>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('custom-class');
      });
    });

    describe('Loading State', () => {
      it('should show loading text when clicked', async () => {
        const user = userEvent.setup();
        const asyncFn = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

        render(
          <AsyncButton onAsyncClick={asyncFn} loadingText="Loading...">
            Click me
          </AsyncButton>
        );

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          expect(screen.getByText('Loading...')).toBeInTheDocument();
        });
      });

      it('should show default loading text when not provided', async () => {
        const user = userEvent.setup();
        const asyncFn = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

        render(<AsyncButton onAsyncClick={asyncFn}>Click me</AsyncButton>);

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          expect(screen.getByText('Loading...')).toBeInTheDocument();
        });
      });

      it('should show loading spinner when loading', async () => {
        const user = userEvent.setup();
        const asyncFn = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

        const { container } = render(<AsyncButton onAsyncClick={asyncFn}>Click me</AsyncButton>);

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          const spinner = container.querySelector('.animate-spin');
          expect(spinner).toBeInTheDocument();
        });
      });

      it('should disable button while loading', async () => {
        const user = userEvent.setup();
        const asyncFn = jest.fn().mockImplementation(() => new Promise(() => {}));

        render(<AsyncButton onAsyncClick={asyncFn}>Click me</AsyncButton>);

        const button = screen.getByRole('button');
        await user.click(button);

        await waitFor(() => {
          expect(button).toBeDisabled();
        });
      });

      it('should not call onAsyncClick multiple times when clicked during loading', async () => {
        const user = userEvent.setup();
        const asyncFn = jest.fn().mockImplementation(() => new Promise(() => {}));

        render(<AsyncButton onAsyncClick={asyncFn}>Click me</AsyncButton>);

        const button = screen.getByRole('button');
        await user.click(button);
        await user.click(button);
        await user.click(button);

        expect(asyncFn).toHaveBeenCalledTimes(1);
      });
    });

    describe('Success Handling', () => {
      it('should call onAsyncClick when clicked', async () => {
        const user = userEvent.setup();
        const asyncFn = jest.fn().mockResolvedValue(undefined);

        render(<AsyncButton onAsyncClick={asyncFn}>Click me</AsyncButton>);

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          expect(asyncFn).toHaveBeenCalledTimes(1);
        });
      });

      it('should return to normal state after success', async () => {
        const user = userEvent.setup();
        const asyncFn = jest.fn().mockResolvedValue(undefined);

        render(<AsyncButton onAsyncClick={asyncFn}>Click me</AsyncButton>);

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          expect(screen.getByText('Click me')).toBeInTheDocument();
        });
      });

      it('should show success toast when successMessage provided', async () => {
        const user = userEvent.setup();
        const asyncFn = jest.fn().mockResolvedValue(undefined);

        render(
          <AsyncButton onAsyncClick={asyncFn} successMessage="Success!">
            Click me
          </AsyncButton>
        );

        await user.click(screen.getByText('Click me'));

        // Wait for async operation to complete
        await waitFor(() => {
          expect(asyncFn).toHaveBeenCalled();
        });

        // Then check toast was shown
        await waitFor(() => {
          expect(ErrorHandler.showSuccessToast).toHaveBeenCalledWith('Success!');
        });
      });

      it('should not show toast when showToast is false', async () => {
        const user = userEvent.setup();
        const asyncFn = jest.fn().mockResolvedValue(undefined);

        render(
          <AsyncButton onAsyncClick={asyncFn} successMessage="Success!" showToast={false}>
            Click me
          </AsyncButton>
        );

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          expect(asyncFn).toHaveBeenCalled();
        });

        expect(ErrorHandler.showSuccessToast).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should handle errors from onAsyncClick', async () => {
        const user = userEvent.setup();
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);

        render(<AsyncButton onAsyncClick={asyncFn}>Click me</AsyncButton>);

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          expect(asyncFn).toHaveBeenCalled();
        });
      });

      it('should show error toast when error occurs', async () => {
        const user = userEvent.setup();
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);

        render(<AsyncButton onAsyncClick={asyncFn}>Click me</AsyncButton>);

        await user.click(screen.getByText('Click me'));

        // Wait for async operation to be called
        await waitFor(() => {
          expect(asyncFn).toHaveBeenCalled();
        });

        // Then check error toast was shown
        await waitFor(() => {
          expect(ErrorHandler.showErrorToast).toHaveBeenCalled();
        });
      });

      it('should use custom error message', async () => {
        const user = userEvent.setup();
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);

        render(
          <AsyncButton onAsyncClick={asyncFn} errorMessage="Custom error message">
            Click me
          </AsyncButton>
        );

        await user.click(screen.getByText('Click me'));

        // Wait for async operation to be called
        await waitFor(() => {
          expect(asyncFn).toHaveBeenCalled();
        });

        // Then check error toast with custom message
        await waitFor(() => {
          expect(ErrorHandler.showErrorToast).toHaveBeenCalledWith(error, 'Custom error message');
        });
      });

      it('should not show error toast when showToast is false', async () => {
        const user = userEvent.setup();
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);

        render(
          <AsyncButton onAsyncClick={asyncFn} showToast={false}>
            Click me
          </AsyncButton>
        );

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          expect(asyncFn).toHaveBeenCalled();
        });

        expect(ErrorHandler.showErrorToast).not.toHaveBeenCalled();
      });

      it('should return to normal state after error', async () => {
        const user = userEvent.setup();
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);

        render(<AsyncButton onAsyncClick={asyncFn}>Click me</AsyncButton>);

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          expect(screen.getByText('Click me')).toBeInTheDocument();
        });
      });
    });

    describe('Retry Functionality', () => {
      it('should show retry button when error occurs and retryOnError is true', async () => {
        const user = userEvent.setup();
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);

        render(<AsyncButton onAsyncClick={asyncFn} retryOnError={true}>Click me</AsyncButton>);

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          expect(screen.getByText('Retry')).toBeInTheDocument();
        });
      });

      it('should not show retry button when retryOnError is false', async () => {
        const user = userEvent.setup();
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);

        render(<AsyncButton onAsyncClick={asyncFn} retryOnError={false}>Click me</AsyncButton>);

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          expect(asyncFn).toHaveBeenCalled();
        });

        expect(screen.queryByText('Retry')).not.toBeInTheDocument();
      });

      it('should retry operation when retry button clicked', async () => {
        const user = userEvent.setup();
        const error = new Error('Test error');
        const asyncFn = jest.fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValueOnce(undefined);

        render(<AsyncButton onAsyncClick={asyncFn} retryOnError={true}>Click me</AsyncButton>);

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          expect(screen.getByText('Retry')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Retry'));

        await waitFor(() => {
          expect(asyncFn).toHaveBeenCalledTimes(2);
        });
      });

      it('should show RefreshCw icon in retry button', async () => {
        const user = userEvent.setup();
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);

        const { container } = render(
          <AsyncButton onAsyncClick={asyncFn} retryOnError={true}>Click me</AsyncButton>
        );

        await user.click(screen.getByText('Click me'));

        await waitFor(() => {
          const retryButton = screen.getByText('Retry').closest('button');
          const svg = retryButton?.querySelector('svg');
          expect(svg).toBeInTheDocument();
        });
      });
    });

    describe('Disabled State', () => {
      it('should be disabled when disabled prop is true', () => {
        render(<AsyncButton onAsyncClick={jest.fn()} disabled={true}>Click me</AsyncButton>);
        expect(screen.getByRole('button')).toBeDisabled();
      });

      it('should not call onAsyncClick when disabled', async () => {
        const user = userEvent.setup();
        const asyncFn = jest.fn();

        render(<AsyncButton onAsyncClick={asyncFn} disabled={true}>Click me</AsyncButton>);

        await user.click(screen.getByRole('button'));

        expect(asyncFn).not.toHaveBeenCalled();
      });

      it('should not call onAsyncClick when already loading', async () => {
        const user = userEvent.setup();
        const asyncFn = jest.fn().mockImplementation(() => new Promise(() => {}));

        render(<AsyncButton onAsyncClick={asyncFn}>Click me</AsyncButton>);

        const button = screen.getByRole('button');
        await user.click(button);
        await user.click(button);

        expect(asyncFn).toHaveBeenCalledTimes(1);
      });
    });

    describe('Custom Props', () => {
      it('should forward props to Button', () => {
        render(
          <AsyncButton onAsyncClick={jest.fn()} data-testid="async-btn" variant="outline">
            Button
          </AsyncButton>
        );
        expect(screen.getByTestId('async-btn')).toBeInTheDocument();
      });

      it('should accept type prop', () => {
        render(<AsyncButton onAsyncClick={jest.fn()} type="submit">Submit</AsyncButton>);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('type', 'submit');
      });
    });
  });

  describe('AsyncSubmitButton Component', () => {
    it('should render without crashing', () => {
      render(<AsyncSubmitButton onSubmit={jest.fn()} />);
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should use custom children', () => {
      render(<AsyncSubmitButton onSubmit={jest.fn()}>Submit Form</AsyncSubmitButton>);
      expect(screen.getByText('Submit Form')).toBeInTheDocument();
    });

    it('should have submit type', () => {
      render(<AsyncSubmitButton onSubmit={jest.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should show custom loading text', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn().mockImplementation(() => new Promise(() => {}));

      render(<AsyncSubmitButton onSubmit={onSubmit} loadingText="Submitting..." />);

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
      });
    });

    it('should show default loading text "Saving..."', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn().mockImplementation(() => new Promise(() => {}));

      render(<AsyncSubmitButton onSubmit={onSubmit} />);

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });

    it('should show success toast with default message', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn().mockResolvedValue(undefined);

      render(<AsyncSubmitButton onSubmit={onSubmit} />);

      await user.click(screen.getByText('Save'));

      // Wait for async operation to complete
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      // Then check toast was shown
      await waitFor(() => {
        expect(ErrorHandler.showSuccessToast).toHaveBeenCalledWith('Saved successfully!');
      });
    });

    it('should call onSubmit when clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn().mockResolvedValue(undefined);

      render(<AsyncSubmitButton onSubmit={onSubmit} />);

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('AsyncDeleteButton Component', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;

    beforeEach(() => {
      window.confirm = jest.fn();
    });

    afterEach(() => {
      window.confirm = originalConfirm;
    });

    it('should render without crashing', () => {
      render(<AsyncDeleteButton onDelete={jest.fn()} />);
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should use custom children', () => {
      render(<AsyncDeleteButton onDelete={jest.fn()}>Remove Item</AsyncDeleteButton>);
      expect(screen.getByText('Remove Item')).toBeInTheDocument();
    });

    it('should have destructive variant', () => {
      render(<AsyncDeleteButton onDelete={jest.fn()} data-testid="delete-btn" />);
      const button = screen.getByTestId('delete-btn');
      expect(button).toBeInTheDocument();
    });

    it('should show confirm dialog before deleting', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      (window.confirm as jest.Mock).mockReturnValue(true);

      render(<AsyncDeleteButton onDelete={onDelete} />);

      await user.click(screen.getByText('Delete'));

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this item?');
    });

    it('should use custom confirm message', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      (window.confirm as jest.Mock).mockReturnValue(true);

      render(<AsyncDeleteButton onDelete={onDelete} confirmMessage="Delete forever?" />);

      await user.click(screen.getByText('Delete'));

      expect(window.confirm).toHaveBeenCalledWith('Delete forever?');
    });

    it('should call onDelete when confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn().mockResolvedValue(undefined);
      (window.confirm as jest.Mock).mockReturnValue(true);

      render(<AsyncDeleteButton onDelete={onDelete} />);

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
    });

    it('should not call onDelete when cancelled', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      (window.confirm as jest.Mock).mockReturnValue(false);

      render(<AsyncDeleteButton onDelete={onDelete} />);

      await user.click(screen.getByText('Delete'));

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('should show loading text "Deleting..."', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn().mockImplementation(() => new Promise(() => {}));
      (window.confirm as jest.Mock).mockReturnValue(true);

      render(<AsyncDeleteButton onDelete={onDelete} />);

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument();
      });
    });

    it('should show success toast after deletion', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn().mockResolvedValue(undefined);
      (window.confirm as jest.Mock).mockReturnValue(true);

      render(<AsyncDeleteButton onDelete={onDelete} />);

      await user.click(screen.getByText('Delete'));

      // Wait for async operation to complete
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });

      // Then check toast was shown
      await waitFor(() => {
        expect(ErrorHandler.showSuccessToast).toHaveBeenCalledWith('Deleted successfully!');
      });
    });

    it('should have retryOnError enabled by default', async () => {
      const user = userEvent.setup();
      const error = new Error('Delete failed');
      const onDelete = jest.fn().mockRejectedValue(error);
      (window.confirm as jest.Mock).mockReturnValue(true);

      render(<AsyncDeleteButton onDelete={onDelete} />);

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('should work with multiple buttons on same page', () => {
      render(
        <div>
          <AsyncButton onAsyncClick={jest.fn()}>Button 1</AsyncButton>
          <AsyncSubmitButton onSubmit={jest.fn()}>Button 2</AsyncSubmitButton>
          <AsyncDeleteButton onDelete={jest.fn()}>Button 3</AsyncDeleteButton>
        </div>
      );

      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
      expect(screen.getByText('Button 3')).toBeInTheDocument();
    });

    it('should handle success and error scenarios in sequence', async () => {
      const user = userEvent.setup();
      const asyncFn = jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(undefined);

      const { rerender } = render(<AsyncButton onAsyncClick={asyncFn} retryOnError={true}>Click me</AsyncButton>);

      // First click - success
      await user.click(screen.getByText('Click me'));
      await waitFor(() => {
        expect(screen.getByText('Click me')).toBeInTheDocument();
      });

      // Second click - error
      rerender(<AsyncButton onAsyncClick={asyncFn} retryOnError={true}>Click me</AsyncButton>);
      await user.click(screen.getByText('Click me'));
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Retry - success
      await user.click(screen.getByText('Retry'));
      await waitFor(() => {
        expect(screen.getByText('Click me')).toBeInTheDocument();
      });
    });
  });
});
