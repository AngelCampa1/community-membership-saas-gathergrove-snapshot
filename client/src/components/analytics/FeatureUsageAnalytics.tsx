"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataError } from "@/components/ui/data-error";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell /* LineChart, Line, Area, AreaChart - unused */
} from 'recharts';
import { 
  Activity, Users, TrendingUp, /* Calendar, */ Monitor, Smartphone, 
  /* Target, */ AlertTriangle, /* CheckCircle, Clock, */ RefreshCw
} from 'lucide-react';
import { featureAnalyticsService, FeatureUsageAnalyticsResponse, MemberEngagementAnalyticsResponse } from '@/services/featureAnalyticsService';
import { logger } from '@/lib/logger';
import { CHART_COLOR_ARRAY, CHART_SEMANTIC, getChartColor } from '@/utils/chartColors';

interface Props {
  clubId: number;
  'data-testid'?: string;
}

export function FeatureUsageAnalytics({ clubId, 'data-testid': dataTestId }: Props) {
  const [featureData, setFeatureData] = useState<FeatureUsageAnalyticsResponse | null>(null);
  const [engagementData, setEngagementData] = useState<MemberEngagementAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState(30);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [featureResponse, engagementResponse] = await Promise.all([
        featureAnalyticsService.getFeatureUsageAnalytics(clubId, timeRange),
        featureAnalyticsService.getMemberEngagementAnalytics(clubId)
      ]);

      setFeatureData(featureResponse);
      setEngagementData(engagementResponse);
    } catch (err) {
      logger.error('analytics', 'Error loading feature usage analytics', { error: err, clubId });
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [clubId, timeRange]);

  const refreshEngagementScores = async () => {
    try {
      setRefreshing(true);
      setError(null); // Clear any previous errors
      await featureAnalyticsService.calculateEngagementScores(clubId);
      await loadAnalytics(); // Reload data after calculation
    } catch (err) {
      logger.error('analytics', 'Error refreshing engagement scores', { error: err, clubId });
      setError(err instanceof Error ? err.message : 'Failed to refresh engagement scores');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [clubId, timeRange, loadAnalytics]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" data-testid="loading-skeleton">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" data-testid="skeleton-card"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return <DataError onRetry={loadAnalytics} error={error} />;
  }

  if (!featureData || !engagementData) {
    return <div>No data available</div>;
  }

  const topFeatures = featureData.featureUsage
    .sort((a, b) => b.totalUsageEvents - a.totalUsageEvents)
    .slice(0, 8);

  const platformData = [
    {
      name: 'Web',
      value: featureData.platformUsage.webUsageEvents,
      percentage: featureData.platformUsage.webUsagePercentage
    },
    {
      name: 'Mobile',
      value: featureData.platformUsage.mobileUsageEvents,
      percentage: featureData.platformUsage.mobileUsagePercentage
    }
  ];

  const distributionData = [
    { name: 'Highly Active', value: engagementData.distribution.highlyActive, color: CHART_SEMANTIC.positive },
    { name: 'Active', value: engagementData.distribution.active, color: CHART_SEMANTIC.info },
    { name: 'Moderate', value: engagementData.distribution.moderate, color: CHART_SEMANTIC.warning },
    { name: 'Low Engagement', value: engagementData.distribution.lowEngagement, color: CHART_COLOR_ARRAY[2] }, // amber
    { name: 'Inactive', value: engagementData.distribution.inactive, color: CHART_SEMANTIC.negative }
  ];

  return (
    <div className="space-y-6" data-testid={dataTestId}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Feature Usage Analytics</h2>
          <p className="text-muted-foreground">
            Track member engagement with platform features
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={refreshEngagementScores}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Scores
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagementData.clubSummary.averageEngagementScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 100 points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {engagementData.clubSummary.highlyActiveMembers + engagementData.clubSummary.moderateMembers}
            </div>
            <p className="text-xs text-muted-foreground">
              {((engagementData.clubSummary.highlyActiveMembers + engagementData.clubSummary.moderateMembers) / engagementData.clubSummary.totalMembers * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {engagementData.clubSummary.retentionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Members active in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Members</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {engagementData.clubSummary.inactiveMembers}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="features" className="space-y-6">
        <TabsList>
          <TabsTrigger value="features">Feature Usage</TabsTrigger>
          <TabsTrigger value="platforms">Platform Usage</TabsTrigger>
          <TabsTrigger value="engagement">Engagement Distribution</TabsTrigger>
          <TabsTrigger value="tenure">Tenure Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Used Features</CardTitle>
              <CardDescription>
                Feature usage over the last {timeRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topFeatures} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="featureName" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalUsageEvents" fill={CHART_COLOR_ARRAY[1]} name="Total Usage" />
                  <Bar dataKey="uniqueUsers" fill={CHART_SEMANTIC.positive} name="Unique Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {topFeatures.map((feature, index) => (
              <Card key={feature.featureName}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    {feature.featureName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <Badge variant={index < 3 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Adoption Rate</span>
                    <span className="font-medium">{feature.adoptionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={feature.adoptionRate} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Usage</div>
                      <div className="font-medium">{feature.totalUsageEvents}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Unique Users</div>
                      <div className="font-medium">{feature.uniqueUsers}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
                <CardDescription>
                  Usage split between web and mobile platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: { name?: string; percentage?: number }) => `${props.name}: ${(props.percentage ?? 0).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                    >
                      {platformData.map((entry, index) => (
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
                <CardTitle>Platform Metrics</CardTitle>
                <CardDescription>
                  Detailed usage statistics by platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Web Platform</div>
                      <div className="text-sm text-muted-foreground">Desktop & tablet usage</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{featureData.platformUsage.webUsageEvents.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{featureData.platformUsage.webUsagePercentage.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-success" />
                    <div>
                      <div className="font-medium">Mobile Platform</div>
                      <div className="text-sm text-muted-foreground">iOS & Android apps</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{featureData.platformUsage.mobileUsageEvents.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{featureData.platformUsage.mobileUsagePercentage.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feature Platform Breakdown</CardTitle>
              <CardDescription>
                How each feature is used across platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureData.platformUsage.featurePlatformBreakdown.slice(0, 8).map((feature) => (
                  <div key={feature.featureName} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {feature.featureName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-muted-foreground">
                        {feature.webUsage + feature.mobileUsage} total
                      </span>
                    </div>
                    <div className="flex gap-1 h-2 bg-muted rounded overflow-hidden">
                      <div
                        style={{
                          width: `${feature.webPercentage}%`,
                          backgroundColor: CHART_COLOR_ARRAY[1] // blue
                        }}
                        title={`Web: ${feature.webUsage} (${feature.webPercentage.toFixed(1)}%)`}
                      />
                      <div
                        style={{
                          width: `${feature.mobilePercentage}%`,
                          backgroundColor: CHART_SEMANTIC.positive // green
                        }}
                        title={`Mobile: ${feature.mobileUsage} (${feature.mobilePercentage.toFixed(1)}%)`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
                <CardDescription>
                  Member distribution across engagement levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                    >
                      {distributionData.map((entry, index) => (
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
                <CardTitle>Engagement Levels</CardTitle>
                <CardDescription>
                  Breakdown of member engagement categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {distributionData.map((level) => (
                  <div key={level.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: level.color }}
                      />
                      <span className="font-medium">{level.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{level.value}</div>
                      <div className="text-sm text-muted-foreground">
                        {((level.value / engagementData.clubSummary.totalMembers) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Patterns by Member Tenure</CardTitle>
              <CardDescription>
                How feature usage varies based on how long members have been with the club
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {featureData.tenurePatterns.map((pattern) => (
                  <Card key={pattern.tenureRange} className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">{pattern.tenureRange}</CardTitle>
                      <CardDescription>
                        {pattern.memberCount} members
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Avg. Feature Usage</div>
                        <div className="text-2xl font-bold">
                          {pattern.averageFeatureUsage.toFixed(1)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Top Features</div>
                        <div className="space-y-1">
                          {pattern.mostUsedFeatures.slice(0, 3).map((feature, index) => (
                            <div key={feature} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                              <span className="text-sm">
                                {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}