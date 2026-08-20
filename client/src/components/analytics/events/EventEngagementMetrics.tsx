"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Area, AreaChart
} from 'recharts';
import {
  Activity, Users, TrendingUp, Star, Target, UserCheck,
  AlertTriangle, CheckCircle, Clock, Calendar
} from 'lucide-react';
import { EventEngagementMetrics as MetricsType, EventTrendData } from './types';
import { CHART_SEMANTIC, getChartColor } from '@/utils/chartColors';

interface Props {
  data: MetricsType;
  trendData: EventTrendData[];
}

export function EventEngagementMetrics({ data, trendData }: Props) {
  // Calculate trend indicators
  const getTrendDirection = (values: number[]) => {
    if (values.length < 2) return 'stable';
    const recent = values.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
    const older = values.slice(-6, -3).reduce((sum, val) => sum + val, 0) / 3;
    const change = ((recent - older) / older) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  };

  const attendanceTrend = getTrendDirection(trendData.map(t => t.totalAttendance));
  const engagementTrend = getTrendDirection(trendData.map(t => t.memberEngagement));
  const ratingTrend = getTrendDirection(trendData.map(t => t.averageRating));

  // Performance categories
  const getPerformanceLevel = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    if (percentage >= 85) return { level: 'excellent', color: 'text-success', bgColor: 'bg-success/10' };
    if (percentage >= 70) return { level: 'good', color: 'text-primary', bgColor: 'bg-primary/10' };
    if (percentage >= 50) return { level: 'average', color: 'text-warning', bgColor: 'bg-warning/10' };
    return { level: 'needs improvement', color: 'text-destructive', bgColor: 'bg-destructive/10' };
  };

  const attendancePerf = getPerformanceLevel(data.averageAttendanceRate);
  const engagementPerf = getPerformanceLevel(data.memberEngagementScore);
  const satisfactionPerf = getPerformanceLevel(data.eventSatisfactionScore, 5);

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'decreasing':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <div className="flex items-center gap-1">
              {renderTrendIcon(attendanceTrend)}
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${attendancePerf.color}`}>
              {data.averageAttendanceRate.toFixed(1)}%
            </div>
            <div className="flex items-center justify-between mt-2">
              <Progress value={data.averageAttendanceRate} className="h-2 flex-1 mr-2" />
              <Badge variant="outline" className={attendancePerf.bgColor}>
                {attendancePerf.level}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.totalAttendance.toLocaleString()} total attendees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Engagement</CardTitle>
            <div className="flex items-center gap-1">
              {renderTrendIcon(engagementTrend)}
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${engagementPerf.color}`}>
              {data.memberEngagementScore.toFixed(1)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <Progress value={data.memberEngagementScore} className="h-2 flex-1 mr-2" />
              <Badge variant="outline" className={engagementPerf.bgColor}>
                {engagementPerf.level}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 100 points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
            <div className="flex items-center gap-1">
              {renderTrendIcon(ratingTrend)}
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${satisfactionPerf.color}`}>
              {data.eventSatisfactionScore.toFixed(1)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <Progress value={(data.eventSatisfactionScore / 5) * 100} className="h-2 flex-1 mr-2" />
              <Badge variant="outline" className={satisfactionPerf.bgColor}>
                {satisfactionPerf.level}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 5.0 stars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              Events organized
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
              {data.repeatAttendanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Members attending multiple events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {data.noShowRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Registered but didn't attend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(data.lastUpdated).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(data.lastUpdated).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
            <CardDescription>
              Monthly engagement and attendance patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="memberEngagement"
                  stackId="1"
                  stroke={getChartColor(1)}
                  fill={getChartColor(1)}
                  fillOpacity={0.6}
                  name="Member Engagement"
                />
                <Area
                  type="monotone"
                  dataKey="totalAttendance"
                  stackId="2"
                  stroke={CHART_SEMANTIC.positive}
                  fill={CHART_SEMANTIC.positive}
                  fillOpacity={0.6}
                  name="Total Attendance"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Quality Trends</CardTitle>
            <CardDescription>
              Average ratings and event frequency over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" domain={[0, 5]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="eventsHeld" 
                  stroke="#e5e7eb"
                  strokeWidth={2}
                  name="Events Held"
                  dot={{ fill: '#e5e7eb', strokeWidth: 1, r: 3 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="averageRating"
                  stroke={CHART_SEMANTIC.warning}
                  strokeWidth={3}
                  dot={{ fill: CHART_SEMANTIC.warning, strokeWidth: 2, r: 4 }}
                  name="Average Rating"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Overall assessment of event engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className={`p-4 rounded-lg ${attendancePerf.bgColor} border`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Attendance Performance</h4>
                <CheckCircle className={`h-5 w-5 ${attendancePerf.color}`} />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Current rate: {data.averageAttendanceRate.toFixed(1)}%
              </p>
              <div className="text-xs space-y-1">
                <div>• Target: 80% attendance rate</div>
                <div>• Status: {attendancePerf.level}</div>
                <div>• Trend: {attendanceTrend}</div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${engagementPerf.bgColor} border`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Engagement Performance</h4>
                <Target className={`h-5 w-5 ${engagementPerf.color}`} />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Current score: {data.memberEngagementScore.toFixed(1)}/100
              </p>
              <div className="text-xs space-y-1">
                <div>• Target: 85+ engagement score</div>
                <div>• Status: {engagementPerf.level}</div>
                <div>• Trend: {engagementTrend}</div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${satisfactionPerf.bgColor} border`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Satisfaction Performance</h4>
                <Star className={`h-5 w-5 ${satisfactionPerf.color}`} />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Current rating: {data.eventSatisfactionScore.toFixed(1)}/5.0
              </p>
              <div className="text-xs space-y-1">
                <div>• Target: 4.2+ satisfaction rating</div>
                <div>• Status: {satisfactionPerf.level}</div>
                <div>• Trend: {ratingTrend}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}