'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  BarChart3,
  LineChart as LineChartIcon,
  Download,
  Target,
  AlertCircle,
  Brain,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { ROIMetric } from '../../types/analytics';
import premiumAnalyticsService from '../../services/premiumAnalyticsService';
import { CHART_COLOR_ARRAY, CHART_SEMANTIC, withOpacity } from '@/utils/chartColors';

// Register Chart.js components - conditionally to avoid conflicts in tests
if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
  );
}

interface ROITrackerProps {
  data: ROIMetric[];
  clubId?: number;
  userTier?: 'basic' | 'pro' | 'unlimited';
  chartType?: 'line' | 'bar';
  showChartToggle?: boolean;
  showMetricControls?: boolean;
  showPeriodSelector?: boolean;
  showPerformanceIndicators?: boolean;
  showRecommendations?: boolean;
  targetROI?: number;
  currency?: 'USD' | 'EUR' | 'GBP';
  allowExport?: boolean;
  onExport?: (data: ROIMetric[], format: string) => void;
  onPeriodClick?: (period: string) => void;
  loading?: boolean;
  error?: string;
  lastUpdated?: Date;
  height?: number;
  responsive?: boolean;
  includeDataTable?: boolean;
  useThemeColors?: boolean;
  className?: string;
  // Advanced features for unlimited tier
  enableForecasting?: boolean;
  enableGoalTracking?: boolean;
  enableRealTimeUpdates?: boolean;
  enableAdvancedAnalytics?: boolean;
  forecastHorizon?: number;
}

interface MetricVisibility {
  revenue: boolean;
  costs: boolean;
  profit: boolean;
  roi: boolean;
}

const _currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const ROITracker: React.FC<ROITrackerProps> = ({
  data,
  clubId,
  userTier = 'basic',
  chartType = 'line',
  showChartToggle = false,
  showMetricControls = false,
  showPeriodSelector = false,
  showPerformanceIndicators = false,
  showRecommendations = false,
  targetROI,
  currency = 'USD',
  allowExport = false,
  onExport,
  onPeriodClick,
  loading = false,
  error,
  lastUpdated,
  height = 400,
  responsive = true,
  includeDataTable = false,
  useThemeColors = false,
  className,
  enableForecasting = false,
  enableGoalTracking = false,
  enableRealTimeUpdates: _enableRealTimeUpdates = false,
  enableAdvancedAnalytics = false,
  forecastHorizon = 90,
}) => {
  const [activeChart, setActiveChart] = useState<'line' | 'bar'>(chartType);
  const [visibleMetrics, setVisibleMetrics] = useState<MetricVisibility>({
    revenue: true,
    costs: true,
    profit: true,
    roi: true,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'lastMonth' | 'lastQuarter'>('all');
  
  // Advanced features state (unlimited tier only)
  const [showForecasting, setShowForecasting] = useState(enableForecasting);
  const [showGoalProgress, setShowGoalProgress] = useState(enableGoalTracking);
  const [forecastPeriods, _setForecastPeriods] = useState(forecastHorizon);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  
  // Check if user has unlimited tier access
  const isUnlimited = userTier === 'unlimited';

  // Currency formatter
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, [currency]);

  // Fetch predictive analytics for ROI forecasting (unlimited tier only)
  const predictionQuery = useQuery({
    queryKey: ['roi-predictions', clubId, forecastPeriods],
    queryFn: () => premiumAnalyticsService.getPredictiveAnalytics(clubId!, 'revenue', forecastPeriods),
    enabled: isUnlimited && enableForecasting && !!clubId && showForecasting,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch goal tracking data (unlimited tier only)
  const goalQuery = useQuery({
    queryKey: ['goal-tracking', clubId],
    queryFn: () => premiumAnalyticsService.getGoalTracking(clubId!),
    enabled: isUnlimited && enableGoalTracking && !!clubId && showGoalProgress,
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch automated insights for ROI analysis (unlimited tier only)
  const insightsQuery = useQuery({
    queryKey: ['roi-insights', clubId],
    queryFn: () => premiumAnalyticsService.getAutomatedInsights(clubId!, 'performance'),
    enabled: isUnlimited && enableAdvancedAnalytics && !!clubId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const roiPredictions = predictionQuery?.data;
  const goalTrackingData = goalQuery?.data;
  const automatedInsights = insightsQuery?.data;

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    if (selectedPeriod === 'all') return data;
    
    const now = new Date();
    const cutoffDate = selectedPeriod === 'lastMonth' 
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    return data.filter(item => new Date(item.period) >= cutoffDate);
  }, [data, selectedPeriod]);

  // Calculate totals and averages
  const totals = useMemo(() => {
    if (!filteredData.length) return null;

    const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
    const totalCosts = filteredData.reduce((sum, item) => sum + item.costs, 0);
    const totalProfit = filteredData.reduce((sum, item) => sum + item.profit, 0);
    const averageROI = filteredData.reduce((sum, item) => sum + item.roi, 0) / filteredData.length;

    return {
      totalRevenue,
      totalCosts,
      totalProfit,
      averageROI,
    };
  }, [filteredData]);

  // Performance analysis
  const performanceAnalysis = useMemo(() => {
    if (!filteredData.length) return null;

    const bestPeriod = filteredData.reduce((best, current) => 
      current.roi > best.roi ? current : best
    );
    
    const worstPeriod = filteredData.reduce((worst, current) => 
      current.roi < worst.roi ? current : worst
    );

    const trendDirection = filteredData.length > 1 
      ? filteredData[filteredData.length - 1].roi > filteredData[0].roi 
        ? 'up' 
        : filteredData[filteredData.length - 1].roi < filteredData[0].roi 
          ? 'down' 
          : 'stable'
      : 'stable';

    return {
      bestPeriod,
      worstPeriod,
      trendDirection,
    };
  }, [filteredData]);

  // Chart data preparation with forecasting
  const chartData = useMemo(() => {
    const labels = filteredData.map(item => format(new Date(item.period), 'MMM yyyy'));
    
    // Add forecasted periods if enabled and available
    let forecastLabels: string[] = [];
    let forecastData: number[] = [];
    
    if (isUnlimited && showForecasting && roiPredictions?.predictions) {
      forecastLabels = roiPredictions.predictions.map(pred => 
        format(new Date(pred.date), 'MMM yyyy')
      );
      forecastData = roiPredictions.predictions.map(pred => pred.predicted);
    }
    
    const allLabels = [...labels, ...forecastLabels];
    const datasets = [];

    if (visibleMetrics.revenue) {
      const revenueData = filteredData.map(item => item.revenue);
      const extendedRevenueData = [...revenueData, ...Array(forecastData.length).fill(null)];

      datasets.push({
        label: 'Revenue',
        data: extendedRevenueData,
        borderColor: useThemeColors ? 'hsl(var(--primary))' : CHART_SEMANTIC.positive,
        backgroundColor: useThemeColors ? 'hsl(var(--primary) / 0.1)' : withOpacity(CHART_SEMANTIC.positive, 0.1),
        hidden: false,
        yAxisID: 'y',
      });

      // Add forecasted revenue if available
      if (isUnlimited && showForecasting && forecastData.length > 0) {
        const forecastRevenueData = [...Array(revenueData.length).fill(null), ...forecastData];
        datasets.push({
          label: 'Revenue Forecast',
          data: forecastRevenueData,
          borderColor: useThemeColors ? 'hsl(var(--primary))' : CHART_SEMANTIC.positive,
          backgroundColor: useThemeColors ? 'hsl(var(--primary) / 0.05)' : withOpacity(CHART_SEMANTIC.positive, 0.05),
          borderDash: [5, 5],
          pointBackgroundColor: 'transparent',
          pointBorderColor: 'transparent',
          hidden: false,
          yAxisID: 'y',
        });
      }
    }

    if (visibleMetrics.costs) {
      datasets.push({
        label: 'Costs',
        data: filteredData.map(item => item.costs),
        borderColor: useThemeColors ? 'hsl(var(--destructive))' : CHART_SEMANTIC.negative,
        backgroundColor: useThemeColors ? 'hsl(var(--destructive) / 0.1)' : withOpacity(CHART_SEMANTIC.negative, 0.1),
        hidden: !visibleMetrics.costs,
        yAxisID: 'y',
      });
    }

    if (visibleMetrics.profit) {
      datasets.push({
        label: 'Profit',
        data: filteredData.map(item => item.profit),
        borderColor: useThemeColors ? 'hsl(var(--primary))' : CHART_COLOR_ARRAY[1], // blue
        backgroundColor: useThemeColors ? 'hsl(var(--primary) / 0.1)' : withOpacity(CHART_COLOR_ARRAY[1], 0.1),
        hidden: false,
        yAxisID: 'y',
      });
    }

    if (visibleMetrics.roi) {
      datasets.push({
        label: 'ROI (%)',
        data: filteredData.map(item => item.roi),
        borderColor: useThemeColors ? 'hsl(var(--warning))' : CHART_SEMANTIC.warning,
        backgroundColor: useThemeColors ? 'hsl(var(--warning) / 0.1)' : withOpacity(CHART_SEMANTIC.warning, 0.1),
        hidden: false,
        yAxisID: 'y1',
      });
    }

    return { labels: allLabels, datasets };
  }, [filteredData, visibleMetrics, useThemeColors, isUnlimited, showForecasting, roiPredictions]);

  // Chart options
  const chartOptions: ChartOptions<'line' | 'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y ?? 0;

            if (label.includes('ROI')) {
              return `${label}: ${value.toFixed(1)}%`;
            }
            return `${label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Period',
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: `Amount (${currency})`,
        },
        ticks: {
          callback: (value) => formatCurrency(Number(value)),
        },
      },
      y1: {
        type: 'linear',
        display: visibleMetrics.roi,
        position: 'right',
        title: {
          display: true,
          text: 'ROI (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  }), [currency, formatCurrency, visibleMetrics.roi]);

  // Handle metric toggle
  const handleMetricToggle = (metric: keyof MetricVisibility) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  // Handle export
  const handleExport = (format: string) => {
    if (onExport) {
      onExport(filteredData, format);
    }
  };

  // Handle period card click
  const handlePeriodCardClick = (period: string) => {
    if (onPeriodClick) {
      onPeriodClick(period);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('space-y-4', className)} data-testid="roi-loading-skeleton">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
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
          No ROI data available for the selected period
        </div>
      </Card>
    );
  }

  return (
    <div 
      className={cn(
        'space-y-6',
        responsive && 'mobile-responsive',
        useThemeColors && 'theme-adaptive',
        className
      )}
      data-testid="roi-tracker"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="roi-metrics-container">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold" aria-label="Total revenue metric">
                  {totals ? formatCurrency(totals.totalRevenue) : '-'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Costs</p>
                <p className="text-2xl font-bold">
                  {totals ? formatCurrency(totals.totalCosts) : '-'}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold">
                  {totals ? formatCurrency(totals.totalProfit) : '-'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average ROI</p>
                <p className="text-2xl font-bold">
                  {totals ? `${totals.averageROI.toFixed(1)}%` : '-'}
                </p>
                {targetROI && totals && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Target ROI: {targetROI}%
                  </p>
                )}
              </div>
              <Target className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Period Selector */}
          {showPeriodSelector && (
            <Select value={selectedPeriod} onValueChange={(value: 'all' | 'lastMonth' | 'lastQuarter') => setSelectedPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue aria-label="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="lastQuarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
          )}

          {lastUpdated && (
            <div className="text-sm text-muted-foreground">
              Last updated: {format(lastUpdated, 'MMM dd, HH:mm')}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Advanced Features for Expand Tier */}
          {isUnlimited && enableForecasting && (
            <div className="flex items-center space-x-2 mr-4">
              <Switch
                id="enable-forecasting"
                checked={showForecasting}
                onCheckedChange={setShowForecasting}
              />
              <Label htmlFor="enable-forecasting" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                <Brain className="h-4 w-4" />
                Forecasting
              </Label>
            </div>
          )}
          
          {isUnlimited && enableGoalTracking && (
            <div className="flex items-center space-x-2 mr-4">
              <Switch
                id="show-goal-progress"
                checked={showGoalProgress}
                onCheckedChange={setShowGoalProgress}
              />
              <Label htmlFor="show-goal-progress" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                <Target className="h-4 w-4" />
                Goals
              </Label>
            </div>
          )}

          {/* Chart Type Toggle */}
          {showChartToggle && (
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
                variant={activeChart === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveChart('bar')}
                aria-label="Bar Chart"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Export Button */}
          {allowExport && (
            <div className="relative group">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export ROI Data
              </Button>
              <div className="absolute right-0 mt-1 w-32 bg-background border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="p-1">
                  <button
                    className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded"
                    onClick={() => handleExport('csv')}
                  >
                    CSV
                  </button>
                  <button
                    className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded"
                    onClick={() => handleExport('excel')}
                  >
                    Excel
                  </button>
                  <button
                    className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded"
                    onClick={() => handleExport('pdf')}
                  >
                    PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metric Controls */}
      {showMetricControls && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-revenue"
                  checked={visibleMetrics.revenue}
                  onCheckedChange={() => handleMetricToggle('revenue')}
                />
                <Label htmlFor="show-revenue" className="text-sm font-medium cursor-pointer">
                  Show Revenue
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-costs"
                  checked={visibleMetrics.costs}
                  onCheckedChange={() => handleMetricToggle('costs')}
                />
                <Label htmlFor="show-costs" className="text-sm font-medium cursor-pointer">
                  Show Costs
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-profit"
                  checked={visibleMetrics.profit}
                  onCheckedChange={() => handleMetricToggle('profit')}
                />
                <Label htmlFor="show-profit" className="text-sm font-medium cursor-pointer">
                  Show Profit
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-roi"
                  checked={visibleMetrics.roi}
                  onCheckedChange={() => handleMetricToggle('roi')}
                />
                <Label htmlFor="show-roi" className="text-sm font-medium cursor-pointer">
                  Show ROI
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardContent className="p-6">
          <div style={{ height }} aria-label="ROI performance chart" role="img">
            {activeChart === 'line' ? (
              <Line data={chartData} options={chartOptions as ChartOptions<'line'>} data-testid="roi-line-chart" />
            ) : (
              <Bar data={chartData} options={chartOptions as ChartOptions<'bar'>} data-testid="roi-bar-chart" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Indicators */}
      {showPerformanceIndicators && performanceAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="best-performing-period">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Best Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{performanceAnalysis.bestPeriod.period}</p>
                <p className="text-2xl font-bold text-success">
                  {performanceAnalysis.bestPeriod.roi.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(performanceAnalysis.bestPeriod.profit)} profit
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="worst-performing-period">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Needs Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{performanceAnalysis.worstPeriod.period}</p>
                <p className="text-2xl font-bold text-destructive">
                  {performanceAnalysis.worstPeriod.roi.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(performanceAnalysis.worstPeriod.profit)} profit
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="roi-trend-direction">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {performanceAnalysis.trendDirection === 'up' ? (
                  <TrendingUp className="h-8 w-8 text-success" />
                ) : performanceAnalysis.trendDirection === 'down' ? (
                  <TrendingDown className="h-8 w-8 text-destructive" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <div className="h-4 w-4 bg-muted-foreground rounded-full" />
                  </div>
                )}
                <span className="text-lg font-medium capitalize">
                  {performanceAnalysis.trendDirection}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goal Tracking for Expand Tier */}
      {isUnlimited && showGoalProgress && goalTrackingData && goalTrackingData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Progress
            </h3>
            {goalTrackingData.length > 1 && (
              <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Goals</SelectItem>
                  {goalTrackingData.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalTrackingData
              .filter(goal => !selectedGoal || goal.id === selectedGoal)
              .map((goal) => (
                <Card key={goal.id} data-testid={`goal-${goal.id}`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{goal.name}</h4>
                        <span className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          goal.status === 'completed' && 'bg-success/10 text-success',
                          goal.status === 'on_track' && 'bg-primary/10 text-primary',
                          goal.status === 'at_risk' && 'bg-warning/10 text-warning',
                          goal.status === 'behind' && 'bg-destructive/10 text-destructive'
                        )}>
                          {goal.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress: {formatCurrency(goal.current)}</span>
                          <span>Target: {formatCurrency(goal.target)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={cn(
                              'h-2 rounded-full transition-all',
                              goal.status === 'completed' && 'bg-success',
                              goal.status === 'on_track' && 'bg-primary',
                              goal.status === 'at_risk' && 'bg-warning',
                              goal.status === 'behind' && 'bg-destructive'
                            )}
                            style={{ width: `${Math.min(goal.progress * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{(goal.progress * 100).toFixed(1)}% complete</span>
                          <span>Due: {format(goal.deadline, 'MMM dd')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </div>
        </div>
      )}

      {/* Forecasting Display for Expand Tier */}
      {isUnlimited && showForecasting && roiPredictions && (
        <Card data-testid="roi-forecasting">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5" />
              ROI Forecasting ({forecastPeriods} days ahead)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Prediction Confidence</p>
                  <p className="text-2xl font-bold text-primary">
                    {(roiPredictions.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="text-lg font-medium">{roiPredictions.method}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Forecast Horizon</p>
                  <p className="text-lg font-medium">{forecastPeriods} days</p>
                </div>
              </div>
              
              {roiPredictions.factors && roiPredictions.factors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key Factors</h4>
                  <div className="space-y-2">
                    {roiPredictions.factors.slice(0, 3).map((factor, index) => (
                      <div key={factor.name || `factor-${index}`} className="flex items-center justify-between">
                        <span className="text-sm">{factor.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1">
                            <div
                              className="h-1 rounded-full"
                              style={{
                                width: `${Math.abs(factor.impact) * 100}%`,
                                backgroundColor: CHART_SEMANTIC.info
                              }}
                            />
                          </div>
                          <span className={cn(
                            'text-xs',
                            factor.impact > 0 ? 'text-success' : 'text-destructive'
                          )}>
                            {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automated Insights for Expand Tier */}
      {isUnlimited && enableAdvancedAnalytics && automatedInsights && automatedInsights.length > 0 && (
        <Card data-testid="roi-automated-insights">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {automatedInsights.slice(0, 3).map((insight, index) => (
                <div key={insight.title?.substring(0, 30) || `insight-${index}`} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          insight.type === 'insight' && 'bg-primary/10 text-primary',
                          insight.type === 'recommendation' && 'bg-success/10 text-success',
                          insight.type === 'alert' && 'bg-destructive/10 text-destructive',
                          insight.type === 'trend' && 'bg-secondary/10 text-secondary'
                        )}>
                          {insight.type}
                        </span>
                        <span className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          insight.impact === 'high' && 'bg-destructive/10 text-destructive',
                          insight.impact === 'medium' && 'bg-warning/10 text-warning',
                          insight.impact === 'low' && 'bg-muted text-muted-foreground'
                        )}>
                          {insight.impact} impact
                        </span>
                      </div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                      {insight.actionItems && insight.actionItems.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Action Items:</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                            {insight.actionItems.slice(0, 2).map((item, itemIndex) => (
                              <li key={itemIndex}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p className="font-medium">{(insight.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Target ROI vs Actual */}
      {targetROI && totals && (
        <Card data-testid="roi-vs-target">
          <CardHeader>
            <CardTitle className="text-base">ROI vs Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Target ROI:</span>
                <span className="font-medium">{targetROI}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Actual ROI:</span>
                <span className={cn(
                  'font-medium',
                  totals.averageROI >= targetROI ? 'text-success' : 'text-destructive'
                )}>
                  {totals.averageROI.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    totals.averageROI >= targetROI ? 'bg-success' : 'bg-destructive'
                  )}
                  style={{
                    width: `${Math.min((totals.averageROI / targetROI) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {showRecommendations && (
        <Card data-testid="roi-recommendations">
          <CardHeader>
            <CardTitle className="text-base">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-medium">Cost Optimization</p>
                  <p className="text-sm text-muted-foreground">
                    Review expense categories to identify potential savings opportunities
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-success mt-2" />
                <div>
                  <p className="font-medium">Revenue Enhancement</p>
                  <p className="text-sm text-muted-foreground">
                    Focus on high-performing periods to replicate success factors
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Cards for Click */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {filteredData.map((item) => (
          <Card
            key={item.period}
            className={cn(
              'cursor-pointer hover:bg-muted/50 transition-colors',
              onPeriodClick && 'hover:border-primary'
            )}
            onClick={() => handlePeriodCardClick(item.period)}
            data-testid={`period-${item.period}`}
          >
            <CardContent className="p-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {format(new Date(item.period), 'MMM yyyy')}
                </p>
                <p className="text-sm font-bold">
                  {item.roi.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1" data-testid="trend-indicator">
                  {item.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : item.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  ) : (
                    <div className="w-3 h-3" />
                  )}
                  <span className="text-xs text-muted-foreground capitalize">
                    {item.trend}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Table for Accessibility */}
      {includeDataTable && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium mb-2">
            View ROI Data Table
          </summary>
          <div className="overflow-x-auto">
            <table
              className="min-w-full text-sm border-collapse border border-border"
              aria-label="ROI Data"
            >
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-2 py-1 text-left">Period</th>
                  <th className="border border-border px-2 py-1 text-left">Revenue</th>
                  <th className="border border-border px-2 py-1 text-left">Costs</th>
                  <th className="border border-border px-2 py-1 text-left">Profit</th>
                  <th className="border border-border px-2 py-1 text-left">ROI</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={row.period || `row-${index}`}>
                    <td className="border border-border px-2 py-1">
                      {format(new Date(row.period), 'MMM yyyy')}
                    </td>
                    <td className="border border-border px-2 py-1">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="border border-border px-2 py-1">
                      {formatCurrency(row.costs)}
                    </td>
                    <td className="border border-border px-2 py-1">
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="border border-border px-2 py-1">
                      {row.roi.toFixed(1)}%
                    </td>
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
        aria-label="ROI data updated"
      >
        ROI tracker updated with {filteredData.length} periods. 
        Average ROI: {totals?.averageROI.toFixed(1)}%
      </div>
    </div>
  );
};

export default ROITracker;
