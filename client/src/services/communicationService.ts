import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

// Membership Types for targeting
export interface MembershipTypeResponse {
  id: number;
  clubId: number;
  name: string;
  description: string;
  duesAmount: number;
  duesFrequency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

// Email types
export interface SendBulkEmailRequest {
  subject: string;
  body: string;
  isHtml: boolean;
  memberTypeIds?: number[]; // Optional list of membership type IDs to target
}

export interface SendBulkEmailResponse {
  success: boolean;
  message: string;
  recipientCount: number;
  failedRecipients: string[];
}

export interface EmailUsageStatsResponse {
  emailsSentThisMonth: number; // Admin communications only (excludes system emails)
  monthlyEmailLimit: number | null; // Limit for admin communications
  isUnlimited: boolean;
  subscriptionTier: string;
}

// Push Notification types
export interface SendPushNotificationRequest {
  title: string;
  body: string;
  memberTypeIds?: number[]; // Optional list of membership type IDs to target
}

export interface SendPushNotificationResponse {
  success: boolean;
  message: string;
  deviceCount: number;
  userCount: number;
  totalActiveMembers: number;
  communicationLogId?: number;
}

export interface PushNotificationUsageStats {
  clubTier: string;
  membersWithDeviceTokens: number;
  totalActiveMembers: number;
  totalDeviceTokens: number;
  isGrowTier: boolean;
  isAzureConfigured: boolean;
  currentMonth: string;
}

// Communication History types
export interface CommunicationHistoryItem {
  id: number;
  communicationType: string;
  subject?: string;
  body: string;
  recipientCount: number;
  status: string;
  sentByUserName: string;
  sentAt: string;
  createdAt: string;
}

export interface GetCommunicationHistoryResponse {
  communications: CommunicationHistoryItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetCommunicationHistoryParams {
  page?: number;
  pageSize?: number;
  communicationType?: string;
  startDate?: string;
  endDate?: string;
}

const communicationService = {
  // Email methods
  async sendBulkEmail(clubId: number, request: SendBulkEmailRequest): Promise<SendBulkEmailResponse> {
    try {
      const response = await apiClient.post<SendBulkEmailResponse>(
        `/clubs/${clubId}/communications/email`,
        request
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'sendBulkEmail' });
    }
  },

  async getEmailUsageStats(clubId: number): Promise<EmailUsageStatsResponse> {
    try {
      const response = await apiClient.get<EmailUsageStatsResponse>(
        `/clubs/${clubId}/communications/email/usage`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'getEmailUsageStats' });
    }
  },

  // Push Notification methods
  async sendPushNotification(clubId: number, request: SendPushNotificationRequest): Promise<SendPushNotificationResponse> {
    try {
      const response = await apiClient.post<SendPushNotificationResponse>(
        `/clubs/${clubId}/communications/push`,
        request
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'sendPushNotification' });
    }
  },

  async getPushNotificationUsageStats(clubId: number): Promise<PushNotificationUsageStats> {
    try {
      const response = await apiClient.get<PushNotificationUsageStats>(
        `/clubs/${clubId}/communications/push/usage`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'getPushNotificationUsageStats' });
    }
  },

  // Membership Types methods for targeting
  async getMembershipTypes(clubId: number): Promise<MembershipTypeResponse[]> {
    try {
      const response = await apiClient.get<MembershipTypeResponse[]>(
        `/clubs/${clubId}/membership-types`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'getMembershipTypes' });
    }
  },

  // Communication History methods
  async getCommunicationHistory(
    clubId: number,
    params: GetCommunicationHistoryParams = {}
  ): Promise<GetCommunicationHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.communicationType) queryParams.append('communicationType', params.communicationType);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await apiClient.get<GetCommunicationHistoryResponse>(
        `/clubs/${clubId}/communications/history?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'getCommunicationHistory' });
    }
  },
};

export default communicationService;
