/**
 * Mock implementation for @/components/ui/switch
 * Provides a simple switch component for testing
 */
import React from 'react';

export interface SwitchProps extends React.HTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        ref={ref}
        role="switch"
        aria-checked={checked}
        data-testid="switch"
        data-state={checked ? 'checked' : 'unchecked'}
        disabled={disabled}
        className={className}
        onClick={handleClick}
        {...props}
      >
        <span 
          data-testid="switch-thumb"
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            backgroundColor: checked ? '#3b82f6' : '#e2e8f0',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            transform: checked ? 'translateX(100%)' : 'translateX(0)',
          }}
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';