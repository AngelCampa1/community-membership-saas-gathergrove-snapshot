import { Loader2, AlertCircle, RefreshCw } from'lucide-react';
import { Button } from'@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from'@/components/ui/alert';
import { cn } from'@/lib/utils';

interface LoadingErrorProps {
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
  loadingMessage?: string;
  errorTitle?: string;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
}

export function LoadingError({
  isLoading,
  error,
  onRetry,
  children,
  className,
  loadingMessage ="Loading...",
  errorTitle ="Something went wrong",
  emptyState,
  isEmpty = false
}: LoadingErrorProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-success/20   rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-background to-muted/20 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground/90">{loadingMessage}</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      :'An unexpected error occurred';

    return (
      <div className={cn("p-4", className)}>
        <Alert variant="destructive" className="glass-soft border-destructive/50 bg-destructive/5  backdrop-blur-sm">
          <div className="p-1.5 rounded-lg bg-destructive/20  w-fit">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <AlertTitle data-testid="loading-error-title" className="text-destructive font-semibold">
            {errorTitle}
          </AlertTitle>
          <AlertDescription data-testid="loading-error-description" className="space-y-3 text-destructive/90">
            <p>{errorMessage}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="w-full sm:w-auto glass-soft border-destructive/30 hover:glass hover:border-destructive/50 text-destructive hover:text-destructive transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (isEmpty && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  // Success state - render children
  return <div className={className}>{children}</div>;
}

// Specialized loading states for common scenarios
export function DataLoadingError({
  isLoading,
  error,
  onRetry,
  children,
  emptyMessage ="No data available",
  isEmpty = false,
  className
}: Omit<LoadingErrorProps,'loadingMessage' |'errorTitle' |'emptyState'> & {
  emptyMessage?: string;
}) {
  return (
    <LoadingError
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
      loadingMessage="Loading data..."
      errorTitle="Failed to load data"
      isEmpty={isEmpty}
      emptyState={
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-background to-muted/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
              </div>
            </div>
          </div>
          <p className="text-muted-foreground font-medium">{emptyMessage}</p>
        </div>
      }
    >
      {children}
    </LoadingError>
  );
}

export function FormLoadingError({
  isLoading,
  error,
  onRetry,
  children,
  className
}: Omit<LoadingErrorProps,'loadingMessage' |'errorTitle' |'emptyState' |'isEmpty'>) {
  return (
    <LoadingError
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
      loadingMessage="Loading form..."
      errorTitle="Failed to load form"
    >
      {children}
    </LoadingError>
  );
} 