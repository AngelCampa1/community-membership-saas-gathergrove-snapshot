/**
 * Mock implementation for @radix-ui/react-focus-scope
 */
import React from 'react';

export interface FocusScopeProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  loop?: boolean;
  trapped?: boolean;
  onMountAutoFocus?: (event: Event) => void;
  onUnmountAutoFocus?: (event: Event) => void;
}

export const FocusScope = React.forwardRef<HTMLDivElement, FocusScopeProps>(
  ({ children, loop, trapped, onMountAutoFocus, onUnmountAutoFocus, ...props }, ref) => {
    return (
      <div ref={ref} data-testid="focus-scope" {...props}>
        {children}
      </div>
    );
  }
);

FocusScope.displayName = 'FocusScope';

export const Root = FocusScope;