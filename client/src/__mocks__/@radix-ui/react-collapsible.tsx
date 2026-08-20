/**
 * Mock for @radix-ui/react-collapsible - External library boundary mock
 */
import * as React from 'react';

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

interface RootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const Root: React.FC<RootProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!isControlled) setInternalOpen(newOpen);
    onOpenChange?.(newOpen);
  }, [isControlled, onOpenChange]);

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div data-state={open ? 'open' : 'closed'}>{children}</div>
    </CollapsibleContext.Provider>
  );
};

export const Trigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  function CollapsibleTrigger({ children, onClick, ...props }, ref) {
    const context = React.useContext(CollapsibleContext);
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          context?.onOpenChange(!context.open);
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

export const Content = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CollapsibleContent({ children, ...props }, ref) {
    const context = React.useContext(CollapsibleContext);
    if (!context?.open) return null;
    return <div ref={ref} {...props}>{children}</div>;
  }
);

export const Collapsible = Root;
export const CollapsibleTrigger = Trigger;
export const CollapsibleContent = Content;
