/**
 * Mock implementation for @radix-ui/react-slot
 * Provides test-friendly slot functionality
 */
import React from 'react';

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export interface SlotCloneProps {
  children: React.ReactNode;
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, { ref, ...props } as React.Attributes & Record<string, unknown>);
    }
    return <span ref={ref as React.Ref<HTMLSpanElement>} {...props}>{children}</span>;
  }
);

export const SlotClone: React.FC<SlotCloneProps> = ({ children }) => {
  return <>{children}</>;
};

export const createSlot = (name: string) => {
  const SlotComponent = React.forwardRef<HTMLElement, SlotProps>(
    ({ children, ...props }, ref) => {
      if (React.isValidElement(children)) {
        return React.cloneElement(children, { ref, ...props } as React.Attributes & Record<string, unknown>);
      }
      return <span ref={ref as React.Ref<HTMLSpanElement>} data-testid={`slot-${name}`} {...props}>{children}</span>;
    }
  );

  SlotComponent.displayName = `Slot(${name})`;
  return SlotComponent;
};

export const createSlottable = () => {
  const SlottableComponent: React.FC<SlotCloneProps> = ({ children }) => {
    return <>{children}</>;
  };
  
  SlottableComponent.displayName = 'Slottable';
  return SlottableComponent;
};

export const Slottable = createSlottable();

Slot.displayName = 'Slot';
SlotClone.displayName = 'SlotClone';