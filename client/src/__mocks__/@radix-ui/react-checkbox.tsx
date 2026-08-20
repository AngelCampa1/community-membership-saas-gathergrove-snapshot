/**
 * Mock for @radix-ui/react-checkbox - External library boundary mock
 */
import * as React from 'react';

interface CheckboxRootProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  defaultChecked?: boolean;
  required?: boolean;
}

export const Root = React.forwardRef<HTMLButtonElement, CheckboxRootProps>(
  function CheckboxRoot({ checked, onCheckedChange, defaultChecked, children, ...props }, ref) {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
    const isControlled = checked !== undefined;
    const currentChecked = isControlled ? checked : internalChecked;

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={currentChecked === 'indeterminate' ? 'mixed' : currentChecked}
        data-state={currentChecked === 'indeterminate' ? 'indeterminate' : currentChecked ? 'checked' : 'unchecked'}
        onClick={() => {
          const newValue = !currentChecked;
          if (!isControlled) setInternalChecked(newValue);
          onCheckedChange?.(newValue);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

export const Indicator: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ children, ...props }) => (
  <span {...props}>{children}</span>
);

export const Checkbox = Root;
export const CheckboxIndicator = Indicator;
