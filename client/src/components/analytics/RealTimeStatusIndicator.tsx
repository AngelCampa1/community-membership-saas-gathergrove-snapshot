/**
 * Real-Time Status Indicator for US-004 Advanced Analytics Dashboard
 * Shows connection status, live metrics, and alerts
 */

import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  Activity,
  Users,
  Calendar,
  Wifi,
  WifiOff,
  Bell,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRealTimeAnalytics, useRealTimeNotifications } from '../../hooks/useRealTimeAnalytics';

interface RealTimeStatusIndicatorProps {
  clubId: number;
  enabled?: boolean;
  position?: 'fixed' | 'inline';
  showNotifications?: boolean;
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

const RealTimeStatusIndicator: React.FC<RealTimeStatusIndicatorProps> = ({
  clubId,
  enabled = true,
  position = 'fixed',
  showNotifications = true,
  onToggle,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    data: realTimeData,
    isConnected,
    lastUpdate,
    error,
    reconnect,
  } = useRealTimeAnalytics({
    clubId,
    enabled,
  });

  const {
    notifications,
    dismissNotification,
    clearAllNotifications,
    hasUnreadNotifications,
  } = useRealTimeNotifications(clubId, enabled && showNotifications);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      default: return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!enabled) return null;

  const containerClasses = cn(
    'bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg transition-all duration-300 ease-in-out',
    position === 'fixed' && 'fixed bottom-4 right-4 z-50',
    position === 'inline' && 'w-full',
    isExpanded ? 'w-80' : 'w-64',
    className
  );

  return (
    <TooltipProvider>
      <Card className={containerClasses}>
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-success" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <Badge 
                variant={isConnected ? 'default' : 'destructive'}
                className="text-xs"
              >
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full mr-1',
                    isConnected ? 'bg-success animate-pulse' : 'bg-destructive'
                  )}
                />
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              {hasUnreadNotifications && showNotifications && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 relative"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      <Bell className="h-3 w-3" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{notifications.length} new notifications</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={reconnect}
                    disabled={isConnected}
                  >
                    <RefreshCw className={cn(
                      'h-3 w-3',
                      isConnected && 'text-success'
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh connection</p>
                </TooltipContent>
              </Tooltip>

              {onToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onToggle(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-2 p-2 bg-destructive/10 text-destructive text-xs rounded">
              {error}
            </div>
          )}

          {/* Live Metrics */}
          {isConnected && realTimeData && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground">Active:</span>
                  <span className="font-medium">{realTimeData.activeUsers}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-success" />
                  <span className="text-muted-foreground">Events:</span>
                  <span className="font-medium">{realTimeData.liveEvents}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-secondary" />
                  <span className="text-muted-foreground">Engagement:</span>
                  <span className="font-medium">{realTimeData.recentEngagement}%</span>
                </div>
                
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>Updated:</span>
                  <span className="font-mono text-xs">
                    {lastUpdate ? formatTime(lastUpdate) : '--:--:--'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {isExpanded && showNotifications && notifications.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Notifications</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-xs px-2"
                  onClick={clearAllNotifications}
                >
                  Clear All
                </Button>
              </div>
              
              <div className="max-h-32 overflow-y-auto space-y-1">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs"
                  >
                    {getAlertIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {notification.title}
                      </div>
                      <div className="text-muted-foreground truncate">
                        {notification.message}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 shrink-0"
                      onClick={() => dismissNotification(notification.id)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                ))}
                
                {notifications.length > 5 && (
                  <div className="text-center text-xs text-muted-foreground py-1">
                    +{notifications.length - 5} more notifications
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground text-center">
              {isConnected ? (
                <span className="text-success">
                  Connected • Real-time updates active
                </span>
              ) : (
                <span className="text-destructive">
                  Disconnected • Attempting to reconnect...
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default RealTimeStatusIndicator;