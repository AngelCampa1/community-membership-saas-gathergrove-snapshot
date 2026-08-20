'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
  ChartData as ChartJSData,
  ChartEvent,
  ActiveElement,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie, Radar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Download,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ChartConfiguration,
  AnalyticsError,
  ThemeConfiguration,
} from '@/types/analytics';

// Define chart data interfaces
interface ChartDataItem {
  date?: string;
  period?: string;
  label?: string;
  name?: string;
  category?: string;
  metric?: string;
  dimension?: string;
  value?: number;
  count?: number;
  revenue?: number;
  engagement?: number;
  percentage?: number;
  score?: number;
  rating?: number;
}

// Removed custom HoverEvent and HoverElement interfaces
// Using Chart.js's built-in ChartEvent and ActiveElement types instead

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface AdvancedAnalyticsChartsProps {
  data: ChartDataItem[];
  chartType: 'line' | 'bar' | 'doughnut' | 'pie' | 'radar';
  title: string;
  userTier: 'basic' | 'pro' | 'unlimited';
  loading?: boolean;
  error?: string;
  height?: number;
  configuration?: Partial<ChartConfiguration>;
  theme?: ThemeConfiguration;
  onConfigChange?: (config: ChartConfiguration) => void;
  onDataExport?: (format: 'png' | 'pdf' | 'csv') => void;
  onRetry?: () => void;
  className?: string;
}

const defaultTheme: ThemeConfiguration = {
  name: 'default',
  colors: {
    primary: 'hsl(217 91% 60%)',
    secondary: 'hsl(160 84% 39%)',
    success: 'hsl(142 76% 36%)',
    warning: 'hsl(38 92% 50%)',
    error: 'hsl(0 84% 60%)',
    info: 'hsl(199 89% 48%)',
    background: 'hsl(0 0% 100%)',
    surface: 'hsl(210 20% 98%)',
    text: 'hsl(217 19% 27%)',
    textSecondary: 'hsl(215 16% 47%)',
  },
  chartDefaults: {
    type: 'line',
    colors: ['hsl(217 91% 60%)', 'hsl(160 84% 39%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)', 'hsl(262 83% 58%)'],
    gridLines: true,
    animations: true,
    legend: true,
    responsive: true,
    maintainAspectRatio: false,
  },
};

const tierFeatures = {
  basic: {
    chartTypes: ['line', 'bar'],
    customization: false,
    export: false,
    maxDataPoints: 100,
  },
  pro: {
    chartTypes: ['line', 'bar', 'doughnut'],
    customization: false,
    export: true,
    maxDataPoints: 500,
  },
  unlimited: {
    chartTypes: ['line', 'bar', 'doughnut', 'pie', 'radar'],
    customization: true,
    export: true,
    maxDataPoints: 10000,
  },
};

const AdvancedAnalyticsCharts: React.FC<AdvancedAnalyticsChartsProps> = ({
  data,
  chartType,
  title,
  userTier,
  loading = false,
  error,
  height = 400,
  configuration,
  theme = defaultTheme,
  onConfigChange,
  onDataExport,
  onRetry,
  className,
}) => {
  const [chartError, setChartError] = useState<AnalyticsError | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const tierFeature = tierFeatures[userTier];
  const isChartAllowed = tierFeature.chartTypes.includes(chartType);

  // Merge configuration with defaults
  const config: ChartConfiguration = useMemo(() => ({
    type: chartType,
    colors: configuration?.colors || theme.chartDefaults?.colors || ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'],
    gridLines: configuration?.gridLines ?? theme.chartDefaults?.gridLines ?? true,
    animations: configuration?.animations ?? theme.chartDefaults?.animations ?? true,
    legend: configuration?.legend ?? theme.chartDefaults?.legend ?? true,
    responsive: configuration?.responsive ?? theme.chartDefaults?.responsive ?? true,
    maintainAspectRatio: configuration?.maintainAspectRatio ?? theme.chartDefaults?.maintainAspectRatio ?? true,
    ...(configuration?.tension !== undefined && { tension: configuration.tension }),
    ...(configuration?.stacked !== undefined && { stacked: configuration.stacked }),
  }), [configuration, chartType, theme.chartDefaults]);

  // Transform data for Chart.js
  const chartData: ChartJSData<'line' | 'bar' | 'doughnut' | 'pie' | 'radar'> = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    try {
      // Limit data points based on tier
      const limitedData = data.slice(0, tierFeature.maxDataPoints);

      switch (chartType) {
        case 'line':
        case 'bar':
          return {
            labels: limitedData.map((item: ChartDataItem) => 
              item.date || item.period || item.label || item.name || ''
            ),
            datasets: [
              {
                label: title,
                data: limitedData.map((item: ChartDataItem) => 
                  item.value || item.count || item.revenue || item.engagement || 0
                ),
                backgroundColor: config.colors[0] + '20',
                borderColor: config.colors[0],
                borderWidth: 2,
                tension: config.tension || 0.4,
                fill: chartType === 'line' ? false : true,
              },
            ],
          };

        case 'doughnut':
        case 'pie':
          return {
            labels: limitedData.map((item: ChartDataItem) => 
              item.label || item.name || item.category || ''
            ),
            datasets: [
              {
                label: title,
                data: limitedData.map((item: ChartDataItem) => 
                  item.value || item.count || item.percentage || 0
                ),
                backgroundColor: config.colors.slice(0, limitedData.length),
                borderWidth: 1,
              },
            ],
          };

        case 'radar':
          return {
            labels: limitedData.map((item: ChartDataItem) => 
              item.label || item.metric || item.dimension || ''
            ),
            datasets: [
              {
                label: title,
                data: limitedData.map((item: ChartDataItem) => 
                  item.value || item.score || item.rating || 0
                ),
                backgroundColor: config.colors[0] + '20',
                borderColor: config.colors[0],
                borderWidth: 2,
                pointBackgroundColor: config.colors[0],
              },
            ],
          };

        default:
          return { labels: [], datasets: [] };
      }
    } catch {
      setChartError({
        code: 'DATA_TRANSFORM_ERROR',
        message: 'Failed to transform data for chart visualization',
        timestamp: new Date(),
        recoverable: true,
        context: { chartType, dataLength: data.length },
      });
      return { labels: [], datasets: [] };
    }
  }, [data, chartType, title, config, tierFeature.maxDataPoints]);

  // Chart.js options
  const chartOptions: ChartOptions<'line' | 'bar' | 'doughnut' | 'pie' | 'radar'> = useMemo(() => ({
    responsive: config.responsive,
    maintainAspectRatio: config.maintainAspectRatio,
    animation: config.animations ? {
      duration: 750,
      easing: 'easeInOutQuart',
    } : false,
    plugins: {
      legend: {
        display: config.legend,
        position: 'top' as const,
        labels: {
          color: theme.colors.text,
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: theme.colors.surface,
        titleColor: theme.colors.text,
        bodyColor: theme.colors.textSecondary,
        borderColor: theme.colors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context: TooltipItem<'line' | 'bar' | 'doughnut' | 'pie' | 'radar'>) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;
            
            if (typeof value === 'number') {
              return `${label}: ${value.toLocaleString()}`;
            }
            return `${label}: ${value}`;
          },
        },
      },
      title: {
        display: true,
        text: title,
        color: theme.colors.text,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
      },
    },
    scales: chartType === 'line' || chartType === 'bar' ? {
      x: {
        display: true,
        grid: {
          display: config.gridLines,
          color: theme.colors.textSecondary + '20',
        },
        ticks: {
          color: theme.colors.textSecondary,
        },
      },
      y: {
        display: true,
        grid: {
          display: config.gridLines,
          color: theme.colors.textSecondary + '20',
        },
        ticks: {
          color: theme.colors.textSecondary,
          callback: function(value: string | number) {
            if (typeof value === 'number') {
              return value.toLocaleString();
            }
            return value;
          },
        },
      },
    } : undefined,
    onHover: (event: ChartEvent, elements: ActiveElement[]) => {
      // Change cursor on hover
      if (event?.native?.target) {
        const target = event.native.target as HTMLElement;
        target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
      }
    },
  }), [config, theme, title, chartType]);

  // Handle export functionality
  const handleExport = useCallback(async (format: 'png' | 'pdf' | 'csv') => {
    if (!tierFeature.export) {
      return;
    }

    setIsExporting(true);
    try {
      await onDataExport?.(format);
    } catch {
      setChartError({
        code: 'EXPORT_ERROR',
        message: `Failed to export chart as ${format.toUpperCase()}`,
        timestamp: new Date(),
        recoverable: true,
        context: { format },
      });
    } finally {
      setIsExporting(false);
    }
  }, [onDataExport, tierFeature.export]);

  // Clear errors after some time
  useEffect(() => {
    if (chartError) {
      const timer = setTimeout(() => {
        setChartError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [chartError]);

  // Render chart component based on type
  const renderChart = () => {
    const commonProps = {
      data: chartData as any,
      options: chartOptions as any,
      height,
    };

    switch (chartType) {
      case 'line':
        return <Line {...commonProps} data-testid="line-chart" aria-label={`Line chart: ${title || 'Data visualization'}`} />;
      case 'bar':
        return <Bar {...commonProps} data-testid="bar-chart" aria-label={`Bar chart: ${title || 'Data visualization'}`} />;
      case 'doughnut':
        return <Doughnut {...commonProps} data-testid="doughnut-chart" aria-label={`Doughnut chart: ${title || 'Data visualization'}`} />;
      case 'pie':
        return <Pie {...commonProps} data-testid="pie-chart" aria-label={`Pie chart: ${title || 'Data visualization'}`} />;
      case 'radar':
        return <Radar {...commonProps} data-testid="radar-chart" aria-label={`Radar chart: ${title || 'Data visualization'}`} />;
      default:
        return null;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton 
            className="w-full" 
            style={{ height: `${height}px` }}
            data-testid="chart-loading-skeleton"
          />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || chartError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {error || chartError?.message}
            </AlertDescription>
          </Alert>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Tier restriction message
  if (!isChartAllowed) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg border-2 border-dashed">
            <div className="text-center space-y-3">
              <div className="text-muted-foreground">
                {chartType} charts are available in the Expand tier
              </div>
              <Button variant="outline" size="sm">
                Upgrade to Expand
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("analytics-chart-card", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Data quality indicator */}
            {data && data.length > 0 && (
              <Badge variant="outline" className="text-xs max-w-[150px] truncate" title={`${data.length.toLocaleString()} data points`}>
                {data.length.toLocaleString()} data points
              </Badge>
            )}
            
            {/* Export buttons */}
            {tierFeature.export && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('png')}
                  disabled={isExporting}
                  aria-label="Export as PNG"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {userTier === 'unlimited' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    aria-label="Export as PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Configuration button */}
            {tierFeature.customization && onConfigChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // This would open a configuration modal
                  logger.info('analytics', 'Chart configuration requested');
                }}
                aria-label="Chart settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          className="chart-container"
          style={{ height: `${height}px`, position: 'relative' }}
        >
          {!data || data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <div>No data available</div>
                <div className="text-sm">Try adjusting your filters or date range</div>
              </div>
            </div>
          ) : (
            renderChart()
          )}
          
          {/* Export progress indicator */}
          {isExporting && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center space-y-2" data-testid="export-progress">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                <div className="text-sm">Exporting chart...</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Chart insights for unlimited tier */}
        {userTier === 'unlimited' && data && data.length > 0 && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Quick Insights</div>
            <div className="text-xs text-muted-foreground">
              • Peak value: {Math.max(...data.map((item: ChartDataItem) => item.value || 0)).toLocaleString()}
              • Average: {(data.reduce((sum: number, item: ChartDataItem) => sum + (item.value || 0), 0) / data.length).toFixed(1)}
              • Data points: {data.length}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedAnalyticsCharts;
export { AdvancedAnalyticsCharts };
