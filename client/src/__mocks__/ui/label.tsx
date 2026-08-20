/**
 * Mock implementation for @/components/ui/label
 * Simple label component
 */
import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  asChild?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, asChild, children, ...props }, ref) => {
    if (asChild) {
      return <>{children}</>;
    }

    return (
      <label
        ref={ref}
        className={`label ${className || ''}`}
        data-testid="label"
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';

// Ensure default export as well
export default Label;