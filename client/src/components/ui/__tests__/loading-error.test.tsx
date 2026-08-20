import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingError, DataLoadingError, FormLoadingError } from '../loading-error';

describe('LoadingError', () => {
  describe('LoadingError Component', () => {
    describe('Loading State', () => {
      it('should render loading state', () => {
        render(
          <LoadingError isLoading={true} error={undefined}>
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      it('should show custom loading message', () => {
        render(
          <LoadingError isLoading={true} error={undefined} loadingMessage="Please wait...">
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.getByText('Please wait...')).toBeInTheDocument();
      });

      it('should render loading spinner', () => {
        const { container } = render(
          <LoadingError isLoading={true} error={undefined}>
            <div>Content</div>
          </LoadingError>
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass('animate-spin');
      });

      it('should render animated dots', () => {
        const { container } = render(
          <LoadingError isLoading={true} error={undefined}>
            <div>Content</div>
          </LoadingError>
        );
        const dots = container.querySelectorAll('.animate-bounce');
        expect(dots.length).toBe(3);
      });

      it('should not render children when loading', () => {
        render(
          <LoadingError isLoading={true} error={undefined}>
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });

      it('should apply custom className to loading state', () => {
        const { container } = render(
          <LoadingError isLoading={true} error={undefined} className="custom-loading">
            <div>Content</div>
          </LoadingError>
        );
        const wrapper = container.querySelector('.custom-loading');
        expect(wrapper).toBeInTheDocument();
      });
    });

    describe('Error State', () => {
      it('should render error state', () => {
        const error = new Error('Test error');
        render(
          <LoadingError isLoading={false} error={error}>
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      it('should show default error title', () => {
        const error = new Error('Test error');
        render(
          <LoadingError isLoading={false} error={error}>
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });

      it('should show custom error title', () => {
        const error = new Error('Test error');
        render(
          <LoadingError isLoading={false} error={error} errorTitle="Custom Error">
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.getByText('Custom Error')).toBeInTheDocument();
      });

      it('should parse Error object message', () => {
        const error = new Error('Error object message');
        render(
          <LoadingError isLoading={false} error={error}>
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.getByText('Error object message')).toBeInTheDocument();
      });

      it('should handle non-Error objects', () => {
        render(
          <LoadingError isLoading={false} error="String error">
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });

      it('should render error icon', () => {
        const error = new Error('Error');
        const { container } = render(
          <LoadingError isLoading={false} error={error}>
            <div>Content</div>
          </LoadingError>
        );
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });

      it('should not render children when error', () => {
        const error = new Error('Error');
        render(
          <LoadingError isLoading={false} error={error}>
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });

      it('should apply custom className to error state', () => {
        const error = new Error('Error');
        const { container } = render(
          <LoadingError isLoading={false} error={error} className="custom-error">
            <div>Content</div>
          </LoadingError>
        );
        const wrapper = container.querySelector('.custom-error');
        expect(wrapper).toBeInTheDocument();
      });
    });

    describe('Retry Functionality', () => {
      it('should show retry button when onRetry is provided', () => {
        const error = new Error('Error');
        render(
          <LoadingError isLoading={false} error={error} onRetry={jest.fn()}>
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      it('should not show retry button without onRetry', () => {
        const error = new Error('Error');
        render(
          <LoadingError isLoading={false} error={error}>
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
      });

      it('should call onRetry when retry button is clicked', async () => {
        const handleRetry = jest.fn();
        const error = new Error('Error');
        const user = userEvent.setup();

        render(
          <LoadingError isLoading={false} error={error} onRetry={handleRetry}>
            <div>Content</div>
          </LoadingError>
        );

        await user.click(screen.getByText('Try Again'));
        expect(handleRetry).toHaveBeenCalledTimes(1);
      });

      it('should render RefreshCw icon in retry button', () => {
        const error = new Error('Error');
        const { container } = render(
          <LoadingError isLoading={false} error={error} onRetry={jest.fn()}>
            <div>Content</div>
          </LoadingError>
        );
        const button = screen.getByText('Try Again').closest('button');
        const svg = button?.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    describe('Empty State', () => {
      it('should render empty state when isEmpty is true', () => {
        render(
          <LoadingError
            isLoading={false}
            error={undefined}
            isEmpty={true}
            emptyState={<div>No data</div>}
          >
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.getByText('No data')).toBeInTheDocument();
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });

      it('should not render empty state when isEmpty is false', () => {
        render(
          <LoadingError
            isLoading={false}
            error={undefined}
            isEmpty={false}
            emptyState={<div>No data</div>}
          >
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.queryByText('No data')).not.toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      it('should not render empty state without emptyState prop', () => {
        render(
          <LoadingError isLoading={false} error={undefined} isEmpty={true}>
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      it('should apply className to empty state', () => {
        const { container } = render(
          <LoadingError
            isLoading={false}
            error={undefined}
            isEmpty={true}
            emptyState={<div>No data</div>}
            className="custom-empty"
          >
            <div>Content</div>
          </LoadingError>
        );
        const wrapper = container.querySelector('.custom-empty');
        expect(wrapper).toBeInTheDocument();
      });
    });

    describe('Success State', () => {
      it('should render children when not loading and no error', () => {
        render(
          <LoadingError isLoading={false} error={undefined}>
            <div>Content</div>
          </LoadingError>
        );
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      it('should apply className to children wrapper', () => {
        const { container } = render(
          <LoadingError isLoading={false} error={undefined} className="custom-content">
            <div>Content</div>
          </LoadingError>
        );
        const wrapper = container.querySelector('.custom-content');
        expect(wrapper).toBeInTheDocument();
      });

      it('should render complex children', () => {
        render(
          <LoadingError isLoading={false} error={undefined}>
            <div>
              <h1>Title</h1>
              <p>Paragraph</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          </LoadingError>
        );

        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Paragraph')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
      });
    });

    describe('State Transitions', () => {
      it('should transition from loading to success', () => {
        const { rerender } = render(
          <LoadingError isLoading={true} error={undefined}>
            <div>Content</div>
          </LoadingError>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();

        rerender(
          <LoadingError isLoading={false} error={undefined}>
            <div>Content</div>
          </LoadingError>
        );

        expect(screen.getByText('Content')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      it('should transition from loading to error', () => {
        const { rerender } = render(
          <LoadingError isLoading={true} error={undefined}>
            <div>Content</div>
          </LoadingError>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();

        const error = new Error('Load failed');
        rerender(
          <LoadingError isLoading={false} error={error}>
            <div>Content</div>
          </LoadingError>
        );

        expect(screen.getByText('Load failed')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      it('should transition from error to success', () => {
        const error = new Error('Error');
        const { rerender } = render(
          <LoadingError isLoading={false} error={error}>
            <div>Content</div>
          </LoadingError>
        );

        expect(screen.getByText('Error')).toBeInTheDocument();

        rerender(
          <LoadingError isLoading={false} error={undefined}>
            <div>Content</div>
          </LoadingError>
        );

        expect(screen.getByText('Content')).toBeInTheDocument();
        expect(screen.queryByText('Error')).not.toBeInTheDocument();
      });
    });
  });

  describe('DataLoadingError Component', () => {
    it('should render without crashing', () => {
      render(
        <DataLoadingError isLoading={false} error={undefined}>
          <div>Data content</div>
        </DataLoadingError>
      );
      expect(screen.getByText('Data content')).toBeInTheDocument();
    });

    it('should show data loading message', () => {
      render(
        <DataLoadingError isLoading={true} error={undefined}>
          <div>Data</div>
        </DataLoadingError>
      );
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should show data load error title', () => {
      const error = new Error('Data error');
      render(
        <DataLoadingError isLoading={false} error={error}>
          <div>Data</div>
        </DataLoadingError>
      );
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should render empty state', () => {
      render(
        <DataLoadingError isLoading={false} error={undefined} isEmpty={true}>
          <div>Data</div>
        </DataLoadingError>
      );
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should use custom empty message', () => {
      render(
        <DataLoadingError isLoading={false} error={undefined} isEmpty={true} emptyMessage="Custom empty">
          <div>Data</div>
        </DataLoadingError>
      );
      expect(screen.getByText('Custom empty')).toBeInTheDocument();
    });

    it('should render retry button for errors', () => {
      const error = new Error('Error');
      render(
        <DataLoadingError isLoading={false} error={error} onRetry={jest.fn()}>
          <div>Data</div>
        </DataLoadingError>
      );
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should call onRetry when retry is clicked', async () => {
      const handleRetry = jest.fn();
      const error = new Error('Error');
      const user = userEvent.setup();

      render(
        <DataLoadingError isLoading={false} error={error} onRetry={handleRetry}>
          <div>Data</div>
        </DataLoadingError>
      );

      await user.click(screen.getByText('Try Again'));
      expect(handleRetry).toHaveBeenCalled();
    });

    it('should render children when loaded successfully', () => {
      render(
        <DataLoadingError isLoading={false} error={undefined}>
          <div>Data content</div>
        </DataLoadingError>
      );
      expect(screen.getByText('Data content')).toBeInTheDocument();
    });
  });

  describe('FormLoadingError Component', () => {
    it('should render without crashing', () => {
      render(
        <FormLoadingError isLoading={false} error={undefined}>
          <form>Form content</form>
        </FormLoadingError>
      );
      expect(screen.getByText('Form content')).toBeInTheDocument();
    });

    it('should show form loading message', () => {
      render(
        <FormLoadingError isLoading={true} error={undefined}>
          <form>Form</form>
        </FormLoadingError>
      );
      expect(screen.getByText('Loading form...')).toBeInTheDocument();
    });

    it('should show form load error title', () => {
      const error = new Error('Form error');
      render(
        <FormLoadingError isLoading={false} error={error}>
          <form>Form</form>
        </FormLoadingError>
      );
      expect(screen.getByText('Failed to load form')).toBeInTheDocument();
    });

    it('should render retry button for errors', () => {
      const error = new Error('Error');
      render(
        <FormLoadingError isLoading={false} error={error} onRetry={jest.fn()}>
          <form>Form</form>
        </FormLoadingError>
      );
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should call onRetry when retry is clicked', async () => {
      const handleRetry = jest.fn();
      const error = new Error('Error');
      const user = userEvent.setup();

      render(
        <FormLoadingError isLoading={false} error={error} onRetry={handleRetry}>
          <form>Form</form>
        </FormLoadingError>
      );

      await user.click(screen.getByText('Try Again'));
      expect(handleRetry).toHaveBeenCalled();
    });

    it('should render children when loaded successfully', () => {
      render(
        <FormLoadingError isLoading={false} error={undefined}>
          <form>Form content</form>
        </FormLoadingError>
      );
      expect(screen.getByText('Form content')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with different loading error types', () => {
      const { rerender } = render(
        <DataLoadingError isLoading={true} error={undefined}>
          <div>Data</div>
        </DataLoadingError>
      );
      expect(screen.getByText('Loading data...')).toBeInTheDocument();

      rerender(
        <FormLoadingError isLoading={true} error={undefined}>
          <form>Form</form>
        </FormLoadingError>
      );
      expect(screen.getByText('Loading form...')).toBeInTheDocument();
    });

    it('should handle complete data loading workflow', async () => {
      const user = userEvent.setup();
      const handleRetry = jest.fn();

      const { rerender } = render(
        <DataLoadingError isLoading={true} error={undefined} onRetry={handleRetry}>
          <div>Data</div>
        </DataLoadingError>
      );

      // Loading state
      expect(screen.getByText('Loading data...')).toBeInTheDocument();

      // Error state
      const error = new Error('Failed to load');
      rerender(
        <DataLoadingError isLoading={false} error={error} onRetry={handleRetry}>
          <div>Data</div>
        </DataLoadingError>
      );
      expect(screen.getByText('Failed to load')).toBeInTheDocument();

      // Retry
      await user.click(screen.getByText('Try Again'));
      expect(handleRetry).toHaveBeenCalled();

      // Success state
      rerender(
        <DataLoadingError isLoading={false} error={undefined} onRetry={handleRetry}>
          <div>Data content loaded</div>
        </DataLoadingError>
      );
      expect(screen.getByText('Data content loaded')).toBeInTheDocument();
    });
  });
});
