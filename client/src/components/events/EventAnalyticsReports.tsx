'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Clock, 
  Star, 
  Download, 
  RefreshCw, 
  Target, 
  Zap,
  Award,
  Activity,
  DollarSign,
  UserCheck,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { eventService } from '@/services/eventService';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface EventMetrics {
  totalEvents: number;
  totalAttendees: number;
  avgAttendanceRate: number;
  totalRevenue: number;
  avgRating: number;
  totalFeedback: number;
  repeatAttendeeRate: number;
  noShowRate: number;
  registrationConversionRate: number;
  waitlistConversionRate: number;
}

interface EventAnalytics {
  eventId: number;
  eventName: string;
  eventDate: string;
  registrations: number;
  attendees: number;
  noShows: number;
  attendanceRate: number;
  revenue: number;
  avgRating: number;
  feedbackCount: number;
  npsScore: number;
  checkInTimes: Array<{ time: string; count: number }>;
  demographicBreakdown: {
    ageGroups: Record<string, number>;
    memberTypes: Record<string, number>;
    locations: Record<string, number>;
  };
  engagementMetrics: {
    avgSessionDuration: number;
    interactionRate: number;
    shareCount: number;
    questionCount: number;
  };
}

interface ComparativeAnalysis {
  currentPeriod: EventMetrics;
  previousPeriod: EventMetrics;
  growthRates: Record<string, number>;
  trends: Array<{
    metric: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
    significance: 'high' | 'medium' | 'low';
  }>;
}

interface PredictiveInsights {
  recommendedCapacity: number;
  expectedAttendance: number;
  confidence: number;
  optimalTiming: {
    dayOfWeek: string;
    timeOfDay: string;
    reasoning: string;
  };
  pricingRecommendation: {
    suggestedPrice: number;
    priceElasticity: number;
    demandForecast: string;
  };
  riskFactors: Array<{
    factor: string;
    impact: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
}

interface PerformanceBenchmark {
  metric: string;
  currentValue: number;
  industryAverage: number;
  topPerformers: number;
  clubAverage: number;
  percentile: number;
  status: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
}

interface EventAnalyticsReportsProps {
  eventId?: number;
  clubId: number;
  dateRange?: { start: string; end: string };
  realTime?: boolean;
  className?: string;
}

const TIME_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '1y', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
];

// Chart color constants
const _CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
};

const METRIC_DEFINITIONS = {
  attendanceRate: 'Percentage of registered attendees who actually attended',
  noShowRate: 'Percentage of registered attendees who did not attend',
  conversionRate: 'Percentage of visitors who registered for the event',
  npsScore: 'Net Promoter Score based on attendee feedback',
  engagementRate: 'Average interaction rate during the event',
  revenuePerAttendee: 'Average revenue generated per attendee',
};

export function EventAnalyticsReports({ eventId, clubId, dateRange: _dateRange, className }: EventAnalyticsReportsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('attendanceRate');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  
  // Data states
  const [overallMetrics, setOverallMetrics] = useState<EventMetrics | null>(null);
  const [eventAnalytics, setEventAnalytics] = useState<EventAnalytics[]>([]);
  const [comparativeAnalysis, setComparativeAnalysis] = useState<ComparativeAnalysis | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsights | null>(null);
  const [performanceBenchmarks, setPerformanceBenchmarks] = useState<PerformanceBenchmark[]>([]);
  
  const toast = useToast();

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [metrics, analytics, comparative, insights, benchmarks] = await Promise.all([
        eventService.getEventMetrics(clubId, { timeRange: selectedTimeRange, eventId }),
        eventService.getEventAnalytics(clubId, { timeRange: selectedTimeRange, eventId }),
        eventService.getComparativeAnalysis(clubId, { timeRange: selectedTimeRange }),
        eventService.getPredictiveInsights(clubId, { eventId }),
        eventService.getPerformanceBenchmarks(clubId, { timeRange: selectedTimeRange }),
      ]);
      
      setOverallMetrics({
        totalEvents: metrics.totalEvents || 0,
        totalAttendees: metrics.totalAttendees || 0,
        avgAttendanceRate: (metrics as any).avgAttendanceRate || 0,
        totalRevenue: (metrics as any).totalRevenue || 0,
        avgRating: (metrics as any).avgRating || 0,
        totalFeedback: (metrics as any).totalFeedback || 0,
        repeatAttendeeRate: (metrics as any).repeatAttendeeRate || 0,
        noShowRate: (metrics as any).noShowRate || 0,
        registrationConversionRate: (metrics as any).registrationConversionRate || 0,
        waitlistConversionRate: (metrics as any).waitlistConversionRate || 0,
      });
      setEventAnalytics(analytics as unknown as EventAnalytics[]);
      setComparativeAnalysis(comparative as unknown as ComparativeAnalysis);
      setPredictiveInsights(insights as unknown as PredictiveInsights);
      setPerformanceBenchmarks(benchmarks as unknown as PerformanceBenchmark[]);
    } catch (err) {
      logger.error('analytics', 'Failed to load event analytics data', { error: err, clubId, eventId, selectedTimeRange });
      setError('Failed to load analytics data. Please try again.');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [clubId, eventId, selectedTimeRange, toast]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const exportReport = async () => {
    try {
      const blob = await eventService.exportAnalyticsReport(clubId, {
        format: exportFormat,
        reportConfig: {
          id: 'analytics-report',
          name: 'Event Analytics Report',
          reportType: 'custom',
          metrics: ['attendance', 'revenue', 'engagement'],
          dateRange: selectedTimeRange as any,
          filters: {},
          includeCharts: true,
          dimensions: ['event_type', 'time_period', 'location'],
        },
        includeRawData: true,
        includeVisualizations: true,
        includeInsights: true,
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Analytics report exported as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      logger.error('analytics', 'Failed to export analytics report', { error: err, clubId, exportFormat });
      toast.error('Failed to export analytics report');
    }
  };

  const getMetricIcon = (metric: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      totalEvents: Calendar,
      totalAttendees: Users,
      avgAttendanceRate: UserCheck,
      totalRevenue: DollarSign,
      avgRating: Star,
      totalFeedback: MessageSquare,
      repeatAttendeeRate: TrendingUp,
      noShowRate: TrendingDown,
      registrationConversionRate: Target,
      waitlistConversionRate: Zap,
    };
    return icons[metric] || Activity;
  };

  const formatMetricValue = (key: string, value: number) => {
    switch (key) {
      case 'totalRevenue':
        return `$${value.toLocaleString()}`;
      case 'avgAttendanceRate':
      case 'repeatAttendeeRate':
      case 'noShowRate':
      case 'registrationConversionRate':
      case 'waitlistConversionRate':
        return `${value.toFixed(1)}%`;
      case 'avgRating':
        return `${value.toFixed(1)}/5`;
      default:
        return value.toLocaleString();
    }
  };

  const getMetricTrend = (current: number, previous: number) => {
    if (current === previous) return { trend: 'stable' as const, change: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      trend: change > 0 ? 'up' as const : 'down' as const,
      change: Math.abs(change),
    };
  };

  const _getBenchmarkStatus = (percentile: number): PerformanceBenchmark['status'] => {
    if (percentile >= 90) return 'excellent';
    if (percentile >= 75) return 'good';
    if (percentile >= 50) return 'average';
    if (percentile >= 25) return 'below-average';
    return 'poor';
  };

  const getBenchmarkColor = (status: PerformanceBenchmark['status']) => {
    switch (status) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'average': return 'text-warning';
      case 'below-average': return 'text-warning';
      case 'poor': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const topPerformingEvents = useMemo(() => {
    return eventAnalytics
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 5);
  }, [eventAnalytics]);

  const eventsByTimeOfDay = useMemo(() => {
    const timeSlots = eventAnalytics.reduce((acc, event) => {
      const hour = new Date(event.eventDate).getHours();
      const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(timeSlots).map(([time, count]) => ({ time, count }));
  }, [eventAnalytics]);

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Event Analytics Reports
            </CardTitle>
            <CardDescription>
              Comprehensive analytics and insights for your events
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={loadAnalyticsData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              {overallMetrics && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(overallMetrics).map(([key, value]) => {
                    const Icon = getMetricIcon(key);
                    const trend = comparativeAnalysis ? 
                      getMetricTrend(value, (comparativeAnalysis.previousPeriod as any)[key]) : 
                      null;
                    
                    return (
                      <Card key={key}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </p>
                              <p className="text-2xl font-bold">
                                {formatMetricValue(key, value)}
                              </p>
                              {trend && (
                                <div className={cn(
                                  'flex items-center gap-1 text-sm',
                                  trend.trend === 'up' ? 'text-success' :
                                  trend.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                                )}>
                                  {trend.trend === 'up' ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : trend.trend === 'down' ? (
                                    <TrendingDown className="h-3 w-3" />
                                  ) : null}
                                  {trend.change.toFixed(1)}%
                                </div>
                              )}
                            </div>
                            <Icon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Top Performing Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Events</CardTitle>
                  <CardDescription>Events with highest attendance rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformingEvents.map((event, index) => (
                      <div key={event.eventId} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                            index === 0 ? 'bg-warning/20 text-warning' :
                            index === 1 ? 'bg-muted text-muted-foreground' :
                            index === 2 ? 'bg-warning/10 text-warning' :
                            'bg-primary/10 text-primary'
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{event.eventName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.eventDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{event.attendanceRate.toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">
                            {event.attendees}/{event.registrations} attended
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Event Distribution by Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Distribution by Time of Day</CardTitle>
                  <CardDescription>When your events are most popular</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {eventsByTimeOfDay.map(({ time, count }) => {
                      const percentage = (count / eventAnalytics.length) * 100;
                      return (
                        <div key={time} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{time}</span>
                          <div className="flex items-center gap-2 flex-1 ml-4">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground min-w-12">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Performance Analysis</h3>
                  <p className="text-muted-foreground">Detailed performance metrics for individual events</p>
                </div>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METRIC_DEFINITIONS).map(([key, _definition]) => (
                      <SelectItem key={key} value={key}>
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, c => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Event Performance Table</CardTitle>
                  <CardDescription>
                    {METRIC_DEFINITIONS[selectedMetric as keyof typeof METRIC_DEFINITIONS]}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 font-medium">Event</th>
                          <th className="text-left p-2 font-medium">Date</th>
                          <th className="text-right p-2 font-medium">Registrations</th>
                          <th className="text-right p-2 font-medium">Attendees</th>
                          <th className="text-right p-2 font-medium">Attendance Rate</th>
                          <th className="text-right p-2 font-medium">Rating</th>
                          <th className="text-right p-2 font-medium">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventAnalytics.map((event) => (
                          <tr key={event.eventId} className="border-b border-border hover:bg-muted/50">
                            <td className="p-2">
                              <div>
                                <p className="font-medium">{event.eventName}</p>
                                <p className="text-sm text-muted-foreground">ID: {event.eventId}</p>
                              </div>
                            </td>
                            <td className="p-2 text-sm">
                              {new Date(event.eventDate).toLocaleDateString()}
                            </td>
                            <td className="p-2 text-right">{event.registrations}</td>
                            <td className="p-2 text-right">{event.attendees}</td>
                            <td className="p-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span>{event.attendanceRate.toFixed(1)}%</span>
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${event.attendanceRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Star className="h-3 w-3 text-warning fill-current" />
                                {event.avgRating.toFixed(1)}
                              </div>
                            </td>
                            <td className="p-2 text-right font-medium">
                              ${event.revenue.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="mt-6">
            {comparativeAnalysis ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Period Comparison</h3>
                  <p className="text-muted-foreground">
                    Comparing current period vs previous period performance
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Period</CardTitle>
                      <CardDescription>Latest {selectedTimeRange} performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(comparativeAnalysis.currentPeriod).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                            <span className="font-medium">
                              {formatMetricValue(key, value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Previous Period</CardTitle>
                      <CardDescription>Previous {selectedTimeRange} performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(comparativeAnalysis.previousPeriod).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                            <span className="font-medium">
                              {formatMetricValue(key, value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Growth Trends</CardTitle>
                    <CardDescription>Key performance indicators and their changes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comparativeAnalysis.trends.map((trend, index) => {
                        const isPositive = trend.trend === 'up';
                        const isSignificant = trend.significance === 'high';
                        
                        return (
                          <div key={trend.metric || `trend-${index}`} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'flex items-center justify-center w-8 h-8 rounded-full',
                                isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                              )}>
                                {isPositive ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium capitalize">
                                  {trend.metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {isSignificant ? 'Significant change' : 'Minor change'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                'font-medium',
                                isPositive ? 'text-success' : 'text-destructive'
                              )}>
                                {isPositive ? '+' : '-'}{trend.change.toFixed(1)}%
                              </p>
                              <Badge variant={isSignificant ? 'default' : 'secondary'} className="text-xs">
                                {trend.significance}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Insufficient Data</h3>
                <p className="text-muted-foreground">
                  Not enough data available for period comparison. More events needed.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            {predictiveInsights ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Predictive Insights</h3>
                  <p className="text-muted-foreground">
                    AI-powered recommendations based on historical data
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Attendance Prediction
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Expected Attendance</span>
                            <span className="font-medium">{predictiveInsights.expectedAttendance}</span>
                          </div>
                          <Progress value={predictiveInsights.confidence} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {predictiveInsights.confidence}% confidence
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Recommended Capacity</span>
                          <p className="font-medium">{predictiveInsights.recommendedCapacity} attendees</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Optimal Timing
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-muted-foreground">Best Day</span>
                          <p className="font-medium">{predictiveInsights.optimalTiming.dayOfWeek}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Best Time</span>
                          <p className="font-medium">{predictiveInsights.optimalTiming.timeOfDay}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Reasoning</span>
                          <p className="text-sm">{predictiveInsights.optimalTiming.reasoning}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Pricing Recommendation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-muted-foreground">Suggested Price</span>
                          <p className="font-medium">${predictiveInsights.pricingRecommendation.suggestedPrice}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Price Elasticity</span>
                          <p className="text-sm">{predictiveInsights.pricingRecommendation.priceElasticity.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Demand Forecast</span>
                          <p className="text-sm">{predictiveInsights.pricingRecommendation.demandForecast}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Risk Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {predictiveInsights.riskFactors.map((risk, index) => (
                          <div key={risk.factor || `risk-${index}`} className="p-3 border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{risk.factor}</span>
                              <Badge variant={
                                risk.impact === 'high' ? 'destructive' :
                                risk.impact === 'medium' ? 'default' : 'secondary'
                              }>
                                {risk.impact} impact
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Insights Unavailable</h3>
                <p className="text-muted-foreground">
                  Predictive insights require more historical data to generate accurate recommendations.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="benchmarks" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Performance Benchmarks</h3>
                <p className="text-muted-foreground">
                  Compare your performance against industry standards and top performers
                </p>
              </div>

              <div className="space-y-4">
                {performanceBenchmarks.map((benchmark, index) => {
                  const statusColor = getBenchmarkColor(benchmark.status);
                  
                  return (
                    <Card key={benchmark.metric || `benchmark-${index}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium capitalize">
                              {benchmark.metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </h4>
                            <p className={cn('text-sm font-medium', statusColor)}>
                              {benchmark.status.replace('-', ' ')}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {benchmark.percentile}th percentile
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Your Value</span>
                              <p className="font-medium">
                                {formatMetricValue(benchmark.metric, benchmark.currentValue)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Club Average</span>
                              <p className="font-medium">
                                {formatMetricValue(benchmark.metric, benchmark.clubAverage)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Industry Average</span>
                              <p className="font-medium">
                                {formatMetricValue(benchmark.metric, benchmark.industryAverage)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Top Performers</span>
                              <p className="font-medium">
                                {formatMetricValue(benchmark.metric, benchmark.topPerformers)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all"
                                style={{ width: `${benchmark.percentile}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>0th</span>
                              <span>50th</span>
                              <span>100th</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {performanceBenchmarks.length === 0 && (
                <div className="text-center py-12">
                  <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Benchmarks Available</h3>
                  <p className="text-muted-foreground">
                    Benchmark data will be available once you have more event history.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportReport} data-testid="export-report">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
