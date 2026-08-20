'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Activity,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import {
  memberEngagementService,
  type EngagementOverviewResponse,
} from '@/services/memberEngagementService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { CHART_SEMANTIC, withOpacity } from '@/utils/chartColors';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

interface ScoreBadge {
  label: string;
  className: string;
}

interface EngagementDashboardProps {
  clubId: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
};

const getScoreBadge = (score: number): ScoreBadge => {
  if (score >= 70) return { label: 'Excellent', className: 'bg-success/10 text-success' };
  if (score >= 40) return { label: 'Good', className: 'bg-warning/10 text-warning' };
  return { label: 'Needs Attention', className: 'bg-destructive/10 text-destructive' };
};

const formatComponentName = (name: string): string =>
  name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (str) => str.toUpperCase());

const EngagementDashboard: React.FC<EngagementDashboardProps> = ({ clubId }) => {
  const [overview, setOverview] = useState<EngagementOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const fetchOverview = useCallback(async (): Promise<void> => {
    if (!clubId) {
      setIsLoading(false);
      setError('Club ID is required');
      return;
    }

    setError(null);
    setRequiresUpgrade(false);

    try {
      const data = await memberEngagementService.getEngagementOverview(clubId);
      setOverview(data);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 403) {
        setRequiresUpgrade(true);
        setError(
          (err as { message?: string })?.message ||
            'Member engagement analytics requires an Expand tier subscription'
        );
      } else {
        logger.error('engagement', 'Failed to fetch engagement overview', { error: err, clubId });
        setError('Engagement metrics are currently unavailable.');
      }
      setOverview(null);
    } finally {
      setIsLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleManualRefresh = (): void => {
    setIsLoading(true);
    fetchOverview();
  };

  const componentEntries = useMemo(
    () => Object.entries(overview?.componentBreakdown ?? {}),
    [overview]
  );

  const distributionChartData = useMemo<ChartData<'pie'> | null>(() => {
    if (!overview) return null;
    return {
      labels: ['Highly Engaged', 'Moderately Engaged', 'At Risk'],
      datasets: [
        {
          data: [overview.highlyEngaged, overview.moderatelyEngaged, overview.atRisk],
          backgroundColor: [
            withOpacity(CHART_SEMANTIC.positive, 0.8),
            withOpacity(CHART_SEMANTIC.warning, 0.8),
            withOpacity(CHART_SEMANTIC.negative, 0.8),
          ],
          borderColor: [CHART_SEMANTIC.positive, CHART_SEMANTIC.warning, CHART_SEMANTIC.negative],
          borderWidth: 2,
        },
      ],
    };
  }, [overview]);

  const componentChartData = useMemo<ChartData<'bar'> | null>(() => {
    if (!overview || componentEntries.length === 0) return null;
    return {
      labels: componentEntries.map(([key]) => formatComponentName(key)),
      datasets: [
        {
          label: 'Score (%)',
          data: componentEntries.map(([, value]) => value),
          backgroundColor: withOpacity(CHART_SEMANTIC.info, 0.5),
          borderColor: CHART_SEMANTIC.info,
          borderWidth: 2,
        },
      ],
    };
  }, [overview, componentEntries]);

  const barChartOptions = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, max: 100 } },
    }),
    []
  );

  const exportData = (): void => {
    if (!overview) return;
    const payload = {
      timestamp: new Date().toISOString(),
      clubId,
      ...overview,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engagement-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading && !overview) {
    return (
      <div className="space-y-6 p-6 animate-pulse" data-testid="engagement-dashboard-loading">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  // Tier-gated state: honest upgrade prompt, never fabricated metrics.
  if (requiresUpgrade) {
    return (
      <div className="flex items-center justify-center p-12" data-testid="engagement-upgrade-required">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => (window.location.href = '/admin/settings/billing')}>
            Upgrade to Expand
          </Button>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {error || 'Failed to load engagement metrics'}
          </h3>
          <Button onClick={handleManualRefresh} variant="outline" className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const trendIsUp = overview.scoreTrend > 0;
  const trendIsDown = overview.scoreTrend < 0;
  const TrendIcon = trendIsUp ? TrendingUp : trendIsDown ? TrendingDown : Minus;
  const trendColor = trendIsUp
    ? 'text-success'
    : trendIsDown
      ? 'text-destructive'
      : 'text-muted-foreground';
  const scoreBadge = getScoreBadge(overview.averageScore);

  return (
    <div className="space-y-6 p-6" data-testid="engagement-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Member Engagement Dashboard</h1>
          {overview.lastCalculated && (
            <p className="text-muted-foreground mt-1">
              Last calculated: {new Date(overview.lastCalculated).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleManualRefresh} variant="outline" size="sm" disabled={isLoading} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className={cn('text-2xl font-bold', getScoreColor(overview.averageScore))}>
                  {overview.averageScore.toFixed(1)}%
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={scoreBadge.className}>{scoreBadge.label}</Badge>
                  <div className={cn('flex items-center text-sm', trendColor)}>
                    <TrendIcon className="h-4 w-4 mr-1" />
                    {Math.abs(overview.scoreTrend).toFixed(1)}%
                  </div>
                </div>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold text-foreground">{overview.totalMembers}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {overview.highlyEngaged} highly engaged
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">At-Risk Members</p>
                <p className="text-2xl font-bold text-destructive">{overview.atRisk}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {overview.moderatelyEngaged} moderately engaged
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-warning">{overview.activeAlerts}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {overview.criticalAlerts} critical
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ErrorBoundary
                    level="component"
                    fallback={(_error, retry) => (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">Failed to load chart</p>
                        <Button variant="outline" size="sm" onClick={retry}>
                          Retry
                        </Button>
                      </div>
                    )}
                  >
                    {distributionChartData && (
                      <Pie
                        data={distributionChartData}
                        options={{ responsive: true, maintainAspectRatio: false }}
                      />
                    )}
                  </ErrorBoundary>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Component Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ErrorBoundary
                    level="component"
                    fallback={(_error, retry) => (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">Failed to load chart</p>
                        <Button variant="outline" size="sm" onClick={retry}>
                          Retry
                        </Button>
                      </div>
                    )}
                  >
                    {componentChartData ? (
                      <Bar data={componentChartData} options={barChartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        No component breakdown available
                      </div>
                    )}
                  </ErrorBoundary>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Level Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  {distributionChartData && (
                    <Pie
                      data={distributionChartData}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <p className="text-2xl font-bold text-success">{overview.highlyEngaged}</p>
                    <p className="text-sm text-muted-foreground">Highly Engaged</p>
                  </div>
                  <div className="text-center p-4 bg-warning/10 rounded-lg">
                    <p className="text-2xl font-bold text-warning">{overview.moderatelyEngaged}</p>
                    <p className="text-sm text-muted-foreground">Moderately Engaged</p>
                  </div>
                  <div className="text-center p-4 bg-destructive/10 rounded-lg">
                    <p className="text-2xl font-bold text-destructive">{overview.atRisk}</p>
                    <p className="text-sm text-muted-foreground">At Risk</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Score Component Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {componentEntries.length > 0 ? (
                <div className="space-y-4">
                  {componentEntries.map(([component, value]) => (
                    <div key={component} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{formatComponentName(component)}</span>
                        <span className={cn('text-sm font-semibold', getScoreColor(value))}>
                          {value.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No component breakdown available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EngagementDashboard;
