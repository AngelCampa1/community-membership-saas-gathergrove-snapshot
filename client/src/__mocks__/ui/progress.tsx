/**
 * Mock implementation for @/components/ui/progress
 */
import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`progress ${className || ''}`}
        data-testid="progress"
        data-value={value}
        data-max={max}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        {...props}
      >
        <div 
          className="progress-indicator" 
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// Ensure default export as well
export default Progress;