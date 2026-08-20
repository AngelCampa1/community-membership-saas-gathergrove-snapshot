/**
 * Mock implementation for @radix-ui/react-portal
 */
import React from 'react';

export interface PortalProps {
  children?: React.ReactNode;
  container?: Element | null;
  forceMount?: boolean;
}

export const Portal: React.FC<PortalProps> = ({ children, forceMount }) => {
  if (forceMount === false) return null;
  return <div data-testid="portal">{children}</div>;
};

Portal.displayName = 'Portal';

export const Root = Portal;