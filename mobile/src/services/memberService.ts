import axios, { AxiosInstance } from 'axios';
import { authService } from './authService';
import { API_CONFIG, ERROR_MESSAGES } from '@/constants';
import { MemberProfileResponse, UpdateMemberRequest } from '@/types';
import { ErrorHandler } from '@/utils/errorHandler';

// Backend API response type for member profile
interface BackendMemberResponse {
  id: number;
  clubId: number;
  membershipTypeId: number;
  membershipTypeName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  status: string;
  joinDate: string;
  duesPaidUntil?: string;
  hasSmsConsent: boolean;
  createdAt: string;
  updatedAt: string;
  totalPaidCurrentPeriod?: number;
  expectedDuesAmount?: number;
  outstandingBalance?: number;
  hasPartialPayments?: boolean;
  duesFrequency?: string;
  customFieldValues?: CustomFieldValue[];
}

// Custom field value type from backend
interface CustomFieldValue {
  customFieldId: number;
  fieldLabel: string;
  fieldValue: string;
}

class MemberServiceClass {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Mobile-Client': 'true',
        'User-Agent': 'GatherGrove-Mobile/1.0.0',
      },
    });

    this.setupRequestInterceptor();
  }

  /**
   * Set up request interceptor to add JWT token to requests
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Always add mobile client headers
        config.headers['X-Mobile-Client'] = 'true';
        config.headers['User-Agent'] = 'GatherGrove-Mobile/1.0.0';
        
        const token = await authService.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          if (__DEV__) {
            /* JWT token added to request headers */
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Gets the current user's member profile
   * @param clubId - The club ID
   * @returns Promise with member profile data
   */
  async getMemberProfile(clubId: number): Promise<MemberProfileResponse> {
    try {
      const response = await this.axiosInstance.get<BackendMemberResponse>(
        API_CONFIG.ENDPOINTS.MEMBER_PROFILE(clubId)
      );

      // Transform backend response to match M14 specification
      const backendData = response.data;
      const transformedData: MemberProfileResponse = {
        id: backendData.id,
        clubId: backendData.clubId,
        membershipTypeId: backendData.membershipTypeId,
        membershipTypeName: backendData.membershipTypeName,
        fullName: backendData.fullName,
        email: backendData.email,
        phoneNumber: backendData.phoneNumber,
        address: backendData.address,
        status: backendData.status,
        joinDate: backendData.joinDate,
        duesPaidUntil: backendData.duesPaidUntil,
        hasSmsConsent: backendData.hasSmsConsent,
        createdAt: backendData.createdAt,
        updatedAt: backendData.updatedAt,
        // Dues-related properties
        totalPaidCurrentPeriod: backendData.totalPaidCurrentPeriod || 0,
        expectedDuesAmount: backendData.expectedDuesAmount || 0,
        outstandingBalance: backendData.outstandingBalance,
        hasPartialPayments: backendData.hasPartialPayments || false,
        duesFrequency: backendData.duesFrequency || 'monthly',
        // Transform customFieldValues to customFields with M14 format
        customFields: backendData.customFieldValues
          ?.filter((cf: CustomFieldValue) => cf.fieldValue && cf.fieldValue.trim()) // Only include fields with values
          ?.map((cf: CustomFieldValue) => ({
            id: cf.customFieldId,
            label: cf.fieldLabel,
            value: cf.fieldValue
          })) || []
      };

      return transformedData;
    } catch (error) {
      
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleApiError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Updates the current user's member profile
   * @param clubId - The club ID
   * @param request - The updated member profile data
   * @returns Promise with updated member profile
   */
  async updateMemberProfile(clubId: number, request: UpdateMemberRequest): Promise<MemberProfileResponse> {
    try {
      const response = await this.axiosInstance.put<MemberProfileResponse>(
        API_CONFIG.ENDPOINTS.MEMBER_PROFILE(clubId),
        request
      );
      return response.data;
    } catch (error: unknown) {
      // Type guard for axios errors
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const errorData = error.response.data as Record<string, unknown>;

        if (status === 400) {
          // Extract validation errors from the response
          if (errorData?.errors) {
            // Handle model validation errors
            const errorMessages = Object.values(errorData.errors as Record<string, string[]>).flat();
            throw new Error(errorMessages.join('. '));
          } else if (errorData?.message) {
            throw new Error(errorData.message as string);
          }
          throw new Error('Invalid input. Please check your information and try again.');
        } else if (status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (status === 403) {
          throw new Error('You do not have permission to update this profile.');
        } else if (status === 404) {
          throw new Error('Member profile not found.');
        } else if (status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      throw new Error('Failed to update profile information.');
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleApiError(error: unknown): Error {
    const appError = ErrorHandler.handleProfileError(error, 'Member Profile');
    return new Error(appError.message);
  }

  /**
   * Get the current member's profile information
   * This includes the member ID which is needed for RSVP operations
   */
  async getCurrentMemberProfile(): Promise<MemberProfileResponse> {
    try {
      const response = await this.axiosInstance.get<MemberProfileResponse>('/users/me/profile-details');
      return response.data;
    } catch (error) {
      throw this.handleMemberError(error);
    }
  }

  /**
   * Handle member-related API errors
   */
  private handleMemberError(error: unknown): Error {
    const appError = ErrorHandler.handleProfileError(error, 'Member Data');
    return new Error(appError.message);
  }
}

// Create and export singleton instance
const memberService = new MemberServiceClass();
export { memberService }; 