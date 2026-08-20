import apiClient from './apiClient';

// Alert configuration response
export interface AlertConfigResponse {
  id: number;
  clubId: number;
  engagementAlerts: boolean;
  churnRiskAlerts: boolean;
  eventReminderAlerts: boolean;
  engagementThreshold: number;
  churnRiskThreshold: number;
  eventReminderDays: number;
  emailRecipients: string[];
  createdAt: string;
  updatedAt: string;
}

// Create alert configuration request
export interface CreateAlertConfigRequest {
  engagementAlerts: boolean;
  churnRiskAlerts: boolean;
  eventReminderAlerts: boolean;
  engagementThreshold: number;
  churnRiskThreshold: number;
  eventReminderDays: number;
  emailRecipients: string[];
}

// Update alert configuration request
export interface UpdateAlertConfigRequest {
  engagementAlerts: boolean;
  churnRiskAlerts: boolean;
  eventReminderAlerts: boolean;
  engagementThreshold: number;
  churnRiskThreshold: number;
  eventReminderDays: number;
  emailRecipients: string[];
}

/**
 * Alert configuration service for managing club engagement alerts
 */
const alertService = {
  /**
   * Get alert configuration for a club
   */
  async getAlertConfig(clubId: number): Promise<AlertConfigResponse> {
    const response = await apiClient.get<AlertConfigResponse>(
      `/api/v1/clubs/${clubId}/alerts/config`
    );
    return response.data;
  },

  /**
   * Create alert configuration for a club
   */
  async createAlertConfig(
    clubId: number,
    request: CreateAlertConfigRequest
  ): Promise<AlertConfigResponse> {
    const response = await apiClient.post<AlertConfigResponse>(
      `/api/v1/clubs/${clubId}/alerts/config`,
      request
    );
    return response.data;
  },

  /**
   * Update alert configuration for a club
   */
  async updateAlertConfig(
    clubId: number,
    request: UpdateAlertConfigRequest
  ): Promise<AlertConfigResponse> {
    const response = await apiClient.put<AlertConfigResponse>(
      `/api/v1/clubs/${clubId}/alerts/config`,
      request
    );
    return response.data;
  },
};

export default alertService;
