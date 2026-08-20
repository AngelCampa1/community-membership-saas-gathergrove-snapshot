"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, LineChart, /* BarChart3, Calendar,
  Users, Star, Target, */ Activity, Download, Info, Zap
} from 'lucide-react';
import { EventTrendData, MemberEventEngagement } from './types';
import { CHART_COLOR_ARRAY, CHART_SEMANTIC } from '@/utils/chartColors';

interface EngagementTrendsChartProps {
  trendData: EventTrendData[];
  memberEngagement?: MemberEventEngagement[];
  timeRange?: number;
  loading?: boolean;
  onExport?: (format: 'csv' | 'png' | 'pdf') => void;
}

type MetricType = 'attendance' | 'events' | 'engagement' | 'rating' | 'revenue';
type ChartType = 'line' | 'bar' | 'area' | 'combined';
type TimeGrouping = 'monthly' | 'weekly' | 'quarterly';

interface TrendMetrics {
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  label: string;
}

const calculateTrendMetrics = (data: EventTrendData[], metric: MetricType): TrendMetrics => {
  if (data.length < 2) {
    return {
      currentValue: 0,
      previousValue: 0,
      change: 0,
      changePercentage: 0,
      trend: 'stable',
      label: metric
    };
  }

  const current = data[data.length - 1];
  const previous = data[data.length - 2];
  
  let currentValue: number, previousValue: number;
  
  switch (metric) {
    case 'attendance':
      currentValue = current.totalAttendance;
      previousValue = previous.totalAttendance;
      break;
    case 'events':
      currentValue = current.eventsHeld;
      previousValue = previous.eventsHeld;
      break;
    case 'engagement':
      currentValue = current.memberEngagement;
      previousValue = previous.memberEngagement;
      break;
    case 'rating':
      currentValue = current.averageRating;
      previousValue = previous.averageRating;
      break;
    case 'revenue':
      currentValue = current.revenueGenerated || 0;
      previousValue = previous.revenueGenerated || 0;
      break;
  }

  const change = currentValue - previousValue;
  const changePercentage = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  const trend = Math.abs(changePercentage) < 5 ? 'stable' : changePercentage > 0 ? 'up' : 'down';

  return {
    currentValue,
    previousValue,
    change,
    changePercentage,
    trend,
    label: metric
  };
};

const formatValue = (value: number, metric: MetricType): string => {
  switch (metric) {
    case 'attendance':
    case 'events':
      return Math.round(value).toLocaleString();
    case 'rating':
      return value.toFixed(1);
    case 'engagement':
      return Math.round(value).toString();
    case 'revenue':
      return `$${value.toFixed(0)}`;
    default:
      return value.toString();
  }
};

const getMetricColor = (metric: MetricType): string => {
  switch (metric) {
    case 'attendance': return CHART_COLOR_ARRAY[1]; // blue
    case 'events': return CHART_SEMANTIC.positive; // green
    case 'engagement': return CHART_COLOR_ARRAY[4]; // purple
    case 'rating': return CHART_COLOR_ARRAY[2]; // amber
    case 'revenue': return CHART_SEMANTIC.negative; // red
    default: return CHART_SEMANTIC.neutral;
  }
};

export function EngagementTrendsChart({ 
  trendData, 
  memberEngagement: _memberEngagement = [],
  timeRange: _timeRange = 90,
  loading = false,
  onExport
}: EngagementTrendsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [primaryMetric, setPrimaryMetric] = useState<MetricType>('attendance');
  const [secondaryMetric, setSecondaryMetric] = useState<MetricType>('events');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeGrouping, _setTimeGrouping] = useState<TimeGrouping>('monthly');
  const [showSecondaryAxis, setShowSecondaryAxis] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Process and group data based on time grouping
  const processedData = useMemo(() => {
    if (!trendData.length) return [];

    // For now, we'll use the data as-is since it's already monthly
    // In a real implementation, you might aggregate weekly data to monthly, etc.
    return trendData.map((item, index) => ({
      ...item,
      index,
      formattedDate: new Date(item.month).toLocaleDateString('en-US', { 
        month: 'short', 
        year: timeGrouping === 'quarterly' ? 'numeric' : undefined 
      })
    }));
  }, [trendData, timeGrouping]);

  // Calculate trend metrics for all metrics
  const metrics = useMemo(() => {
    const metricTypes: MetricType[] = ['attendance', 'events', 'engagement', 'rating', 'revenue'];
    return metricTypes.reduce((acc, metric) => {
      acc[metric] = calculateTrendMetrics(trendData, metric);
      return acc;
    }, {} as Record<MetricType, TrendMetrics>);
  }, [trendData]);

  // Calculate chart dimensions and scales
  const chartDimensions = {
    width: 600,
    height: 300,
    margin: { top: 20, right: 60, bottom: 40, left: 60 }
  };

  const chartWidth = chartDimensions.width - chartDimensions.margin.left - chartDimensions.margin.right;
  const chartHeight = chartDimensions.height - chartDimensions.margin.top - chartDimensions.margin.bottom;

  const primaryValues = processedData.map(d => {
    switch (primaryMetric) {
      case 'attendance': return d.totalAttendance;
      case 'events': return d.eventsHeld;
      case 'engagement': return d.memberEngagement;
      case 'rating': return d.averageRating;
      case 'revenue': return d.revenueGenerated || 0;
    }
  });

  const secondaryValues = processedData.map(d => {
    switch (secondaryMetric) {
      case 'attendance': return d.totalAttendance;
      case 'events': return d.eventsHeld;
      case 'engagement': return d.memberEngagement;
      case 'rating': return d.averageRating;
      case 'revenue': return d.revenueGenerated || 0;
    }
  });

  const primaryScale = {
    min: Math.min(...primaryValues) * 0.9,
    max: Math.max(...primaryValues) * 1.1
  };

  const secondaryScale = {
    min: Math.min(...secondaryValues) * 0.9,
    max: Math.max(...secondaryValues) * 1.1
  };

  // Generate chart paths and points
  const primaryPath = processedData.map((point, index) => {
    const x = (index / (processedData.length - 1)) * chartWidth;
    const y = chartHeight - ((primaryValues[index] - primaryScale.min) / (primaryScale.max - primaryScale.min)) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const secondaryPath = processedData.map((point, index) => {
    const x = (index / (processedData.length - 1)) * chartWidth;
    const y = chartHeight - ((secondaryValues[index] - secondaryScale.min) / (secondaryScale.max - secondaryScale.min)) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate area fill path for area chart
  const primaryAreaPath = processedData.length > 0 ? [
    primaryPath,
    `L ${chartWidth} ${chartHeight}`,
    `L 0 ${chartHeight}`,
    'Z'
  ].join(' ') : '';

  const handleExport = (format: 'csv' | 'png' | 'pdf') => {
    if (onExport) {
      onExport(format);
    } else if (format === 'csv') {
      const csvContent = [
        ['Month', 'Events Held', 'Total Attendance', 'Average Rating', 'Member Engagement', 'Revenue'],
        ...trendData.map(item => [
          item.month,
          item.eventsHeld,
          item.totalAttendance,
          item.averageRating,
          item.memberEngagement,
          item.revenueGenerated || 0
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `engagement-trends-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const TrendIndicator = ({ trend, change: _change, changePercentage }: {
    trend: 'up' | 'down' | 'stable';
    change: number;
    changePercentage: number;
  }) => {
    const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
    const colorClass = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
    
    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">
          {trend === 'stable' ? '±' : changePercentage > 0 ? '+' : ''}{changePercentage.toFixed(1)}%
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded"></div>
          <div className="h-4 w-72 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!trendData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Engagement Trends
          </CardTitle>
          <CardDescription>Track engagement patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No trend data available</p>
              <p className="text-sm">Data will appear as events are tracked over time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trend Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Object.entries(metrics).map(([key, metric]) => (
          <Card key={key} className={primaryMetric === key ? 'ring-2 ring-primary' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium capitalize">
                  {key === 'revenue' ? 'Revenue' : 
                   key === 'engagement' ? 'Engagement' : 
                   key === 'rating' ? 'Avg Rating' : key}
                </div>
                <TrendIndicator 
                  trend={metric.trend} 
                  change={metric.change} 
                  changePercentage={metric.changePercentage} 
                />
              </div>
              <div className="text-2xl font-bold" style={{ color: getMetricColor(key as MetricType) }}>
                {formatValue(metric.currentValue, key as MetricType)}
              </div>
              <div className="text-xs text-muted-foreground">
                Previous: {formatValue(metric.previousValue, key as MetricType)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Engagement Trends Analysis
              </CardTitle>
              <CardDescription>
                Track key engagement metrics over time to identify patterns and opportunities
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Select value={primaryMetric} onValueChange={(value: MetricType) => setPrimaryMetric(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
              
              {showSecondaryAxis && (
                <Select value={secondaryMetric} onValueChange={(value: MetricType) => setSecondaryMetric(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="combined">Combined</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecondaryAxis(!showSecondaryAxis)}
              >
                {showSecondaryAxis ? 'Single Axis' : 'Dual Axis'}
              </Button>
              
              <Select onValueChange={(value: 'csv' | 'png' | 'pdf') => handleExport(value)}>
                <SelectTrigger className="w-24">
                  <Download className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
              className="w-full h-80"
              style={{ maxHeight: '400px' }}
            >
              <defs>
                <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={getMetricColor(primaryMetric)} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={getMetricColor(primaryMetric)} stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={getMetricColor(secondaryMetric)} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={getMetricColor(secondaryMetric)} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              
              {/* Chart area */}
              <g transform={`translate(${chartDimensions.margin.left}, ${chartDimensions.margin.top})`}>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((percentage) => {
                  const y = (percentage / 100) * chartHeight;
                  return (
                    <line
                      key={percentage}
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  );
                })}
                
                {/* Vertical grid lines */}
                {processedData.map((_, index) => {
                  const x = (index / (processedData.length - 1)) * chartWidth;
                  return (
                    <line
                      key={`grid-line-${index}`}
                      x1={x}
                      y1="0"
                      x2={x}
                      y2={chartHeight}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  );
                })}
                
                {/* Primary metric chart */}
                {chartType === 'area' || chartType === 'combined' ? (
                  <path
                    d={primaryAreaPath}
                    fill="url(#primaryGradient)"
                    opacity="0.6"
                  />
                ) : null}
                
                {chartType === 'bar' ? (
                  processedData.map((point, index) => {
                    const x = (index / (processedData.length - 1)) * chartWidth;
                    const barHeight = ((primaryValues[index] - primaryScale.min) / (primaryScale.max - primaryScale.min)) * chartHeight;
                    const barWidth = chartWidth / processedData.length * 0.6;
                    
                    return (
                      <rect
                        key={`bar-${index}-${point.formattedDate}`}
                        x={x - barWidth / 2}
                        y={chartHeight - barHeight}
                        width={barWidth}
                        height={barHeight}
                        fill={getMetricColor(primaryMetric)}
                        opacity="0.8"
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="cursor-pointer"
                      />
                    );
                  })
                ) : (
                  <path
                    d={primaryPath}
                    fill="none"
                    stroke={getMetricColor(primaryMetric)}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}
                
                {/* Secondary metric chart */}
                {showSecondaryAxis && chartType !== 'bar' && (
                  <path
                    d={secondaryPath}
                    fill="none"
                    stroke={getMetricColor(secondaryMetric)}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
                
                {/* Data points */}
                {(chartType === 'line' || chartType === 'area' || chartType === 'combined') && 
                 processedData.map((point, index) => {
                  const x = (index / (processedData.length - 1)) * chartWidth;
                  const primaryY = chartHeight - ((primaryValues[index] - primaryScale.min) / (primaryScale.max - primaryScale.min)) * chartHeight;
                  const secondaryY = chartHeight - ((secondaryValues[index] - secondaryScale.min) / (secondaryScale.max - secondaryScale.min)) * chartHeight;
                  
                  return (
                    <g key={`point-${index}-${point.formattedDate}`}>
                      <circle
                        cx={x}
                        cy={primaryY}
                        r={hoveredPoint === index ? 6 : 4}
                        fill={getMetricColor(primaryMetric)}
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {showSecondaryAxis && (
                        <circle
                          cx={x}
                          cy={secondaryY}
                          r={hoveredPoint === index ? 5 : 3}
                          fill={getMetricColor(secondaryMetric)}
                          stroke="white"
                          strokeWidth="2"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredPoint(index)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      )}
                    </g>
                  );
                })}
                
                {/* Tooltip */}
                {hoveredPoint !== null && (
                  <g>
                    <foreignObject
                      x={(hoveredPoint / (processedData.length - 1)) * chartWidth - 60}
                      y={-10}
                      width="120"
                      height="80"
                    >
                      <div className="bg-white border rounded-lg shadow-lg p-2 text-xs">
                        <div className="font-medium">{processedData[hoveredPoint].formattedDate}</div>
                        <div style={{ color: getMetricColor(primaryMetric) }}>
                          {primaryMetric}: {formatValue(primaryValues[hoveredPoint], primaryMetric)}
                        </div>
                        {showSecondaryAxis && (
                          <div style={{ color: getMetricColor(secondaryMetric) }}>
                            {secondaryMetric}: {formatValue(secondaryValues[hoveredPoint], secondaryMetric)}
                          </div>
                        )}
                      </div>
                    </foreignObject>
                  </g>
                )}
              </g>
              
              {/* X-axis labels */}
              <g transform={`translate(${chartDimensions.margin.left}, ${chartDimensions.height - chartDimensions.margin.bottom + 20})`}>
                {processedData.map((point, index) => {
                  const x = (index / (processedData.length - 1)) * chartWidth;
                  return (
                    <text
                      key={`label-${index}-${point.formattedDate}`}
                      x={x}
                      y={0}
                      textAnchor="middle"
                      className="text-xs fill-muted-foreground"
                    >
                      {point.formattedDate}
                    </text>
                  );
                })}
              </g>
              
              {/* Y-axis labels */}
              <g transform={`translate(${chartDimensions.margin.left - 10}, ${chartDimensions.margin.top})`}>
                {[0, 25, 50, 75, 100].map((percentage) => {
                  const y = (percentage / 100) * chartHeight;
                  const value = primaryScale.min + (primaryScale.max - primaryScale.min) * (1 - percentage / 100);
                  return (
                    <text
                      key={percentage}
                      x={0}
                      y={y + 4}
                      textAnchor="end"
                      className="text-xs fill-muted-foreground"
                    >
                      {formatValue(value, primaryMetric)}
                    </text>
                  );
                })}
              </g>
              
              {/* Secondary Y-axis labels */}
              {showSecondaryAxis && (
                <g transform={`translate(${chartDimensions.width - chartDimensions.margin.right + 10}, ${chartDimensions.margin.top})`}>
                  {[0, 25, 50, 75, 100].map((percentage) => {
                    const y = (percentage / 100) * chartHeight;
                    const value = secondaryScale.min + (secondaryScale.max - secondaryScale.min) * (1 - percentage / 100);
                    return (
                      <text
                        key={percentage}
                        x={0}
                        y={y + 4}
                        textAnchor="start"
                        className="text-xs"
                        fill={getMetricColor(secondaryMetric)}
                      >
                        {formatValue(value, secondaryMetric)}
                      </text>
                    );
                  })}
                </g>
              )}
            </svg>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-1 rounded" 
                  style={{ backgroundColor: getMetricColor(primaryMetric) }}
                />
                <span className="text-sm capitalize">{primaryMetric}</span>
              </div>
              {showSecondaryAxis && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-1 rounded border-dashed border-2" 
                    style={{ borderColor: getMetricColor(secondaryMetric) }}
                  />
                  <span className="text-sm capitalize">{secondaryMetric}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights and Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Trend Insights
          </CardTitle>
          <CardDescription>
            Key observations and recommendations based on engagement trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Performance Highlights</h4>
              {Object.entries(metrics)
                .filter(([_, metric]) => metric.trend === 'up' && metric.changePercentage > 10)
                .slice(0, 3)
                .map(([key, metric]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="capitalize">{key}</span>
                    <span className="text-success">
                      +{metric.changePercentage.toFixed(1)}%
                    </span>
                    <Badge variant="secondary" className="ml-auto">
                      Strong Growth
                    </Badge>
                  </div>
                ))}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Areas for Attention</h4>
              {Object.entries(metrics)
                .filter(([_, metric]) => metric.trend === 'down' && metric.changePercentage < -5)
                .slice(0, 3)
                .map(([key, metric]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="capitalize">{key}</span>
                    <span className="text-destructive">
                      {metric.changePercentage.toFixed(1)}%
                    </span>
                    <Badge variant="destructive" className="ml-auto">
                      Needs Focus
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h5 className="font-semibold text-sm mb-1">Trend Analysis Summary</h5>
                <p className="text-sm text-muted-foreground">
                  Based on {trendData.length} months of data, your engagement trends show {' '}
                  {metrics.attendance.trend === 'up' ? 'positive growth' : 
                   metrics.attendance.trend === 'down' ? 'declining patterns' : 'stable performance'} {' '}
                  in attendance with an average of {formatValue(metrics.attendance.currentValue, 'attendance')} {' '}
                  attendees per period. Consider focusing on {' '}
                  {Object.entries(metrics).find(([_, m]) => m.trend === 'down')?.[0] || 'maintaining current momentum'} {' '}
                  to optimize overall engagement.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}