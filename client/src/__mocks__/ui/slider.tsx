import React from 'react';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export const Slider: React.FC<SliderProps> = ({ 
  value, 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1,
  className,
  disabled = false,
  'aria-label': ariaLabel,
  ...props 
}) => (
  <input
    type="range"
    data-testid="slider"
    min={min}
    max={max}
    step={step}
    value={value[0]}
    onChange={(e) => onValueChange([parseFloat(e.target.value)])}
    className={className}
    disabled={disabled}
    aria-label={ariaLabel}
    {...props}
  />
);