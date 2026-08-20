/**
 * Mock for @radix-ui/react-alert-dialog - External library boundary mock
 */
import * as React from 'react';

// Create context to share open state with children
const AlertDialogContext = React.createContext<{ open: boolean; onOpenChange?: (open: boolean) => void }>({ open: false });

export const Root: React.FC<{ open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }> = ({
  open: controlledOpen,
  onOpenChange,
  children
}) => {
  // Use internal state if not controlled
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div data-state={open ? 'open' : 'closed'}>{children}</div>
    </AlertDialogContext.Provider>
  );
};

export const Trigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  function AlertDialogTrigger({ children, onClick, asChild, ...props }, ref) {
    const { onOpenChange } = React.useContext(AlertDialogContext);

    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<any>;
      const originalOnClick = childElement.props?.onClick;

      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        originalOnClick?.(e);
        onClick?.(e);
        onOpenChange?.(true);
      };

      return React.cloneElement(childElement, { onClick: handleClick, ref });
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onOpenChange?.(true);
    };

    return <button ref={ref} onClick={handleClick} {...props}>{children}</button>;
  }
);

export const Portal: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { open } = React.useContext(AlertDialogContext);
  if (!open) return null;
  return <>{children}</>;
};

export const Overlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function AlertDialogOverlay(props, ref) {
    return <div ref={ref} data-testid="alert-dialog-overlay" {...props} />;
  }
);

export const Content = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function AlertDialogContent({ children, ...props }, ref) {
    return <div ref={ref} role="alertdialog" aria-modal="true" {...props}>{children}</div>;
  }
);

export const Title = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function AlertDialogTitle({ children, ...props }, ref) {
    return <h2 ref={ref} {...props}>{children}</h2>;
  }
);

export const Description = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function AlertDialogDescription({ children, ...props }, ref) {
    return <p ref={ref} {...props}>{children}</p>;
  }
);

export const Cancel = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  function AlertDialogCancel({ children, onClick, asChild, ...props }, ref) {
    const { onOpenChange } = React.useContext(AlertDialogContext);

    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<any>;
      const originalOnClick = childElement.props?.onClick;

      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        originalOnClick?.(e);
        onClick?.(e);
        onOpenChange?.(false);
      };

      return React.cloneElement(childElement, { onClick: handleClick, ref });
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onOpenChange?.(false);
    };

    return <button ref={ref} onClick={handleClick} {...props}>{children}</button>;
  }
);

export const Action = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  function AlertDialogAction({ children, onClick, asChild, ...props }, ref) {
    // Action does NOT auto-close - the component is responsible for closing via state management
    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<any>;
      const originalOnClick = childElement.props?.onClick;

      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        originalOnClick?.(e);
        onClick?.(e);
      };

      return React.cloneElement(childElement, { onClick: handleClick, ref });
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
    };

    return <button ref={ref} {...props} onClick={handleClick} data-testid="alert-dialog-action">{children}</button>;
  }
);

// Namespace exports for compatibility
export const AlertDialog = Root;
export const AlertDialogTrigger = Trigger;
export const AlertDialogPortal = Portal;
export const AlertDialogOverlay = Overlay;
export const AlertDialogContent = Content;
export const AlertDialogTitle = Title;
export const AlertDialogDescription = Description;
export const AlertDialogCancel = Cancel;
export const AlertDialogAction = Action;
