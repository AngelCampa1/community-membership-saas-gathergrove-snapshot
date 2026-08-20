/**
 * Mock implementation for @/components/ui/async-state
 * CRITICAL: Uses React.createElement to avoid any JSX transform or import issues
 */
import * as React from 'react';

function AsyncStateMock({
  children,
  loading,
  error,
  empty,
  emptyMessage,
  emptyAction,
  onRetry,
  loadingText,
  ...props
}: any) {
  if (loading) {
    return React.createElement('div', { 'data-testid': 'async-state-loading', ...props }, [
      React.createElement('div', { key: 'loader', 'data-testid': 'loader2-icon', className: 'animate-spin' }),
      React.createElement('p', { key: 'loading-text' }, loadingText || 'Loading...')
    ]);
  }

  if (error) {
    const errorElements = [
      React.createElement('p', { key: 'error-msg' }, (error as any)?.message || 'An error occurred')
    ];
    if (onRetry) {
      errorElements.push(
        React.createElement('button', { key: 'retry-btn', onClick: onRetry, 'data-testid': 'async-state-retry' }, 'Retry')
      );
    }
    return React.createElement('div', { 'data-testid': 'async-state-error', ...props }, errorElements);
  }

  if (empty) {
    const emptyElements = [
      React.createElement('p', { key: 'empty-msg' }, emptyMessage || 'No data available')
    ];
    if (emptyAction) {
      emptyElements.push(
        React.createElement('button', {
          key: 'empty-action',
          onClick: emptyAction.onClick,
          'data-testid': 'async-state-empty-action'
        }, emptyAction.label)
      );
    }
    return React.createElement('div', { 'data-testid': 'async-state-empty', ...props }, emptyElements);
  }

  // Return children wrapped in Fragment
  return React.createElement(React.Fragment, null, children);
}

function DataLoaderMock({ children, ...props }: any) {
  return React.createElement(AsyncStateMock, props, children);
}

function PageLoaderMock({ children, ...props }: any) {
  return React.createElement(AsyncStateMock, props, children);
}

function CardLoaderMock({ children, ...props }: any) {
  return React.createElement(AsyncStateMock, props, children);
}

function InlineLoaderMock({ children, ...props }: any) {
  return React.createElement(AsyncStateMock, props, children);
}

// Export with proper ES module semantics
export {
  AsyncStateMock as AsyncState,
  DataLoaderMock as DataLoader,
  PageLoaderMock as PageLoader,
  CardLoaderMock as CardLoader,
  InlineLoaderMock as InlineLoader
};

export default AsyncStateMock;
