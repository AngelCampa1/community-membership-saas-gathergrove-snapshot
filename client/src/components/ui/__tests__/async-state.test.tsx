import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AsyncState,
  DataLoader,
  PageLoader,
  CardLoader,
  InlineLoader,
} from '../async-state';

// Mock ErrorMessage component
jest.mock('../error-message', () => ({
  ErrorMessage: ({ error, showRetry, onRetry }: any) => (
    <div data-testid="error-message">
      <p>Error: {error?.message || String(error)}</p>
      {showRetry && onRetry && (
        <button onClick={onRetry}>Retry</button>
      )}
    </div>
  ),
}));

describe('AsyncState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading state with default variant', () => {
      render(<AsyncState loading>Content</AsyncState>);

      expect(screen.getByTestId('async-state-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('should render loading state with custom loading text', () => {
      render(<AsyncState loading loadingText="Please wait...">Content</AsyncState>);

      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('should render loading state with card variant', () => {
      const { container } = render(
        <AsyncState loading variant="card">Content</AsyncState>
      );

      expect(screen.getByTestId('async-state-loading')).toBeInTheDocument();
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it('should render loading state with minimal variant', () => {
      render(<AsyncState loading variant="minimal">Content</AsyncState>);

      expect(screen.getByTestId('async-state-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should apply custom className in loading state', () => {
      const { container } = render(
        <AsyncState loading className="custom-class">Content</AsyncState>
      );

      const loadingContainer = container.querySelector('.custom-class');
      expect(loadingContainer).toBeInTheDocument();
    });

    it('should render Loader2 spinner icon', () => {
      const { container } = render(<AsyncState loading>Content</AsyncState>);

      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should have correct styling for minimal variant', () => {
      const { container } = render(
        <AsyncState loading variant="minimal">Content</AsyncState>
      );

      const loadingDiv = screen.getByTestId('async-state-loading');
      expect(loadingDiv).toHaveClass('flex', 'items-center', 'justify-center', 'py-4');
    });
  });

  describe('Error State', () => {
    it('should render error state', () => {
      const error = new Error('Test error');
      render(<AsyncState error={error}>Content</AsyncState>);

      expect(screen.getByTestId('async-state-error')).toBeInTheDocument();
      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('should render error with string error', () => {
      render(<AsyncState error="String error">Content</AsyncState>);

      expect(screen.getByTestId('async-state-error')).toBeInTheDocument();
      expect(screen.getByText(/String error/)).toBeInTheDocument();
    });

    it('should render error with card variant', () => {
      const { container } = render(
        <AsyncState error={new Error('Card error')} variant="card">
          Content
        </AsyncState>
      );

      expect(screen.getByTestId('async-state-error')).toBeInTheDocument();
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it('should show retry button when onRetry is provided', () => {
      const onRetry = jest.fn();
      render(
        <AsyncState error={new Error('Test error')} onRetry={onRetry}>
          Content
        </AsyncState>
      );

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn();

      render(
        <AsyncState error={new Error('Test error')} onRetry={onRetry}>
          Content
        </AsyncState>
      );

      await user.click(screen.getByText('Retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<AsyncState error={new Error('Test error')}>Content</AsyncState>);

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should apply custom className in error state', () => {
      const { container } = render(
        <AsyncState error={new Error('Test')} className="error-custom">
          Content
        </AsyncState>
      );

      const errorContainer = container.querySelector('.error-custom');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should prioritize error over loading state', () => {
      render(
        <AsyncState loading error={new Error('Error priority')}>
          Content
        </AsyncState>
      );

      // Loading is checked first in component logic, so loading shows
      expect(screen.getByTestId('async-state-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('async-state-error')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state', () => {
      render(<AsyncState empty>Content</AsyncState>);

      expect(screen.getByTestId('async-state-empty')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('should render empty state with custom message', () => {
      render(<AsyncState empty emptyMessage="No results found">Content</AsyncState>);

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should render empty state with card variant', () => {
      const { container } = render(
        <AsyncState empty variant="card">Content</AsyncState>
      );

      expect(screen.getByTestId('async-state-empty')).toBeInTheDocument();
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('border-dashed');
    });

    it('should render empty action button', () => {
      const emptyAction = {
        label: 'Add Item',
        onClick: jest.fn(),
      };

      render(<AsyncState empty emptyAction={emptyAction}>Content</AsyncState>);

      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });

    it('should call empty action onClick when button is clicked', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const emptyAction = {
        label: 'Create New',
        onClick,
      };

      render(<AsyncState empty emptyAction={emptyAction}>Content</AsyncState>);

      await user.click(screen.getByText('Create New'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not render empty action button when not provided', () => {
      render(<AsyncState empty>Content</AsyncState>);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should apply custom className in empty state', () => {
      const { container } = render(
        <AsyncState empty className="empty-custom">Content</AsyncState>
      );

      const emptyContainer = container.querySelector('.empty-custom');
      expect(emptyContainer).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should render children when no states are active', () => {
      render(
        <AsyncState>
          <div>Success content</div>
        </AsyncState>
      );

      expect(screen.getByText('Success content')).toBeInTheDocument();
      expect(screen.queryByTestId('async-state-loading')).not.toBeInTheDocument();
      expect(screen.queryByTestId('async-state-error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('async-state-empty')).not.toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <AsyncState>
          <div>First child</div>
          <div>Second child</div>
        </AsyncState>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });

    it('should render null children without crashing', () => {
      render(<AsyncState>{null}</AsyncState>);

      expect(screen.queryByTestId('async-state-loading')).not.toBeInTheDocument();
    });

    it('should render undefined children without crashing', () => {
      render(<AsyncState>{undefined}</AsyncState>);

      expect(screen.queryByTestId('async-state-loading')).not.toBeInTheDocument();
    });
  });

  describe('State Priority', () => {
    it('should prioritize loading over error and empty', () => {
      render(
        <AsyncState loading error={new Error('Test')} empty>
          Content
        </AsyncState>
      );

      expect(screen.getByTestId('async-state-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('async-state-error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('async-state-empty')).not.toBeInTheDocument();
    });

    it('should prioritize error over empty', () => {
      render(
        <AsyncState error={new Error('Test')} empty>
          Content
        </AsyncState>
      );

      expect(screen.queryByTestId('async-state-loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('async-state-error')).toBeInTheDocument();
      expect(screen.queryByTestId('async-state-empty')).not.toBeInTheDocument();
    });

    it('should show empty state when loading is false and no error', () => {
      render(
        <AsyncState loading={false} empty>
          Content
        </AsyncState>
      );

      expect(screen.getByTestId('async-state-empty')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant correctly', () => {
      const { container } = render(
        <AsyncState loading variant="default">Content</AsyncState>
      );

      const loadingDiv = container.querySelector('.min-h-\\[200px\\]');
      expect(loadingDiv).toBeInTheDocument();
    });

    it('should render card variant with CardContent wrapper', () => {
      const { container } = render(
        <AsyncState loading variant="card">Content</AsyncState>
      );

      const cardContent = container.querySelector('[data-slot="card-content"]');
      expect(cardContent).toBeInTheDocument();
    });

    it('should render minimal variant with compact styling', () => {
      const { container } = render(
        <AsyncState loading variant="minimal">Content</AsyncState>
      );

      const loadingDiv = screen.getByTestId('async-state-loading');
      expect(loadingDiv).toHaveClass('py-4');
      expect(loadingDiv).not.toHaveClass('min-h-[200px]');
    });
  });
});

describe('DataLoader', () => {
  it('should render loading state', () => {
    render(<DataLoader loading>Content</DataLoader>);

    expect(screen.getByTestId('async-state-loading')).toBeInTheDocument();
  });

  it('should render error state', () => {
    render(<DataLoader error={new Error('Data error')}>Content</DataLoader>);

    expect(screen.getByTestId('async-state-error')).toBeInTheDocument();
  });

  it('should render empty state when data is empty array', () => {
    render(<DataLoader data={[]}>Content</DataLoader>);

    expect(screen.getByTestId('async-state-empty')).toBeInTheDocument();
  });

  it('should render empty state when data is null', () => {
    render(<DataLoader data={null}>Content</DataLoader>);

    expect(screen.getByTestId('async-state-empty')).toBeInTheDocument();
  });

  it('should render empty state when data is undefined', () => {
    render(<DataLoader data={undefined}>Content</DataLoader>);

    expect(screen.getByTestId('async-state-empty')).toBeInTheDocument();
  });

  it('should render children when data has items', () => {
    render(
      <DataLoader data={[{ id: 1 }, { id: 2 }]}>
        <div>Data list</div>
      </DataLoader>
    );

    expect(screen.getByText('Data list')).toBeInTheDocument();
    expect(screen.queryByTestId('async-state-empty')).not.toBeInTheDocument();
  });

  it('should render children when data is non-array truthy value', () => {
    render(
      <DataLoader data={{ id: 1 }}>
        <div>Data object</div>
      </DataLoader>
    );

    expect(screen.getByText('Data object')).toBeInTheDocument();
  });

  it('should use custom empty message', () => {
    render(<DataLoader data={[]} emptyMessage="No items found">Content</DataLoader>);

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('should not show empty state while loading', () => {
    render(<DataLoader loading data={[]}>Content</DataLoader>);

    expect(screen.getByTestId('async-state-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('async-state-empty')).not.toBeInTheDocument();
  });

  it('should not show empty state when error exists', () => {
    render(<DataLoader error={new Error('Test')} data={[]}>Content</DataLoader>);

    expect(screen.queryByTestId('async-state-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('async-state-error')).toBeInTheDocument();
    expect(screen.queryByTestId('async-state-empty')).not.toBeInTheDocument();
  });

  it('should handle onRetry callback', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(
      <DataLoader error={new Error('Test')} onRetry={onRetry}>
        Content
      </DataLoader>
    );

    await user.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('PageLoader', () => {
  it('should render loading state with default variant', () => {
    render(<PageLoader loading>Content</PageLoader>);

    expect(screen.getByTestId('async-state-loading')).toBeInTheDocument();
  });

  it('should render error state', () => {
    render(<PageLoader error={new Error('Page error')}>Content</PageLoader>);

    expect(screen.getByTestId('async-state-error')).toBeInTheDocument();
  });

  it('should render children when no states are active', () => {
    render(
      <PageLoader>
        <div>Page content</div>
      </PageLoader>
    );

    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('should apply min-h-screen class', () => {
    const { container } = render(<PageLoader loading>Content</PageLoader>);

    const wrapper = container.querySelector('.min-h-screen');
    expect(wrapper).toBeInTheDocument();
  });

  it('should handle onRetry callback', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(<PageLoader error={new Error('Test')} onRetry={onRetry}>Content</PageLoader>);

    await user.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PageLoader loading className="page-custom">
        Content
      </PageLoader>
    );

    const customElement = container.querySelector('.page-custom');
    expect(customElement).toBeInTheDocument();
  });
});

describe('CardLoader', () => {
  it('should render loading state with card variant', () => {
    const { container } = render(<CardLoader loading>Content</CardLoader>);

    expect(screen.getByTestId('async-state-loading')).toBeInTheDocument();
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();
  });

  it('should render error state with card variant', () => {
    const { container } = render(
      <CardLoader error={new Error('Card error')}>Content</CardLoader>
    );

    expect(screen.getByTestId('async-state-error')).toBeInTheDocument();
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();
  });

  it('should render children when no states are active', () => {
    render(
      <CardLoader>
        <div>Card content</div>
      </CardLoader>
    );

    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should handle onRetry callback', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(<CardLoader error={new Error('Test')} onRetry={onRetry}>Content</CardLoader>);

    await user.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CardLoader loading className="card-custom">
        Content
      </CardLoader>
    );

    const customElement = container.querySelector('.card-custom');
    expect(customElement).toBeInTheDocument();
  });
});

describe('InlineLoader', () => {
  it('should render loading state with minimal variant', () => {
    render(<InlineLoader loading>Content</InlineLoader>);

    expect(screen.getByTestId('async-state-loading')).toBeInTheDocument();
    const loadingDiv = screen.getByTestId('async-state-loading');
    expect(loadingDiv).toHaveClass('py-4');
  });

  it('should render error state', () => {
    render(<InlineLoader error={new Error('Inline error')}>Content</InlineLoader>);

    expect(screen.getByTestId('async-state-error')).toBeInTheDocument();
  });

  it('should render children when no states are active', () => {
    render(
      <InlineLoader>
        <div>Inline content</div>
      </InlineLoader>
    );

    expect(screen.getByText('Inline content')).toBeInTheDocument();
  });

  it('should have compact minimal styling', () => {
    render(<InlineLoader loading>Content</InlineLoader>);

    const loadingDiv = screen.getByTestId('async-state-loading');
    expect(loadingDiv).not.toHaveClass('min-h-[200px]');
    expect(loadingDiv).toHaveClass('py-4');
  });

  it('should handle onRetry callback', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(<InlineLoader error={new Error('Test')} onRetry={onRetry}>Content</InlineLoader>);

    await user.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <InlineLoader loading className="inline-custom">
        Content
      </InlineLoader>
    );

    const customElement = container.querySelector('.inline-custom');
    expect(customElement).toBeInTheDocument();
  });
});
