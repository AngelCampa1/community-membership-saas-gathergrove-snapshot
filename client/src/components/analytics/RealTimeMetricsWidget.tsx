'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  Users,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Settings,
  Zap,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeMetricsWidgetProps {
  clubId: number;
  userTier: 'basic' | 'pro' | 'unlimited';
  enabled: boolean;
  position?: 'fixed' | 'relative';
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

interface RealTimeMetrics {
  timestamp: Date;
  activeUsers: number;
  liveEvents: number;
  recentEngagement: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastUpdate: Date;
}

interface MetricTrend {
  current: number;
  previous: number;
  change: number;
  direction: 'up' | 'down' | 'stable';
}

export const RealTimeMetricsWidget: React.FC<RealTimeMetricsWidgetProps> = ({
  clubId,
  userTier,
  enabled,
  position = 'relative',
  onToggle,
  className,
}) => {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    timestamp: new Date(),
    activeUsers: 0,
    liveEvents: 0,
    recentEngagement: 0,
    connectionStatus: 'disconnected',
    lastUpdate: new Date(),
  });

  const [isVisible, setIsVisible] = useState(true);
  const [trends, setTrends] = useState<Record<string, MetricTrend>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  // Simulate WebSocket connection for real-time data
  useEffect(() => {
    if (!enabled || userTier === 'basic') {
      setMetrics(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      return;
    }

    let interval: NodeJS.Timeout;
    let reconnectTimeout: NodeJS.Timeout;
    let connectionTimeout: NodeJS.Timeout;

    const connectToRealTimeData = () => {
      setIsConnecting(true);
      setMetrics(prev => ({ ...prev, connectionStatus: 'reconnecting' }));

      // BUG FIX: Track connection timeout for cleanup
      connectionTimeout = setTimeout(() => {
        setMetrics(prev => ({ ...prev, connectionStatus: 'connected' }));
        setIsConnecting(false);

        // Start updating metrics
        interval = setInterval(() => {
          const now = new Date();
          const newActiveUsers = Math.floor(Math.random() * 50) + 10;
          const newLiveEvents = Math.floor(Math.random() * 5);
          const newEngagement = Math.floor(Math.random() * 100);

          // Calculate trends
          setTrends(prev => {
            const newTrends = { ...prev };
            
            // Active users trend
            if (prev.activeUsers) {
              const change = newActiveUsers - prev.activeUsers.current;
              newTrends.activeUsers = {
                current: newActiveUsers,
                previous: prev.activeUsers.current,
                change: Math.abs(change),
                direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
              };
            } else {
              newTrends.activeUsers = {
                current: newActiveUsers,
                previous: newActiveUsers,
                change: 0,
                direction: 'stable',
              };
            }

            return newTrends;
          });

          setMetrics(prev => ({
            ...prev,
            timestamp: now,
            activeUsers: newActiveUsers,
            liveEvents: newLiveEvents,
            recentEngagement: newEngagement,
            lastUpdate: new Date(),
          }));
        }, 30000); // Update every 30 seconds

        // Initial data
        setMetrics(prev => ({
          ...prev,
          activeUsers: Math.floor(Math.random() * 50) + 10,
          liveEvents: Math.floor(Math.random() * 5),
          recentEngagement: Math.floor(Math.random() * 100),
          lastUpdate: new Date(),
        }));
      }, 1000);
    };

    // Handle connection failures and reconnection
    const handleConnectionError = () => {
      setMetrics(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      
      // Attempt to reconnect after 10 seconds
      reconnectTimeout = setTimeout(() => {
        if (enabled) {
          connectToRealTimeData();
        }
      }, 10000);
    };

    // Listen for online/offline events
    const handleOnline = () => {
      if (enabled) {
        connectToRealTimeData();
      }
    };

    const handleOffline = () => {
      handleConnectionError();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection
    connectToRealTimeData();

    return () => {
      if (interval) clearInterval(interval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (connectionTimeout) clearTimeout(connectionTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, userTier, clubId]);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const handleToggleEnabled = useCallback(() => {
    onToggle?.(!enabled);
  }, [onToggle, enabled]);

  const formatLastUpdate = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const getConnectionIcon = () => {
    switch (metrics.connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-success" />;
      case 'reconnecting':
        return <Wifi className="h-3 w-3 text-warning animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="h-3 w-3 text-destructive" />;
      default:
        return <WifiOff className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendIcon = (trend: MetricTrend) => {
    if (trend.direction === 'up') {
      return <TrendingUp className="h-3 w-3 text-success" />;
    }
    if (trend.direction === 'down') {
      return <TrendingDown className="h-3 w-3 text-destructive" />;
    }
    return null;
  };

  // Disabled state for basic tier
  if (userTier === 'basic') {
    return (
      <div className={cn(
        "real-time-widget",
        position === 'fixed' && "fixed bottom-4 right-4 z-50",
        className
      )}>
        <Card className="w-64 bg-muted/50 border-dashed" data-testid="realtime-disabled">
          <CardContent className="p-4 text-center">
            <div className="space-y-2">
              <Zap className="h-6 w-6 mx-auto text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                Real-time features available in Expand tier
              </div>
              <Button size="sm" variant="outline" className="text-xs">
                Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "real-time-widget",
      position === 'fixed' && "fixed bottom-4 right-4 z-50",
      className
    )}>
      <Card className={cn(
        "w-72 transition-all duration-300",
        !isVisible && "h-12 overflow-hidden",
        metrics.connectionStatus === 'connected' && "border-success/20 bg-success/5",
        metrics.connectionStatus === 'disconnected' && "border-destructive/20 bg-destructive/5"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-Time Metrics
              {isConnecting && <Skeleton className="h-3 w-3 rounded-full" />}
            </CardTitle>
            
            <div className="flex items-center gap-1">
              <Badge 
                variant="outline" 
                className="text-xs px-1.5 py-0.5"
                data-testid="realtime-indicator"
              >
                <div className="flex items-center gap-1">
                  {getConnectionIcon()}
                  {metrics.connectionStatus}
                </div>
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVisibility}
                className="h-6 w-6 p-0"
              >
                {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isVisible && (
          <CardContent className="space-y-3">
            {/* Connection Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center gap-1">
                {metrics.connectionStatus === 'connected' && (
                  <div 
                    className="flex items-center gap-1"
                    data-testid="connection-status-connected"
                  >
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-success">Live</span>
                  </div>
                )}
                {metrics.connectionStatus === 'disconnected' && (
                  <div 
                    className="flex items-center gap-1"
                    data-testid="connection-status-disconnected"
                  >
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-destructive">Offline</span>
                  </div>
                )}
                {metrics.connectionStatus === 'reconnecting' && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-warning animate-ping" />
                    <span className="text-warning">Connecting...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Active Users</span>
                </div>
                <div className="flex items-center gap-1">
                  <span 
                    className="text-sm font-medium"
                    data-testid="live-users-count"
                  >
                    {metrics.activeUsers}
                  </span>
                  {trends.activeUsers && getTrendIcon(trends.activeUsers)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>Live Events</span>
                </div>
                <span className="text-sm font-medium">{metrics.liveEvents}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Engagement</span>
                </div>
                <span className="text-sm font-medium">{metrics.recentEngagement}%</span>
              </div>
            </div>

            {/* Last Update */}
            <div className="flex items-center justify-between text-xs border-t pt-2">
              <span className="text-muted-foreground">Last update:</span>
              <span className="text-muted-foreground">
                {formatLastUpdate(metrics.lastUpdate)}
              </span>
            </div>

            {/* Settings */}
            {userTier === 'unlimited' && (
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleEnabled}
                  className="text-xs h-6"
                >
                  {enabled ? 'Disable' : 'Enable'} Real-time
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Performance indicator */}
            {metrics.connectionStatus === 'connected' && (
              <div role="status" aria-live="polite" className="sr-only">
                Real-time data updated. Active users: {metrics.activeUsers}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
