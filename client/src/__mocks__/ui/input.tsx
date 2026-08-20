/**
 * Mock implementation for @/components/ui/input
 * Simple input component
 */
import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  asChild?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', asChild, ...props }, ref) => {
    if (asChild) {
      return <>{props.children}</>;
    }

    return (
      <input
        ref={ref}
        type={type}
        className={`input ${className || ''}`}
        data-testid="input"
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

// Ensure default export as well
export default Input;