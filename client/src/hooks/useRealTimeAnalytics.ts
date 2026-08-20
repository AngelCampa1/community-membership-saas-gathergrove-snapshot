/**
 * Real-time analytics hook for US-004 Advanced Analytics Dashboard
 * Provides WebSocket connection for live data updates
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import premiumAnalyticsService from '../services/premiumAnalyticsService';

interface RealTimeMetrics {
  timestamp: Date;
  activeUsers: number;
  liveEvents: number;
  recentEngagement: number;
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'success' | 'error';
    title: string;
    message: string;
    timestamp: Date;
  }>;
}

interface UseRealTimeAnalyticsProps {
  clubId: number;
  enabled?: boolean;
  refreshInterval?: number;
  onDataUpdate?: (data: RealTimeMetrics) => void;
  onConnectionChange?: (connected: boolean) => void;
}

interface UseRealTimeAnalyticsReturn {
  data: RealTimeMetrics | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
  reconnect: () => void;
  disconnect: () => void;
}

export const useRealTimeAnalytics = ({
  clubId,
  enabled = true,
  refreshInterval = 30000,
  onDataUpdate,
  onConnectionChange,
}: UseRealTimeAnalyticsProps): UseRealTimeAnalyticsReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const connectionAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Fetch real-time metrics using React Query with auto-refresh
  const { data, isError, error: queryError } = useQuery({
    queryKey: ['realtime-metrics', clubId],
    queryFn: async () => {
      try {
        const metrics = await premiumAnalyticsService.getRealTimeMetrics(clubId);
        setError(null);
        setIsConnected(true);
        setLastUpdate(new Date());
        connectionAttempts.current = 0;
        
        return {
          ...metrics,
          timestamp: new Date(metrics.timestamp),
          alerts: metrics.alerts.map(alert => ({
            ...alert,
            timestamp: new Date(alert.timestamp),
          })),
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        setError(errorMessage);
        setIsConnected(false);
        throw err;
      }
    },
    enabled: enabled && !!clubId,
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: true,
    retry: (failureCount) => failureCount < maxReconnectAttempts,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
    staleTime: 0, // Always fetch fresh data
  });

  // Handle data updates
  useEffect(() => {
    if (data) {
      onDataUpdate?.(data);
      setLastUpdate(new Date());
    }
  }, [data, onDataUpdate]);

  // Handle connection state changes
  useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  // Handle query errors
  useEffect(() => {
    if (isError && queryError) {
      const errorMessage = queryError instanceof Error ? queryError.message : 'Unknown error';
      setError(errorMessage);
      setIsConnected(false);
      
      // Attempt reconnection with exponential backoff
      if (connectionAttempts.current < maxReconnectAttempts) {
        connectionAttempts.current += 1;
        const delay = Math.min(1000 * Math.pow(2, connectionAttempts.current), 30000);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['realtime-metrics', clubId] });
        }, delay);
      }
    }
  }, [isError, queryError, clubId, queryClient]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setError(null);
    connectionAttempts.current = 0;
    queryClient.invalidateQueries({ queryKey: ['realtime-metrics', clubId] });
  }, [clubId, queryClient]);

  // Disconnect function
  const disconnect = useCallback(() => {
    setIsConnected(false);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    queryClient.cancelQueries({ queryKey: ['realtime-metrics', clubId] });
  }, [clubId, queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    data: data || null,
    isConnected,
    lastUpdate,
    error,
    reconnect,
    disconnect,
  };
};

/**
 * Hook for real-time notifications and alerts
 */
export const useRealTimeNotifications = (clubId: number, enabled = true) => {
  const [notifications, setNotifications] = useState<RealTimeMetrics['alerts']>([]);

  const { data: _data } = useRealTimeAnalytics({
    clubId,
    enabled,
    onDataUpdate: (data) => {
      if (data.alerts && data.alerts.length > 0) {
        setNotifications(prev => {
          const newAlerts = data.alerts.filter(
            alert => !prev.some(existing => existing.id === alert.id)
          );
          return [...prev, ...newAlerts].slice(-10); // Keep only last 10 notifications
        });
      }
    },
  });

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    dismissNotification,
    clearAllNotifications,
    hasUnreadNotifications: notifications.length > 0,
  };
};

export default useRealTimeAnalytics;