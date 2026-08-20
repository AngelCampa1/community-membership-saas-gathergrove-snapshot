'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Calendar, ChevronDown, Clock, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { format, subDays, subMonths, isAfter, isValid } from 'date-fns';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { AnalyticsDateRange } from '../../types/analytics';

interface DateRangePreset {
  label: string;
  getValue: () => AnalyticsDateRange;
  isAvailable: (tier: string) => boolean;
}

interface CustomDateRangePickerProps {
  value: AnalyticsDateRange;
  onChange: (range: AnalyticsDateRange) => void;
  tier: 'basic' | 'pro' | 'unlimited';
  showQuickActions?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
}

const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  value,
  onChange,
  tier,
  showQuickActions = false,
  loading = false,
  error,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customRange, setCustomRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Date range presets
  const presets: DateRangePreset[] = [
    {
      label: 'Last 7 days',
      getValue: () => ({
        startDate: subDays(new Date(), 7),
        endDate: new Date(),
        label: 'Last 7 days',
      }),
      isAvailable: () => true,
    },
    {
      label: 'Last 30 days',
      getValue: () => ({
        startDate: subDays(new Date(), 30),
        endDate: new Date(),
        label: 'Last 30 days',
      }),
      isAvailable: () => true,
    },
    {
      label: 'Last 90 days',
      getValue: () => ({
        startDate: subDays(new Date(), 90),
        endDate: new Date(),
        label: 'Last 90 days',
      }),
      isAvailable: (tier) => tier === 'pro' || tier === 'unlimited',
    },
    {
      label: 'Last 6 months',
      getValue: () => ({
        startDate: subMonths(new Date(), 6),
        endDate: new Date(),
        label: 'Last 6 months',
      }),
      isAvailable: (tier) => tier === 'unlimited',
    },
    {
      label: 'Last year',
      getValue: () => ({
        startDate: subMonths(new Date(), 12),
        endDate: new Date(),
        label: 'Last year',
      }),
      isAvailable: (tier) => tier === 'unlimited',
    },
    {
      label: 'All time',
      getValue: () => ({
        startDate: new Date('2020-01-01'),
        endDate: new Date(),
        label: 'All time',
      }),
      isAvailable: (tier) => tier === 'unlimited',
    },
  ];

  // Get available presets based on tier
  const availablePresets = presets.filter(preset => preset.isAvailable(tier));
  const unavailablePresets = presets.filter(preset => !preset.isAvailable(tier));

  // Format display value
  const displayValue = value.label || 
    `${format(value.startDate, 'MMM dd, yyyy')} - ${format(value.endDate, 'MMM dd, yyyy')}`;

  // Handle preset selection
  const handlePresetSelect = (preset: DateRangePreset) => {
    const newRange = preset.getValue();
    onChange(newRange);
    setSelectedPreset(preset.label);
    setIsCustomMode(false);
    setIsOpen(false);
  };

  // Handle custom range application
  const handleCustomRangeApply = () => {
    if (!customRange.startDate || !customRange.endDate) {
      setValidationError('Please select both start and end dates');
      return;
    }

    if (isAfter(customRange.startDate, customRange.endDate)) {
      setValidationError('End date must be after start date');
      return;
    }

    const newRange: AnalyticsDateRange = {
      startDate: customRange.startDate,
      endDate: customRange.endDate,
      label: 'Custom range',
    };

    onChange(newRange);
    setSelectedPreset(null);
    setValidationError('');
    setIsOpen(false);
  };

  // Quick actions
  const handlePreviousPeriod = () => {
    const diffInDays = Math.ceil((value.endDate.getTime() - value.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const newStartDate = subDays(value.startDate, diffInDays);
    const newEndDate = subDays(value.endDate, diffInDays);
    
    onChange({
      startDate: newStartDate,
      endDate: newEndDate,
      label: value.label,
    });
  };

  const handleNextPeriod = () => {
    const diffInDays = Math.ceil((value.endDate.getTime() - value.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const newStartDate = new Date(value.startDate.getTime() + diffInDays * 24 * 60 * 60 * 1000);
    const newEndDate = new Date(value.endDate.getTime() + diffInDays * 24 * 60 * 60 * 1000);
    
    // Don't allow future dates beyond today
    if (isAfter(newEndDate, new Date())) return;
    
    onChange({
      startDate: newStartDate,
      endDate: newEndDate,
      label: value.label,
    });
  };

  const handleReset = () => {
    const defaultRange = presets[1].getValue(); // Last 30 days
    onChange(defaultRange);
    setSelectedPreset('Last 30 days');
    setIsCustomMode(false);
  };

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Mobile responsiveness with safer window.matchMedia check
  const _isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    } catch {
      return false;
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2" data-testid="date-picker-loading">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} data-testid="date-range-picker">
      <div className="flex items-center gap-1">
        {showQuickActions && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPeriod}
              title="Previous period"
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPeriod}
              disabled={isAfter(
                new Date(value.endDate.getTime() + (value.endDate.getTime() - value.startDate.getTime())),
                new Date()
              )}
              title="Next period"
              className="p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              title="Reset to default"
              className="p-2"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        )}

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="outline"
              className={cn(
                'justify-start text-left font-normal mobile-responsive',
                !value && 'text-muted-foreground'
              )}
              onClick={() => setIsOpen(!isOpen)}
              onKeyDown={handleKeyDown}
              aria-label="Select date range"
              aria-haspopup="true"
              aria-expanded={isOpen}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {displayValue}
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent 
            className={cn(
              'w-auto p-0', 
              _isMobile && 'w-screen'
            )} 
            align="start"
          >
            <div className="p-4 space-y-4">
              {/* Quick Presets */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Quick Select</h4>
                <div className="grid grid-cols-2 gap-2">
                  {availablePresets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant={selectedPreset === preset.label ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePresetSelect(preset)}
                      className="justify-start"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                {/* Unavailable presets with upgrade prompt */}
                {unavailablePresets.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Premium ranges</span>
                      <Badge variant="secondary" className="text-xs">
                        Upgrade to Expand
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {unavailablePresets.map((preset) => (
                        <Button
                          key={preset.label}
                          variant="outline"
                          size="sm"
                          disabled
                          className="justify-start opacity-50"
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Range */}
              <div className="space-y-2 border-t pt-4">
                <Button
                  variant={isCustomMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setIsCustomMode(true);
                    setCustomRange({
                      startDate: value.startDate,
                      endDate: value.endDate,
                    });
                  }}
                  className="w-full justify-start"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Custom range
                </Button>

                {isCustomMode && (
                  <div className="space-y-4 p-4 border rounded-lg" data-testid="calendar-widget">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={customRange.startDate ? format(customRange.startDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            if (isValid(date)) {
                              setCustomRange(prev => ({ ...prev, startDate: date }));
                              setValidationError('');
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={customRange.endDate ? format(customRange.endDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            if (isValid(date)) {
                              setCustomRange(prev => ({ ...prev, endDate: date }));
                              setValidationError('');
                            }
                          }}
                        />
                      </div>
                    </div>

                    {validationError && (
                      <div className="text-sm text-destructive" role="alert">
                        {validationError}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCustomMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCustomRangeApply}
                        disabled={!customRange.startDate || !customRange.endDate || !!validationError}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected range announcement for screen readers */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-label="Selected date range"
      >
        Selected range: {displayValue}
      </div>
    </div>
  );
};

export default CustomDateRangePicker;
