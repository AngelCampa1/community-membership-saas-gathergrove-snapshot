import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

// Types for dashboard
export interface DashboardSummary {
  currentTier: string;
  memberCount: number;
  memberLimit: number;
  duesCollectedYTD: number;
  upcomingEventCount: number;
}

/**
 * Dashboard service for fetching dashboard summary data
 */
class DashboardService {
  /**
   * Gets dashboard summary statistics for a club
   * @param clubId - The club ID to get dashboard data for
   * @returns Promise with dashboard summary data
   */
  async getDashboardSummary(clubId: number): Promise<DashboardSummary> {
    try {
      const response = await apiClient.get<DashboardSummary>(`/clubs/${clubId}/dashboard/summary`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading dashboard summary',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view dashboard data for this club',
          404: 'Club not found or you do not have access to it'
        }
      });
    }
  }
}

// Export singleton instance
const dashboardService = new DashboardService();
export default dashboardService; 