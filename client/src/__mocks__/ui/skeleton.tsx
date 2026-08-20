/**
 * Mock implementation for @/components/ui/skeleton
 * Provides a simple skeleton component for testing
 */
import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="skeleton"
        className={className}
        style={{
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';