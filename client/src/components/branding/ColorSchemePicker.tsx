'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { isValidHexColor, getContrastRatio, generateColorPalette, hexToHsl, hslToHex } from '@/utils/colorUtils';
import { Check, AlertTriangle } from 'lucide-react';
import { GLASSMORPHISM } from '@/utils/chartColors';

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  description: string;
}

export interface ColorSchemePickerProps {
  primaryColor: string;
  secondaryColor: string;
  onColorChange: (colors: { primary: string; secondary: string }) => void;
  onSchemeChange?: (scheme: ColorScheme) => void;
  onError: (error: string) => void;
  presetSchemes?: ColorScheme[];
  selectedSchemeId?: string;
  advancedMode?: boolean;
  showPalette?: boolean;
  showHarmony?: boolean;
  showPreview?: boolean;
  className?: string;
}

const DEFAULT_SCHEMES: ColorScheme[] = [
  {
    id: 'blue',
    name: 'Blue Ocean',
    primary: '#3B82F6',
    secondary: '#1E40AF',
    description: 'Professional blue theme'
  },
  {
    id: 'purple',
    name: 'Purple Galaxy',
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    description: 'Creative purple theme'
  }
];

export function ColorSchemePicker({
  primaryColor,
  secondaryColor,
  onColorChange,
  onSchemeChange,
  onError,
  presetSchemes = DEFAULT_SCHEMES,
  selectedSchemeId,
  advancedMode = false,
  showPalette = false,
  showHarmony = false,
  showPreview = false,
  className
}: ColorSchemePickerProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorType, setActiveColorType] = useState<'primary' | 'secondary'>('primary');
  const [inputErrors, setInputErrors] = useState<{ primary?: string; secondary?: string }>({});

  // Convert hex to HSL for sliders
  const primaryHsl = useMemo(() => hexToHsl(primaryColor), [primaryColor]);
  const secondaryHsl = useMemo(() => hexToHsl(secondaryColor), [secondaryColor]);

  // Generate color palette
  const colorPalette = useMemo(() => generateColorPalette(primaryColor), [primaryColor]);

  // Check contrast ratios
  const primaryContrast = getContrastRatio(primaryColor, '#FFFFFF');
  const _secondaryContrast = getContrastRatio(secondaryColor, '#FFFFFF');

  const validateAndUpdateColor = useCallback((color: string, type: 'primary' | 'secondary') => {
    if (!isValidHexColor(color)) {
      setInputErrors(prev => ({ ...prev, [type]: 'Invalid color format' }));
      onError('Invalid color format. Please use hex format (e.g., #3B82F6)');
      return;
    }

    setInputErrors(prev => ({ ...prev, [type]: undefined }));
    
    onColorChange({
      primary: type === 'primary' ? color.toUpperCase() : primaryColor,
      secondary: type === 'secondary' ? color.toUpperCase() : secondaryColor
    });
  }, [primaryColor, secondaryColor, onColorChange, onError]);

  const handleColorInputChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'primary' | 'secondary') => {
    const value = event.target.value;
    // Allow typing without immediate validation
    if (value.length >= 7) {
      validateAndUpdateColor(value, type);
    }
  };

  const handleColorInputBlur = (event: React.FocusEvent<HTMLInputElement>, type: 'primary' | 'secondary') => {
    const value = event.target.value;
    if (value) {
      validateAndUpdateColor(value, type);
    }
  };

  const handleColorSwatchClick = (type: 'primary' | 'secondary') => {
    setActiveColorType(type);
    setShowColorPicker(true);
  };

  const handleHslChange = (hue: number, saturation: number, lightness: number, type: 'primary' | 'secondary') => {
    const newColor = hslToHex(hue, saturation, lightness);
    onColorChange({
      primary: type === 'primary' ? newColor : primaryColor,
      secondary: type === 'secondary' ? newColor : secondaryColor
    });
  };

  const handlePresetSchemeClick = (scheme: ColorScheme) => {
    onColorChange({
      primary: scheme.primary,
      secondary: scheme.secondary
    });
    onSchemeChange?.(scheme);
  };

  const handleKeyDown = (event: React.KeyboardEvent, _callback: () => void) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      // Handle arrow navigation between presets
      event.preventDefault();
      // Implementation would cycle through presets
    }
  };

  const getColorDescription = (color: string) => {
    const hsl = hexToHsl(color);
    if (!hsl || typeof hsl.h !== 'number') return 'custom color';
    if (hsl.h >= 200 && hsl.h <= 260) return 'bright blue';
    if (hsl.h >= 260 && hsl.h <= 320) return 'vibrant purple';
    if (hsl.h >= 320 || hsl.h <= 20) return 'warm red';
    if (hsl.h >= 20 && hsl.h <= 60) return 'golden yellow';
    if (hsl.h >= 60 && hsl.h <= 160) return 'fresh green';
    return 'custom color';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Color Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary-color">Primary Color</Label>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="w-12 h-10 p-0 border-2"
              style={{ backgroundColor: primaryColor }}
              onClick={() => handleColorSwatchClick('primary')}
              aria-label="Open primary color picker"
            />
            <Input
              id="primary-color"
              value={primaryColor}
              onChange={(e) => handleColorInputChange(e, 'primary')}
              onBlur={(e) => handleColorInputBlur(e, 'primary')}
              placeholder="#3B82F6"
              className={cn(inputErrors.primary && 'border-destructive')}
              aria-describedby="primary-color-description"
            />
          </div>
          <p className="text-xs text-muted-foreground" id="primary-color-description">
            {getColorDescription(primaryColor)}
          </p>
          
          {/* Contrast Warning */}
          {primaryContrast < 3 && (
            <div className="flex items-center space-x-1 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Low contrast warning - may not meet WCAG AA compliance</span>
            </div>
          )}
          
          {primaryContrast >= 7 && (
            <Badge variant="secondary" className="text-xs">
              WCAG AAA Compliant
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary-color">Secondary Color</Label>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="w-12 h-10 p-0 border-2"
              style={{ backgroundColor: secondaryColor }}
              onClick={() => handleColorSwatchClick('secondary')}
              aria-label="Open secondary color picker"
            />
            <Input
              id="secondary-color"
              value={secondaryColor}
              onChange={(e) => handleColorInputChange(e, 'secondary')}
              onBlur={(e) => handleColorInputBlur(e, 'secondary')}
              placeholder="#8B5CF6"
              className={cn(inputErrors.secondary && 'border-destructive')}
              aria-describedby="secondary-color-description"
            />
          </div>
          <p className="text-xs text-muted-foreground" id="secondary-color-description">
            {getColorDescription(secondaryColor)}
          </p>
        </div>
      </div>

      {/* Preset Color Schemes */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Preset Schemes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label="Preset color schemes">
          {presetSchemes.map((scheme) => (
            <Button
              key={scheme.id}
              variant="outline"
              className={cn(
                'h-auto p-3 flex items-start space-x-3 text-left',
                selectedSchemeId === scheme.id && 'ring-2 ring-primary'
              )}
              onClick={() => handlePresetSchemeClick(scheme)}
              onKeyDown={(e) => handleKeyDown(e, () => handlePresetSchemeClick(scheme))}
              aria-label={`Apply ${scheme.name} scheme`}
            >
              <div className="flex space-x-1" data-testid="color-preview">
                <div 
                  className="w-4 h-4 rounded-sm border"
                  style={{ backgroundColor: scheme.primary }}
                />
                <div 
                  className="w-4 h-4 rounded-sm border"
                  style={{ backgroundColor: scheme.secondary }}
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{scheme.name}</p>
                <p className="text-xs text-muted-foreground">{scheme.description}</p>
              </div>
              {selectedSchemeId === scheme.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </Button>
          ))}
          
          {/* Show custom scheme if colors don't match any preset */}
          {!presetSchemes.some(s => s.primary === primaryColor && s.secondary === secondaryColor) && (
            <div className="p-3 border border-dashed border-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div 
                    className="w-4 h-4 rounded-sm border"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div 
                    className="w-4 h-4 rounded-sm border"
                    style={{ backgroundColor: secondaryColor }}
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">Custom Scheme</p>
                  <p className="text-xs text-muted-foreground">Your current colors</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced HSL Controls */}
      {advancedMode && (
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium">Advanced Color Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Primary Color HSL</h4>
              <div className="space-y-2">
                <Label htmlFor="primary-hue">Hue: {primaryHsl.h}°</Label>
                <Slider
                  id="primary-hue"
                  min={0}
                  max={360}
                  step={1}
                  value={[primaryHsl.h]}
                  onValueChange={([hue]) => handleHslChange(hue, primaryHsl.s, primaryHsl.l, 'primary')}
                />
                
                <Label htmlFor="primary-saturation">Saturation: {primaryHsl.s}%</Label>
                <Slider
                  id="primary-saturation"
                  min={0}
                  max={100}
                  step={1}
                  value={[primaryHsl.s]}
                  onValueChange={([saturation]) => handleHslChange(primaryHsl.h, saturation, primaryHsl.l, 'primary')}
                />
                
                <Label htmlFor="primary-lightness">Lightness: {primaryHsl.l}%</Label>
                <Slider
                  id="primary-lightness"
                  min={0}
                  max={100}
                  step={1}
                  value={[primaryHsl.l]}
                  onValueChange={([lightness]) => handleHslChange(primaryHsl.h, primaryHsl.s, lightness, 'primary')}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Secondary Color HSL</h4>
              <div className="space-y-2">
                <Label htmlFor="secondary-hue">Hue: {secondaryHsl.h}°</Label>
                <Slider
                  id="secondary-hue"
                  min={0}
                  max={360}
                  step={1}
                  value={[secondaryHsl.h]}
                  onValueChange={([hue]) => handleHslChange(hue, secondaryHsl.s, secondaryHsl.l, 'secondary')}
                />
                
                <Label htmlFor="secondary-saturation">Saturation: {secondaryHsl.s}%</Label>
                <Slider
                  id="secondary-saturation"
                  min={0}
                  max={100}
                  step={1}
                  value={[secondaryHsl.s]}
                  onValueChange={([saturation]) => handleHslChange(secondaryHsl.h, saturation, secondaryHsl.l, 'secondary')}
                />
                
                <Label htmlFor="secondary-lightness">Lightness: {secondaryHsl.l}%</Label>
                <Slider
                  id="secondary-lightness"
                  min={0}
                  max={100}
                  step={1}
                  value={[secondaryHsl.l]}
                  onValueChange={([lightness]) => handleHslChange(secondaryHsl.h, secondaryHsl.s, lightness, 'secondary')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Color Palette */}
      {showPalette && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-medium">Color Palette</h3>
          <div className="flex space-x-2">
            {Object.entries(colorPalette).map(([name, color]) => (
              <Button
                key={name}
                variant="outline"
                className="w-12 h-12 p-0 border-2 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => onColorChange({ primary: color, secondary: secondaryColor })}
                aria-label={`Palette color ${name}`}
                title={`${name}: ${color}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Color Harmony Suggestions */}
      {showHarmony && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-medium">Color Harmony</h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Implement complementary color logic */}}
              aria-label="Apply complementary colors"
            >
              Complementary
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Implement triadic color logic */}}
              aria-label="Apply triadic colors"
            >
              Triadic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Implement analogous color logic */}}
              aria-label="Apply analogous colors"
            >
              Analogous
            </Button>
          </div>
        </div>
      )}

      {/* Live Preview */}
      {showPreview && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-medium">Live Preview</h3>
          <div 
            className="p-4 rounded-lg border"
            style={{ backgroundColor: primaryColor, color: 'white' }}
            data-testid="color-preview"
          >
            <div className="mb-2 font-medium">Sample Header</div>
            <Button 
              className="mr-2"
              style={{ backgroundColor: secondaryColor }}
            >
              Action Button
            </Button>
            <div 
              className="mt-2 p-2 rounded"
              style={{ backgroundColor: GLASSMORPHISM.overlay }}
              data-testid="theme-preview"
            >
              Sample content with your branding
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Dialog */}
      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent aria-label="Color picker" className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Pick {activeColorType === 'primary' ? 'Primary' : 'Secondary'} Color
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Native Color Input */}
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={activeColorType === 'primary' ? primaryColor : secondaryColor}
                onChange={(e) => {
                  const newColor = e.target.value.toUpperCase();
                  onColorChange({
                    primary: activeColorType === 'primary' ? newColor : primaryColor,
                    secondary: activeColorType === 'secondary' ? newColor : secondaryColor
                  });
                }}
                className="w-20 h-20 cursor-pointer rounded-lg border-2 border-border"
                aria-label={`${activeColorType} color picker`}
              />
              <div className="flex-1 space-y-2">
                <Label>Hex Value</Label>
                <Input
                  value={activeColorType === 'primary' ? primaryColor : secondaryColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length >= 7 && isValidHexColor(value)) {
                      onColorChange({
                        primary: activeColorType === 'primary' ? value.toUpperCase() : primaryColor,
                        secondary: activeColorType === 'secondary' ? value.toUpperCase() : secondaryColor
                      });
                    }
                  }}
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* HSL Sliders */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Hue: {activeColorType === 'primary' ? primaryHsl.h : secondaryHsl.h}°
                </Label>
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={[activeColorType === 'primary' ? primaryHsl.h : secondaryHsl.h]}
                  onValueChange={([hue]) => {
                    const hsl = activeColorType === 'primary' ? primaryHsl : secondaryHsl;
                    handleHslChange(hue, hsl.s, hsl.l, activeColorType);
                  }}
                  className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-red-500 [&_[role=slider]]:via-green-500 [&_[role=slider]]:to-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Saturation: {activeColorType === 'primary' ? primaryHsl.s : secondaryHsl.s}%
                </Label>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[activeColorType === 'primary' ? primaryHsl.s : secondaryHsl.s]}
                  onValueChange={([saturation]) => {
                    const hsl = activeColorType === 'primary' ? primaryHsl : secondaryHsl;
                    handleHslChange(hsl.h, saturation, hsl.l, activeColorType);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Lightness: {activeColorType === 'primary' ? primaryHsl.l : secondaryHsl.l}%
                </Label>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[activeColorType === 'primary' ? primaryHsl.l : secondaryHsl.l]}
                  onValueChange={([lightness]) => {
                    const hsl = activeColorType === 'primary' ? primaryHsl : secondaryHsl;
                    handleHslChange(hsl.h, hsl.s, lightness, activeColorType);
                  }}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
              <div
                className="w-12 h-12 rounded-lg border-2"
                style={{ backgroundColor: activeColorType === 'primary' ? primaryColor : secondaryColor }}
              />
              <div>
                <p className="font-medium text-sm">
                  {activeColorType === 'primary' ? primaryColor : secondaryColor}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getColorDescription(activeColorType === 'primary' ? primaryColor : secondaryColor)}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowColorPicker(false)}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Region for Screen Readers */}
      <div role="status" aria-live="polite" className="sr-only">
        Primary color updated to {primaryColor}
      </div>
    </div>
  );
}
