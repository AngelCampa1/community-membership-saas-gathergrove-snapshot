"use client";

import React, { useState, useEffect as _useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Users, Calendar, TrendingUp, Download, Eye, EyeOff,
  BarChart3, LineChart, PieChart, Activity, Info as _Info
} from 'lucide-react';
import { EventAttendanceData, EventTrendData } from './types';
import { CHART_SEMANTIC, getChartColor } from '@/utils/chartColors';

interface EventParticipationChartProps {
  data: EventAttendanceData[];
  trendData?: EventTrendData[];
  timeRange?: number;
  loading?: boolean;
  onExport?: (format: 'csv' | 'pdf' | 'png') => void;
}

type ChartType = 'bar' | 'line' | 'pie' | 'area';
type MetricType = 'attendance' | 'rate' | 'capacity';

export function EventParticipationChart({ 
  data, 
  trendData = [], 
  timeRange = 90,
  loading = false,
  onExport
}: EventParticipationChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [metricType, setMetricType] = useState<MetricType>('attendance');
  const [showDetails, setShowDetails] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventAttendanceData | null>(null);

  // Calculate chart metrics
  const chartMetrics = React.useMemo(() => {
    if (!data?.length) return null;

    const totalEvents = data.length;
    const avgAttendance = data.reduce((sum, event) => sum + event.actualAttendance, 0) / totalEvents;
    const avgRate = data.reduce((sum, event) => sum + event.attendanceRate, 0) / totalEvents;
    const highestAttendance = Math.max(...data.map(e => e.actualAttendance));
    const lowestAttendance = Math.min(...data.map(e => e.actualAttendance));
    
    // Group by category for insights
    const categoryData = data.reduce((acc, event) => {
      const category = event.category || 'Other';
      if (!acc[category]) {
        acc[category] = { count: 0, totalAttendance: 0, totalCapacity: 0 };
      }
      acc[category].count++;
      acc[category].totalAttendance += event.actualAttendance;
      acc[category].totalCapacity += event.expectedAttendance;
      return acc;
    }, {} as Record<string, { count: number; totalAttendance: number; totalCapacity: number; }>);

    // Calculate category performance
    const categoryPerformance = Object.entries(categoryData).map(([category, stats]) => ({
      category,
      avgAttendance: stats.totalAttendance / stats.count,
      avgRate: (stats.totalAttendance / stats.totalCapacity) * 100,
      eventCount: stats.count
    })).sort((a, b) => b.avgRate - a.avgRate);

    return {
      totalEvents,
      avgAttendance: Math.round(avgAttendance),
      avgRate: Math.round(avgRate * 10) / 10,
      highestAttendance,
      lowestAttendance,
      categoryPerformance
    };
  }, [data]);

  // Generate chart data based on type and metric
  const chartData = React.useMemo(() => {
    if (!data?.length) return [];

    switch (chartType) {
      case 'bar':
        return data.slice(0, 10).map(event => ({
          name: event.eventName.length > 20 ? event.eventName.substring(0, 20) + '...' : event.eventName,
          fullName: event.eventName,
          value: metricType === 'attendance' ? event.actualAttendance : 
                metricType === 'rate' ? event.attendanceRate : 
                event.expectedAttendance,
          expected: event.expectedAttendance,
          actual: event.actualAttendance,
          rate: event.attendanceRate,
          category: event.category,
          date: event.eventDate
        }));
      
      case 'pie':
        if (!chartMetrics) return [];
        return chartMetrics.categoryPerformance.map((cat, index) => ({
          name: cat.category,
          value: cat.eventCount,
          percentage: Math.round((cat.eventCount / chartMetrics.totalEvents) * 100),
          color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
        }));
      
      case 'line':
        return trendData.map(trend => ({
          name: trend.month,
          value: metricType === 'attendance' ? trend.totalAttendance : 
                metricType === 'rate' ? trend.averageRating * 20 : // Scale rating to percentage
                trend.eventsHeld * 50, // Estimated capacity
          events: trend.eventsHeld,
          attendance: trend.totalAttendance,
          rating: trend.averageRating
        }));
        
      default:
        return [];
    }
  }, [data, chartType, metricType, chartMetrics, trendData]);

  const handleExport = (format: 'csv' | 'pdf' | 'png') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export functionality
      if (format === 'csv') {
        const csvContent = [
          ['Event Name', 'Date', 'Expected', 'Actual', 'Rate %', 'Category'],
          ...data.map(event => [
            event.eventName,
            new Date(event.eventDate).toLocaleDateString(),
            event.expectedAttendance,
            event.actualAttendance,
            event.attendanceRate.toFixed(1),
            event.category
          ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event-participation-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No data available for visualization</p>
            <p className="text-sm mt-1">No events to display</p>
          </div>
        </div>
      );
    }

    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Error loading chart data</p>
            <p className="text-sm mt-1">Unable to process event data</p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'bar':
        const maxValue = Math.max(...chartData.map(d => d.value));
        return (
          <div className="space-y-3">
            {chartData.map((item, index) => (
              <div
                key={'fullName' in item ? item.fullName : item.name || `item-${index}`}
                className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors"
                onClick={() => setSelectedEvent(data.find(e => e.eventName === ('fullName' in item ? item.fullName : item.name)) || null)}
                role="button"
                tabIndex={0}
                aria-label={`Event: ${'fullName' in item ? item.fullName : item.name}, ${metricType}: ${item.value}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate" title={'fullName' in item ? item.fullName : item.name}>
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {'date' in item ? `${new Date(item.date).toLocaleDateString()} • ${item.category}` : 'General Event'}
                  </div>
                </div>
                <div className="flex-shrink-0 w-32">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{item.value}</span>
                    <span className="text-muted-foreground">
                      {metricType === 'rate' ? '%' : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(item.value / maxValue) * 100}%`,
                        backgroundColor: ('rate' in item && item.rate >= 80) ? CHART_SEMANTIC.positive :
                                       ('rate' in item && item.rate >= 60) ? CHART_SEMANTIC.warning : CHART_SEMANTIC.negative
                      }}
                    />
                  </div>
                </div>
                <div className="flex-shrink-0 text-right min-w-16">
                  <div className="text-sm font-medium">
                    {'rate' in item ? `${item.rate.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {'actual' in item && 'expected' in item ? `${item.actual}/${item.expected}` : item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'pie':
        return (
          <div className="grid grid-cols-2 gap-4 h-64">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {chartData.reduce((acc, item, index) => {
                    const startAngle = acc.currentAngle;
                    const angleSize = (item.value / (chartMetrics?.totalEvents ?? 1)) * 360;
                    const endAngle = startAngle + angleSize;
                    
                    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                    
                    const largeArc = angleSize > 180 ? 1 : 0;
                    
                    const path = [
                      'M', 50, 50,
                      'L', x1, y1,
                      'A', 40, 40, 0, largeArc, 1, x2, y2,
                      'Z'
                    ].join(' ');
                    
                    acc.elements.push(
                      <path
                        key={`path-${index}-${'fullName' in item ? item.fullName : item.name}`}
                        d={path}
                        fill={'color' in item ? item.color : '#3b82f6'}
                        stroke="#fff"
                        strokeWidth="1"
                        className="hover:opacity-80 cursor-pointer"
                        aria-label={`${item.name}: ${'percentage' in item ? `${item.percentage}%` : item.value}`}
                      />
                    );
                    
                    acc.currentAngle = endAngle;
                    return acc;
                  }, { elements: [] as React.ReactElement[], currentAngle: 0 }).elements}
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              {chartData.map((item, index) => (
                <div key={'fullName' in item ? item.fullName : item.name || `legend-${index}`} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-sm flex-shrink-0" 
                    style={{ backgroundColor: ('color' in item ? item.color : '#3b82f6') }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.value} events ({'percentage' in item ? `(${item.percentage}%)` : ''})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'line':
        const lineMaxValue = Math.max(...chartData.map(d => d.value));
        return (
          <div className="h-64 relative">
            <svg viewBox="0 0 400 200" className="w-full h-full">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={getChartColor(1)} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={getChartColor(1)} stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(y => (
                <line 
                  key={y}
                  x1="0" 
                  y1={y * 2} 
                  x2="400" 
                  y2={y * 2}
                  stroke="#e5e7eb" 
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}
              
              {/* Data line */}
              <path
                d={chartData.map((point, index) => {
                  const x = (index / (chartData.length - 1)) * 380 + 10;
                  const y = 180 - (point.value / lineMaxValue) * 160;
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke={getChartColor(1)}
                strokeWidth="2"
              />
              
              {/* Area fill */}
              <path
                d={[
                  chartData.map((point, index) => {
                    const x = (index / (chartData.length - 1)) * 380 + 10;
                    const y = 180 - (point.value / lineMaxValue) * 160;
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' '),
                  `L ${380 + 10} 180`,
                  `L 10 180`,
                  'Z'
                ].join(' ')}
                fill="url(#lineGradient)"
              />
              
              {/* Data points */}
              {chartData.map((point, index) => {
                const x = (index / (chartData.length - 1)) * 380 + 10;
                const y = 180 - (point.value / lineMaxValue) * 160;
                return (
                  <circle
                    key={`point-${index}-${point.name}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={getChartColor(1)}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:r-6 cursor-pointer transition-all"
                    aria-label={`${point.name}: ${point.value}`}
                  />
                );
              })}
            </svg>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
              {chartData.map((point, index) => (
                <span key={point.name || `label-${index}`}>{point.name}</span>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded"></div>
          <div className="h-4 w-72 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="event-participation-chart">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Event Participation Analysis
              </CardTitle>
              <CardDescription>
                Visual representation of event attendance and engagement patterns
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Bar
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      Line
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Pie
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={metricType} onValueChange={(value: MetricType) => setMetricType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="rate">Rate %</SelectItem>
                  <SelectItem value="capacity">Capacity</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                aria-label={showDetails ? 'Hide details' : 'Show details'}
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              
              {onExport && (
                <Select onValueChange={(value: 'csv' | 'pdf' | 'png') => handleExport(value)}>
                  <SelectTrigger className="w-24">
                    <Download className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div 
            ref={chartRef} 
            role="img" 
            aria-label={`Event participation ${chartType} chart showing ${data?.length || 0} events`}
            className="chart-container"
          >
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      {/* Chart metrics and insights */}
      {showDetails && chartMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chartMetrics.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Last {timeRange} days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Avg Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {chartMetrics.avgAttendance}
              </div>
              <p className="text-xs text-muted-foreground">
                Per event average
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {chartMetrics.avgRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average attendance rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Peak Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {chartMetrics.highestAttendance}
              </div>
              <p className="text-xs text-muted-foreground">
                Highest event attendance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category performance breakdown */}
      {showDetails && chartMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Performance</CardTitle>
            <CardDescription>
              Event performance breakdown by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartMetrics.categoryPerformance.map((category, _index) => (
                <div key={category.category} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{category.category}</Badge>
                    <div>
                      <div className="text-sm font-medium">
                        {category.eventCount} event{category.eventCount !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg: {Math.round(category.avgAttendance)} attendees
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      category.avgRate >= 80 ? 'text-success' :
                      category.avgRate >= 60 ? 'text-warning' : 'text-destructive'
                    }`}>
                      {category.avgRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Success rate
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected event details */}
      {selectedEvent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Event Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">{selectedEvent.eventName}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(selectedEvent.eventDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <Badge variant="outline">{selectedEvent.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="capitalize">{selectedEvent.eventType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span>{selectedEvent.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{selectedEvent.duration} minutes</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Attendance Metrics</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Expected:</span>
                    <span>{selectedEvent.expectedAttendance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actual:</span>
                    <span>{selectedEvent.actualAttendance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span className={`font-semibold ${
                      selectedEvent.attendanceRate >= 80 ? 'text-success' :
                      selectedEvent.attendanceRate >= 60 ? 'text-warning' : 'text-destructive'
                    }`}>
                      {selectedEvent.attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>No-shows:</span>
                    <span>{selectedEvent.expectedAttendance - selectedEvent.actualAttendance}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}