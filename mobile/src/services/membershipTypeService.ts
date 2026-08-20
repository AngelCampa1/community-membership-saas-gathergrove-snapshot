import axios, { AxiosInstance } from 'axios';
import { authService } from './authService';
import { API_CONFIG, ERROR_MESSAGES } from '@/constants';

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
}

class MembershipTypeServiceClass {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupRequestInterceptor();
  }

  /**
   * Set up axios request interceptor to include JWT token
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await authService.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Gets all membership types for a club
   * @param clubId - The club ID
   * @returns Promise with membership types
   */
  async getMembershipTypes(clubId: number): Promise<MembershipTypeResponse[]> {
    try {
      const response = await this.axiosInstance.get<MembershipTypeResponse[]>(
        `/api/v1/clubs/${clubId}/membership-types`
      );

      return response.data;
    } catch (error) {
      
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleApiError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleApiError(error: unknown): Error {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: {
          status?: number;
          data?: { message?: string; errorCode?: string }
        }
      };

      if (axiosError.response?.status === 401) {
        return new Error('Session expired. Please log in again.');
      }

      if (axiosError.response?.status === 403) {
        return new Error('Access denied. You are not authorized to view membership types.');
      }

      if (axiosError.response?.status === 404) {
        return new Error('Membership types not found.');
      }

      if (axiosError.response?.status && axiosError.response.status >= 500) {
        return new Error(ERROR_MESSAGES.SERVER_ERROR);
      }
    }

    if (error && typeof error === 'object' && 'request' in error) {
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    return new Error(ERROR_MESSAGES.GENERIC_ERROR);
  }
}

// Create and export singleton instance
const membershipTypeService = new MembershipTypeServiceClass();
export { membershipTypeService }; 