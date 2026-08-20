'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  memberEngagementService,
  type EngagementOverviewResponse,
} from '@/services/memberEngagementService';

interface EngagementMetricsPanelProps {
  clubId: string;
  /** Optional auto-refresh interval (ms). When > 0 the overview re-fetches on a timer. */
  refreshInterval?: number;
  isCompact?: boolean;
}

const getScoreColor = (score: number): string => {
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
};

const formatComponentName = (name: string): string =>
  name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (str) => str.toUpperCase());

const EngagementMetricsPanel: React.FC<EngagementMetricsPanelProps> = ({
  clubId,
  refreshInterval = 0,
  isCompact = false,
}) => {
  const [overview, setOverview] = useState<EngagementOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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
      setLastRefresh(new Date());
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 403) {
        // Tier-gated: honest upgrade prompt, never fabricated metrics.
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

  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0 || !clubId) return;
    const interval = setInterval(() => {
      fetchOverview();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchOverview, clubId]);

  const handleManualRefresh = (): void => {
    setIsLoading(true);
    fetchOverview();
  };

  if (isLoading && !overview) {
    return (
      <div className="space-y-6 animate-pulse" data-testid="loading-skeleton">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // Tier-gated state: honest upgrade message, no fabricated numbers.
  if (requiresUpgrade) {
    return (
      <div className="text-center p-6" data-testid="engagement-upgrade-required">
        <AlertCircle className="h-8 w-8 text-warning mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">
          {error || 'Failed to load engagement metrics'}
        </p>
        <Button onClick={handleManualRefresh} variant="outline" className="mt-4">
          Try Again
        </Button>
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

  // Compact mode for dashboard integration.
  if (isCompact) {
    return (
      <div className="space-y-4" data-testid="engagement-metrics-compact">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Engagement Overview</span>
          </div>
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className={cn('text-lg font-bold', getScoreColor(overview.averageScore))}>
              {overview.averageScore.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-foreground">{overview.totalMembers}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-success">{overview.highlyEngaged}</p>
            <p className="text-xs text-muted-foreground">Highly Engaged</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-destructive">{overview.atRisk}</p>
            <p className="text-xs text-muted-foreground">At Risk</p>
          </div>
        </div>

        <div className={cn('flex items-center justify-center gap-1 text-sm', trendColor)}>
          <TrendIcon className="h-4 w-4" />
          {Math.abs(overview.scoreTrend).toFixed(1)}% vs. previous period
        </div>

        {overview.criticalAlerts > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {overview.criticalAlerts} critical alert
                {overview.criticalAlerts === 1 ? '' : 's'} need attention
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const componentEntries = Object.entries(overview.componentBreakdown ?? {});

  return (
    <div className="space-y-6" data-testid="engagement-metrics-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Engagement Metrics</h2>
          {overview.lastCalculated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last calculated: {new Date(overview.lastCalculated).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          onClick={handleManualRefresh}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
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
                <div className={cn('flex items-center gap-1 text-sm mt-2', trendColor)}>
                  <TrendIcon className="h-4 w-4" />
                  {Math.abs(overview.scoreTrend).toFixed(1)}%
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

      {/* Component Breakdown (real backend score components) */}
      {componentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Score Component Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EngagementMetricsPanel;
