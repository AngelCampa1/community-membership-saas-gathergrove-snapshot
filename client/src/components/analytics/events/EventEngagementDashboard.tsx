"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataError } from "@/components/ui/data-error";
import { 
  Calendar, Users, TrendingUp, Star, RefreshCw, Clock, 
  Trophy, UserCheck, MessageSquare as _MessageSquare, Target as _Target, BarChart3,
  Table, Funnel, User
} from 'lucide-react';
import { EventAttendanceChart } from './EventAttendanceChart';
import { EventEngagementMetrics } from './EventEngagementMetrics';
import { EventFeedbackAnalytics } from './EventFeedbackAnalytics';
import { EventRecommendations } from './EventRecommendations';
import { EventImpactAnalysis } from './EventImpactAnalysis';
import { EventParticipationChart } from './EventParticipationChart';
import { MemberEventScoreCard } from './MemberEventScoreCard';
import { EventAnalyticsTable } from './EventAnalyticsTable';
import { EngagementTrendsChart } from './EngagementTrendsChart';
import { EventConversionRates } from './EventConversionRates';
import {
  EventAnalyticsResponse as _ComponentEventAnalyticsResponse,
  EventFeedbackData,
  EventRecommendation,
  EventAttendanceData,
  EventImpactMetrics,
  MemberEventEngagement,
  EventTrendData
} from './types';
import { LegacyEventAnalyticsResponse as ServiceEventAnalyticsResponse } from '../../../services/eventEngagementApiService';

interface Props {
  clubId: number;
}

import { eventEngagementApiService } from '@/services/eventEngagementApiService';
import { logger } from '@/lib/logger';

export function EventEngagementDashboard({ clubId }: Props) {
  const [data, setData] = useState<ServiceEventAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState(90);
  const [activeTab, setActiveTab] = useState("overview");

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await eventEngagementApiService.getEventAnalytics(clubId, timeRange);
      setData(response as ServiceEventAnalyticsResponse);
      
      // Track feature usage for analytics
      eventEngagementApiService.trackFeature(clubId, 'event_analytics_dashboard_view', 'web', {
        timeRange,
        tabView: activeTab
      });
    } catch (err) {
      logger.error('events', 'Error loading event analytics', { error: err, clubId, timeRange, activeTab });
      setError(err instanceof Error ? err.message : 'Failed to load event analytics');
    } finally {
      setLoading(false);
    }
  }, [clubId, timeRange, activeTab]);

  const refreshAnalytics = async () => {
    try {
      setRefreshing(true);
      await loadAnalytics();
      
      // Track refresh action
      eventEngagementApiService.trackFeature(clubId, 'event_analytics_refresh', 'web', {
        timeRange,
        tabView: activeTab
      });
    } catch (err) {
      logger.error('events', 'Error refreshing event analytics', { error: err, clubId, timeRange, activeTab });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [clubId, timeRange, loadAnalytics]);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse" data-testid="loading-skeleton">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded"></div>
            <div className="h-4 w-96 bg-muted rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-muted rounded"></div>
            <div className="h-10 w-24 bg-muted rounded"></div>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" data-testid="skeleton-card"></div>
          ))}
        </div>
        
        <div className="h-12 w-full bg-muted rounded"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <DataError 
        onRetry={loadAnalytics} 
        error={error}
      />
    );
  }

  if (!data && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="text-muted-foreground text-center">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <h3 className="text-lg font-semibold mb-1">No Event Data Available</h3>
          <p>There's no event engagement data to display for the selected time period.</p>
        </div>
        <Button onClick={loadAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show error banner if there's an error but we have data */}
      {error && data && (
        <div className="rounded-md bg-warning/10 p-4 border border-warning/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-warning">
                Unable to refresh data
              </h3>
              <div className="mt-2 text-sm text-warning/80">
                <p>Showing cached data. {error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Event Engagement Analytics</h2>
          <p className="text-muted-foreground">
            Track and analyze event performance and member engagement
            {data?.metrics.lastUpdated && (
              <span className="block mt-1 text-xs">
                Last updated: {new Date(data.metrics.lastUpdated).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={timeRange.toString()} 
            onValueChange={(value) => {
              setTimeRange(parseInt(value));
              // Track time range change
              eventEngagementApiService.trackFeature(clubId, 'event_analytics_time_range_change', 'web', {
                newTimeRange: parseInt(value),
                previousTimeRange: timeRange
              });
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="180">6 months</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={refreshAnalytics}
            disabled={refreshing || loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.metrics?.totalEvents ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {(data?.metrics?.averageAttendanceRate ?? 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {(data?.metrics?.totalAttendance ?? 0).toLocaleString()} total attendees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {data?.metrics?.eventSatisfactionScore ? data.metrics.eventSatisfactionScore.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0 stars
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Attendance</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {data?.metrics?.repeatAttendanceRate ? `${data.metrics.repeatAttendanceRate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Members attending multiple events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(newTab) => {
          setActiveTab(newTab);
          // Track tab change
          eventEngagementApiService.trackFeature(clubId, 'event_analytics_tab_change', 'web', {
            newTab,
            previousTab: activeTab,
            timeRange
          });
        }} 
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-1">
          <TabsTrigger value="overview" disabled={loading && !data} className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="participation" disabled={loading && !data} className="text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="members" disabled={loading && !data} className="text-xs">
            <User className="h-3 w-3 mr-1" />
            Members
          </TabsTrigger>
          <TabsTrigger value="table" disabled={loading && !data} className="text-xs">
            <Table className="h-3 w-3 mr-1" />
            Data
          </TabsTrigger>
          <TabsTrigger value="trends" disabled={loading && !data} className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="conversion" disabled={loading && !data} className="text-xs">
            <Funnel className="h-3 w-3 mr-1" />
            Conversion
          </TabsTrigger>
          <TabsTrigger value="attendance" disabled={loading && !data} className="text-xs">Attendance</TabsTrigger>
          <TabsTrigger value="feedback" disabled={loading && !data} className="text-xs">Feedback</TabsTrigger>
          <TabsTrigger value="recommendations" disabled={loading && !data} className="text-xs">Insights</TabsTrigger>
          <TabsTrigger value="impact" disabled={loading && !data} className="text-xs">Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top Performing Events
                </CardTitle>
                <CardDescription>
                  Events with highest attendance rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data?.topPerformingEvents?.length ?? 0) > 0 ? (
                    data?.topPerformingEvents?.map((event, index) => (
                      <div key={event.eventId || index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{event.eventName || 'Untitled Event'}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Date TBD'} • General
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-success">
                            {typeof event.attendanceRate === 'number' ? `${event.attendanceRate.toFixed(1)}%` : 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {event.attendanceCount || 0}/{event.rsvpCount || 0}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Trophy className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No event performance data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>
                  Events scheduled in the coming weeks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.upcomingEvents && data.upcomingEvents.length > 0 ? (
                    data.upcomingEvents.map((event) => (
                      <div key={event.eventId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{event.eventName || 'Untitled Event'}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Date TBD'} • {('eventLocation' in event && event.eventLocation) ? String(event.eventLocation) : 'Location TBD'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{Number(('totalRsvpCount' in event ? event.totalRsvpCount : 0) || event.rsvpCount || 0)}</div>
                          <div className="text-sm text-muted-foreground">Expected</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No upcoming events scheduled</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {data?.metrics && data?.trendData && (
            <EventEngagementMetrics data={data.metrics} trendData={data.trendData} />
          )}
        </TabsContent>

        <TabsContent value="attendance">
          {data?.attendanceData && (
            <EventAttendanceChart 
              data={data.attendanceData} 
              trendData={data.trendData || []} 
            />
          )}
          {!data?.attendanceData && (
            <div className="text-center text-muted-foreground py-16">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No attendance data available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="feedback">
          <EventFeedbackAnalytics
            feedbackData={(data?.feedbackData as unknown as EventFeedbackData[]) || []}
            overallSatisfaction={data?.metrics?.eventSatisfactionScore || 0}
          />
        </TabsContent>

        <TabsContent value="recommendations">
          <EventRecommendations
            recommendations={(data?.recommendations as unknown as EventRecommendation[]) || []}
            performanceData={(data?.attendanceData as unknown as EventAttendanceData[]) || []}
          />
        </TabsContent>

        <TabsContent value="impact">
          <EventImpactAnalysis
            impactMetrics={(data?.impactMetrics as unknown as EventImpactMetrics[]) || []}
            memberEngagement={(data?.memberEngagement as unknown as MemberEventEngagement[]) || []}
          />
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid gap-6">
            {data?.metrics && data?.trendData && (
              <EventEngagementMetrics data={data.metrics} trendData={data.trendData} />
            )}
            
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">No-Show Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">
                    {data?.metrics?.noShowRate ? `${data.metrics.noShowRate.toFixed(1)}%` : 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Members who registered but didn't attend
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Member Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary">
                    {data?.metrics?.memberEngagementScore ? data.metrics.memberEngagementScore.toFixed(1) : 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Overall engagement score
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Last Updated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {data?.metrics?.lastUpdated ? 
                      new Date(data.metrics.lastUpdated).toLocaleString() : 
                      'Unknown'
                    }
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analytics refresh time
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="participation">
          <EventParticipationChart 
            data={data?.attendanceData || []}
            trendData={data?.trendData}
            timeRange={timeRange}
            loading={loading && !data}
            onExport={(format) => {
              eventEngagementApiService.trackFeature(clubId, 'event_participation_export', 'web', {
                format,
                timeRange,
                dataPoints: data?.attendanceData?.length || 0
              });
            }}
          />
        </TabsContent>

        <TabsContent value="members">
          <MemberEventScoreCard
            memberData={(data?.memberEngagement as unknown as MemberEventEngagement[]) || []}
            loading={loading && !data}
            showDetailedScores={true}
            onMemberSelect={(member) => {
              eventEngagementApiService.trackFeature(clubId, 'member_score_card_select', 'web', {
                memberId: member.memberId,
                attendanceRate: member.attendanceRate
              });
            }}
          />
        </TabsContent>

        <TabsContent value="table">
          <EventAnalyticsTable
            eventData={(data?.attendanceData as unknown as EventAttendanceData[]) || []}
            feedbackData={(data?.feedbackData as unknown as EventFeedbackData[])}
            loading={loading && !data}
            onEventSelect={(event) => {
              eventEngagementApiService.trackFeature(clubId, 'event_analytics_table_select', 'web', {
                eventId: event.eventId,
                attendanceRate: event.attendanceRate
              });
            }}
            onExport={(format) => {
              eventEngagementApiService.trackFeature(clubId, 'event_analytics_table_export', 'web', {
                format,
                totalEvents: data?.attendanceData?.length || 0
              });
            }}
          />
        </TabsContent>

        <TabsContent value="trends">
          <EngagementTrendsChart
            trendData={(data?.trendData as unknown as EventTrendData[]) || []}
            memberEngagement={(data?.memberEngagement as unknown as MemberEventEngagement[])}
            timeRange={timeRange}
            loading={loading && !data}
            onExport={(format) => {
              eventEngagementApiService.trackFeature(clubId, 'engagement_trends_export', 'web', {
                format,
                timeRange,
                trendDataPoints: data?.trendData?.length || 0
              });
            }}
          />
        </TabsContent>

        <TabsContent value="conversion">
          <EventConversionRates 
            eventData={data?.attendanceData || []}
            loading={loading && !data}
            timeRange={timeRange}
            onExport={(format) => {
              eventEngagementApiService.trackFeature(clubId, 'event_conversion_export', 'web', {
                format,
                eventsAnalyzed: data?.attendanceData?.length || 0
              });
            }}
          />
        </TabsContent>

      </Tabs>
    </div>
  );
}