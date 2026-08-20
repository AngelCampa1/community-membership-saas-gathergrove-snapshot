"use client";

import { useState, useEffect, useCallback } from"react";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import {
  Users,
  Calendar,
  CreditCard,
  Plus,
  RefreshCw,
  Zap,
  Crown,
  Bell,
  Activity
} from"lucide-react";
import dashboardService, { type DashboardSummary } from"@/services/dashboardService";
import { billingService, type BillingStatus } from"@/services/billingService";
import { UpgradeModal } from"@/components/billing/UpgradeModal";
import { useAuth } from"@/hooks/useAuth";
import { DataError } from"@/components/ui/data-error";
import { ErrorHandler } from"@/lib/errorHandler";
import { logger } from"@/lib/logger";
import Link from"next/link";
import { EngagementMetricsPanel } from"@/components/engagement";
import { getPricingPlan } from"@/lib/pricing";

export default function DashboardPage() {
  const { user, loading: authLoading, error: authError, retryLastOperation } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const growPlan = getPricingPlan('grow');
  const unlimitedPlan = getPricingPlan('unlimited');
  const isTopTier = (tier?: string) => tier === 'Expand' || tier === 'Unlimited';

  const loadDashboardData = useCallback(async () => {
    if (!user?.clubId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load dashboard summary first - this is critical
      const summary = await dashboardService.getDashboardSummary(user.clubId);
      setDashboardData(summary);

      // Try to load billing status, but don't fail if it's not available
      try {
        const billingData = await billingService.getBillingStatus();
        setBillingStatus(billingData);
      } catch (billingError) {
        logger.warn('billing','Billing service not available', { error: billingError, clubId: user?.clubId });
        // Set default billing status
        setBillingStatus({
          currentTier: user?.clubTier ||'Grow',
          hasActiveSubscription: user?.clubTier ==='Grow' || isTopTier(user?.clubTier),
          memberCount: summary.memberCount,
          memberLimit: isTopTier(user?.clubTier) ? 2000 : 200,
          canUpgrade: !isTopTier(user?.clubTier)
        });
      }
    } catch (error) {
      logger.error('dashboard','Failed to load dashboard data', { error, clubId: user?.clubId });
      setError(error);
      const apiError = ErrorHandler.handleApiError(error, { context:'loading dashboard data' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [user?.clubId, user?.clubTier]);

  useEffect(() => {
    if (user?.clubId) {
      loadDashboardData();
    } else if (!authLoading && !user) {
      // If not loading auth and no user, stop loading
      setIsLoading(false);
    }
  }, [user?.clubId, authLoading, loadDashboardData, user]);

  const retryLoadDashboard = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse" data-testid="dashboard-loading-skeleton">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (authError) {
    return <DataError onRetry={retryLastOperation} error={authError} />;
  }

  if (error) {
    return <DataError onRetry={retryLoadDashboard} error={error} />;
  }

  // No data state
  if (!dashboardData || !billingStatus) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No dashboard data available</p>
          <Button onClick={retryLoadDashboard}>Retry</Button>
        </div>
      </div>
    );
  }

  // Calculate member usage percentage (handle Expand tier gracefully)
  const normalizedMemberLimit = billingStatus.memberLimit === Number.MAX_SAFE_INTEGER ? 2000 : billingStatus.memberLimit;
  const currentTierIsTop = isTopTier(billingStatus.currentTier);
  const memberUsagePercentage = Math.round((billingStatus.memberCount / normalizedMemberLimit) * 100);

  // Helper function to display member limit text
  const getMemberLimitText = () => {
    return normalizedMemberLimit.toLocaleString();
  };

  // Helper function to display member count with formatting
  const getMemberCountText = () => {
    if (billingStatus.memberLimit === Number.MAX_SAFE_INTEGER) {
      return `${billingStatus.memberCount.toLocaleString()}`;
    }
    return billingStatus.memberCount.toString();
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-8 space-y-8 glass border border-border/50 rounded-2xl shadow-lg">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, <span className="font-medium truncate inline-block max-w-[200px] align-bottom" title={user?.fullName}>{user?.fullName}</span>!
            </p>
            <p className="text-muted-foreground text-sm truncate" title={user?.clubName}>
              {user?.clubName}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={loadDashboardData} className="hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Link href="/admin/members">
              <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                <Plus className="h-4 w-4 mr-1" />
                Add a New Member
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-members" className="glass border-border/50 hover:glass-strong group hover:opacity-95 hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Total Members</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-success/20   group-hover:shadow-lg transition-shadow duration-200">
                <Users className="h-4 w-4 text-primary group-hover:text-success transition-colors duration-200" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">{dashboardData.memberCount}</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/90 transition-colors duration-200">
                {dashboardData.memberCount === 1 ?'1 member' : `${dashboardData.memberCount} members`} registered
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-members" className="glass border-border/50 hover:glass-strong group hover:opacity-95 hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Active Members</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent/20 to-info/20   group-hover:shadow-lg transition-shadow duration-200">
                <Users className="h-4 w-4 text-accent-foreground group-hover:text-info transition-colors duration-200" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-accent-foreground to-info bg-clip-text text-transparent">{dashboardData.memberCount}</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/90 transition-colors duration-200">
                Currently active members
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-upcoming-events" className="glass border-border/50 hover:glass-strong group hover:opacity-95 hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Upcoming Events</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-secondary/40 to-chart-1/20   group-hover:shadow-lg transition-shadow duration-200">
                <Calendar className="h-4 w-4 text-secondary-foreground group-hover:text-chart-1 transition-colors duration-200" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-secondary-foreground to-chart-1 bg-clip-text text-transparent">{dashboardData.upcomingEventCount}</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/90 transition-colors duration-200">
                Events this month
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-dues-collected" className="glass border-border/50 hover:glass-strong group hover:opacity-95 hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Dues Collected YTD</CardTitle>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-warning/20 to-chart-4/20   group-hover:shadow-lg transition-shadow duration-200">
                <CreditCard className="h-4 w-4 text-warning group-hover:text-chart-4 transition-colors duration-200" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-warning to-chart-4 bg-clip-text text-transparent">${dashboardData.duesCollectedYTD.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/90 transition-colors duration-200">
                Total dues collected this year
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Current Plan & Member Usage */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Plan Card */}
          <Card data-testid="card-current-plan" className="glass border-border/50 hover:glass-strong group hover:opacity-95 hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20   group-hover:shadow-lg transition-all duration-300">
                  {billingStatus.currentTier ==="Grow" ? (
                    <Crown className="h-5 w-5 text-warning group-hover:text-warning/80 transition-colors duration-300" />
                  ) : (
                    <Zap className="h-5 w-5 text-success group-hover:text-success/80 transition-colors duration-300" />
                  )}
                </div>
                <span className="group-hover:text-primary transition-colors duration-200">Current Plan</span>
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-semibold">{billingStatus.currentTier}</span>
                  <Badge variant={billingStatus.hasActiveSubscription ?"default" :"secondary"}>
                    {billingStatus.hasActiveSubscription ?"Active" :"Free"}
                  </Badge>
                  {currentTierIsTop && (
                    <Badge variant="default" className="bg-gradient-to-r from-secondary to-secondary/80 text-white">
                      Expand
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentTierIsTop
                    ?"Expand plan with up to 2,000 members"
                    :"Grow plan with advanced features"
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {currentTierIsTop
                    ?`$${unlimitedPlan.monthlyPrice.toLocaleString()}`
                    :`$${growPlan.monthlyPrice.toLocaleString()}`
                  }
                </div>
                {billingStatus.currentTier ==="Grow" && (
                  <div className="text-sm text-muted-foreground">/month</div>
                )}
                {currentTierIsTop && (
                  <div className="text-sm text-muted-foreground">/month</div>
                )}
              </div>
            </div>

            {billingStatus.canUpgrade && (
              <div className="pt-4 border-t">
                <div className="mb-3">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Upgrade to Expand for more room
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Up to 2,000 members</li>
                    <li>• Bulk import up to 2,000 members</li>
                    <li>• Advanced analytics</li>
                    <li>• White-label support</li>
                    <li>• Dedicated account manager</li>
                  </ul>
                </div>
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full"
                  data-testid="upgrade-button"
                >
                  Upgrade to Expand
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

          {/* Member Usage Card */}
          <Card data-testid="card-member-usage" className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-info/20   group-hover:shadow-lg transition-all duration-300">
                  <Users className="h-5 w-5 text-accent-foreground group-hover:text-info transition-colors duration-300" />
                </div>
                <span className="group-hover:text-primary transition-colors duration-200">Member Usage</span>
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {getMemberCountText()} out of {getMemberLimitText()}
                </span>
                <span className="text-sm text-muted-foreground">
                  {memberUsagePercentage}%
                </span>
              </div>

              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    memberUsagePercentage > 80 ?'bg-destructive' :
                        memberUsagePercentage > 60 ?'bg-warning' :'bg-success'
                  }`}
                  style={{
                    width: `${Math.min(memberUsagePercentage, 100)}%`
                  }}
                />
              </div>
            </div>

            {memberUsagePercentage > 80 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-warning  mb-3">
                  You&apos;re approaching your member limit.
                  {billingStatus.canUpgrade &&" Consider upgrading for more members."}
                </p>
                {billingStatus.canUpgrade && (
                  <Button
                    variant="outline"
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full"
                  >
                    Upgrade to Expand
                  </Button>
                )}
              </div>
            )}

            {currentTierIsTop && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-success-foreground">
                  <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
                  <span className="font-medium">Expand member capacity</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Add up to 2,000 members on this plan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Engagement Overview - Only for Expand Tier */}
        {currentTierIsTop && (
          <div className="space-y-6">
            <Card className="glass border-border/50 hover:glass-strong transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-secondary/40">
                    <Activity className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <span>Member Engagement Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EngagementMetricsPanel clubId={user?.clubId ? String(user.clubId) :''} isCompact={true} />
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Link href="/admin/engagement">
                    <Button variant="outline" className="w-full justify-start group hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
                      <Activity className="h-4 w-4 mr-2 group-hover:text-primary transition-colors duration-200" />
                      View Full Engagement Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Member Management */}
          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20   group-hover:shadow-lg transition-all duration-300">
                  <Users className="h-5 w-5 text-primary group-hover:text-success transition-colors duration-300" />
                </div>
                <span className="group-hover:text-primary transition-colors duration-200">Member Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/members">
                <Button variant="outline" className="w-full justify-start group hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
                  <Users className="h-4 w-4 mr-2 group-hover:text-primary transition-colors duration-200" />
                  View All Members
                </Button>
              </Link>
              <Link href="/admin/members">
                <Button variant="outline" className="w-full justify-start group hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2 group-hover:text-primary transition-colors duration-200" />
                  Add New Member
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Events */}
          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/40 to-chart-1/20   group-hover:shadow-lg transition-all duration-300">
                  <Calendar className="h-5 w-5 text-secondary-foreground group-hover:text-chart-1 transition-colors duration-300" />
                </div>
                <span className="group-hover:text-primary transition-colors duration-200">Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/events">
                <Button variant="outline" className="w-full justify-start group hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
                  <Calendar className="h-4 w-4 mr-2 group-hover:text-primary transition-colors duration-200" />
                  View All Events
                </Button>
              </Link>
              <Link href="/admin/events">
                <Button variant="outline" className="w-full justify-start group hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2 group-hover:text-primary transition-colors duration-200" />
                  Create Event
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Communications */}
          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-chart-2/20   group-hover:shadow-lg transition-all duration-300">
                  <Bell className="h-5 w-5 text-accent-foreground group-hover:text-chart-2 transition-colors duration-300" />
                </div>
                <span className="group-hover:text-primary transition-colors duration-200">Communications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/communications">
                <Button variant="outline" className="w-full justify-start group hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
                  <Bell className="h-4 w-4 mr-2 group-hover:text-primary transition-colors duration-200" />
                  View Communications
                </Button>
              </Link>
              <Link href="/admin/communications/new">
                <Button variant="outline" className="w-full justify-start group hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2 group-hover:text-primary transition-colors duration-200" />
                  Create New Message
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={retryLoadDashboard}
        />
      </div>
    </div>
  );
}
