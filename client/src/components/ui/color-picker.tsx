import React, { useState, useRef as _useRef, useEffect as _useEffect } from 'react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#374151'
];

export interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  colors?: string[];
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function ColorPicker({
  value = '#3b82f6',
  onChange,
  colors = DEFAULT_COLORS,
  className,
  disabled = false,
  'aria-label': ariaLabel = 'Select color'
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-12 h-12 p-1 border-2",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          <div
            className="w-full h-full rounded-sm border border-border"
            style={{ backgroundColor: value }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-4">
          <div className="text-sm font-medium text-foreground">
            Choose a color
          </div>
          
          {/* Preset Colors */}
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-8 h-8 rounded-sm border-2 transition-all hover:scale-110",
                  value === color
                    ? "border-foreground ring-2 ring-muted-foreground"
                    : "border-border"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>

          {/* Custom Color Input */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Custom Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-12 h-8 rounded border-0 cursor-pointer"
                aria-label="Custom color picker"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onBlur={() => onChange(customColor)}
                className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}