import apiClient from './apiClient';

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  service: string;
}

/**
 * Health service for checking API connectivity
 */
export const healthService = {
  /**
   * Check the health status of the backend API
   * @returns Promise with health status information
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  },
}; 