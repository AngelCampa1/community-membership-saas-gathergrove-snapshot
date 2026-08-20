import React from 'react';
import { Button } from './button';

interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[];
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  modifiersClassNames?: Record<string, string>;
}

export function Calendar({
  mode: _mode = 'single',
  selected,
  onSelect,
  disabled,
  className = '',
  ...props
}: CalendarProps) {
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 6=Sat

  return (
    <div className={`p-4 border rounded-md ${className}`} {...props}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="p-2 text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {Array.from({ length: 42 }, (_, i) => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - startDayOfWeek + 1);
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isSelected = selected instanceof Date && 
            date.toDateString() === selected.toDateString();
          const isDisabled = disabled && disabled(date);
          
          return (
            <Button
              key={i}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              className={`
                h-9 w-9 p-0 font-normal
                ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
                ${isSelected ? 'bg-primary text-primary-foreground' : ''}
              `}
              disabled={isDisabled}
              onClick={() => onSelect && onSelect(date)}
            >
              {date.getDate()}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
