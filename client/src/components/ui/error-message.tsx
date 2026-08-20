"use client";

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Wifi, 
  Lock, 
  UserX, 
  Search, 
  Server, 
  CreditCard, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { ErrorTypes, ApiErrorClass, getUserFriendlyMessage } from '@/types/errors';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  error?: string | Error | ApiErrorClass | unknown;
  variant?: 'default' | 'destructive' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
  retryText?: string;
  title?: string;
  children?: React.ReactNode;
}

const ERROR_ICONS = {
  [ErrorTypes.NETWORK_ERROR]: Wifi,
  [ErrorTypes.AUTHENTICATION_ERROR]: Lock,
  [ErrorTypes.AUTHORIZATION_ERROR]: UserX,
  [ErrorTypes.NOT_FOUND_ERROR]: Search,
  [ErrorTypes.SERVER_ERROR]: Server,
  [ErrorTypes.PAYMENT_ERROR]: CreditCard,
  [ErrorTypes.STRIPE_ERROR]: CreditCard,
  [ErrorTypes.TIMEOUT_ERROR]: Wifi,
  [ErrorTypes.CONFLICT_ERROR]: AlertTriangle,
  [ErrorTypes.VALIDATION_ERROR]: AlertCircle,
  [ErrorTypes.UNKNOWN_ERROR]: AlertTriangle,
} as const;

const ERROR_TITLES = {
  [ErrorTypes.NETWORK_ERROR]: 'Connection Error',
  [ErrorTypes.AUTHENTICATION_ERROR]: 'Authentication Required',
  [ErrorTypes.AUTHORIZATION_ERROR]: 'Access Denied',
  [ErrorTypes.NOT_FOUND_ERROR]: 'Not Found',
  [ErrorTypes.SERVER_ERROR]: 'Server Error',
  [ErrorTypes.PAYMENT_ERROR]: 'Payment Error',
  [ErrorTypes.STRIPE_ERROR]: 'Payment Processing Error',
  [ErrorTypes.TIMEOUT_ERROR]: 'Request Timeout',
  [ErrorTypes.CONFLICT_ERROR]: 'Conflict Error',
  [ErrorTypes.VALIDATION_ERROR]: 'Validation Error',
  [ErrorTypes.UNKNOWN_ERROR]: 'Unexpected Error',
} as const;

export function ErrorMessage({
  error,
  variant = 'destructive',
  size = 'md',
  className,
  showIcon = true,
  showRetry = false,
  onRetry,
  retryText = 'Try Again',
  title,
  children,
}: ErrorMessageProps) {
  // Parse error to get message and type
  const parseError = (err: unknown): { message: string; type?: ErrorTypes; title?: string } => {
    if (err instanceof ApiErrorClass) {
      return {
        message: err.message,
        type: err.type,
        title: ERROR_TITLES[err.type] || title
      };
    }
    
    if (err instanceof Error) {
      return { message: err.message, title };
    }
    
    if (typeof err === 'string') {
      return { message: err, title };
    }
    
    return { 
      message: getUserFriendlyMessage(err), 
      type: ErrorTypes.UNKNOWN_ERROR,
      title: ERROR_TITLES[ErrorTypes.UNKNOWN_ERROR] || title
    };
  };

  const { message, type, title: errorTitle } = parseError(error);
  
  // Get appropriate icon
  const IconComponent = type && ERROR_ICONS[type] 
    ? ERROR_ICONS[type] 
    : AlertTriangle;

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  // Don't render if no error
  if (!error && !children) {
    return null;
  }

  return (
    <Alert 
      variant={variant === 'warning' ? 'destructive' : variant} 
      className={cn(
        sizeClasses[size], 
        "glass-soft border-border/40 backdrop-blur-md shadow-lg hover:glass transition-all duration-300",
        className
      )}
    >
      {showIcon && (
        <IconComponent className={cn(iconSizes[size], "animate-pulse")} />
      )}
      
      {errorTitle && (
        <AlertTitle>{errorTitle}</AlertTitle>
      )}
      
      <AlertDescription className="space-y-3">
        {message && <p>{message}</p>}
        
        {children}
        
        {showRetry && onRetry && (
          <Button 
            variant="outline" 
            size={size === 'sm' ? 'sm' : 'default'}
            onClick={onRetry}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {retryText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Specialized error message components
export function NetworkError({ onRetry, ...props }: Omit<ErrorMessageProps, 'error'>) {
  return (
    <ErrorMessage
      error="Unable to connect to the server. Please check your internet connection."
      showRetry={true}
      onRetry={onRetry}
      retryText="Retry Connection"
      {...props}
    />
  );
}

export function NotFoundError({ resource = 'resource', ...props }: Omit<ErrorMessageProps, 'error'> & { resource?: string }) {
  return (
    <ErrorMessage
      error={`The requested ${resource} could not be found.`}
      variant="warning"
      title="Not Found"
      {...props}
    />
  );
}

export function PermissionError({ action = 'perform this action', ...props }: Omit<ErrorMessageProps, 'error'> & { action?: string }) {
  return (
    <ErrorMessage
      error={`You don't have permission to ${action}.`}
      title="Access Denied"
      {...props}
    />
  );
}

export function ValidationError({ errors, ...props }: Omit<ErrorMessageProps, 'error'> & { errors?: string[] }) {
  return (
    <ErrorMessage
      title="Please correct the following errors:"
      variant="warning"
      {...props}
    >
      {errors && errors.length > 0 && (
        <ul className="list-disc list-inside space-y-1 text-sm">
          {errors.map((error, index) => (
            <li key={`error-${index}-${error.substring(0, 30)}`}>{error}</li>
          ))}
        </ul>
      )}
    </ErrorMessage>
  );
}

export function ServerError({ onRetry, ...props }: Omit<ErrorMessageProps, 'error'>) {
  return (
    <ErrorMessage
      error="Something went wrong on our end. Please try again in a moment."
      showRetry={true}
      onRetry={onRetry}
      retryText="Try Again"
      {...props}
    />
  );
}

export function PaymentError({ onRetry, ...props }: Omit<ErrorMessageProps, 'error'>) {
  return (
    <ErrorMessage
      error="There was an issue processing your payment. Please check your payment details and try again."
      showRetry={true}
      onRetry={onRetry}
      retryText="Retry Payment"
      {...props}
    />
  );
}

// Field-level error message for forms
export function FieldError({ error, className }: { error?: string; className?: string }) {
  if (!error) return null;
  
  return (
    <p className={cn("text-sm text-destructive", className)}>
      {error}
    </p>
  );
}

// Inline error for subtle errors
export function InlineError({ error, className }: { error?: string; className?: string }) {
  if (!error) return null;
  
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm text-destructive", className)}>
      <AlertCircle className="h-3 w-3" />
      {error}
    </span>
  );
}