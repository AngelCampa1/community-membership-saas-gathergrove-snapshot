"use client";

import React from 'react';
import { useAuthorization } from '@/hooks/useAuthorization';
import LoginActivityDashboard from '@/components/admin/analytics/LoginActivityDashboard';
import { FeatureUsageAnalytics } from '@/components/analytics/FeatureUsageAnalytics';
import { EventEngagementDashboard } from '@/components/analytics/events/EventEngagementDashboard';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const { user, isAuthenticated, isAdmin } = useAuthorization();

  if (!isAuthenticated || !isAdmin()) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You need admin access to view analytics.</p>
      </div>
    );
  }

  const currentUser = user!;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor member engagement, event analytics, login patterns, and platform usage
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Analytics Features</p>
                <p className="text-2xl font-bold text-primary">Login Tracking</p>
                <p className="text-xs text-muted-foreground">Member engagement insights</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Member Insights</p>
                <p className="text-2xl font-bold text-success">Activity Levels</p>
                <p className="text-xs text-muted-foreground">Track member participation</p>
              </div>
              <Users className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Event Analytics</p>
                <p className="text-2xl font-bold text-secondary">Engagement</p>
                <p className="text-xs text-muted-foreground">Event attendance & satisfaction</p>
              </div>
              <TrendingUp className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login Activity Dashboard */}
      <div className="mb-12">
        <LoginActivityDashboard
          clubId={currentUser.clubId}
          clubTier={currentUser.clubTier}
          data-testid="login-activity-dashboard"
        />
      </div>

      {/* Feature Usage Analytics */}
      <div className="mb-12">
        <FeatureUsageAnalytics
          clubId={currentUser.clubId}
          data-testid="feature-usage-analytics"
        />
      </div>

      {/* Event Engagement Analytics */}
      <div className="mb-12">
        <EventEngagementDashboard 
          clubId={currentUser.clubId}
        />
      </div>

      {/* Coming Soon Sections */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-foreground">Communication Engagement</h3>
            <p className="text-sm text-muted-foreground">Coming Soon</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>Email open rates and response tracking</p>
              <p className="text-xs mt-2">Push notifications, surveys, polls</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-foreground">Mobile App Analytics</h3>
            <p className="text-sm text-muted-foreground">Coming Soon</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>Mobile vs web usage patterns</p>
              <p className="text-xs mt-2">App downloads, session duration</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-foreground">Advanced Insights</h3>
            <p className="text-sm text-muted-foreground">Coming Soon</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>Predictive analytics and recommendations</p>
              <p className="text-xs mt-2">Member retention predictions, growth insights</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}