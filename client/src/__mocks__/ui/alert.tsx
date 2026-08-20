import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ children, className, ...props }) => (
  <div data-testid="alert" className={className} {...props}>
    {children}
  </div>
);

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className, ...props }) => (
  <div data-testid="alert-description" className={className} {...props}>
    {children}
  </div>
);

export const AlertTitle: React.FC<AlertDescriptionProps> = ({ children, className, ...props }) => (
  <div data-testid="alert-title" className={className} {...props}>
    {children}
  </div>
);