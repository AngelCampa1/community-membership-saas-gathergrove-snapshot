import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '@/constants';
import apiClient from './apiClient';

export interface MembershipCardResponse {
  fullName: string;
  membershipTypeName: string;
  membershipExpiresAt: string;
  qrCodeData: string;
}

interface ApiErrorData {
  message?: string;
}

class MembershipCardServiceClass {
  /**
   * Get digital membership card data for the current user
   * @returns Promise with membership card data
   */
  async getMembershipCard(): Promise<MembershipCardResponse> {
    try {
      // Use apiClient instead of creating own axios instance
      // This provides: auth interceptor, offline queueing, retry logic, security headers
      const data = await apiClient.get<MembershipCardResponse>(
        API_CONFIG.ENDPOINTS.MEMBERSHIP_CARD
      );
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorData>;

      // Network errors (no response) - timeout, connection refused, etc.
      if (!axiosError.response) {
        return new Error('Network error. Please check your connection.');
      }

      const status = axiosError.response.status;
      const data = axiosError.response.data;

      switch (status) {
        case 401:
          return new Error('Authentication required. Please log in again.');
        case 404:
          return new Error('Membership information not found. Please contact support@gathergrove.club.');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(data?.message || 'Failed to load membership card.');
      }
    }

    return new Error('Network error. Please check your connection.');
  }
}

// Export class for testing
export { MembershipCardServiceClass };

// Export singleton instance
export const membershipCardService = new MembershipCardServiceClass(); 