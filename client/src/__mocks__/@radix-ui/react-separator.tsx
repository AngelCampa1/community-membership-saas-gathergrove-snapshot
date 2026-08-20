/**
 * Mock for @radix-ui/react-separator - External library boundary mock
 */
import * as React from 'react';

export const Root = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { orientation?: string; decorative?: boolean }>(
  function SeparatorRoot({ orientation = 'horizontal', decorative = true, ...props }, ref) {
    return (
      <div
        ref={ref}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={orientation as 'horizontal' | 'vertical'}
        data-orientation={orientation}
        {...props}
      />
    );
  }
);

export const Separator = Root;
