import { useState, useEffect, useCallback, useRef } from 'react';
import { LoginActivityService } from '@/services/loginActivityService';
import { LoginActivityStats } from '@/types/loginActivity';
import { logger } from '@/lib/logger';

/**
 * Loads real login-activity statistics for a club.
 *
 * Backed exclusively by the LoginActivityController `stats/{clubId}` endpoint,
 * which returns aggregate counts plus a `loginTrends` series (date, total logins,
 * unique users, web/mobile split). There is no backend source for session
 * duration, hourly distribution, device class, or geographic data, so this hook
 * intentionally exposes only data the platform can truthfully report.
 */
export function useLoginActivity(clubId: number, days: number = 30) {
  const [data, setData] = useState<LoginActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const currentController = abortControllerRef.current;

    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // Add timeout protection for the API call
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10s timeout
      });

      const stats = await Promise.race([
        LoginActivityService.getLoginStats(clubId, days),
        timeout,
      ]);

      // Check if component is still mounted and this is the current request
      if (isMountedRef.current && !currentController.signal.aborted) {
        setData(stats);
        setError(null);
      }
    } catch (err) {
      // Only update state if component is still mounted and request wasn't aborted
      if (isMountedRef.current && !currentController.signal.aborted) {
        if (err instanceof Error && err.message !== 'Request timeout') {
          setError('Failed to load login activity data');
          setData(null);
          logger.error('analytics', 'Failed to load login activity data', { error: err, clubId });
        } else {
          setError('Request timed out');
          setData(null);
          logger.warn('analytics', 'Login activity request timed out', { clubId });
        }
      }
    } finally {
      if (isMountedRef.current && !currentController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [clubId, days]);

  const refetch = useCallback(() => {
    loadData();
  }, [loadData]);

  // Load data when dependencies change with cleanup
  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    return () => {
      isMountedRef.current = false;
      // Abort any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
