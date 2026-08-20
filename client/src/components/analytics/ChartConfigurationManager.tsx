'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Settings,
  Palette,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Lock,
  Save,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartConfiguration } from '@/types/analytics';
import { CHART_COLOR_ARRAY, CHART_SEMANTIC } from '@/utils/chartColors';

interface ChartConfigurationManagerProps {
  chartConfig: ChartConfiguration;
  userTier: 'basic' | 'pro' | 'unlimited';
  onConfigChange: (config: ChartConfiguration) => void;
  className?: string;
}

interface ChartTypeOption {
  value: ChartConfiguration['type'];
  label: string;
  icon: React.ReactNode;
  available: boolean;
}

interface ColorTheme {
  name: string;
  colors: string[];
  preview: string[];
}

const chartTypeOptions: ChartTypeOption[] = [
  {
    value: 'line',
    label: 'Line Chart',
    icon: <LineChart className="h-4 w-4" />,
    available: true,
  },
  {
    value: 'bar',
    label: 'Bar Chart',
    icon: <BarChart3 className="h-4 w-4" />,
    available: true,
  },
  {
    value: 'doughnut',
    label: 'Doughnut Chart',
    icon: <PieChart className="h-4 w-4" />,
    available: true,
  },
  {
    value: 'pie',
    label: 'Pie Chart',
    icon: <PieChart className="h-4 w-4" />,
    available: true,
  },
  {
    value: 'radar',
    label: 'Radar Chart',
    icon: <Activity className="h-4 w-4" />,
    available: true,
  },
  {
    value: 'area',
    label: 'Area Chart',
    icon: <LineChart className="h-4 w-4" />,
    available: true,
  },
];

const colorThemes: ColorTheme[] = [
  {
    name: 'Blue Ocean',
    colors: [CHART_COLOR_ARRAY[1], '#1E40AF', '#60A5FA', '#93C5FD', '#DBEAFE'],
    preview: [CHART_COLOR_ARRAY[1], '#1E40AF', '#60A5FA'],
  },
  {
    name: 'Green Forest',
    colors: [CHART_SEMANTIC.positive, '#059669', '#34D399', '#6EE7B7', '#D1FAE5'],
    preview: [CHART_SEMANTIC.positive, '#059669', '#34D399'],
  },
  {
    name: 'Purple Galaxy',
    colors: [CHART_COLOR_ARRAY[4], '#7C3AED', '#A78BFA', '#C4B5FD', '#EDE9FE'],
    preview: [CHART_COLOR_ARRAY[4], '#7C3AED', '#A78BFA'],
  },
  {
    name: 'Orange Sunset',
    colors: [CHART_SEMANTIC.warning, '#D97706', '#FBBF24', '#FCD34D', '#FEF3C7'],
    preview: [CHART_SEMANTIC.warning, '#D97706', '#FBBF24'],
  },
  {
    name: 'Red Fire',
    colors: [CHART_SEMANTIC.negative, '#DC2626', '#F87171', '#FCA5A5', '#FEE2E2'],
    preview: [CHART_SEMANTIC.negative, '#DC2626', '#F87171'],
  },
  {
    name: 'Grayscale',
    colors: [CHART_SEMANTIC.neutral, '#4B5563', '#9CA3AF', '#D1D5DB', '#F3F4F6'],
    preview: [CHART_SEMANTIC.neutral, '#4B5563', '#9CA3AF'],
  },
];

const tierFeatures = {
  basic: {
    chartTypes: ['line', 'bar'],
    customization: false,
    colorThemes: false,
    animations: false,
  },
  pro: {
    chartTypes: ['line', 'bar', 'doughnut'],
    customization: false,
    colorThemes: false,
    animations: true,
  },
  unlimited: {
    chartTypes: ['line', 'bar', 'doughnut', 'pie', 'radar', 'area'],
    customization: true,
    colorThemes: true,
    animations: true,
  },
};

export const ChartConfigurationManager: React.FC<ChartConfigurationManagerProps> = ({
  chartConfig,
  userTier,
  onConfigChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<ChartConfiguration>(chartConfig);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const tierFeature = tierFeatures[userTier];
  const isCustomizationAllowed = tierFeature.customization;

  const updateTempConfig = useCallback((updates: Partial<ChartConfiguration>) => {
    setTempConfig(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  const handleSaveConfig = useCallback(() => {
    onConfigChange(tempConfig);
    setHasUnsavedChanges(false);
    setIsOpen(false);
  }, [onConfigChange, tempConfig]);

  const handleResetConfig = useCallback(() => {
    setTempConfig(chartConfig);
    setHasUnsavedChanges(false);
  }, [chartConfig]);

  const handleApplyTheme = useCallback((theme: ColorTheme) => {
    updateTempConfig({ colors: theme.colors });
  }, [updateTempConfig]);

  // Restricted view for basic/pro tiers
  if (!isCustomizationAllowed) {
    return (
      <Card className={cn("chart-configuration-restricted", className)}>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="rounded-full bg-muted/50 p-4 mx-auto w-fit">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Chart Customization</h3>
              <p className="text-muted-foreground">
                Chart customization is available in the Expand tier
              </p>
            </div>
            <Button variant="outline" size="sm">
              Upgrade to Expand
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("chart-configuration", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            data-testid="chart-configuration"
          >
            <Settings className="h-4 w-4" />
            Chart Settings
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">
                *
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Chart Configuration
                </div>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-xs">
                    Unsaved changes
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Chart Type Selector */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Chart Type</Label>
                <Select
                  value={tempConfig.type}
                  onValueChange={(value: ChartConfiguration['type']) =>
                    updateTempConfig({ type: value })
                  }
                >
                  <SelectTrigger data-testid="chart-type-selector">
                    <SelectValue placeholder="Select chart type" />
                  </SelectTrigger>
                  <SelectContent>
                    {chartTypeOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={!tierFeature.chartTypes.includes(option.value)}
                      >
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <span>{option.label}</span>
                          {!tierFeature.chartTypes.includes(option.value) && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateTempConfig({ type: 'bar' })}
                  className="text-xs"
                  aria-label="Change chart type"
                >
                  Change Chart Type
                </Button>
              </div>

              {/* Color Themes */}
              {tierFeature.colorThemes && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Color Theme</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {colorThemes.map((theme) => (
                      <Button
                        key={theme.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyTheme(theme)}
                        className="h-auto p-3 flex flex-col items-start space-y-2"
                        data-testid="color-picker"
                      >
                        <div className="flex space-x-1">
                          {theme.preview.map((color, index) => (
                            <div
                              key={`color-${index}-${color}`}
                              className="w-4 h-4 rounded-full border border-border"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium">{theme.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chart Options */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Chart Options</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="grid-lines" className="text-sm">
                      Show Grid Lines
                    </Label>
                    <Switch
                      id="grid-lines"
                      checked={tempConfig.gridLines}
                      onCheckedChange={(checked) =>
                        updateTempConfig({ gridLines: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="legend" className="text-sm">
                      Show Legend
                    </Label>
                    <Switch
                      id="legend"
                      checked={tempConfig.legend}
                      onCheckedChange={(checked) =>
                        updateTempConfig({ legend: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="animations" className="text-sm">
                      Enable Animations
                    </Label>
                    <Switch
                      id="animations"
                      checked={tempConfig.animations}
                      onCheckedChange={(checked) =>
                        updateTempConfig({ animations: checked })
                      }
                      disabled={!tierFeature.animations}
                      data-testid="animations-toggle"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="responsive" className="text-sm">
                      Responsive
                    </Label>
                    <Switch
                      id="responsive"
                      checked={tempConfig.responsive}
                      onCheckedChange={(checked) =>
                        updateTempConfig({ responsive: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Line Chart Specific Options */}
              {(tempConfig.type === 'line' || tempConfig.type === 'area') && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Line Options</Label>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Line Tension: {tempConfig.tension || 0}
                    </Label>
                    <Slider
                      value={[tempConfig.tension || 0]}
                      onValueChange={([value]) =>
                        updateTempConfig({ tension: value })
                      }
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Bar Chart Specific Options */}
              {tempConfig.type === 'bar' && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Bar Options</Label>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stacked" className="text-sm">
                      Stacked Bars
                    </Label>
                    <Switch
                      id="stacked"
                      checked={tempConfig.stacked || false}
                      onCheckedChange={(checked) =>
                        updateTempConfig({ stacked: checked })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetConfig}
                  disabled={!hasUnsavedChanges}
                  className="gap-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveConfig}
                    disabled={!hasUnsavedChanges}
                    className="gap-2"
                  >
                    <Save className="h-3 w-3" />
                    Apply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};
