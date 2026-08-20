'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Calendar, TrendingUp, Building2 } from 'lucide-react';
import {
  crossLocationReportingService,
  type ConsolidatedDashboardResponse,
} from '@/lib/api/crossLocationReportingService';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

export default function LocationReportsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [dashboard, setDashboard] = useState<ConsolidatedDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.clubId) {
      loadDashboard();
    }
  }, [user?.clubId]);

  const loadDashboard = async () => {
    if (!user?.clubId) return;

    try {
      setLoading(true);
      const data = await crossLocationReportingService.getConsolidatedDashboard(user.clubId);
      setDashboard(data);
    } catch (error: any) {
      logger.error('analytics', 'Error loading cross-location dashboard', { error, clubId: user.clubId });
      toast.error(error.response?.data?.message || 'Failed to load consolidated dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cross-Location Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of all {dashboard.clubName} locations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalActiveLocations}</div>
            <p className="text-xs text-muted-foreground">Active chapters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Location</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.totalActiveLocations > 0
                ? Math.round(dashboard.totalMembers / dashboard.totalActiveLocations)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Members per location</p>
          </CardContent>
        </Card>
      </div>

      {/* Location Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Location Breakdown</CardTitle>
          <CardDescription>
            Performance metrics for each location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{location.locationName}</h3>
                      <Badge variant={location.isActive ? 'default' : 'secondary'}>
                        {location.locationCode}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {location.activeMembers} members • {location.upcomingEvents} upcoming events
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{location.activeMembers}</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{location.upcomingEvents}</div>
                    <div className="text-xs text-muted-foreground">Events</div>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <div className="text-sm font-medium">
                      {dashboard.totalMembers > 0
                        ? Math.round((location.activeMembers / dashboard.totalMembers) * 100)
                        : 0}
                      %
                    </div>
                    <div className="text-xs text-muted-foreground">of total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {dashboard.locations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No locations found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Distribution Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Member Distribution</CardTitle>
          <CardDescription>
            Visual representation of member distribution across locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboard.locations.map((location) => {
              const percentage =
                dashboard.totalMembers > 0
                  ? (location.activeMembers / dashboard.totalMembers) * 100
                  : 0;

              return (
                <div key={location.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{location.locationName}</span>
                    <span className="text-muted-foreground">
                      {location.activeMembers} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
