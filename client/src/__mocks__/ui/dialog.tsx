/**
 * Mock implementation for @/components/ui/dialog
 * Handles RadixUI Dialog props properly without passing them to DOM
 * Updated to properly handle open/close state for Next.js tests
 */
import React from 'react';

// Context to share dialog state between Dialog and DialogContent
const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}>({ open: false });

// Mock Dialog components that handle RadixUI props correctly
export const Dialog: React.FC<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}> = ({
  open,
  onOpenChange,
  children,
  defaultOpen = false
}) => {
  console.log('🔴 DIALOG MOCK CALLED', { open, defaultOpen });
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open! : internalOpen;

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [isControlled, onOpenChange]);

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      <div data-testid="dialog" data-open={isOpen}>
        {children}
      </div>
    </DialogContext.Provider>
  );
};

export const DialogTrigger: React.FC<{
  asChild?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}> = ({ asChild, children, onClick }) => {
  const { onOpenChange } = React.useContext(DialogContext);

  const handleClick = (e: React.MouseEvent) => {
    onClick?.();
    onOpenChange?.(true);
  };

  // Handle asChild prop - if true, clone the child element with onClick
  if (asChild && React.isValidElement(children)) {
    const existingOnClick = (children.props as any)?.onClick;
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        existingOnClick?.(e);
        handleClick(e);
      }
    } as any);
  }
  return <button data-testid="dialog-trigger" onClick={handleClick}>{children}</button>;
};

export const DialogContent: React.FC<{
  className?: string;
  children?: React.ReactNode;
  onEscapeKeyDown?: () => void;
  onPointerDownOutside?: () => void;
}> = ({ className, children, onEscapeKeyDown, onPointerDownOutside }) => {
  const { open, onOpenChange } = React.useContext(DialogContext);

  // Only render content when dialog is open
  if (!open) {
    return null;
  }

  const handleEscape = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onEscapeKeyDown?.();
      onOpenChange?.(false);
    }
  };

  return (
    <div
      data-testid="dialog-content"
      className={className}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleEscape}
    >
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className, 
  children 
}) => {
  return <div data-testid="dialog-header" className={className}>{children}</div>;
};

export const DialogTitle: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className, 
  children 
}) => {
  return <h2 data-testid="dialog-title" className={className}>{children}</h2>;
};

export const DialogDescription: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className, 
  children 
}) => {
  return <p data-testid="dialog-description" className={className}>{children}</p>;
};

export const DialogFooter: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className, 
  children 
}) => {
  return <div data-testid="dialog-footer" className={className}>{children}</div>;
};

export const DialogClose: React.FC<{
  asChild?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}> = ({ asChild, children, onClick }) => {
  const { onOpenChange } = React.useContext(DialogContext);

  const handleClick = () => {
    onClick?.();
    onOpenChange?.(false);
  };

  // Handle asChild prop - if true, clone the child element with onClick
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick
    } as any);
  }

  return <button data-testid="dialog-close" onClick={handleClick}>{children}</button>;
};

// Additional Dialog components that might be imported
export const DialogPortal: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const DialogOverlay: React.FC<{ className?: string }> = ({ className }) => {
  return <div data-testid="dialog-overlay" className={className} />;
};