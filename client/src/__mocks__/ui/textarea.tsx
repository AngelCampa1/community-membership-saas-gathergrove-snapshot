import React from 'react';

// Mock Textarea component for testing
export const Textarea = React.forwardRef<HTMLTextAreaElement, any>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={className}
        data-testid="textarea"
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
