/**
 * Mock for @radix-ui/react-radio-group - External library boundary mock
 */
import * as React from 'react';

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

interface RootProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  orientation?: 'horizontal' | 'vertical';
  loop?: boolean;
}

export const Root = React.forwardRef<HTMLDivElement, RootProps>(
  function RadioGroupRoot({ value: controlledValue, defaultValue = '', onValueChange, children, ...props }, ref) {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;

    const handleValueChange = React.useCallback((newValue: string) => {
      if (!isControlled) setInternalValue(newValue);
      onValueChange?.(newValue);
    }, [isControlled, onValueChange]);

    return (
      <RadioGroupContext.Provider value={{ value, onValueChange: handleValueChange }}>
        <div ref={ref} role="radiogroup" {...props}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);

interface ItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const Item = React.forwardRef<HTMLButtonElement, ItemProps>(
  function RadioGroupItem({ value, children, ...props }, ref) {
    const context = React.useContext(RadioGroupContext);
    const checked = context?.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        onClick={() => context?.onValueChange(value)}
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

export const RadioGroup = Root;
export const RadioGroupItem = Item;
export const RadioGroupIndicator = Indicator;
