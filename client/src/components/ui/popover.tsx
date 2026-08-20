import React, { useState, useEffect, useRef } from 'react';

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  role?: string;
  'aria-label'?: string;
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function Popover({ children, open, onOpenChange }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(open || false);
  
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);
  
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };
  
  return (
    <div className="relative inline-block">
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
          isOpen,
          onOpenChange: handleOpenChange,
        })
      )}
    </div>
  );
}

export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  
  if (asChild && React.isValidElement(children)) {
    const childEl = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
    return React.cloneElement(childEl, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        if (childEl.props.onClick) {
          childEl.props.onClick(e);
        }
        // Trigger popover open logic would go here
      },
    } as Partial<{ onClick?: (e: React.MouseEvent) => void }> & { ref?: React.Ref<HTMLDivElement> });
  }
  
  return (
    <div ref={triggerRef} className="cursor-pointer">
      {children}
    </div>
  );
}

export function PopoverContent({ 
  children, 
  className = '', 
  align = 'center',
  ...props 
}: PopoverContentProps) {
  return (
    <div 
      className={`
        absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border
        bg-popover p-1 text-popover-foreground shadow-md
        ${align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}