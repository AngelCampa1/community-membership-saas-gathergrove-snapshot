/**
 * Mock implementation for @radix-ui/react-dismissable-layer
 */
import React from 'react';

export interface DismissableLayerProps extends React.HTMLAttributes<HTMLDivElement> {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: Event) => void;
  onFocusOutside?: (event: Event) => void;
  onInteractOutside?: (event: Event) => void;
  forceMount?: boolean;
  disableOutsidePointerEvents?: boolean;
}

export const DismissableLayer = React.forwardRef<HTMLDivElement, DismissableLayerProps>(
  ({ children, onEscapeKeyDown, onPointerDownOutside, onFocusOutside, onInteractOutside, ...props }, ref) => {
    return (
      <div ref={ref} data-testid="dismissable-layer" {...props}>
        {children}
      </div>
    );
  }
);

DismissableLayer.displayName = 'DismissableLayer';