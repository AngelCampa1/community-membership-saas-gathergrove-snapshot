import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { ErrorHandler } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface AsyncButtonProps extends React.ComponentProps<typeof Button> {
  onAsyncClick: () => Promise<void>;
  loadingText?: string;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
  retryOnError?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export function AsyncButton({
  onAsyncClick,
  loadingText,
  successMessage,
  errorMessage,
  showToast = true,
  retryOnError = false,
  disabled = false,
  children,
  className,
  ...props
}: AsyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastError, setLastError] = useState<unknown>(null);

  const handleClick = async () => {
    if (isLoading || disabled) return;

    try {
      setIsLoading(true);
      setHasError(false);
      setLastError(null);

      await onAsyncClick();

      if (successMessage && showToast) {
        ErrorHandler.showSuccessToast(successMessage);
      }
    } catch (error) {
      logger.error('ui', 'AsyncButton operation failed', { error, hasSuccessMessage: !!successMessage });
      setHasError(true);
      setLastError(error);

      if (showToast) {
        const message = errorMessage || 'Operation failed. Please try again.';
        ErrorHandler.showErrorToast(error, message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (hasError && lastError) {
      await handleClick();
    }
  };

  // Show retry button if there's an error and retry is enabled
  if (hasError && retryOnError) {
    return (
      <Button
        {...props}
        onClick={handleRetry}
        disabled={isLoading || disabled}
        className={cn("", className)}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    );
  }

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={isLoading || disabled}
      className={cn("", className)}
    >
      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {isLoading ? (loadingText || 'Loading...') : children}
    </Button>
  );
}

// Specialized async buttons for common scenarios
export function AsyncSubmitButton({
  onSubmit,
  children = 'Save',
  loadingText = 'Saving...',
  successMessage = 'Saved successfully!',
  ...props
}: Omit<AsyncButtonProps, 'onAsyncClick' | 'children'> & {
  onSubmit: () => Promise<void>;
  children?: React.ReactNode;
}) {
  return (
    <AsyncButton
      onAsyncClick={onSubmit}
      loadingText={loadingText}
      successMessage={successMessage}
      type="submit"
      {...props}
    >
      {children}
    </AsyncButton>
  );
}

export function AsyncDeleteButton({
  onDelete,
  children = 'Delete',
  loadingText = 'Deleting...',
  successMessage = 'Deleted successfully!',
  confirmMessage = 'Are you sure you want to delete this item?',
  ...props
}: Omit<AsyncButtonProps, 'onAsyncClick' | 'children'> & {
  onDelete: () => Promise<void>;
  children?: React.ReactNode;
  confirmMessage?: string;
}) {
  const handleDeleteWithConfirm = async () => {
    if (confirmMessage && !confirm(confirmMessage)) {
      return;
    }
    await onDelete();
  };

  return (
    <AsyncButton
      onAsyncClick={handleDeleteWithConfirm}
      loadingText={loadingText}
      successMessage={successMessage}
      variant="destructive"
      retryOnError={true}
      {...props}
    >
      {children}
    </AsyncButton>
  );
} 