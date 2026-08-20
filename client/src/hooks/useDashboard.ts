'use client';

import { useQuery } from '@tanstack/react-query';
import dashboardService from '@/services/dashboardService';

export function useDashboard(clubId?: number) {
  return useQuery({
    queryKey: ['dashboard', clubId],
    queryFn: () => {
      if (!clubId) throw new Error('Club ID is required');
      return dashboardService.getDashboardSummary(clubId);
    },
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
  });
}

export function useDashboardMutation() {
  // For invalidating dashboard cache after actions
  return {
    invalidateDashboard: () => {
      // This would be used by other components to invalidate the cache
    }
  };
}