/**
 * Mock for @radix-ui/react-progress - External library boundary mock
 */
import * as React from 'react';

interface ProgressRootProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | null;
  max?: number;
  getValueLabel?: (value: number, max: number) => string;
}

export const Root = React.forwardRef<HTMLDivElement, ProgressRootProps>(
  function ProgressRoot({ value, max = 100, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value ?? undefined}
        aria-valuemin={0}
        aria-valuemax={max}
        data-value={value}
        data-max={max}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const Indicator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function ProgressIndicator(props, ref) {
    return <div ref={ref} {...props} />;
  }
);

export const Progress = Root;
export const ProgressIndicator = Indicator;
