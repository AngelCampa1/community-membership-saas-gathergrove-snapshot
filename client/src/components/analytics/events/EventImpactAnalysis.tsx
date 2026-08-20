"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as _Badge } from "@/components/ui/badge";
import { Progress as _Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart as _LineChart, Line as _Line, Area, AreaChart, ScatterChart, Scatter, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp as _TrendingUp, Users as _Users, DollarSign, Share2 as _Share2, UserPlus, Repeat,
  Heart, Target, Award, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { EventImpactMetrics, MemberEventEngagement } from './types';
import { CHART_SEMANTIC, getChartColor } from '@/utils/chartColors';

interface Props {
  impactMetrics: EventImpactMetrics[];
  memberEngagement: MemberEventEngagement[];
}

export function EventImpactAnalysis({ impactMetrics, memberEngagement }: Props) {
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y'>('6m');
  const [metricType, setMetricType] = useState<'growth' | 'retention' | 'revenue'>('growth');

  // Generate mock data if none provided
  const mockImpactMetrics: EventImpactMetrics[] = React.useMemo(() => {
    if (impactMetrics && impactMetrics.length > 0) return impactMetrics;
    
    return Array.from({ length: 10 }, (_, i) => ({
      eventId: i + 1,
      eventName: `Event ${i + 1}`,
      membershipGrowth: Math.floor(Math.random() * 20) + 5,
      memberRetention: Math.random() * 30 + 70,
      revenueImpact: Math.floor(Math.random() * 5000) + 1000,
      followUpEngagement: Math.random() * 40 + 60,
      socialMediaMentions: Math.floor(Math.random() * 50) + 10,
      referrals: Math.floor(Math.random() * 15) + 2,
      overallImpactScore: Math.random() * 30 + 70
    }));
  }, [impactMetrics]);

  const mockMemberEngagement: MemberEventEngagement[] = React.useMemo(() => {
    if (memberEngagement && memberEngagement.length > 0) return memberEngagement;
    
    return Array.from({ length: 15 }, (_, i) => ({
      memberId: i + 1,
      memberName: `Member ${i + 1}`,
      eventsAttended: Math.floor(Math.random() * 15) + 1,
      totalEventsInvited: Math.floor(Math.random() * 20) + 10,
      attendanceRate: Math.random() * 40 + 60,
      averageRating: Math.random() * 2 + 3,
      preferredEventTypes: ['workshop', 'social', 'meeting'].slice(0, Math.floor(Math.random() * 3) + 1),
      lastEventAttended: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      engagementTrend: (['increasing', 'stable', 'decreasing'] as const)[Math.floor(Math.random() * 3)]
    }));
  }, [memberEngagement]);

  // Calculate aggregated metrics
  const aggregatedMetrics = React.useMemo(() => {
    const totalGrowth = mockImpactMetrics.reduce((sum, event) => sum + event.membershipGrowth, 0);
    const avgRetention = mockImpactMetrics.reduce((sum, event) => sum + event.memberRetention, 0) / mockImpactMetrics.length;
    const totalRevenue = mockImpactMetrics.reduce((sum, event) => sum + event.revenueImpact, 0);
    const totalReferrals = mockImpactMetrics.reduce((sum, event) => sum + event.referrals, 0);
    const avgEngagement = mockImpactMetrics.reduce((sum, event) => sum + event.followUpEngagement, 0) / mockImpactMetrics.length;

    return {
      totalGrowth,
      avgRetention,
      totalRevenue,
      totalReferrals,
      avgEngagement,
      avgImpactScore: mockImpactMetrics.reduce((sum, event) => sum + event.overallImpactScore, 0) / mockImpactMetrics.length
    };
  }, [mockImpactMetrics]);

  // Member engagement analysis
  const engagementAnalysis = React.useMemo(() => {
    const trendCounts = mockMemberEngagement.reduce((acc, member) => {
      acc[member.engagementTrend]++;
      return acc;
    }, { increasing: 0, stable: 0, decreasing: 0 });

    const highEngagers = mockMemberEngagement.filter(m => m.attendanceRate > 80).length;
    const lowEngagers = mockMemberEngagement.filter(m => m.attendanceRate < 50).length;

    return {
      trendCounts,
      highEngagers,
      lowEngagers,
      avgAttendanceRate: mockMemberEngagement.reduce((sum, m) => sum + m.attendanceRate, 0) / mockMemberEngagement.length
    };
  }, [mockMemberEngagement]);

  // Event ROI calculation
  const eventROI = React.useMemo(() => {
    return mockImpactMetrics.map(event => ({
      name: event.eventName,
      roi: ((event.revenueImpact - 500) / 500) * 100, // Assuming $500 average event cost
      impact: event.overallImpactScore,
      growth: event.membershipGrowth,
      retention: event.memberRetention
    })).sort((a, b) => b.roi - a.roi);
  }, [mockImpactMetrics]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <ArrowUpRight className="h-4 w-4 text-success" />;
      case 'decreasing':
        return <ArrowDownRight className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-success';
      case 'decreasing':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Event Impact Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Measure how events drive membership growth, retention, and engagement
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={metricType} onValueChange={(value: any) => setMetricType(value)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="growth">Growth Focus</SelectItem>
              <SelectItem value="retention">Retention Focus</SelectItem>
              <SelectItem value="revenue">Revenue Focus</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 months</SelectItem>
              <SelectItem value="6m">6 months</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Impact Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Members</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              +{aggregatedMetrics.totalGrowth}
            </div>
            <p className="text-xs text-muted-foreground">
              From event referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {aggregatedMetrics.avgRetention.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Event attendees staying active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              ${aggregatedMetrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated from events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {aggregatedMetrics.avgImpactScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 100 points
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Member Engagement</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          <TabsTrigger value="social">Social Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event Impact Distribution</CardTitle>
                <CardDescription>
                  Overall impact scores across all events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockImpactMetrics.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="eventName" angle={-45} textAnchor="end" height={80} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="overallImpactScore" fill={getChartColor(1)} name="Impact Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth vs Retention</CardTitle>
                <CardDescription>
                  Relationship between member growth and retention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={mockImpactMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="membershipGrowth" name="Growth" />
                    <YAxis dataKey="memberRetention" name="Retention" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Events" dataKey="memberRetention" fill={getChartColor(4)} />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Impact Events</CardTitle>
              <CardDescription>
                Events with highest overall impact on the club
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockImpactMetrics
                  .sort((a, b) => b.overallImpactScore - a.overallImpactScore)
                  .slice(0, 5)
                  .map((event, index) => (
                    <div key={event.eventId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{event.eventName}</div>
                          <div className="text-sm text-muted-foreground">
                            +{event.membershipGrowth} members • {event.memberRetention.toFixed(1)}% retention
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{event.overallImpactScore.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Impact Score</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
                <CardDescription>
                  Member engagement trajectory over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={[
                        { name: 'Increasing', value: engagementAnalysis.trendCounts.increasing, color: CHART_SEMANTIC.positive },
                        { name: 'Stable', value: engagementAnalysis.trendCounts.stable, color: CHART_SEMANTIC.warning },
                        { name: 'Decreasing', value: engagementAnalysis.trendCounts.decreasing, color: CHART_SEMANTIC.negative }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                    >
                      {[
                        { name: 'Increasing', value: engagementAnalysis.trendCounts.increasing, color: CHART_SEMANTIC.positive },
                        { name: 'Stable', value: engagementAnalysis.trendCounts.stable, color: CHART_SEMANTIC.warning },
                        { name: 'Decreasing', value: engagementAnalysis.trendCounts.decreasing, color: CHART_SEMANTIC.negative }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Member Attendance Rates</CardTitle>
                <CardDescription>
                  Distribution of member event attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={[
                      { range: '80-100%', count: engagementAnalysis.highEngagers, color: CHART_SEMANTIC.positive },
                      { range: '60-79%', count: mockMemberEngagement.filter(m => m.attendanceRate >= 60 && m.attendanceRate < 80).length, color: getChartColor(1) },
                      { range: '40-59%', count: mockMemberEngagement.filter(m => m.attendanceRate >= 40 && m.attendanceRate < 60).length, color: CHART_SEMANTIC.warning },
                      { range: '0-39%', count: engagementAnalysis.lowEngagers, color: CHART_SEMANTIC.negative }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={getChartColor(1)} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Member Engagement Details</CardTitle>
              <CardDescription>
                Individual member engagement patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mockMemberEngagement.slice(0, 10).map((member) => (
                  <div key={member.memberId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getTrendIcon(member.engagementTrend)}
                        <span className={`text-sm font-medium ${getTrendColor(member.engagementTrend)}`}>
                          {member.engagementTrend}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{member.memberName}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.eventsAttended}/{member.totalEventsInvited} events • 
                          Last: {new Date(member.lastEventAttended).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{member.attendanceRate.toFixed(1)}%</div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.round(member.averageRating) }, (_, i) => (
                          <Heart key={i} className="h-3 w-3 fill-destructive text-destructive" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event ROI Analysis</CardTitle>
                <CardDescription>
                  Return on investment for each event based on revenue and impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={eventROI.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="roi" fill={CHART_SEMANTIC.positive} name="ROI %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Best ROI Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {eventROI[0]?.roi.toFixed(0)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {eventROI[0]?.name}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Average ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {(eventROI.reduce((sum, event) => sum + event.roi, 0) / eventROI.length).toFixed(0)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Across all events
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">
                    ${aggregatedMetrics.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generated from events
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="social">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Impact</CardTitle>
                <CardDescription>
                  Event mentions and social engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockImpactMetrics.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="eventName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="socialMediaMentions"
                      stroke={getChartColor(1)}
                      fill={getChartColor(1)}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Impact</CardTitle>
                <CardDescription>
                  New member referrals from events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockImpactMetrics.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="eventName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="referrals" fill={CHART_SEMANTIC.positive} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Mentions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockImpactMetrics.reduce((sum, event) => sum + event.socialMediaMentions, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all platforms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {aggregatedMetrics.totalReferrals}
                </div>
                <p className="text-xs text-muted-foreground">
                  New members from events
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {aggregatedMetrics.avgEngagement.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Follow-up engagement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Virality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {(aggregatedMetrics.totalReferrals / mockImpactMetrics.length * 10).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sharing potential
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}