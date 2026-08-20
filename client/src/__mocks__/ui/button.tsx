/**
 * Mock implementation for @/components/ui/button
 * Handles button variants and sizes without complex logic
 */
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild, children, ...props }, ref) => {
    // Always render as a button in tests, ignore asChild prop
    // The parent component (like DialogTrigger) will handle composition
    return (
      <button
        ref={ref}
        className={`button ${variant} ${size} ${className || ''}`}
        data-testid="button"
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Mock buttonVariants function for class-variance-authority
export const buttonVariants = ({ variant = 'default', size = 'default' }: { variant?: string; size?: string } = {}) => {
  return `button ${variant} ${size}`;
};

// Ensure default export as well
export default Button;