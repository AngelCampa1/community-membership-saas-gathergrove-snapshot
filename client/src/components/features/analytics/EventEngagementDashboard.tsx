"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Select as _Select, SelectContent as _SelectContent, SelectItem as _SelectItem, SelectTrigger as _SelectTrigger, SelectValue as _SelectValue } from "../../ui/select";
import { DataError as _DataError } from "../../ui/data-error";
import { 
  Calendar, Users, TrendingUp as _TrendingUp, Star, RefreshCw, Clock as _Clock, 
  Trophy, UserCheck as _UserCheck, MessageSquare, Target, BarChart3 as _BarChart3,
  Table, Funnel as _Funnel, User
} from 'lucide-react';
import { DateRangePicker } from '../../shared/DateRangePicker';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { logger } from '../../../lib/logger';
import { getEventEngagementAnalytics, getEngagementTrends, getEngagementBenchmarks } from '../../../services/analyticsService';

interface Props {
  clubId?: number;
}

// Mock data types for testing
interface EventAnalyticsData {
  clubId: number;
  clubName: string;
  analyticsDateRange: {
    start: Date;
    end: Date;
  };
  overallEngagementScore: number;
  eventMetrics: EventMetric[];
  memberEngagementBreakdown: MemberEngagement[];
  keyInsights: string[];
  recommendations: string[];
}

interface EventMetric {
  eventId: number;
  eventName: string;
  eventDate: Date;
  totalRsvps: number;
  totalAttended: number;
  rsvpRate: number;
  attendanceRate: number;
  engagementScore: number;
}

interface MemberEngagement {
  memberId: number;
  memberName: string;
  engagementLevel: string;
  eventAttendanceRate: number;
  overallScore: number;
}

interface _TrendsData {
  clubId: number;
  periodDays: number;
  dailyTrends: TrendPoint[];
  trendDirection: string;
  growthRate: number;
  averageEngagementScore: number;
}

interface TrendPoint {
  date: Date;
  engagementScore: number;
  eventCount: number;
  attendanceRate: number;
}

interface _BenchmarkData {
  clubId: number;
  averageAttendanceRate: number;
  averageRsvpRate: number;
  averageEngagementScore: number;
  industryComparisons: Record<string, number>;
  performanceIndicators: Record<string, string>;
  benchmarkPeriod: string;
  lastUpdated: Date;
}

export function EventEngagementDashboard({ clubId }: Props) {
  const [data, setData] = useState<EventAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });
  const [activeTab, setActiveTab] = useState("overview");

  const { user } = useAuth();
  const router = useRouter();

  const effectiveClubId = clubId || user?.clubId;

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!effectiveClubId) {
        throw new Error('No club ID available');
      }
      
      const [analyticsData, _trendsData, _benchmarkData] = await Promise.all([
        getEventEngagementAnalytics(effectiveClubId, dateRange.start, dateRange.end),
        getEngagementTrends(effectiveClubId, 30),
        getEngagementBenchmarks(effectiveClubId)
      ]);

      setData(analyticsData as any);
    } catch (err) {
      logger.error('analytics', 'Error loading event engagement analytics', { error: err, clubId: effectiveClubId, dateRange });
      setError(err instanceof Error ? err.message : 'Failed to load event analytics');
    } finally {
      setLoading(false);
    }
  }, [effectiveClubId, dateRange]);

  const refreshAnalytics = async () => {
    try {
      setRefreshing(true);
      await loadAnalytics();
    } catch (err) {
      logger.error('analytics', 'Error refreshing event engagement analytics', { error: err, clubId: effectiveClubId });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDateRangeChange = (newRange: { start: Date; end: Date }) => {
    setDateRange(newRange);
  };

  const handleEventRowClick = (eventId: number) => {
    router.push(`/admin/events/${eventId}/analytics`);
  };

  const handleMemberRowClick = (memberId: number) => {
    router.push(`/admin/members/${memberId}/engagement`);
  };

  useEffect(() => {
    if (effectiveClubId) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadAnalytics is defined above and includes proper dependencies
  }, [effectiveClubId, dateRange]);

  // Check tier access
  if (user?.clubTier !== 'Expand' && user?.clubTier !== 'Unlimited') {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-warning" />
          <h3 className="text-lg font-semibold mb-2">Upgrade to Expand</h3>
          <p className="text-muted-foreground mb-4">
            EventEngagementAnalytics requires Expand tier access to view detailed engagement insights and analytics.
          </p>
          <Button onClick={() => router.push('/admin/billing')}>
            Upgrade Now
          </Button>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse" role="status" aria-label="Loading analytics data">
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
            <div key={`engagement-skeleton-${i}`} className="h-32 bg-muted rounded-lg" data-testid="skeleton-card"></div>
          ))}
        </div>
        
        <div className="h-12 w-full bg-muted rounded"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <div className="text-center text-muted-foreground py-16">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error loading analytics data</h3>
          <p className="mb-4">Please try again</p>
          <Button onClick={loadAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        
        {error.includes('Unauthorized') && (
          <div className="text-center text-muted-foreground py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-warning" />
            <h3 className="text-lg font-semibold mb-2">Unauthorized Access</h3>
            <p className="mb-4">EventEngagementAnalytics requires Expand tier</p>
          </div>
        )}

        {error.includes('Network') && (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-warning" />
            <h3 className="text-lg font-semibold mb-2">Network error</h3>
            <p className="mb-4">Please check your connection and try again</p>
            <Button onClick={loadAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
      </div>
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
    <div className="space-y-6" role="main" aria-label="engagement analytics dashboard">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Event Engagement Analytics</h2>
          <p className="text-muted-foreground">
            Track and analyze event performance and member engagement
            {user?.clubName && (
              <span className="block mt-1 font-medium">{user.clubName}</span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <DateRangePicker 
            onRangeChange={handleDateRangeChange}
            startDate={dateRange.start}
            endDate={dateRange.end}
          />
          
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
            <CardTitle className="text-sm font-medium">Overall Engagement Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {data?.overallEngagementScore.toFixed(1) || '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current period average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.eventMetrics?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Engagement</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {data?.memberEngagementBreakdown?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active members tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights Generated</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {(data?.keyInsights?.length || 0) + (data?.recommendations?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Actionable insights
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
        role="tablist"
      >
        <TabsList className="grid w-full grid-cols-3 gap-1">
          <TabsTrigger value="overview" className="text-xs" role="tab">Overview</TabsTrigger>
          <TabsTrigger value="events" className="text-xs" role="tab">
            <Table className="h-3 w-3 mr-1" />
            Events
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs" role="tab">
            <User className="h-3 w-3 mr-1" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Key Insights
                </CardTitle>
                <CardDescription>
                  Important patterns and trends identified
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.keyInsights?.length ? (
                    data.keyInsights.map((insight, index) => (
                      <div key={`insight-${index}-${insight.substring(0, 20)}`} className="p-3 border rounded-lg">
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No insights available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Suggested actions to improve engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.recommendations?.length ? (
                    data.recommendations.map((recommendation, index) => (
                      <div key={`recommendation-${index}-${recommendation.substring(0, 20)}`} className="p-3 border rounded-lg">
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No recommendations available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Event Performance</CardTitle>
              <CardDescription>
                Detailed metrics for each event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.eventMetrics?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full" role="table">
                    <thead>
                      <tr className="border-b" role="row">
                        <th className="text-left p-2">Event Name</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-right p-2">RSVPs</th>
                        <th className="text-right p-2">Attended</th>
                        <th className="text-right p-2">Attendance Rate</th>
                        <th className="text-right p-2">Engagement Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.eventMetrics.map((event) => (
                        <tr 
                          key={event.eventId} 
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleEventRowClick(event.eventId)}
                          role="row"
                        >
                          <td className="p-2 font-medium">{event.eventName}</td>
                          <td className="p-2 text-muted-foreground">
                            {new Date(event.eventDate).toLocaleDateString()}
                          </td>
                          <td className="p-2 text-right">{event.totalRsvps}</td>
                          <td className="p-2 text-right">{event.totalAttended}</td>
                          <td className="p-2 text-right">
                            <span className={`font-medium ${event.attendanceRate >= 80 ? 'text-success' : event.attendanceRate >= 60 ? 'text-warning' : 'text-destructive'}`}>
                              {event.attendanceRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <span className="font-medium">
                              {event.engagementScore.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No event data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Member Engagement</CardTitle>
              <CardDescription>
                Individual member engagement levels and scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.memberEngagementBreakdown?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full" role="table">
                    <thead>
                      <tr className="border-b" role="row">
                        <th className="text-left p-2">Member Name</th>
                        <th className="text-center p-2">Engagement Level</th>
                        <th className="text-right p-2">Attendance Rate</th>
                        <th className="text-right p-2">Overall Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.memberEngagementBreakdown.map((member) => (
                        <tr 
                          key={member.memberId} 
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleMemberRowClick(member.memberId)}
                          role="row"
                        >
                          <td className="p-2 font-medium">{member.memberName}</td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.engagementLevel === 'Green' ? 'bg-success/10 text-success' :
                              member.engagementLevel === 'Yellow' ? 'bg-warning/10 text-warning' :
                              'bg-destructive/10 text-destructive'
                            }`}>
                              {member.engagementLevel}
                            </span>
                          </td>
                          <td className="p-2 text-right">{member.eventAttendanceRate.toFixed(1)}%</td>
                          <td className="p-2 text-right font-medium">
                            {member.overallScore.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No member engagement data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
