"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, TrendingUp, Users, Clock as _Clock } from 'lucide-react';
import { EventAttendanceData, EventTrendData } from './types';
import { CHART_SEMANTIC, getChartColor } from '@/utils/chartColors';

interface Props {
  data: EventAttendanceData[];
  trendData: EventTrendData[];
}

interface AttendanceChartPoint {
  name: string;
  events: number;
  attendance: number;
  avgAttendance?: number;
  rating?: number;
  expected?: number;
  attendanceRate?: number;
  avgDuration?: number;
}

export function EventAttendanceChart({ data, trendData }: Props) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [groupBy, setGroupBy] = useState<'category' | 'type' | 'month'>('category');

  // Process data based on grouping
  const processedData = React.useMemo<AttendanceChartPoint[]>(() => {
    if (groupBy === 'month') {
      return trendData.map(trend => ({
        name: trend.month,
        events: trend.eventsHeld,
        attendance: trend.totalAttendance,
        avgAttendance: Math.round(trend.totalAttendance / trend.eventsHeld),
        rating: trend.averageRating
      }));
    }

    const grouped = data.reduce((acc, event) => {
      const key = groupBy === 'category' ? event.category : event.eventType;
      if (!acc[key]) {
        acc[key] = {
          name: key,
          totalEvents: 0,
          totalAttendance: 0,
          totalExpected: 0,
          avgDuration: 0
        };
      }
      acc[key].totalEvents += 1;
      acc[key].totalAttendance += event.actualAttendance;
      acc[key].totalExpected += event.expectedAttendance;
      acc[key].avgDuration += event.duration;
      return acc;
    }, {} as Record<string, { name: string; totalEvents: number; totalAttendance: number; totalExpected: number; avgDuration: number }>);

    return Object.values(grouped).map((item) => ({
      name: item.name,
      events: item.totalEvents,
      attendance: item.totalAttendance,
      expected: item.totalExpected,
      attendanceRate: Math.round((item.totalAttendance / item.totalExpected) * 100),
      avgDuration: Math.round(item.avgDuration / item.totalEvents)
    }));
  }, [data, trendData, groupBy]);

  // Category distribution for pie chart
  const categoryDistribution = React.useMemo(() => {
    const categories = data.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      percentage: (value / data.length) * 100
    }));
  }, [data]);

  // Recent events data
  const recentEvents = React.useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
      .slice(0, 10)
      .map(event => ({
        name: event.eventName.length > 20 ? event.eventName.substring(0, 20) + '...' : event.eventName,
        fullName: event.eventName,
        attendance: event.actualAttendance,
        expected: event.expectedAttendance,
        rate: event.attendanceRate,
        date: event.eventDate,
        category: event.category
      }));
  }, [data]);

  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke={getChartColor(1)}
                strokeWidth={2}
                dot={{ fill: getChartColor(1) }}
                name="Actual Attendance"
              />
              {groupBy !== 'month' && (
                <Line
                  type="monotone"
                  dataKey="expected"
                  stroke={CHART_SEMANTIC.negative}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: CHART_SEMANTIC.negative }}
                  name="Expected Attendance"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="attendance"
                stackId="1"
                stroke={getChartColor(1)}
                fill={getChartColor(1)}
                fillOpacity={0.6}
                name="Actual Attendance"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="attendance" fill={getChartColor(1)} name="Actual Attendance" />
              {groupBy !== 'month' && (
                <Bar dataKey="expected" fill={CHART_SEMANTIC.negative} name="Expected Attendance" opacity={0.7} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold">Event Attendance Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Visualize attendance patterns and trends across events
          </p>
        </div>
        
        <div className="flex gap-2 ml-auto">
          <Select value={groupBy} onValueChange={(value: "type" | "category" | "month") => setGroupBy(value)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">By Category</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
              <SelectItem value="month">By Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={chartType} onValueChange={(value: "line" | "bar" | "area") => setChartType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Attendance Trends
          </CardTitle>
          <CardDescription>
            {groupBy === 'month' ? 'Monthly attendance patterns' : `Attendance grouped by ${groupBy}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      {/* Secondary Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Category Distribution
            </CardTitle>
            <CardDescription>
              Distribution of events across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: { name?: string; percentage?: number }) => `${props.name}: ${(props.percentage ?? 0).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Events Performance
            </CardTitle>
            <CardDescription>
              Latest events with attendance details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {recentEvents.map((event, index) => (
                <div key={event.fullName || event.name || `event-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium" title={event.fullName}>
                      {event.name}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {new Date(event.date).toLocaleDateString()}
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      event.rate >= 80 ? 'text-success' :
                      event.rate >= 60 ? 'text-warning' :
                      'text-destructive'
                    }`}>
                      {event.rate}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.attendance}/{event.expected}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Performing Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {categoryDistribution.reduce((max, cat) => 
                cat.value > max.value ? cat : max
              ).name}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryDistribution.reduce((max, cat) => 
                cat.value > max.value ? cat : max
              ).value} events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Event Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {Math.round(data.reduce((sum, event) => sum + event.duration, 0) / data.length)} min
            </div>
            <p className="text-xs text-muted-foreground">
              Across all events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peak Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {Math.max(...data.map(event => event.actualAttendance))}
            </div>
            <p className="text-xs text-muted-foreground">
              Highest single event
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consistency Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {(100 - (data.reduce((sum, event) => 
                sum + Math.abs(event.attendanceRate - 75), 0
              ) / data.length)).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Predictability metric
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}