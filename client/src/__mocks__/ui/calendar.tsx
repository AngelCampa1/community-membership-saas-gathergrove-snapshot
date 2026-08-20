/**
 * Mock implementation for @/components/ui/calendar
 */
import React from 'react';

export interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[] | { from?: Date; to?: Date };
  onSelect?: (date: Date | Date[] | { from?: Date; to?: Date } | undefined) => void;
  className?: string;
  initialFocus?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  mode = 'single', 
  selected, 
  onSelect, 
  className
}) => {
  const handleDateClick = (date: Date) => {
    if (onSelect) {
      if (mode === 'single') {
        onSelect(date);
      } else if (mode === 'range') {
        if (!selected || typeof selected !== 'object' || Array.isArray(selected)) {
          onSelect({ from: date, to: undefined });
        } else {
          const range = selected as { from?: Date; to?: Date };
          if (!range.from || (range.from && range.to)) {
            onSelect({ from: date, to: undefined });
          } else {
            onSelect({ from: range.from, to: date });
          }
        }
      }
    }
  };

  return (
    <div data-testid="calendar" className={className}>
      <div>Mock Calendar</div>
      <button
        type="button"
        onClick={() => handleDateClick(new Date('2024-01-01'))}
        data-testid="calendar-day-1"
      >
        1
      </button>
      <button
        type="button"
        onClick={() => handleDateClick(new Date('2024-01-15'))}
        data-testid="calendar-day-15"
      >
        15
      </button>
    </div>
  );
};