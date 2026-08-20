/**
 * Mock implementation for @/components/ui/alert-dialog
 * Provides test-friendly alert dialog components
 */
import React from 'react';

export interface AlertDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface AlertDialogTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface AlertDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}

export interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface AlertDialogActionProps extends React.HTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export interface AlertDialogCancelProps extends React.HTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export const AlertDialog = React.forwardRef<HTMLDivElement, AlertDialogProps>(
  ({ children, open = false, onOpenChange, ...props }, ref) => {
    return (
      <div ref={ref} data-testid="alert-dialog" data-state={open ? 'open' : 'closed'} {...props}>
        {open && children}
      </div>
    );
  }
);

export const AlertDialogTrigger = React.forwardRef<HTMLButtonElement, AlertDialogTriggerProps>(
  ({ children, asChild = false, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ref, ...props } as React.Attributes & Record<string, unknown>);
    }
    return (
      <button ref={ref} data-testid="alert-dialog-trigger" {...props}>
        {children}
      </button>
    );
  }
);

export const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} data-testid="alert-dialog-content" className={className} {...props}>
        {children}
      </div>
    );
  }
);

export const AlertDialogHeader = React.forwardRef<HTMLDivElement, AlertDialogHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} data-testid="alert-dialog-header" className={className} {...props}>
        {children}
      </div>
    );
  }
);

export const AlertDialogTitle = React.forwardRef<HTMLHeadingElement, AlertDialogTitleProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <h2 ref={ref} data-testid="alert-dialog-title" className={className} {...props}>
        {children}
      </h2>
    );
  }
);

export const AlertDialogDescription = React.forwardRef<HTMLParagraphElement, AlertDialogDescriptionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <p ref={ref} data-testid="alert-dialog-description" className={className} {...props}>
        {children}
      </p>
    );
  }
);

export const AlertDialogFooter = React.forwardRef<HTMLDivElement, AlertDialogFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} data-testid="alert-dialog-footer" className={className} {...props}>
        {children}
      </div>
    );
  }
);

export const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button ref={ref} data-testid="alert-dialog-action" className={className} {...props}>
        {children}
      </button>
    );
  }
);

export const AlertDialogCancel = React.forwardRef<HTMLButtonElement, AlertDialogCancelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button ref={ref} data-testid="alert-dialog-cancel" className={className} {...props}>
        {children}
      </button>
    );
  }
);

AlertDialog.displayName = 'AlertDialog';
AlertDialogTrigger.displayName = 'AlertDialogTrigger';
AlertDialogContent.displayName = 'AlertDialogContent';
AlertDialogHeader.displayName = 'AlertDialogHeader';
AlertDialogTitle.displayName = 'AlertDialogTitle';
AlertDialogDescription.displayName = 'AlertDialogDescription';
AlertDialogFooter.displayName = 'AlertDialogFooter';
AlertDialogAction.displayName = 'AlertDialogAction';
AlertDialogCancel.displayName = 'AlertDialogCancel';