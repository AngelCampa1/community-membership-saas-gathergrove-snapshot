"use client";

import React from 'react';
import { DateRangePicker as SharedDateRangePicker } from '../shared/DateRangePicker';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DatePickerWithRangeProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePickerWithRange({ 
  value, 
  onChange, 
  className,
  placeholder,
  disabled 
}: DatePickerWithRangeProps) {
  const handleRangeChange = (range: { start: Date; end: Date }) => {
    onChange?.({ from: range.start, to: range.end });
  };

  return (
    <SharedDateRangePicker
      startDate={value?.from}
      endDate={value?.to}
      onRangeChange={handleRangeChange}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}