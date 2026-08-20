/**
 * Mock implementation for @radix-ui/react-primitive
 * Provides test-friendly primitive components
 */
import React from 'react';

export interface PrimitiveProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export const Primitive = {
  div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => <div ref={ref} {...props} />
  ),
  button: React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => <button ref={ref} {...props} />
  ),
  span: React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
    (props, ref) => <span ref={ref} {...props} />
  ),
  p: React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    (props, ref) => <p ref={ref} {...props} />
  ),
  h1: React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    (props, ref) => <h1 ref={ref} {...props} />
  ),
  h2: React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    (props, ref) => <h2 ref={ref} {...props} />
  ),
  h3: React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    (props, ref) => <h3 ref={ref} {...props} />
  ),
};

// Named exports that some components might use
export const Root = Primitive.div;
export const Trigger = Primitive.button;
export const Content = Primitive.div;