import apiClient from './apiClient';

// Outreach request types
export interface SendOutreachRequest {
  selectedMemberIds: number[];
  subject?: string;
  message: string;
  type: 'email' | 'notification';
}

// Outreach response
export interface SendOutreachResponse {
  success: boolean;
  sentCount: number;
  message?: string;
  communicationLogId?: number;
  errors: string[];
}

/**
 * Outreach service for sending unified communications to selected members
 * Supports email and push notification channels
 */
const outreachService = {
  /**
   * Send outreach communication to selected members
   * @param clubId - The club ID
   * @param request - The outreach request with recipients, message, and type
   * @returns Response with success status and delivery details
   */
  async sendOutreach(clubId: number, request: SendOutreachRequest): Promise<SendOutreachResponse> {
    const response = await apiClient.post<SendOutreachResponse>(
      `/api/v1/clubs/${clubId}/communications/outreach`,
      request
    );
    return response.data;
  },
};

export default outreachService;
