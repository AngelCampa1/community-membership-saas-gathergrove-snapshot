/**
 * Mock for @radix-ui/react-slider - External library boundary mock
 */
import * as React from 'react';

interface RootProps extends React.HTMLAttributes<HTMLSpanElement> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  inverted?: boolean;
}

export const Root = React.forwardRef<HTMLSpanElement, RootProps>(
  function SliderRoot({ value, defaultValue = [0], onValueChange, min = 0, max = 100, children, ...props }, ref) {
    return (
      <span
        ref={ref}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value?.[0] ?? defaultValue[0]}
        {...props}
      >
        {children}
      </span>
    );
  }
);

export const Track = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function SliderTrack({ children, ...props }, ref) {
    return <span ref={ref} {...props}>{children}</span>;
  }
);

export const Range = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function SliderRange(props, ref) {
    return <span ref={ref} {...props} />;
  }
);

export const Thumb = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function SliderThumb(props, ref) {
    return <span ref={ref} {...props} />;
  }
);

export const Slider = Root;
export const SliderTrack = Track;
export const SliderRange = Range;
export const SliderThumb = Thumb;
