'use client';

import React, { useState } from 'react';
import { useLoginActivity } from '@/hooks/useLoginActivity';
import { LoginActivityService } from '../../../services/loginActivityService';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { CHART_SEMANTIC, getChartColor } from '@/utils/chartColors';

interface Props {
  clubId: number;
  clubTier: string;
  'data-testid'?: string;
}

export default function LoginActivityDashboard({ clubId, clubTier, 'data-testid': dataTestId }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const { data: stats, loading, error, refetch } = useLoginActivity(clubId, selectedPeriod);
  const [calculatingScores, setCalculatingScores] = useState(false);

  // Check if club has access to Expand features
  const hasUnlimitedAccess = clubTier === 'Expand' || clubTier === 'Unlimited';

  const handleCalculateEngagementScores = async () => {
    setCalculatingScores(true);
    try {
      await LoginActivityService.calculateEngagementScores(clubId);
      await refetch(); // Use hook's refetch method
    } catch (error) {
      logger.error('analytics', 'Failed to calculate engagement scores', { error, clubId });
    } finally {
      setCalculatingScores(false);
    }
  };

  if (!hasUnlimitedAccess) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Login Activity Tracking</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" style={{ color: CHART_SEMANTIC.warning }} />
            <h4 className="text-lg font-medium text-foreground mb-2">Expand Tier Required</h4>
            <p className="text-muted-foreground mb-4">
              Login activity tracking and member engagement analytics are available exclusively
              to clubs on the Expand tier.
            </p>
            <Button>
              Upgrade to Expand
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Login Activity Dashboard</h2>
          <p className="text-muted-foreground">Track member login patterns and platform engagement</p>
        </div>
        <div className="animate-pulse" data-testid="loading-skeleton">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} data-testid="skeleton-card">
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Login Activity Dashboard</h2>
          <p className="text-muted-foreground">Track member login patterns and platform engagement</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" style={{ color: CHART_SEMANTIC.negative }} />
            <h4 className="text-lg font-medium text-foreground mb-2">Error Loading Data</h4>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const activityRate = stats.totalMembers > 0
    ? ((stats.membersWithLogins / stats.totalMembers) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6" data-testid={dataTestId}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Login Activity Dashboard</h2>
          <p className="text-muted-foreground">Track member login patterns and platform engagement</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={selectedPeriod.toString()}
            onValueChange={(value) => setSelectedPeriod(Number(value))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleCalculateEngagementScores}
            disabled={calculatingScores}
            variant="outline"
          >
            {calculatingScores ? 'Calculating...' : 'Update Scores'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Logins</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalLogins}</p>
                <p className="text-xs text-muted-foreground/70">
                  Avg: {stats.averageLoginsPerMember.toFixed(1)} per member
                </p>
              </div>
              <Clock className="h-8 w-8" style={{ color: CHART_SEMANTIC.info }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold text-success">{stats.membersWithLogins}</p>
                <p className="text-xs text-muted-foreground/70">
                  {activityRate}% of {stats.totalMembers} members
                </p>
              </div>
              <TrendingUp className="h-8 w-8" style={{ color: CHART_SEMANTIC.positive }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Monthly Active</p>
                <p className="text-2xl font-bold text-primary">{stats.monthlyActiveUsers}</p>
                <p className="text-xs text-muted-foreground/70">
                  {stats.weeklyActiveUsers} weekly · {stats.dailyActiveUsers} daily
                </p>
              </div>
              <Users className="h-8 w-8" style={{ color: CHART_SEMANTIC.info }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Inactive Members</p>
                <p className="text-2xl font-bold" style={{ color: CHART_SEMANTIC.warning }}>{stats.inactiveMembers}</p>
                <p className="text-xs text-muted-foreground/70">At risk of churn</p>
              </div>
              <TrendingDown className="h-8 w-8" style={{ color: CHART_SEMANTIC.warning }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Daily Login Activity</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.loginTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Bar dataKey="totalLogins" fill={getChartColor(1)} name="Logins" />
                <Bar dataKey="uniqueUsers" fill={CHART_SEMANTIC.positive} name="Unique Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Split Chart (web vs mobile) */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Web vs Mobile Logins</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.loginTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="webLogins"
                  stroke={getChartColor(1)}
                  name="Web"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="mobileLogins"
                  stroke={CHART_SEMANTIC.positive}
                  name="Mobile"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
