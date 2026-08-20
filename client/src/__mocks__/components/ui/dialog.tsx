import React from 'react';

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Dialog = ({ children, open, onOpenChange: _onOpenChange, ...props }: DialogProps) => {
  if (!open) return null;
  return <div data-testid="dialog" {...props}>{children}</div>;
};

export const DialogContent = ({ children, ...props }: DialogComponentProps) => (
  <div data-testid="dialog-content" {...props}>{children}</div>
);

export const DialogHeader = ({ children, ...props }: DialogComponentProps) => (
  <div data-testid="dialog-header" {...props}>{children}</div>
);

export const DialogTitle = ({ children, ...props }: DialogComponentProps) => (
  <h2 data-testid="dialog-title" {...props}>{children}</h2>
);

export const DialogDescription = ({ children, ...props }: DialogComponentProps) => (
  <p data-testid="dialog-description" {...props}>{children}</p>
);

export const DialogFooter = ({ children, ...props }: DialogComponentProps) => (
  <div data-testid="dialog-footer" {...props}>{children}</div>
);