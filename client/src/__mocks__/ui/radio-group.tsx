/**
 * Mock implementation for @/components/ui/radio-group
 * Handles RadixUI RadioGroup props properly
 */
import React from 'react';

export const RadioGroup: React.FC<{ 
  value?: string; 
  onValueChange?: (value: string) => void; 
  children?: React.ReactNode;
  className?: string;
  defaultValue?: string;
}> = ({ value, onValueChange, children, className, defaultValue }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || value || '');
  
  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div 
      data-testid="radio-group" 
      className={className}
      data-value={value || internalValue}
      role="radiogroup"
    >
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child, { 
              onValueChange: handleChange, 
              groupValue: value || internalValue 
            } as any)
          : child
      )}
    </div>
  );
};

export const RadioGroupItem: React.FC<{ 
  value: string; 
  id?: string;
  className?: string;
  groupValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}> = ({ value, id, className, groupValue, onValueChange, children }) => {
  const itemId = id || `radio-item-${value}`;
  const isChecked = groupValue === value;
  
  return (
    <div className={`radio-group-item ${className || ''}`} data-testid="radio-group-item">
      <input
        type="radio"
        id={itemId}
        name="radio-group"
        value={value}
        checked={isChecked}
        onChange={() => onValueChange?.(value)}
        data-value={value}
        aria-labelledby={`${itemId}-label`}
      />
      <label 
        id={`${itemId}-label`}
        htmlFor={itemId} 
        className="radio-label"
      >
        {children || value}
      </label>
    </div>
  );
};