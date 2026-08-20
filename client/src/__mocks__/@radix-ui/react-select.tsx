/**
 * Mock for @radix-ui/react-select - External library boundary mock
 */
import * as React from 'react';

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

interface RootProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  children?: React.ReactNode;
}

export const Root: React.FC<RootProps> = ({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  children
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) setInternalValue(newValue);
    onValueChange?.(newValue);
  }, [isControlled, onValueChange]);

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div data-testid="select-root">{children}</div>
    </SelectContext.Provider>
  );
};

export const Trigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function SelectTrigger({ children, ...props }, ref) {
    return <button ref={ref} type="button" role="combobox" {...props}>{children}</button>;
  }
);

export const Value: React.FC<{ children?: React.ReactNode; placeholder?: string }> = ({ children, placeholder }) => (
  <span>{children || placeholder}</span>
);

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
  children?: React.ReactNode;
}

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  function SelectIcon({ children, asChild, ...props }, ref) {
    if (asChild && React.isValidElement(children)) {
      // When asChild, pass props to child but not ref (children may not accept ref)
      return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        ...props,
      });
    }
    return <span ref={ref} {...props}>{children}</span>;
  }
);

export const Portal: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;

export const Content = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function SelectContent({ children, ...props }, ref) {
    return <div ref={ref} role="listbox" {...props}>{children}</div>;
  }
);

export const Viewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function SelectViewport({ children, ...props }, ref) {
    return <div ref={ref} {...props}>{children}</div>;
  }
);

interface ItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

export const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  function SelectItem({ children, value, onClick, ...props }, ref) {
    const context = React.useContext(SelectContext);
    return (
      <div
        ref={ref}
        role="option"
        data-value={value}
        aria-selected={context?.value === value}
        onClick={(e) => {
          context?.onValueChange(value);
          (onClick as React.MouseEventHandler<HTMLDivElement>)?.(e);
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const ItemText: React.FC<{ children?: React.ReactNode }> = ({ children }) => <span>{children}</span>;
export const ItemIndicator: React.FC<{ children?: React.ReactNode }> = ({ children }) => <span>{children}</span>;
export const ScrollUpButton: React.FC = () => null;
export const ScrollDownButton: React.FC = () => null;
export const Group: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div role="group">{children}</div>;
export const Label: React.FC<{ children?: React.ReactNode }> = ({ children }) => <span>{children}</span>;
export const Separator: React.FC = () => <hr />;
export const Arrow: React.FC = () => null;

// Namespace exports
export const Select = Root;
export const SelectTrigger = Trigger;
export const SelectValue = Value;
export const SelectIcon = Icon;
export const SelectPortal = Portal;
export const SelectContent = Content;
export const SelectViewport = Viewport;
export const SelectItem = Item;
export const SelectItemText = ItemText;
export const SelectItemIndicator = ItemIndicator;
export const SelectScrollUpButton = ScrollUpButton;
export const SelectScrollDownButton = ScrollDownButton;
export const SelectGroup = Group;
export const SelectLabel = Label;
export const SelectSeparator = Separator;
export const SelectArrow = Arrow;
