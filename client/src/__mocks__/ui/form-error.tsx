import React from 'react';

// Mock FormError component for testing
export const FormError = ({ message, ...props }: any) => {
  if (!message) return null;

  return (
    <div data-testid="form-error" className="text-destructive text-sm" {...props}>
      {message}
    </div>
  );
};

export default FormError;
