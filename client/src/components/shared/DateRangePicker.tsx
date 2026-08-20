"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format, subDays, subWeeks as _subWeeks, subMonths as _subMonths, startOfWeek, startOfMonth, startOfYear, endOfMonth, endOfWeek, endOfYear } from 'date-fns';
import { cn } from '../../lib/utils';

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onRangeChange: (range: { start: Date; end: Date }) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

interface PresetRange {
  label: string;
  range: { start: Date; end: Date };
}

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  className,
  disabled = false,
  placeholder = "Select date range"
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localStartDate, setLocalStartDate] = useState<Date | undefined>(startDate);
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(endDate);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Preset date ranges
  const presets: PresetRange[] = [
    {
      label: "Today",
      range: {
        start: new Date(),
        end: new Date()
      }
    },
    {
      label: "Yesterday",
      range: {
        start: subDays(new Date(), 1),
        end: subDays(new Date(), 1)
      }
    },
    {
      label: "Last 7 days",
      range: {
        start: subDays(new Date(), 6),
        end: new Date()
      }
    },
    {
      label: "Last 14 days",
      range: {
        start: subDays(new Date(), 13),
        end: new Date()
      }
    },
    {
      label: "Last 30 days",
      range: {
        start: subDays(new Date(), 29),
        end: new Date()
      }
    },
    {
      label: "Last 90 days",
      range: {
        start: subDays(new Date(), 89),
        end: new Date()
      }
    },
    {
      label: "This week",
      range: {
        start: startOfWeek(new Date()),
        end: endOfWeek(new Date())
      }
    },
    {
      label: "This month",
      range: {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
      }
    },
    {
      label: "This year",
      range: {
        start: startOfYear(new Date()),
        end: endOfYear(new Date())
      }
    }
  ];

  // Update local state when props change
  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [startDate, endDate]);

  // Format display text
  const formatRange = () => {
    if (!localStartDate && !localEndDate) {
      return placeholder;
    }
    
    if (localStartDate && localEndDate) {
      if (format(localStartDate, 'yyyy-MM-dd') === format(localEndDate, 'yyyy-MM-dd')) {
        return format(localStartDate, 'MMM d, yyyy');
      }
      return `${format(localStartDate, 'MMM d, yyyy')} - ${format(localEndDate, 'MMM d, yyyy')}`;
    }
    
    if (localStartDate) {
      return `From ${format(localStartDate, 'MMM d, yyyy')}`;
    }
    
    if (localEndDate) {
      return `Until ${format(localEndDate, 'MMM d, yyyy')}`;
    }
    
    return placeholder;
  };

  // Handle preset selection
  const handlePresetSelect = (preset: PresetRange) => {
    setLocalStartDate(preset.range.start);
    setLocalEndDate(preset.range.end);
    onRangeChange(preset.range);
    setIsOpen(false);
  };

  // Handle calendar date selection
  const handleDateSelect = (date: Date | undefined, type: 'start' | 'end') => {
    if (!date) return;

    if (type === 'start') {
      setLocalStartDate(date);
      // If end date is before start date, clear it
      if (localEndDate && date > localEndDate) {
        setLocalEndDate(undefined);
      }
      // If we have both dates, trigger callback
      if (localEndDate && date <= localEndDate) {
        onRangeChange({ start: date, end: localEndDate });
      }
    } else {
      setLocalEndDate(date);
      // If start date is after end date, clear it
      if (localStartDate && localStartDate > date) {
        setLocalStartDate(undefined);
      }
      // If we have both dates, trigger callback
      if (localStartDate && localStartDate <= date) {
        onRangeChange({ start: localStartDate, end: date });
      }
    }
  };

  // Handle apply button (when both dates are selected)
  const handleApply = () => {
    if (localStartDate && localEndDate) {
      onRangeChange({ start: localStartDate, end: localEndDate });
      setIsOpen(false);
    }
  };

  // Clear selection
  const handleClear = () => {
    setLocalStartDate(undefined);
    setLocalEndDate(undefined);
  };

  const hasValidRange = localStartDate && localEndDate;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !hasValidRange && "text-muted-foreground",
            className
          )}
          aria-label="Select date range"
          role="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatRange()}
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
        role="dialog"
        aria-label="Date range picker"
      >
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r border-border p-3 w-40">
            <div className="text-sm font-medium mb-2">Quick select</div>
            <div className="space-y-1">
              {presets.map((preset, index) => (
                <Button
                  key={preset.label || `preset-${index}`}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs font-normal"
                  onClick={() => handlePresetSelect(preset)}
                  role="menuitem"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Calendar section */}
          <div className="p-3">
            <div className="space-y-3">
              {/* Calendar headers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-sm font-medium">Start Date</div>
                  <Calendar
                    mode="single"
                    selected={localStartDate}
                    onSelect={(date) => handleDateSelect(date, 'start')}
                    className="w-auto"
                    modifiersClassNames={{
                      selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                    }}
                  />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">End Date</div>
                  <Calendar
                    mode="single"
                    selected={localEndDate}
                    onSelect={(date) => handleDateSelect(date, 'end')}
                    disabled={(date) => localStartDate ? date < localStartDate : false}
                    className="w-auto"
                    modifiersClassNames={{
                      selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                    }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between border-t pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={!localStartDate && !localEndDate}
                >
                  Clear
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApply}
                    disabled={!hasValidRange}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}