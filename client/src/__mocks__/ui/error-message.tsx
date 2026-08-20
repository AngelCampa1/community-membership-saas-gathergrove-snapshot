import React from 'react';

// Mock ErrorMessage component for testing
export const ErrorMessage = ({
  error,
  showRetry,
  onRetry,
  ...props
}: any) => {
  const errorMessage = error?.message || error?.toString() || 'An error occurred';

  return (
    <div data-testid="error-message" {...props}>
      <p>{errorMessage}</p>
      {showRetry && onRetry && (
        <button onClick={onRetry} data-testid="error-retry-button">
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
