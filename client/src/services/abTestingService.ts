import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050';

export interface ABTestCampaignResponse {
  id: number;
  clubId: number;
  campaignName: string;
  variantATemplateId: number;
  variantBTemplateId: number;
  testPercentage: number;
  winnerId?: number;
  createdAt: string;
  endedAt?: string;
}

export interface CreateABTestCampaignRequest {
  campaignName: string;
  variantATemplateId?: number;
  variantBTemplateId?: number;
  testPercentage: number;
}

export interface StartABTestRequest {
  scheduledFor?: string;
}

export interface ABTestResultsResponse {
  campaignId: number;
  campaignName: string;
  status: string;
  variantA: VariantStatsResponse;
  variantB: VariantStatsResponse;
  testPercentage: number;
  winnerId?: number;
  isComplete: boolean;
  winnerVariant?: string;
  statisticalSignificance?: number;
  hasReachedMinimumSample: boolean;
  isStatisticallySignificant: boolean;
}

export interface VariantStatsResponse {
  templateId: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
}

class ABTestingService {
  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      credentials: 'include' as const,
    };
  }

  async getCampaigns(clubId: number): Promise<ABTestCampaignResponse[]> {
    const response = await axios.get<ABTestCampaignResponse[]>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/ab-tests`,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async getCampaign(clubId: number, campaignId: number): Promise<ABTestCampaignResponse> {
    const response = await axios.get<ABTestCampaignResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/ab-tests/${campaignId}`,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async createCampaign(
    clubId: number,
    request: CreateABTestCampaignRequest
  ): Promise<ABTestCampaignResponse> {
    const response = await axios.post<ABTestCampaignResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/ab-tests`,
      request,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async startCampaign(
    clubId: number,
    campaignId: number,
    request: StartABTestRequest
  ): Promise<ABTestCampaignResponse> {
    const response = await axios.post<ABTestCampaignResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/ab-tests/${campaignId}/start`,
      request,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async getCampaignResults(clubId: number, campaignId: number): Promise<ABTestResultsResponse> {
    const response = await axios.get<ABTestResultsResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/ab-tests/${campaignId}/results`,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async determineWinner(clubId: number, campaignId: number): Promise<ABTestCampaignResponse> {
    const response = await axios.post<ABTestCampaignResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/ab-tests/${campaignId}/determine-winner`,
      {},
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }
}

export const abTestingService = new ABTestingService();

