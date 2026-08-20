import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050';

export interface CommunicationAnalyticsResponse {
  communicationId: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalUnsubscribed: number;
  totalBounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  byType?: Record<string, CommunicationTypeAnalytics>;
  byDevice?: Record<string, number>;
  byEmailClient?: Record<string, number>;
  byLocation?: Record<string, number>;
  timeBasedData?: TimeBasedEngagement[];
}

export interface CommunicationTypeAnalytics {
  communicationType: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export interface TimeBasedEngagement {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export interface CommunicationDetailsResponse {
  communicationId: number;
  communicationType: string;
  subject?: string;
  sentAt: string;
  recipientCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  unsubscribedCount: number;
  bouncedCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  recipients: RecipientEngagement[];
}

export interface RecipientEngagement {
  memberId: number;
  memberName: string;
  email: string;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  unsubscribed: boolean;
  bounced: boolean;
  openedAt?: string;
  clickedAt?: string;
  openCount: number;
  clickCount: number;
  deviceType?: string;
  emailClient?: string;
}

export interface AnalyticsFilterRequest {
  startDate?: string;
  endDate?: string;
  communicationType?: string;
  templateId?: number;
  segmentId?: number;
}

class CommunicationAnalyticsService {
  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      credentials: 'include' as const,
    };
  }

  async getAnalyticsSummary(
    clubId: number,
    filters?: AnalyticsFilterRequest
  ): Promise<CommunicationAnalyticsResponse> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.communicationType) params.append('communicationType', filters.communicationType);
    if (filters?.templateId) params.append('templateId', filters.templateId.toString());
    if (filters?.segmentId) params.append('segmentId', filters.segmentId.toString());

    const response = await axios.get<CommunicationAnalyticsResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/communication-analytics/summary?${params.toString()}`,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async getCommunicationDetails(
    clubId: number,
    communicationId: number
  ): Promise<CommunicationDetailsResponse> {
    const response = await axios.get<CommunicationDetailsResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/communication-analytics/communications/${communicationId}`,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }
}

export const communicationAnalyticsService = new CommunicationAnalyticsService();

