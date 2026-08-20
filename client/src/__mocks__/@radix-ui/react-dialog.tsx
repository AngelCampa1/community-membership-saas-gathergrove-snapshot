/**
 * Mock for @radix-ui/react-dialog
 * This mocks the ACTUAL RadixUI dialog primitives
 */
import React from 'react';

// Create context to share open state with children
const DialogContext = React.createContext<{ open: boolean; onOpenChange?: (open: boolean) => void }>({ open: false });

export const Root: React.FC<{ open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }> = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children
}) => {
  // Support both controlled and uncontrolled modes
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

  // Use controlled open if provided, otherwise use internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [isControlled, onOpenChange]);

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div data-testid="radix-dialog-root" data-open={open}>{children}</div>
    </DialogContext.Provider>
  );
};

export const Trigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'> & { asChild?: boolean }>(
  ({ children, onClick, asChild, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DialogContext);

    // When asChild is true, clone the child element with the click handler
    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<any>;
      const originalOnClick = childElement.props?.onClick;

      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Call the child's original onClick first
        originalOnClick?.(e);
        // Call any onClick passed to Trigger
        onClick?.(e);
        // Then call onOpenChange
        onOpenChange?.(true);
      };

      return React.cloneElement(childElement, {
        onClick: handleClick,
        ref,
      });
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onOpenChange?.(true);
    };

    return (
      <button ref={ref} data-testid="radix-dialog-trigger" onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
Trigger.displayName = 'DialogTrigger';

export const Portal: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { open } = React.useContext(DialogContext);
  // Portal only renders when dialog is open
  if (!open) return null;
  return <div data-testid="radix-dialog-portal">{children}</div>;
};

export const Overlay = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ children, ...props }, ref) => {
    return <div ref={ref} data-testid="radix-dialog-overlay" {...props}>{children}</div>;
  }
);
Overlay.displayName = 'DialogOverlay';

export const Content = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ children, ...props }, ref) => {
    return <div ref={ref} data-testid="radix-dialog-content" role="dialog" {...props}>{children}</div>;
  }
);
Content.displayName = 'DialogContent';

export const Title = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<'h2'>>(
  ({ children, ...props }, ref) => {
    return <h2 ref={ref} data-testid="radix-dialog-title" {...props}>{children}</h2>;
  }
);
Title.displayName = 'DialogTitle';

export const Description = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<'p'>>(
  ({ children, ...props }, ref) => {
    return <p ref={ref} data-testid="radix-dialog-description" {...props}>{children}</p>;
  }
);
Description.displayName = 'DialogDescription';

export const Close = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'> & { asChild?: boolean }>(
  ({ children, onClick, asChild, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DialogContext);

    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<any>;
      const originalOnClick = childElement.props?.onClick;

      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        originalOnClick?.(e);
        onClick?.(e);
        onOpenChange?.(false);
      };

      return React.cloneElement(childElement, {
        onClick: handleClick,
        ref,
      });
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onOpenChange?.(false);
    };

    return <button ref={ref} data-testid="radix-dialog-close" onClick={handleClick} {...props}>{children}</button>;
  }
);
Close.displayName = 'DialogClose';
