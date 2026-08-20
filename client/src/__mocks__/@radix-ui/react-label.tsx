/**
 * Mock for @radix-ui/react-label - External library boundary mock
 * Radix primitives don't work correctly in JSDOM due to ESM issues.
 */
import * as React from 'react';

export const Root = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  function LabelRoot({ children, ...props }, ref) {
    return <label ref={ref} {...props}>{children}</label>;
  }
);

export const Label = Root;
