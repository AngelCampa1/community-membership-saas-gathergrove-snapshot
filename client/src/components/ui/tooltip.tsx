/**
 * Tooltip component for GatherGrove UI
 * Provides accessible tooltips with mock implementation for testing
 */

import React from 'react';
import { cn } from '../../lib/utils';

// Mock tooltip implementation for testing - replace with Radix UI when available
const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & {
    asChild?: boolean;
  }
>(({ children, asChild, ...props }, ref) => {
  // When asChild is true, just return the children
  if (asChild) {
    return React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, { ref, ...props })
      : children;
  }
  
  return (
    <button ref={ref as React.RefObject<HTMLButtonElement>} {...props}>
      {children}
    </button>
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    sideOffset?: number;
  }
>(({ className, children, sideOffset: _sideOffset = 4, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };