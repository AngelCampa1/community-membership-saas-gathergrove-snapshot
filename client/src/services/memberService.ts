import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';
import { billingService } from './billingService';
import { logger } from '@/lib/logger';

// Types for custom field values (Story 35)
export interface MemberCustomFieldValueRequest {
  customFieldId: number;
  fieldValue: string;
}

export interface MemberCustomFieldValueResponse {
  id: number;
  customFieldId: number;
  fieldLabel: string;
  fieldType: string;
  fieldValue: string;
  updatedAt: string;
}

// Types for members
export interface CreateMemberRequest {
  membershipTypeId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  joinDate?: string;
  hasSmsConsent: boolean;
  customFieldValues: MemberCustomFieldValueRequest[];
}

// New interface for updating members (Story 15)
export interface UpdateMemberRequest {
  membershipTypeId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  hasSmsConsent: boolean;
  customFieldValues: MemberCustomFieldValueRequest[];
}

// New interface for updating member status (Story 16)
export interface UpdateMemberStatusRequest {
  status: string;
}

// New interface for recording member payments (Story 17)
export interface RecordPaymentRequest {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

// Interface for member self-service dues payment (Story M-08 Web)
export interface PayMyDuesRequest {
  paymentMethodId: string;
  membershipTypeId: number;
}

export interface PaymentResponse {
  paymentId: number;
  memberId: number;
  clubId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  isPartialPayment: boolean;
  expectedDuesAmount?: number;
  outstandingBalance?: number;
  paymentStatusMessage?: string;
}

export interface MemberResponse {
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
  customFieldValues: MemberCustomFieldValueResponse[];
  totalPaidCurrentPeriod: number;
  expectedDuesAmount: number;
  outstandingBalance?: number;
  hasPartialPayments: boolean;
}

// New interface for paginated member responses (Story 14)
export interface PaginatedMembersResponse {
  members: MemberResponse[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  search?: string;
}

/**
 * Service for managing members
 */
class MemberService {
  /**
   * Creates a new member for a club
   * @param clubId - The ID of the club
   * @param member - Member details
   * @returns Promise with created member
   */
  async createMember(clubId: number, member: CreateMemberRequest): Promise<MemberResponse> {
    try {
      // Check billing status for limit enforcement (graceful degradation)
      let billingStatus;
      try {
        billingStatus = await billingService.getBillingStatus();
        
        const memberLimit = billingStatus.memberLimit === Number.MAX_SAFE_INTEGER ? 2000 : billingStatus.memberLimit;
        if (billingStatus.memberCount >= memberLimit) {
          throw new Error('Member limit exceeded for current tier');
        }
      } catch (billingError) {
        // Check if this is our limit enforcement error
        if (billingError instanceof Error && 
            (billingError.message.includes('Member limit exceeded') || 
             billingError.message.includes('Member limit exceeded for current tier'))) {
          throw billingError;
        }
        // Continue with operation if billing service is unavailable (graceful degradation)
        logger.error('Billing service unavailable, proceeding with member creation');
      }
      
      const response = await apiClient.post<MemberResponse>(
        `/clubs/${clubId}/members`, 
        member
      );
      return response.data;
    } catch (error) {
      // Check if this is our limit enforcement error
      if (error instanceof Error && 
          (error.message.includes('Member limit exceeded') || 
           error.message.includes('Member limit exceeded for current tier'))) {
        throw error;
      }
      
      throw ErrorHandler.handleApiError(error, {
        context: 'creating member',
        action: 'Please check the member information and try again',
        customMessages: {
          409: `A member with email ${member.email} already exists in this club`,
          400: 'Please verify all required fields are filled correctly',
          403: 'Member limit exceeded for current tier'
        }
      });
    }
  }

  /**
   * Gets paginated and searchable members for a club (Story 14)
   * @param clubId - The ID of the club
   * @param search - Optional search term to filter by name or email
   * @param page - Page number (1-based, defaults to 1)
   * @param pageSize - Number of items per page (defaults to 25)
   * @returns Promise with paginated member data
   */
  async getPaginatedMembers(
    clubId: number, 
    search?: string, 
    page: number = 1, 
    pageSize: number = 25
  ): Promise<PaginatedMembersResponse> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const response = await apiClient.get<PaginatedMembersResponse>(
        `/clubs/${clubId}/members/paginated?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading members',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view members in this club',
          404: 'Club not found or you do not have access to it'
        }
      });
    }
  }

  /**
   * Gets all members for a club
   * @param clubId - The ID of the club
   * @returns Promise with list of members
   */
  async getMembers(clubId: number): Promise<MemberResponse[]> {
    try {
      // Check billing status for capacity information
      await billingService.getBillingStatus();
      
      const response = await apiClient.get<MemberResponse[] | { data: MemberResponse[] }>(
        `/clubs/${clubId}/members`
      );
      
      // Handle both response formats: direct array or wrapped in data property
      const data = Array.isArray(response.data) ? response.data : response.data?.data;
      
      // Return empty array if data is undefined or null
      return data || [];
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading members',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view members in this club',
          404: 'Club not found or you do not have access to it'
        }
      });
    }
  }

  /**
   * Gets a specific member by ID
   * @param clubId - The ID of the club
   * @param memberId - The ID of the member
   * @returns Promise with member details
   */
  async getMember(clubId: number, memberId: number): Promise<MemberResponse> {
    try {
      const response = await apiClient.get<MemberResponse>(
        `/clubs/${clubId}/members/${memberId}`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading member details',
        action: 'Please try refreshing the page or go back to the member list',
        customMessages: {
          404: 'Member not found or has been removed from the club',
          403: 'You do not have permission to view this member\'s details'
        }
      });
    }
  }

  /**
   * Updates an existing member's information (Story 15)
   * @param clubId - The ID of the club
   * @param memberId - The ID of the member to update
   * @param member - Updated member details
   * @returns Promise with updated member
   */
  async updateMember(clubId: number, memberId: number, member: UpdateMemberRequest): Promise<MemberResponse> {
    try {
      // Check billing status for access validation
      await billingService.getBillingStatus();
      
      const response = await apiClient.put<MemberResponse>(
        `/clubs/${clubId}/members/${memberId}`,
        member
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating member information',
        action: 'Please check the information and try again',
        customMessages: {
          409: `Email ${member.email} is already in use by another member`,
          400: 'Please verify all required fields are filled correctly',
          404: 'Member not found or has been removed',
          403: 'You do not have permission to edit this member'
        }
      });
    }
  }

  /**
   * Archives a member (Story 16: Archive a Member)
   * @param clubId - The ID of the club
   * @param memberId - The ID of the member to archive
   * @returns Promise with updated member
   */
  async archiveMember(clubId: number, memberId: number): Promise<MemberResponse> {
    try {
      const response = await apiClient.put<MemberResponse>(
        `/clubs/${clubId}/members/${memberId}/status`,
        { status: 'Archived' } as UpdateMemberStatusRequest
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'archiving member',
        action: 'Please try again or contact support@gathergrove.club if the issue persists',
        customMessages: {
          404: 'Member not found or has already been archived',
          403: 'You do not have permission to archive this member',
          400: 'This member cannot be archived at this time'
        }
      });
    }
  }

  /**
   * Unarchives a member (restores to Active status)
   * @param clubId - The ID of the club
   * @param memberId - The ID of the member to unarchive
   * @returns Promise with updated member
   */
  async unarchiveMember(clubId: number, memberId: number): Promise<MemberResponse> {
    try {
      const response = await apiClient.put<MemberResponse>(
        `/clubs/${clubId}/members/${memberId}/status`,
        { status: 'Active' } as UpdateMemberStatusRequest
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'restoring member',
        action: 'Please try again or contact support@gathergrove.club if the issue persists',
        customMessages: {
          404: 'Member not found or is already active',
          403: 'You do not have permission to restore this member',
          400: 'This member cannot be restored at this time'
        }
      });
    }
  }

  /**
   * Records a manual dues payment for a member (Story 17)
   * @param clubId - The ID of the club
   * @param memberId - The ID of the member making the payment
   * @param payment - Payment details
   * @returns Promise with recorded payment
   */
  async recordPayment(clubId: number, memberId: number, payment: RecordPaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post<PaymentResponse>(
        `/clubs/${clubId}/members/${memberId}/payments`,
        payment
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'recording payment',
        action: 'Please verify the payment details and try again',
        customMessages: {
          400: 'Invalid payment amount or date. Please check the details',
          404: 'Member not found or has been removed',
          403: 'You do not have permission to record payments for this member'
        }
      });
    }
  }

  /**
   * Gets the current user's member profile (self-access)
   * @param clubId - The ID of the club
   * @returns Promise with current user's member profile
   */
  async getMyProfile(clubId: number): Promise<MemberResponse> {
    try {
      const response = await apiClient.get<MemberResponse>(
        `/clubs/${clubId}/members/me`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading your profile',
        action: 'Please try refreshing the page or contact support@gathergrove.club',
        customMessages: {
          404: 'Your membership profile was not found. Please contact club administrators',
          403: 'You do not have access to view your profile in this club'
        }
      });
    }
  }

  /**
   * Updates the current user's member profile (self-access)
   * @param clubId - The ID of the club
   * @param member - Updated member profile details
   * @returns Promise with updated member profile
   */
  async updateMyProfile(clubId: number, member: UpdateMemberRequest): Promise<MemberResponse> {
    try {
      const response = await apiClient.put<MemberResponse>(
        `/clubs/${clubId}/members/me`,
        member
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating your profile',
        action: 'Please check your information and try again',
        customMessages: {
          409: `Email ${member.email} is already in use by another member`,
          400: 'Please verify all required fields are filled correctly',
          403: 'You do not have permission to update your profile at this time'
        }
      });
    }
  }

  /**
   * Pay member dues (self-service) using Stripe payment
   * @param request - Payment details including Stripe payment method ID
   * @returns Promise with payment confirmation
   */
  async payMyDues(request: PayMyDuesRequest): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post<PaymentResponse>(
        `/users/me/dues/pay`,
        request
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'processing your dues payment',
        action: 'Please check your payment method and try again',
        customMessages: {
          400: 'Invalid payment information. Please verify your payment method',
          402: 'Payment failed. Please check your card details or try a different payment method',
          403: 'You are not authorized to make payments at this time',
          409: 'A payment is already being processed. Please wait and try again'
        }
      });
    }
  }

  /**
   * Creates multiple members in bulk (TDD implementation)
   * @param clubId - The ID of the club
   * @param members - Array of member details to create
   * @returns Promise with bulk creation result
   */
  async createBulkMembers(clubId: number, members: CreateMemberRequest[]): Promise<{
    successful: number;
    failed: number;
    results: MemberResponse[];
  }> {
    try {
      // Check billing status for bulk operation limits
      const billingStatus = await billingService.getBillingStatus();
      
      const memberLimit = billingStatus.memberLimit === Number.MAX_SAFE_INTEGER ? 2000 : billingStatus.memberLimit;
      const projectedCount = billingStatus.memberCount + members.length;
      if (projectedCount > memberLimit) {
        throw new Error('Bulk operation would exceed member limit');
      }
      
      const response = await apiClient.post<{
        successful: number;
        failed: number;
        results: MemberResponse[];
      }>(`/clubs/${clubId}/members/bulk`, { members });
      return response.data;
    } catch (error) {
      // Check if this is our limit enforcement error
      if (error instanceof Error && error.message.includes('Bulk operation would exceed member limit')) {
        throw error;
      }
      
      throw ErrorHandler.handleApiError(error, {
        context: 'creating members in bulk',
        action: 'Please check the member information and try again',
        customMessages: {
          403: 'Bulk operation would exceed member limit',
          400: 'Please verify all required fields are filled correctly'
        }
      });
    }
  }

  /**
   * Deletes a member (TDD implementation)
   * @param clubId - The ID of the club
   * @param memberId - The ID of the member to delete
   * @returns Promise with success confirmation
   */
  async deleteMember(clubId: number, memberId: number): Promise<{ success: boolean }> {
    try {
      // Check billing status for access validation
      await billingService.getBillingStatus();
      
      const response = await apiClient.delete<{ success: boolean }>(
        `/clubs/${clubId}/members/${memberId}`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'deleting member',
        action: 'Please try again or contact support if the issue persists',
        customMessages: {
          404: 'Member not found or has already been removed',
          403: 'You do not have permission to delete this member'
        }
      });
    }
  }
}

// Export singleton instance
const memberService = new MemberService();
export default memberService;
export { memberService }; 
