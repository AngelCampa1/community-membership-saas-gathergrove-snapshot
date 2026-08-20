"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorMessage } from './error-message';
import { Card, CardContent } from './card';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AsyncStateProps {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  onRetry?: () => void;
  children?: React.ReactNode;
  className?: string;
  loadingText?: string;
  variant?: 'default' | 'card' | 'minimal';
}

export function AsyncState({
  loading = false,
  error,
  empty = false,
  emptyMessage = 'No data available',
  emptyAction,
  onRetry,
  children,
  className,
  loadingText = 'Loading...',
  variant = 'default'
}: AsyncStateProps) {
  // Loading state
  if (loading) {
    const loadingContent = (
      <div className="flex flex-col items-center justify-center p-8 space-y-4" data-testid="async-state-loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{loadingText}</p>
      </div>
    );

    if (variant === 'card') {
      return (
        <Card className={className}>
          <CardContent>
            {loadingContent}
          </CardContent>
        </Card>
      );
    }

    if (variant === 'minimal') {
      return (
        <div className={cn("flex items-center justify-center py-4", className)} data-testid="async-state-loading">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">{loadingText}</span>
        </div>
      );
    }

    return (
      <div className={cn("flex items-center justify-center min-h-[200px]", className)}>
        {loadingContent}
      </div>
    );
  }

  // Error state
  if (error) {
    const errorContent = (
      <div className="p-4" data-testid="async-state-error">
        <ErrorMessage
          error={error}
          showRetry={!!onRetry}
          onRetry={onRetry}
        />
      </div>
    );

    if (variant === 'card') {
      return (
        <Card className={className}>
          <CardContent>
            {errorContent}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={cn("min-h-[200px] flex items-center justify-center", className)}>
        {errorContent}
      </div>
    );
  }

  // Empty state
  if (empty) {
    const emptyContent = (
      <div className="flex flex-col items-center justify-center p-8 space-y-4" data-testid="async-state-empty">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">{emptyMessage}</p>
          {emptyAction && (
            <Button onClick={emptyAction.onClick} variant="outline">
              {emptyAction.label}
            </Button>
          )}
        </div>
      </div>
    );

    if (variant === 'card') {
      return (
        <Card className={cn("border-dashed", className)}>
          <CardContent>
            {emptyContent}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={cn("min-h-[200px] flex items-center justify-center", className)}>
        {emptyContent}
      </div>
    );
  }

  // Success state - render children
  return <>{children}</>;
}

// Specialized components for common use cases
export function DataLoader({
  loading,
  error,
  data,
  emptyMessage = 'No data found',
  onRetry,
  children,
  ...props
}: Omit<AsyncStateProps, 'empty'> & {
  data?: unknown[] | unknown;
}) {
  const isEmpty = Array.isArray(data) ? data.length === 0 : !data;
  
  return (
    <AsyncState
      loading={loading}
      error={error}
      empty={!loading && !error && isEmpty}
      emptyMessage={emptyMessage}
      onRetry={onRetry}
      {...props}
    >
      {children}
    </AsyncState>
  );
}

export function PageLoader({
  loading,
  error,
  onRetry,
  children,
  ...props
}: Pick<AsyncStateProps, 'loading' | 'error' | 'onRetry' | 'children' | 'className'>) {
  return (
    <AsyncState
      loading={loading}
      error={error}
      onRetry={onRetry}
      variant="default"
      className="min-h-screen flex items-center justify-center"
      {...props}
    >
      {children}
    </AsyncState>
  );
}

export function CardLoader({
  loading,
  error,
  onRetry,
  children,
  ...props
}: Pick<AsyncStateProps, 'loading' | 'error' | 'onRetry' | 'children' | 'className'>) {
  return (
    <AsyncState
      loading={loading}
      error={error}
      onRetry={onRetry}
      variant="card"
      {...props}
    >
      {children}
    </AsyncState>
  );
}

export function InlineLoader({
  loading,
  error,
  onRetry,
  children,
  ...props
}: Pick<AsyncStateProps, 'loading' | 'error' | 'onRetry' | 'children' | 'className'>) {
  return (
    <AsyncState
      loading={loading}
      error={error}
      onRetry={onRetry}
      variant="minimal"
      {...props}
    >
      {children}
    </AsyncState>
  );
}