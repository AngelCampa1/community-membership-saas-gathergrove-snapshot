/**
 * Mock implementation for @/components/ui/popover
 */
import React from 'react';

export const Popover: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div data-testid="popover">{children}</div>;
};

export const PopoverTrigger: React.FC<{ 
  asChild?: boolean; 
  children?: React.ReactNode;
}> = ({ asChild, children }) => {
  if (asChild) {
    return <>{children}</>;
  }
  return <div data-testid="popover-trigger">{children}</div>;
};

export const PopoverContent: React.FC<{ 
  className?: string; 
  children?: React.ReactNode;
  align?: string;
  side?: string;
}> = ({ className, children }) => {
  return <div data-testid="popover-content" className={className}>{children}</div>;
};