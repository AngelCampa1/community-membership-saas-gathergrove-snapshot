'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { logger } from '@/lib/logger';
import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';
import { 
  LineChart as LineChartIcon, 
  AreaChart as AreaChartIcon, 
  ZoomIn, 
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  Target,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { EngagementMetric, PredictionData, AdvancedFilters } from '../../types/analytics';
import premiumAnalyticsService from '../../services/premiumAnalyticsService';

interface AnomalyData {
  timestamp: string | number | Date;
  value: number;
  severity: 'low' | 'medium' | 'high';
  reason?: string;
}

interface TrendAnalysisData {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  confidence: number;
  seasonality?: boolean;
}

interface EngagementTrendChartProps {
  clubId?: number;
  data: EngagementMetric[];
  title?: string;
  chartType?: 'line' | 'area';
  showTypeToggle?: boolean;
  showMetricToggles?: boolean;
  metrics?: Array<keyof EngagementMetric>;
  height?: number;
  colors?: string[];
  allowZoom?: boolean;
  loading?: boolean;
  error?: string;
  tooltipFormatter?: (value: number, name: string) => [string, string];
  includeDataTable?: boolean;
  useThemeColors?: boolean;
  responsive?: boolean;
  className?: string;
  enablePredictions?: boolean;
  enableAdvancedFilters?: boolean;
  enableAnomalyDetection?: boolean;
  enableTrendAnalysis?: boolean;
  userTier?: 'basic' | 'pro' | 'unlimited';
}

const defaultMetrics: Array<keyof EngagementMetric> = [
  'activeMembers',
  'eventAttendance',
  'engagementRate',
];

import { CHART_COLOR_ARRAY } from '../../utils/chartColors';

const defaultColors = CHART_COLOR_ARRAY;

const metricLabels: Record<keyof EngagementMetric, string> = {
  date: 'Date',
  activeMembers: 'Active Members',
  eventAttendance: 'Event Attendance',
  engagementRate: 'Engagement Rate',
  totalMembers: 'Total Members',
};

const EngagementTrendChart: React.FC<EngagementTrendChartProps> = ({
  clubId,
  data,
  title = 'Member Engagement Trends',
  chartType = 'line',
  showTypeToggle = false,
  showMetricToggles = false,
  metrics = defaultMetrics,
  height = 400,
  colors = defaultColors,
  allowZoom = false,
  loading = false,
  error,
  tooltipFormatter: _tooltipFormatter,
  includeDataTable = false,
  useThemeColors = false,
  responsive = true,
  className,
  enablePredictions = false,
  enableAdvancedFilters = false,
  enableAnomalyDetection = false,
  enableTrendAnalysis = false,
  userTier = 'basic',
}) => {
  const [activeChart, setActiveChart] = useState<'line' | 'area'>(chartType);
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>(
    metrics.reduce((acc, metric) => ({ ...acc, [metric]: true }), {})
  );
  const [zoomDomain, setZoomDomain] = useState<[string, string] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysisData | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    membershipTiers: [],
    eventCategories: [],
    locationFilters: [],
    ageGroups: [],
    engagementLevels: []
  });

  const isUnlimited = userTier === 'unlimited';

  // Process data for chart with advanced features
  const chartData = useMemo(() => {
    let processedData = data.map((item) => ({
      ...item,
      date: format(new Date(item.date), 'MMM dd'),
      engagementRate: item.engagementRate * 100, // Convert to percentage
      isAnomaly: false,
      predictedValue: null as number | null,
    }));

    // Add anomaly detection if enabled
    if (enableAnomalyDetection && isUnlimited && anomalies.length > 0) {
      processedData = processedData.map(item => ({
        ...item,
        isAnomaly: anomalies.some(anomaly => 
          format(new Date(anomaly.timestamp as string | number | Date), 'MMM dd') === item.date
        )
      }));
    }

    // Add predictions if enabled
    if (enablePredictions && isUnlimited && predictions.length > 0) {
      const predictedItems = predictions.map(pred => ({
        date: format(new Date(pred.date), 'MMM dd'),
        activeMembers: 0,
        eventAttendance: 0,
        engagementRate: pred.predicted,
        totalMembers: 0,
        isPrediction: true,
        predictedValue: pred.predicted,
        confidence: pred.confidence,
        upperBound: pred.upperBound,
        lowerBound: pred.lowerBound,
        isAnomaly: false
      }));
      
      return [...processedData, ...predictedItems].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    return processedData;
  }, [data, enableAnomalyDetection, enablePredictions, isUnlimited, anomalies, predictions]);

  // Load advanced analytics data
  React.useEffect(() => {
    if (!isUnlimited || !clubId || data.length === 0) return;

    const loadAdvancedData = async () => {
      try {
        // Load trend analysis
        if (enableTrendAnalysis) {
          // Simple trend analysis based on data points
          const values = data.map(d => d.engagementRate);
          const firstHalf = values.slice(0, Math.floor(values.length / 2));
          const secondHalf = values.slice(Math.floor(values.length / 2));
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          const diff = secondAvg - firstAvg;

          setTrendAnalysis({
            direction: diff > 0.1 ? 'increasing' : diff < -0.1 ? 'decreasing' : 'stable',
            strength: Math.abs(diff * 100),
            confidence: Math.min(95, 50 + (data.length * 5)), // Confidence based on data points
            seasonality: false
          });
        }

        // Load anomaly detection (simplified)
        if (enableAnomalyDetection) {
          const values = data.map(d => d.engagementRate);
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);

          const detectedAnomalies = data
            .map((d, _index) => ({
              timestamp: d.date,
              value: d.engagementRate,
              severity: Math.abs(d.engagementRate - mean) > (2 * stdDev) ? 'high' as const :
                       Math.abs(d.engagementRate - mean) > stdDev ? 'medium' as const : 'low' as const,
              reason: Math.abs(d.engagementRate - mean) > stdDev ? 'Statistical outlier detected' : undefined
            }))
            .filter(anomaly => anomaly.severity !== 'low');

          setAnomalies(detectedAnomalies);
        }

        // Load predictions
        if (enablePredictions) {
          const forecast = await premiumAnalyticsService.getPredictiveAnalytics(
            clubId,
            'engagement',
            30 // 30 day horizon
          );
          setPredictions(forecast.predictions);
        }
      } catch (error) {
        logger.warn('analytics', 'Failed to load advanced analytics data', { error });
      }
    };

    loadAdvancedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only load when these specific values change
  }, [isUnlimited, clubId, data.length, enableTrendAnalysis, enableAnomalyDetection, enablePredictions]);

  // Handle metric toggle
  const handleMetricToggle = useCallback((metric: string) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  }, []);

  // Advanced filter handlers
  const handleFilterChange = useCallback((filterType: keyof AdvancedFilters, values: string[]) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterType]: values
    }));
  }, []);

  // Enhanced custom tooltip with advanced data
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      color: string;
      dataKey: string;
      name: string;
      value: number;
      payload: Record<string, unknown>;
    }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    const isAnomalous = Boolean(data?.isAnomaly);
    const isPredicted = Boolean(data?.isPrediction);

    return (
      <Card className="p-3 shadow-lg max-w-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-medium">{label}</p>
            {isAnomalous && (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
            {isPredicted && (
              <Target className="h-4 w-4 text-primary" />
            )}
          </div>
          
          {payload.map((entry, index: number) => (
            <div key={`tooltip-${entry.dataKey || entry.name || index}`} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.name}:</span>
              <span>
                {entry.dataKey === 'engagementRate'
                  ? `${entry.value.toFixed(1)}%`
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}

          {/* Show prediction confidence */}
          {isPredicted && typeof data?.confidence === 'number' ? (
            <div className="text-xs text-muted-foreground border-t pt-2">
              <div>Confidence: {((data.confidence as number) * 100).toFixed(1)}%</div>
              <div>Range: {(data.lowerBound as number)?.toFixed(1)}% - {(data.upperBound as number)?.toFixed(1)}%</div>
            </div>
          ) : null}

          {/* Show anomaly information */}
          {isAnomalous && (
            <div className="text-xs text-warning border-t pt-2">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Anomalous behavior detected
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Zoom functions
  const handleZoomIn = () => {
    if (chartData.length > 10) {
      const start = Math.floor(chartData.length * 0.2);
      const end = Math.floor(chartData.length * 0.8);
      setZoomDomain([chartData[start].date, chartData[end].date]);
    }
  };

  const handleZoomOut = () => {
    setZoomDomain(null);
  };

  // Mobile responsive check
  const _isMobile = responsive && typeof window !== 'undefined' && 
    window.matchMedia && window.matchMedia('(max-width: 768px)')?.matches;

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn('space-y-4', className)} data-testid="chart-loading-skeleton">
        {title && <Skeleton className="h-6 w-48" />}
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center space-y-2">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // Empty data state
  if (!data || data.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-muted-foreground">
          No data available for the selected period
        </div>
      </Card>
    );
  }

  return (
    <div 
      className={cn(
        'space-y-4',
        responsive && 'mobile-responsive',
        useThemeColors && 'theme-adaptive',
        className
      )}
      data-testid="engagement-trend-chart"
      role="img"
      aria-label={`${title} showing engagement trends over time`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          {title && <h3 className="font-semibold">{title}</h3>}
          <div className="text-sm text-muted-foreground">
            {data.length} data points • Last updated {format(new Date(), 'HH:mm')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Trend Analysis Display */}
          {enableTrendAnalysis && isUnlimited && trendAnalysis && (
            <div className="flex items-center gap-1 text-sm bg-muted/50 px-2 py-1 rounded">
              {trendAnalysis.direction === 'increasing' ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : trendAnalysis.direction === 'decreasing' ? (
                <TrendingDown className="h-4 w-4 text-destructive" />
              ) : (
                <Calendar className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-muted-foreground">
                {trendAnalysis.direction} ({trendAnalysis.strength}%)
              </span>
            </div>
          )}

          {/* Advanced Filters Toggle */}
          {enableAdvancedFilters && isUnlimited && (
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle advanced filters"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          )}

          {/* Chart Type Toggle */}
          {showTypeToggle && (
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={activeChart === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveChart('line')}
                aria-label="Line Chart"
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={activeChart === 'area' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveChart('area')}
                aria-label="Area Chart"
              >
                <AreaChartIcon className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Zoom Controls */}
          {allowZoom && (
            <div className="flex items-center gap-1" data-testid="zoom-controls">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={!!zoomDomain}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={!zoomDomain}
                aria-label="Reset Zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Metric Toggles */}
      {showMetricToggles && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
          {metrics.map((metric) => (
            <div key={metric} className="flex items-center space-x-2">
              <Switch
                id={`metric-${metric}`}
                checked={visibleMetrics[metric]}
                onCheckedChange={() => handleMetricToggle(metric)}
              />
              <Label 
                htmlFor={`metric-${metric}`}
                className="text-sm font-medium cursor-pointer"
              >
                {metricLabels[metric]}
              </Label>
              <div
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: colors[metrics.indexOf(metric)] 
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {enableAdvancedFilters && isUnlimited && showFilters && (
        <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
          <h4 className="font-medium text-sm">Advanced Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Membership Tiers */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Membership Tiers</Label>
              <div className="space-y-1">
                {['Basic', 'Premium', 'VIP'].map(tier => (
                  <label key={tier} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={advancedFilters.membershipTiers?.includes(tier)}
                      onChange={(e) => {
                        const current = advancedFilters.membershipTiers || [];
                        const updated = e.target.checked
                          ? [...current, tier]
                          : current.filter(t => t !== tier);
                        handleFilterChange('membershipTiers', updated);
                      }}
                      className="rounded"
                    />
                    <span>{tier}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Engagement Levels */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Engagement Levels</Label>
              <div className="space-y-1">
                {['High', 'Medium', 'Low'].map(level => (
                  <label key={level} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={advancedFilters.engagementLevels?.includes(level)}
                      onChange={(e) => {
                        const current = advancedFilters.engagementLevels || [];
                        const updated = e.target.checked
                          ? [...current, level]
                          : current.filter(l => l !== level);
                        handleFilterChange('engagementLevels', updated);
                      }}
                      className="rounded"
                    />
                    <span>{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age Groups */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Age Groups</Label>
              <div className="space-y-1">
                {['18-24', '25-34', '35-44', '45-54', '55+'].map(age => (
                  <label key={age} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={advancedFilters.ageGroups?.includes(age)}
                      onChange={(e) => {
                        const current = advancedFilters.ageGroups || [];
                        const updated = e.target.checked
                          ? [...current, age]
                          : current.filter(a => a !== age);
                        handleFilterChange('ageGroups', updated);
                      }}
                      className="rounded"
                    />
                    <span>{age}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAdvancedFilters({
                membershipTiers: [],
                eventCategories: [],
                locationFilters: [],
                ageGroups: [],
                engagementLevels: []
              })}
            >
              Clear All
            </Button>
            <div className="text-xs text-muted-foreground">
              Active filters: {Object.values(advancedFilters).flat().length}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height }} data-testid="responsive-container">
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === 'line' ? (
            <LineChart data={chartData} data-testid="line-chart">
              <CartesianGrid strokeDasharray="3 3" data-testid="cartesian-grid" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: _isMobile ? 10 : 12 }}
                angle={_isMobile ? -45 : 0}
                textAnchor={_isMobile ? 'end' : 'middle'}
                data-testid="x-axis"
              />
              <YAxis
                tick={{ fontSize: _isMobile ? 10 : 12 }}
                data-testid="y-axis"
              />
              <Tooltip
                content={<CustomTooltip />}
                data-testid="tooltip"
              />
              <Legend 
                wrapperStyle={{ 
                  fontSize: _isMobile ? '12px' : '14px',
                  paddingTop: '20px',
                }}
                data-testid="legend"
              />
              
              {metrics.map((metric, index) => (
                visibleMetrics[metric] && (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={colors[index]}
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      
                      // Show different dots for anomalies and predictions
                      if (payload?.isAnomaly && enableAnomalyDetection) {
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={6} 
                            fill="orange" 
                            stroke="#ff4500" 
                            strokeWidth={2}
                            className="animate-pulse"
                          />
                        );
                      }
                      
                      if (payload?.isPrediction && enablePredictions) {
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={5} 
                            fill="none" 
                            stroke={colors[index]} 
                            strokeWidth={2}
                            strokeDasharray="3,3"
                          />
                        );
                      }
                      
                      // Default dot
                      return (
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={4} 
                          fill={colors[index]} 
                          strokeWidth={0}
                        />
                      );
                    }}
                    activeDot={{ r: 6, stroke: colors[index], strokeWidth: 2 }}
                    name={metricLabels[metric]}
                    data-testid="line"
                    strokeDasharray={predictions.length > 0 ? "5,5" : "0"}
                  />
                )
              ))}
            </LineChart>
          ) : (
            <AreaChart data={chartData} data-testid="area-chart">
              <CartesianGrid strokeDasharray="3 3" data-testid="cartesian-grid" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: _isMobile ? 10 : 12 }}
                angle={_isMobile ? -45 : 0}
                textAnchor={_isMobile ? 'end' : 'middle'}
                data-testid="x-axis"
              />
              <YAxis
                tick={{ fontSize: _isMobile ? 10 : 12 }}
                data-testid="y-axis"
              />
              <Tooltip
                content={<CustomTooltip />}
                data-testid="tooltip"
              />
              <Legend 
                wrapperStyle={{ 
                  fontSize: _isMobile ? '12px' : '14px',
                  paddingTop: '20px',
                }}
                data-testid="legend"
              />
              
              {metrics.map((metric, index) => (
                visibleMetrics[metric] && (
                  <Area
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stackId={metric === 'engagementRate' ? '2' : '1'}
                    stroke={colors[index]}
                    fill={colors[index]}
                    fillOpacity={0.6}
                    name={metricLabels[metric]}
                    data-testid="area"
                  />
                )
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Data Table for Accessibility */}
      {includeDataTable && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium mb-2">
            View Data Table
          </summary>
          <div className="overflow-x-auto">
            <table 
              className="min-w-full text-sm border-collapse border border-border"
              aria-label="Engagement Data"
            >
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-1 text-left">Date</th>
                  {metrics.map((metric) => (
                    <th key={metric} className="border border-border px-2 py-1 text-left">
                      {metricLabels[metric]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={row.date || `row-${index}`}>
                    <td className="border border-border px-2 py-1">
                      {format(new Date(row.date), 'MMM dd, yyyy')}
                    </td>
                    {metrics.map((metric) => (
                      <td key={metric} className="border border-border px-2 py-1">
                        {metric === 'engagementRate'
                          ? `${(row[metric] * 100).toFixed(1)}%`
                          : row[metric]?.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* Screen Reader Announcement */}
      <div 
        className="sr-only" 
        aria-live="polite"
        aria-label="Chart updated with new data"
      >
        Chart updated with {data.length} data points showing {metrics.join(', ')} metrics
      </div>
    </div>
  );
};

export default EngagementTrendChart;