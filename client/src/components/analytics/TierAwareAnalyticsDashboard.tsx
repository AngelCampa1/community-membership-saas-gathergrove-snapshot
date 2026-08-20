'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  BarChart3,
  Users,
  DollarSign,
  Calendar,
  Lock,
  Crown,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdvancedAnalyticsCharts } from './AdvancedAnalyticsCharts';
import { DataExportManager } from './DataExportManager';
import { RealTimeMetricsWidget } from './RealTimeMetricsWidget';
import { ChartConfigurationManager } from './ChartConfigurationManager';
import {
  AnalyticsConfig,
  AnalyticsDateRange,
  ChartConfiguration,
  TierFeatures,
} from '@/types/analytics';
import { logger } from '@/lib/logger';

interface User {
  clubId: number;
  clubTier: string;
  permissions: string[];
}

interface TierAwareAnalyticsDashboardProps {
  user: User;
  analyticsData: any;
  loading?: boolean;
  error?: string;
  className?: string;
}

const tierConfigurations: Record<string, TierFeatures> = {
  Free: {
    chartTypes: ['line', 'bar'],
    maxDataPoints: 100,
    realTimeUpdates: false,
    customization: false,
    exportFormats: ['csv'],
    aiInsights: false,
    cohortAnalysis: false,
    benchmarkComparison: false,
  },
  Grow: {
    chartTypes: ['line', 'bar', 'doughnut'],
    maxDataPoints: 500,
    realTimeUpdates: false,
    customization: false,
    exportFormats: ['csv', 'excel'],
    aiInsights: false,
    cohortAnalysis: false,
    benchmarkComparison: false,
  },
  Professional: {
    chartTypes: ['line', 'bar', 'doughnut', 'pie'],
    maxDataPoints: 2000,
    realTimeUpdates: true,
    customization: false,
    exportFormats: ['csv', 'excel', 'pdf'],
    aiInsights: false,
    cohortAnalysis: true,
    benchmarkComparison: true,
  },
  Enterprise: {
    chartTypes: ['line', 'bar', 'doughnut', 'pie', 'radar'],
    maxDataPoints: 10000,
    realTimeUpdates: true,
    customization: true,
    exportFormats: ['csv', 'excel', 'pdf', 'json'],
    aiInsights: true,
    cohortAnalysis: true,
    benchmarkComparison: true,
  },
};

const getAnalyticsConfig = (clubTier: string): AnalyticsConfig => {
  const tierFeatures = tierConfigurations[clubTier] || tierConfigurations.Free;
  
  return {
    tier: clubTier === 'Enterprise' ? 'unlimited' : 
          clubTier === 'Professional' ? 'pro' : 'basic',
    features: {
      extendedDateRange: tierFeatures.maxDataPoints > 500,
      cohortAnalysis: tierFeatures.cohortAnalysis,
      advancedCharts: tierFeatures.chartTypes.length > 2,
      dataExport: tierFeatures.exportFormats.length > 1,
      realTimeUpdates: tierFeatures.realTimeUpdates,
    },
  };
};

export const TierAwareAnalyticsDashboard: React.FC<TierAwareAnalyticsDashboardProps> = ({
  user,
  analyticsData,
  loading = false,
  error,
  className,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [chartConfigurations, setChartConfigurations] = useState<Record<string, ChartConfiguration>>({});
  const [dateRange, _setDateRange] = useState<AnalyticsDateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    label: 'Last 30 days',
  });

  const config = useMemo(() => getAnalyticsConfig(user.clubTier), [user.clubTier]);
  const tierFeatures = tierConfigurations[user.clubTier] || tierConfigurations.Free;
  const isUnlimited = config.tier === 'unlimited';
  const isPro = config.tier === 'pro';
  const isBasic = config.tier === 'basic';

  // User tier mapping for components
  const userTier = isUnlimited ? 'unlimited' : isPro ? 'pro' : 'basic';

  // Handle chart configuration changes
  const handleChartConfigChange = useCallback((chartId: string, newConfig: ChartConfiguration) => {
    setChartConfigurations(prev => ({
      ...prev,
      [chartId]: newConfig,
    }));
  }, []);

  // Handle data export
  const handleDataExport = useCallback(async (format: string, _data: any) => {
    logger.debug('analytics', `Exporting ${format} for tier ${user.clubTier}`, { format, tier: user.clubTier, clubId: user.clubId });
    // Implementation would be handled by DataExportManager
  }, [user.clubTier, user.clubId]);

  // Upgrade prompt component
  const UpgradePrompt: React.FC<{ feature: string; targetTier?: string }> = ({ 
    feature, 
    targetTier = 'Enterprise' 
  }) => (
    <Card className="border-dashed border-2 border-muted-foreground/25">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="rounded-full bg-muted/50 p-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Unlock {feature}</h3>
          <p className="text-muted-foreground max-w-md">
            This feature is available in the {targetTier} tier. Upgrade to access advanced analytics capabilities.
          </p>
        </div>
        <Button className="gap-2">
          <Crown className="h-4 w-4" />
          Upgrade to {targetTier}
        </Button>
      </CardContent>
    </Card>
  );

  // Feature availability checker
  const isFeatureAvailable = (feature: keyof TierFeatures): boolean => {
    return Boolean(tierFeatures[feature]);
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with tier indicator */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <div className="flex items-center gap-2">
            <Badge variant={isUnlimited ? 'default' : 'secondary'} className="gap-1">
              {isUnlimited && <Crown className="h-3 w-3" />}
              {user.clubTier} Tier
            </Badge>
            {config.features.realTimeUpdates && (
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" />
                Live Data
              </Badge>
            )}
          </div>
        </div>

        {/* Real-time metrics widget for pro/unlimited */}
        {config.features.realTimeUpdates && (
          <RealTimeMetricsWidget
            clubId={user.clubId}
            userTier={userTier}
            enabled={true}
          />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger 
            value="advanced" 
            disabled={!config.features.advancedCharts}
            className={!config.features.advancedCharts ? 'opacity-50' : ''}
          >
            Advanced
            {!config.features.advancedCharts && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger 
            value="insights"
            disabled={!isUnlimited}
            className={!isUnlimited ? 'opacity-50' : ''}
          >
            AI Insights
            {!isUnlimited && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.totalMembers?.toLocaleString() || '1,247'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.activeMembers?.toLocaleString() || '892'}
                </div>
                <p className="text-xs text-muted-foreground">
                  71.5% engagement rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analyticsData?.revenue?.toLocaleString() || '45,780'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +8.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.totalEvents || '24'}
                </div>
                <p className="text-xs text-muted-foreground">
                  68% avg attendance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Basic Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="basic-charts-section">
            <AdvancedAnalyticsCharts
              data={analyticsData?.engagementTrends || []}
              chartType="line"
              title="Member Engagement"
              userTier={userTier}
              configuration={chartConfigurations.engagement}
              onConfigChange={(config) => handleChartConfigChange('engagement', config)}
            />

            <AdvancedAnalyticsCharts
              data={analyticsData?.eventAttendance || []}
              chartType="bar"
              title="Event Attendance"
              userTier={userTier}
              configuration={chartConfigurations.events}
              onConfigChange={(config) => handleChartConfigChange('events', config)}
            />
          </div>

          {/* Export Manager */}
          {config.features.dataExport && (
            <DataExportManager
              data={analyticsData}
              userTier={userTier}
              dateRange={dateRange}
              onExport={handleDataExport}
            />
          )}

          {/* Upgrade prompt for basic tier */}
          {isBasic && (
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Upgrade to unlock advanced analytics, real-time data, and premium export options.</span>
                <Button size="sm" variant="outline">
                  View Plans
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6" data-tab="engagement">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedAnalyticsCharts
              data={analyticsData?.memberEngagement || []}
              chartType="line"
              title="Member Activity Trends"
              userTier={userTier}
            />

            {isFeatureAvailable('cohortAnalysis') ? (
              <AdvancedAnalyticsCharts
                data={analyticsData?.cohortData || []}
                chartType="doughnut"
                title="Member Retention Cohorts"
                userTier={userTier}
              />
            ) : (
              <UpgradePrompt feature="Cohort Analysis" targetTier="Professional" />
            )}
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedAnalyticsCharts
              data={analyticsData?.revenueData || []}
              chartType="bar"
              title="Revenue Trends"
              userTier={userTier}
            />

            <AdvancedAnalyticsCharts
              data={analyticsData?.financialBreakdown || []}
              chartType="doughnut"
              title="Revenue Sources"
              userTier={userTier}
            />
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          {config.features.advancedCharts ? (
            <div className="space-y-6" data-testid="advanced-charts-section">
              {/* Chart Configuration Manager */}
              {isUnlimited && (
                <ChartConfigurationManager
                  chartConfig={chartConfigurations.advanced || {
                    type: 'line',
                    colors: ['#3B82F6', '#10B981'],
                    gridLines: true,
                    animations: true,
                    legend: true,
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                  userTier={userTier}
                  onConfigChange={(config) => handleChartConfigChange('advanced', config)}
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AdvancedAnalyticsCharts
                  data={analyticsData?.advancedMetrics || []}
                  chartType="radar"
                  title="Performance Radar"
                  userTier={userTier}
                />

                <AdvancedAnalyticsCharts
                  data={analyticsData?.comparativeData || []}
                  chartType="pie"
                  title="Comparative Analysis"
                  userTier={userTier}
                />
              </div>
            </div>
          ) : (
            <UpgradePrompt feature="Advanced Charts" />
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {isUnlimited ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-primary">Member Engagement Opportunity</h4>
                    <p className="text-primary/80 text-sm mt-1">
                      23% of members haven't attended events in the last 3 months. Consider targeted outreach.
                    </p>
                  </div>
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <h4 className="font-semibold text-success">Revenue Growth Trend</h4>
                    <p className="text-success/80 text-sm mt-1">
                      Monthly revenue is trending upward. Projected 15% growth if current trend continues.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Contact Inactive Members
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Member Event
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Detailed Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <UpgradePrompt feature="AI-Powered Insights" />
          )}
        </TabsContent>
      </Tabs>

      {/* Real-time metrics indicator */}
      {!config.features.realTimeUpdates && (
        <div className="fixed bottom-4 right-4" data-testid="realtime-disabled">
          <Card className="p-3 bg-muted/50 border-dashed">
            <div className="text-xs text-muted-foreground text-center">
              Real-time features available in Expand tier
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
