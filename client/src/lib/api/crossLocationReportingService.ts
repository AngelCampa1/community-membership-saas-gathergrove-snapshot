import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8050/api/v1';

export interface LocationDashboardSummary {
  id: number;
  locationName: string;
  locationCode: string;
  activeMembers: number;
  upcomingEvents: number;
  isActive: boolean;
}

export interface ConsolidatedDashboardResponse {
  clubId: number;
  clubName: string;
  locations: LocationDashboardSummary[];
  totalMembers: number;
  totalEvents: number;
  totalActiveLocations: number;
}

class CrossLocationReportingService {
  /**
   * Gets consolidated dashboard showing all locations for a club
   */
  async getConsolidatedDashboard(clubId: number): Promise<ConsolidatedDashboardResponse> {
    const response = await axios.get<ConsolidatedDashboardResponse>(
      `${API_BASE_URL}/clubs/${clubId}/reports/consolidated-dashboard`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
}

export const crossLocationReportingService = new CrossLocationReportingService();

