import { AlertCircle, RefreshCw, WifiOff, Server, ShieldAlert, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ApiErrorClass, ErrorTypes } from '@/types/errors';

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
}: DataErrorProps) {
  // Determine error type and appropriate icon/styling
  const getErrorInfo = () => {
    if (error instanceof ApiErrorClass) {
      switch (error.type) {
        case ErrorTypes.NETWORK_ERROR:
          return {
            icon: WifiOff,
            iconColor: 'text-warning',
            title: title || 'Connection Problem',
            message: message || error.message,
            canRetry: true
          };
        case ErrorTypes.AUTHENTICATION_ERROR:
          return {
            icon: ShieldAlert,
            iconColor: 'text-destructive',
            title: title || 'Authentication Required',
            message: message || error.message,
            canRetry: false
          };
        case ErrorTypes.AUTHORIZATION_ERROR:
          return {
            icon: ShieldAlert,
            iconColor: 'text-warning',
            title: title || 'Access Denied',
            message: message || error.message,
            canRetry: false
          };
        case ErrorTypes.SERVER_ERROR:
          return {
            icon: Server,
            iconColor: 'text-destructive',
            title: title || 'Server Error',
            message: message || error.message,
            canRetry: true
          };
        case ErrorTypes.TIMEOUT_ERROR:
          return {
            icon: Clock,
            iconColor: 'text-info',
            title: title || 'Request Timeout',
            message: message || error.message,
            canRetry: true
          };
        default:
          return {
            icon: AlertCircle,
            iconColor: 'text-destructive',
            title: title || 'Something went wrong',
            message: message || error.message,
            canRetry: true
          };
      }
    }

    // Fallback for non-ApiError instances
    return {
      icon: AlertCircle,
      iconColor: 'text-destructive',
      title: title || 'Error',
      message: message || (error instanceof Error ? error.message : 'An unexpected error occurred'),
      canRetry: true
    };
  };

  const errorInfo = getErrorInfo();
  const Icon = errorInfo.icon;

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-3 p-4 rounded-md border border-destructive/20 bg-destructive/5", className)}>
        <Icon className={cn("h-5 w-5 flex-shrink-0", errorInfo.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{errorInfo.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{errorInfo.message}</p>
          {showDetails && error instanceof ApiErrorClass && error.code && (
            <p className="text-xs text-muted-foreground mt-1">Error Code: {error.code}</p>
          )}
        </div>
        <div className="flex gap-2">
          {errorInfo.canRetry && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel || 'Help'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'full-page') {
    return (
      <div className={cn("flex items-center justify-center min-h-[50vh] p-8", className)}>
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-3">
              <Icon className={cn("h-8 w-8", errorInfo.iconColor)} />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">{errorInfo.title}</h2>
          <p className="text-muted-foreground mb-6">{errorInfo.message}</p>
          {showDetails && error instanceof ApiErrorClass && error.code && (
            <p className="text-xs text-muted-foreground mb-4">Error Code: {error.code}</p>
          )}
          <div className="flex justify-center gap-3">
            {errorInfo.canRetry && onRetry && (
              <Button onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {onSecondaryAction && (
              <Button variant="outline" onClick={onSecondaryAction}>
                {secondaryActionLabel || 'Go Back'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <Card className={cn("", className)} data-testid="data-error">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-2">
          <div className="rounded-full bg-muted p-3">
            <Icon className={cn("h-6 w-6", errorInfo.iconColor)} />
          </div>
        </div>
        <CardTitle className="text-lg" data-testid="data-error-title">{errorInfo.title}</CardTitle>
        <CardDescription data-testid="data-error-description">{errorInfo.message}</CardDescription>
        {showDetails && error instanceof ApiErrorClass && error.code && (
          <p className="text-xs text-muted-foreground mt-2">Error Code: {error.code}</p>
        )}
      </CardHeader>
      <CardContent className="text-center pt-0">
        <div className="flex justify-center gap-3">
          {errorInfo.canRetry && onRetry && (
            <Button onClick={onRetry} size="sm" data-testid="retry-button">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          {onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel || 'Go Back'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized components for common scenarios
export function NetworkError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <DataError
      error={{ type: ErrorTypes.NETWORK_ERROR, message: 'Please check your internet connection and try again.' }}
      onRetry={onRetry}
      className={className}
      variant="inline"
    />
  );
}

export function ServerError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <DataError
      error={{ type: ErrorTypes.SERVER_ERROR, message: 'Our servers are having trouble. Please try again in a moment.' }}
      onRetry={onRetry}
      className={className}
      variant="inline"
    />
  );
}

export function AuthError({ onLogin, className }: { onLogin?: () => void; className?: string }) {
  return (
    <DataError
      error={{ type: ErrorTypes.AUTHENTICATION_ERROR, message: 'Please log in to continue.' }}
      onSecondaryAction={onLogin}
      secondaryActionLabel="Log In"
      className={className}
      variant="card"
    />
  );
} 