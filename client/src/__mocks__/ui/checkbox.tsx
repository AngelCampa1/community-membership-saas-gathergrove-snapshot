/**
 * Mock implementation for @/components/ui/checkbox
 * Simple functional component without forwardRef
 */
import React from 'react';

export interface CheckboxProps {
  className?: string;
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  value?: string;
  asChild?: boolean;
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  children?: React.ReactNode;
}

function Checkbox(props: CheckboxProps) {
  const { 
    className, 
    checked, 
    defaultChecked, 
    disabled, 
    required, 
    name, 
    id, 
    value, 
    asChild,
    onCheckedChange,
    children,
    ...rest 
  } = props;

  if (asChild && children) {
    return <>{children}</>;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(event.target.checked);
    }
  };

  return (
    <input
      type="checkbox"
      className={`checkbox ${className || ''}`}
      checked={checked === 'indeterminate' ? false : checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      required={required}
      name={name}
      id={id}
      value={value}
      onChange={handleChange}
      data-testid="checkbox"
      data-state={checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
      {...rest}
    />
  );
}

Checkbox.displayName = 'Checkbox';

export { Checkbox };
export default Checkbox;