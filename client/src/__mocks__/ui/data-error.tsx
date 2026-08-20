import React, { ReactNode } from 'react';

// Standalone mock for DataError component - no external dependencies
interface DataErrorProps {
  title?: string;
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  className?: string;
  variant?: 'card' | 'inline' | 'full-page';
  showDetails?: boolean;
}

export function DataError({
  title,
  message,
  error,
  onRetry,
  onSecondaryAction,
  secondaryActionLabel,
  className,
  variant = 'card',
  showDetails = false
}: DataErrorProps): ReactNode {
  const errorTitle = title || 'Error';
  const errorMessage = message || (error instanceof Error ? error.message : 'An unexpected error occurred');
  
  // Unified render with data-testid for tests
  return (
    <div className={className} data-testid="data-error">
      <div data-testid="data-error-title">{errorTitle}</div>
      <div data-testid="data-error-description">{errorMessage}</div>
      {onRetry && (
        <button data-testid="retry-button" onClick={onRetry}>
          {variant === 'inline' ? 'Retry' : 'Try Again'}
        </button>
      )}
      {onSecondaryAction && (
        <button data-testid="secondary-button" onClick={onSecondaryAction}>
          {secondaryActionLabel || (variant === 'full-page' ? 'Go Back' : 'Help')}
        </button>
      )}
      {showDetails && error ? (
        <div data-testid="error-details">
          <span>{typeof error === 'string' ? error : (error instanceof Error ? error.message : String(error))}</span>
        </div>
      ) : null}
    </div>
  );
}

// Export specialized error components as well
export function NetworkError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <DataError
      title="Network Error"
      message="Please check your internet connection and try again."
      onRetry={onRetry}
      className={className}
      variant="inline"
    />
  );
}

export function ServerError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <DataError
      title="Server Error"
      message="Our servers are having trouble. Please try again in a moment."
      onRetry={onRetry}
      className={className}
      variant="inline"
    />
  );
}

export function AuthError({ onLogin, className }: { onLogin?: () => void; className?: string }) {
  return (
    <DataError
      title="Authentication Error"
      message="Please log in to continue."
      onSecondaryAction={onLogin}
      secondaryActionLabel="Log In"
      className={className}
      variant="card"
    />
  );
}

// Also export as default in case it's imported that way
export default DataError;