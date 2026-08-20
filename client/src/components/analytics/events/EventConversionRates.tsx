"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, UserPlus, UserCheck, UserX, TrendingUp, TrendingDown,
  Target, Funnel, PieChart as _PieChart, BarChart3, Activity, AlertCircle,
  Download, Calendar, Filter, Eye, Info
} from 'lucide-react';
import { EventAttendanceData } from './types';
import { CHART_COLOR_ARRAY, CHART_SEMANTIC } from '@/utils/chartColors';

interface EventConversionRatesProps {
  eventData: EventAttendanceData[];
  loading?: boolean;
  timeRange?: number;
  onExport?: (format: 'csv' | 'png' | 'pdf') => void;
}

interface ConversionMetrics {
  signUpToAttendance: number;
  inviteToSignUp: number;
  overallConversion: number;
  dropOffRate: number;
  averageCapacityUtilization: number;
}

interface ConversionFunnelStep {
  step: string;
  label: string;
  value: number;
  percentage: number;
  dropOff: number;
  color: string;
  icon: React.ReactNode;
}

interface EventConversionData extends EventAttendanceData {
  signUpToAttendanceRate: number;
  capacityUtilization: number;
  noShowCount: number;
  conversionGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  improvementPotential: number;
}

const calculateConversionGrade = (rate: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
  if (rate >= 90) return 'A';
  if (rate >= 80) return 'B';
  if (rate >= 70) return 'C';
  if (rate >= 60) return 'D';
  return 'F';
};

const getGradeColor = (grade: 'A' | 'B' | 'C' | 'D' | 'F'): string => {
  switch (grade) {
    case 'A': return 'text-success bg-success/10 border-success/20'; // success
    case 'B': return 'text-primary bg-primary/10 border-primary/20'; // info
    case 'C': return 'text-warning bg-warning/10 border-warning/20'; // warning
    case 'D': return 'text-warning bg-warning/10 border-warning/20'; // warning
    case 'F': return 'text-destructive bg-destructive/10 border-destructive/20'; // error
  }
};

export function EventConversionRates({ 
  eventData, 
  loading = false,
  timeRange = 90,
  onExport
}: EventConversionRatesProps) {
  const [viewType, setViewType] = useState<'funnel' | 'comparison' | 'trends'>('funnel');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'conversion' | 'attendance' | 'date'>('conversion');
  const [showDetailsFor, setShowDetailsFor] = useState<number | null>(null);

  // Process event data with conversion metrics
  const processedEvents: EventConversionData[] = useMemo(() => {
    return eventData.map(event => {
      const signUpToAttendanceRate = event.attendanceRate;
      const capacityUtilization = (event.actualAttendance / event.expectedAttendance) * 100;
      const noShowCount = event.expectedAttendance - event.actualAttendance;
      const conversionGrade = calculateConversionGrade(signUpToAttendanceRate);
      const improvementPotential = Math.max(0, 90 - signUpToAttendanceRate); // Potential to reach 90%

      return {
        ...event,
        signUpToAttendanceRate,
        capacityUtilization,
        noShowCount,
        conversionGrade,
        improvementPotential
      };
    });
  }, [eventData]);

  // Calculate overall conversion metrics
  const conversionMetrics: ConversionMetrics = useMemo(() => {
    if (!processedEvents.length) {
      return {
        signUpToAttendance: 0,
        inviteToSignUp: 0,
        overallConversion: 0,
        dropOffRate: 0,
        averageCapacityUtilization: 0
      };
    }

    const totalExpected = processedEvents.reduce((sum, e) => sum + e.expectedAttendance, 0);
    const totalActual = processedEvents.reduce((sum, e) => sum + e.actualAttendance, 0);
    const totalNoShows = totalExpected - totalActual;
    
    const signUpToAttendance = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;
    const dropOffRate = totalExpected > 0 ? (totalNoShows / totalExpected) * 100 : 0;
    const averageCapacityUtilization = processedEvents.reduce((sum, e) => sum + e.capacityUtilization, 0) / processedEvents.length;
    
    // For demo purposes, assuming invite-to-signup conversion is typically higher
    const inviteToSignUp = Math.min(100, signUpToAttendance * 1.2);
    const overallConversion = signUpToAttendance;

    return {
      signUpToAttendance,
      inviteToSignUp,
      overallConversion,
      dropOffRate,
      averageCapacityUtilization
    };
  }, [processedEvents]);

  // Create funnel data
  const funnelData: ConversionFunnelStep[] = useMemo(() => {
    const totalInvited = processedEvents.reduce((sum, e) => sum + Math.round(e.expectedAttendance * 1.3), 0); // Estimate invites sent
    const totalSignedUp = processedEvents.reduce((sum, e) => sum + e.expectedAttendance, 0);
    const totalAttended = processedEvents.reduce((sum, e) => sum + e.actualAttendance, 0);

    return [
      {
        step: 'invited',
        label: 'Invited',
        value: totalInvited,
        percentage: 100,
        dropOff: 0,
        color: CHART_COLOR_ARRAY[1], // blue
        icon: <Users className="h-4 w-4" />
      },
      {
        step: 'signedUp',
        label: 'Signed Up',
        value: totalSignedUp,
        percentage: totalInvited > 0 ? (totalSignedUp / totalInvited) * 100 : 0,
        dropOff: totalInvited - totalSignedUp,
        color: CHART_SEMANTIC.positive, // green
        icon: <UserPlus className="h-4 w-4" />
      },
      {
        step: 'attended',
        label: 'Attended',
        value: totalAttended,
        percentage: totalInvited > 0 ? (totalAttended / totalInvited) * 100 : 0,
        dropOff: totalSignedUp - totalAttended,
        color: CHART_SEMANTIC.warning, // amber
        icon: <UserCheck className="h-4 w-4" />
      }
    ];
  }, [processedEvents]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = processedEvents;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(e => e.category === filterCategory);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'conversion':
          return b.signUpToAttendanceRate - a.signUpToAttendanceRate;
        case 'attendance':
          return b.actualAttendance - a.actualAttendance;
        case 'date':
          return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
        default:
          return 0;
      }
    });
  }, [processedEvents, filterCategory, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(processedEvents.map(e => e.category)));
  }, [processedEvents]);

  const handleExport = (format: 'csv' | 'png' | 'pdf') => {
    if (onExport) {
      onExport(format);
    } else if (format === 'csv') {
      const csvContent = [
        ['Event Name', 'Date', 'Category', 'Expected', 'Actual', 'Conversion Rate %', 'No-Shows', 'Grade'],
        ...filteredEvents.map(event => [
          event.eventName,
          new Date(event.eventDate).toLocaleDateString(),
          event.category,
          event.expectedAttendance,
          event.actualAttendance,
          event.signUpToAttendanceRate.toFixed(1),
          event.noShowCount,
          event.conversionGrade
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-conversion-rates-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
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
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!eventData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Funnel className="h-5 w-5" />
            Event Conversion Rates
          </CardTitle>
          <CardDescription>Track sign-up to attendance conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No conversion data available</p>
              <p className="text-sm">Data will appear once events are tracked</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Conversion</p>
                <p className="text-2xl font-bold text-success">
                  {conversionMetrics.signUpToAttendance.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-success" />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-1">
                {conversionMetrics.signUpToAttendance > 75 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">Excellent</span>
                  </>
                ) : conversionMetrics.signUpToAttendance > 60 ? (
                  <>
                    <Activity className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary">Good</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    <span className="text-xs text-destructive">Needs Work</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drop-off Rate</p>
                <p className="text-2xl font-bold text-destructive">
                  {conversionMetrics.dropOffRate.toFixed(1)}%
                </p>
              </div>
              <UserX className="h-8 w-8 text-destructive" />
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">
                {funnelData[1]?.dropOff || 0} no-shows total
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Capacity Utilization</p>
                <p className="text-2xl font-bold text-secondary">
                  {conversionMetrics.averageCapacityUtilization.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-secondary" />
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">
                Average venue utilization
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold text-primary">
                  {processedEvents.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">
                Last {timeRange} days
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Conversion Analysis */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Funnel className="h-5 w-5" />
                Event Conversion Analysis
              </CardTitle>
              <CardDescription>
                Analyze the journey from event invitations to actual attendance
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={viewType} onValueChange={(value: 'funnel' | 'comparison' | 'trends') => setViewType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="funnel">Funnel View</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="trends">Trends</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-36">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {viewType === 'funnel' && (
            <div className="space-y-6">
              {/* Conversion Funnel Visualization */}
              <div className="flex flex-col items-center space-y-4">
                {funnelData.map((step, index) => (
                  <div key={step.step} className="w-full max-w-md">
                    <div 
                      className="relative bg-white border-2 rounded-lg p-4 transition-all hover:shadow-md"
                      style={{ 
                        borderColor: step.color,
                        width: `${Math.max(30, step.percentage)}%`,
                        marginLeft: 'auto',
                        marginRight: 'auto'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-2 rounded-full"
                            style={{ backgroundColor: step.color + '20', color: step.color }}
                          >
                            {step.icon}
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: step.color }}>
                              {step.label}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {step.value.toLocaleString()} people
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {step.percentage.toFixed(1)}%
                          </div>
                          {index > 0 && (
                            <div className="text-sm text-destructive">
                              -{step.dropOff.toLocaleString()} lost
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {index < funnelData.length - 1 && (
                      <div className="flex justify-center py-2">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-muted" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Funnel Insights */}
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-sm mb-1">Conversion Insights</h5>
                    <p className="text-sm text-muted-foreground">
                      Your conversion funnel shows that {funnelData[2]?.percentage.toFixed(1)}% of invited members 
                      actually attend events. The biggest drop-off occurs between{' '}
                      {funnelData[1]?.dropOff > funnelData[2]?.dropOff ? 'invitation and sign-up' : 'sign-up and attendance'}.
                      {conversionMetrics.signUpToAttendance < 70 && (
                        <span className="block mt-1 text-primary">
                          Consider implementing reminder notifications or waitlist strategies to improve attendance.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {viewType === 'comparison' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Select value={sortBy} onValueChange={(value: 'conversion' | 'attendance' | 'date') => setSortBy(value)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversion">By Conversion</SelectItem>
                    <SelectItem value="attendance">By Attendance</SelectItem>
                    <SelectItem value="date">By Date</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  Showing {filteredEvents.length} events
                </span>
              </div>
              
              {filteredEvents.map((event) => (
                <Card
                  key={event.eventId}
                  className={`transition-all cursor-pointer hover:shadow-md ${
                    showDetailsFor === event.eventId ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setShowDetailsFor(
                    showDetailsFor === event.eventId ? null : event.eventId
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold truncate">{event.eventName}</h3>
                          <Badge className={getGradeColor(event.conversionGrade)}>
                            Grade {event.conversionGrade}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {event.category}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Expected</div>
                            <div className="font-medium">{event.expectedAttendance}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Actual</div>
                            <div className="font-medium">{event.actualAttendance}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Conversion</div>
                            <div className={`font-medium ${
                              event.signUpToAttendanceRate >= 80 ? 'text-success' :
                              event.signUpToAttendanceRate >= 60 ? 'text-primary' : 'text-destructive'
                            }`}>
                              {event.signUpToAttendanceRate.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">No-Shows</div>
                            <div className="font-medium text-destructive">{event.noShowCount}</div>
                          </div>
                        </div>
                        
                        {/* Conversion Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Conversion Progress</span>
                            <span>{event.signUpToAttendanceRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                event.signUpToAttendanceRate >= 80 ? 'bg-success' :
                                event.signUpToAttendanceRate >= 60 ? 'bg-primary' : 'bg-destructive'
                              }`}
                              style={{ width: `${Math.min(event.signUpToAttendanceRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {showDetailsFor === event.eventId && (
                      <div className="mt-4 pt-4 border-t grid gap-4 md:grid-cols-2">
                        <div>
                          <h5 className="font-semibold text-sm mb-2">Event Details</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Date:</span>
                              <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Type:</span>
                              <span className="capitalize">{event.eventType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Location:</span>
                              <span>{event.location}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span>{event.duration} min</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold text-sm mb-2">Performance Analysis</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Capacity Utilization:</span>
                              <span>{event.capacityUtilization.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Improvement Potential:</span>
                              <span className={event.improvementPotential > 20 ? 'text-warning' : 'text-success'}>
                                {event.improvementPotential.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Performance Grade:</span>
                              <Badge className={getGradeColor(event.conversionGrade)}>
                                {event.conversionGrade}
                              </Badge>
                            </div>
                          </div>
                          
                          {event.improvementPotential > 10 && (
                            <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded text-xs">
                              <AlertCircle className="h-3 w-3 text-warning inline mr-1" />
                              Consider sending reminder emails or following up with registrants to improve attendance.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {viewType === 'trends' && (
            <div className="space-y-4">
              <div className="text-center text-muted-foreground py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Trend analysis view</p>
                <p className="text-sm">Coming soon - historical conversion trend analysis</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}