import React from 'react';

export const Avatar = ({ 
  children, 
  className, 
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string; 
  [key: string]: any 
}) => (
  <div className={className} data-testid="avatar" {...props}>
    {children}
  </div>
);

export const AvatarImage = ({ 
  src, 
  alt, 
  className, 
  ...props 
}: { 
  src?: string; 
  alt?: string; 
  className?: string; 
  [key: string]: any 
}) => (
  <img 
    src={src} 
    alt={alt || ''} 
    className={className} 
    data-testid="avatar-image" 
    {...props}
  />
);

export const AvatarFallback = ({ 
  children, 
  className, 
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string; 
  [key: string]: any 
}) => (
  <div className={className} data-testid="avatar-fallback" {...props}>
    {children}
  </div>
);