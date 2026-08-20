/**
 * Mock implementation for @/components/ui/select
 * Handles RadixUI Select props properly without passing them to DOM
 * Matches the exact export structure of the real UI component
 */
import React from 'react';

// Mock implementations that match the real component structure
function Select({ 
  value, 
  onValueChange, 
  children, 
  defaultValue,
  ...props 
}: { 
  value?: string; 
  onValueChange?: (value: string) => void; 
  children?: React.ReactNode;
  defaultValue?: string;
  [key: string]: any;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || value || '');
  
  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div data-testid="select" data-value={value || internalValue} {...props}>
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child, { onValueChange: handleChange, value: value || internalValue } as any)
          : child
      )}
    </div>
  );
}

function SelectGroup({ 
  className, 
  children, 
  ...props 
}: { 
  className?: string; 
  children?: React.ReactNode;
  [key: string]: any;
}) {
  return <div data-testid="select-group" className={className} {...props}>{children}</div>;
}

function SelectValue({ 
  placeholder, 
  value, 
  ...props 
}: { 
  placeholder?: string;
  value?: string;
  [key: string]: any;
}) {
  return <span data-testid="select-value" {...props}>{value || placeholder}</span>;
}

// Use forwardRef to match the real component structure
const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  {
    className?: string;
    children?: React.ReactNode;
    asChild?: boolean;
    size?: "sm" | "default";
    [key: string]: any;
  }
>(({ className, children, size = "default", disabled, ...props }, ref) => {
  // Ignore disabled prop in tests - always render as enabled for test interactions
  return (
    <button
      ref={ref}
      role="combobox"
      data-testid="select-trigger"
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
});

function SelectContent({ 
  className, 
  children, 
  position = "popper",
  side,
  ...props 
}: { 
  className?: string; 
  children?: React.ReactNode;
  position?: string;
  side?: string;
  [key: string]: any;
}) {
  return (
    <div 
      data-testid="select-content" 
      className={className}
      data-position={position}
      data-side={side}
      {...props}
    >
      {children}
    </div>
  );
}

function SelectLabel({ 
  className, 
  children, 
  ...props 
}: { 
  className?: string; 
  children?: React.ReactNode;
  [key: string]: any;
}) {
  return <div data-testid="select-label" className={className} {...props}>{children}</div>;
}

function SelectItem({
  value,
  children,
  className,
  onValueChange,
  ...props
}: {
  value: string;
  children?: React.ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
  [key: string]: any;
}) {
  return (
    <div
      role="option"
      data-testid="select-item"
      data-value={value}
      className={className}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </div>
  );
}

function SelectSeparator({ 
  className, 
  ...props 
}: { 
  className?: string;
  [key: string]: any;
}) {
  return <div data-testid="select-separator" className={className} {...props} />;
}

function SelectScrollUpButton({ 
  className, 
  ...props 
}: { 
  className?: string;
  [key: string]: any;
}) {
  return <div data-testid="select-scroll-up-button" className={className} {...props} />;
}

function SelectScrollDownButton({ 
  className, 
  ...props 
}: { 
  className?: string;
  [key: string]: any;
}) {
  return <div data-testid="select-scroll-down-button" className={className} {...props} />;
}

// Set display names to match real components
SelectTrigger.displayName = 'SelectTrigger';

// Export using the same structure as the real component
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};