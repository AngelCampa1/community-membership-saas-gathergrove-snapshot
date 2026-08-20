import React from 'react';

// Mock Spinner component
export const Spinner = ({ className, ...props }: any) => (
  <div 
    className={`spinner ${className || ''}`} 
    data-testid="spinner"
    {...props}
  />
);

export default Spinner;