/**
 * Mock for @radix-ui/react-avatar - External library boundary mock
 */
import * as React from 'react';

export const Root = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function AvatarRoot({ children, ...props }, ref) {
    return <span ref={ref} {...props}>{children}</span>;
  }
);

export const Image = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  function AvatarImage({ src, alt, ...props }, ref) {
    return <img ref={ref} src={src} alt={alt} {...props} />;
  }
);

export const Fallback = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function AvatarFallback({ children, ...props }, ref) {
    return <span ref={ref} {...props}>{children}</span>;
  }
);

export const Avatar = Root;
export const AvatarImage = Image;
export const AvatarFallback = Fallback;
