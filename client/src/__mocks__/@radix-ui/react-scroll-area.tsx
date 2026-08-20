/**
 * Mock for @radix-ui/react-scroll-area - External library boundary mock
 */
import * as React from 'react';

export const Root = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function ScrollAreaRoot({ children, ...props }, ref) {
    return <div ref={ref} {...props}>{children}</div>;
  }
);

export const Viewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function ScrollAreaViewport({ children, ...props }, ref) {
    return <div ref={ref} {...props}>{children}</div>;
  }
);

export const Scrollbar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }>(
  function ScrollAreaScrollbar({ children, orientation = 'vertical', ...props }, ref) {
    return <div ref={ref} data-orientation={orientation} {...props}>{children}</div>;
  }
);

export const Thumb = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function ScrollAreaThumb(props, ref) {
    return <div ref={ref} {...props} />;
  }
);

export const Corner = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function ScrollAreaCorner(props, ref) {
    return <div ref={ref} {...props} />;
  }
);

export const ScrollArea = Root;
export const ScrollAreaViewport = Viewport;
export const ScrollAreaScrollbar = Scrollbar;
export const ScrollAreaThumb = Thumb;
export const ScrollAreaCorner = Corner;
