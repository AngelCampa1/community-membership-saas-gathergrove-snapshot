/**
 * Mock implementation for next/link
 * Provides test-friendly Link component
 */
import React from 'react';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  locale?: string | false;
  legacyBehavior?: boolean;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, href, prefetch, replace, scroll, shallow, passHref, locale, legacyBehavior, ...props }, ref) => {
    return (
      <a ref={ref} href={href} data-testid="link" {...props}>
        {children}
      </a>
    );
  }
);

Link.displayName = 'Link';

export default Link;
