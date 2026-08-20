"use client";

import { Suspense } from"react";
import { Card, CardContent } from"@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs";
import { EngagementDashboard, AtRiskMembersAlert } from"@/components/engagement";
import { FeatureUsageAnalytics } from"@/components/analytics/FeatureUsageAnalytics";
import { useAuth } from"@/hooks/useAuth";
import { DataError } from"@/components/ui/data-error";
import { Activity, AlertCircle, BarChart3, Users } from"lucide-react";
import { TierGate } from"@/components/tier/TierGate";

function EngagementPageContent() {
  const { user, loading: authLoading, error: authError, retryLastOperation } = useAuth();

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return <DataError onRetry={retryLastOperation} error={authError} />;
  }

  if (!user?.clubId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Club Not Found</h3>
          <p className="text-muted-foreground">Unable to access engagement data without club information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Member Engagement
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor member activity and engagement across your club
          </p>
        </div>
      </div>

      {/* At-Risk Members Alert */}
      <AtRiskMembersAlert clubId={String(user.clubId)} />

      {/* Engagement Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Member Overview
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Feature Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="glass border-border/50">
            <CardContent className="p-0">
              <EngagementDashboard clubId={String(user.clubId)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card className="glass border-border/50">
            <CardContent className="p-6">
              <FeatureUsageAnalytics clubId={user.clubId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EngagementPage() {
  return (
    <TierGate requiredTier="Expand" feature="Member Engagement Analytics" showUpgrade={true}>
      <div className="min-h-screen">
        <div className="container mx-auto p-8 space-y-8 glass border border-border/50 rounded-2xl shadow-lg">
          <Suspense fallback={
            <div className="space-y-6 animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          }>
            <EngagementPageContent />
          </Suspense>
        </div>
      </div>
    </TierGate>
  );
}
