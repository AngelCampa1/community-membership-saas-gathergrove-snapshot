import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

// Types for invite codes
export interface CreateInviteCodeRequest {
  name: string;
  description?: string;
  membershipTypeId: number;
  expiresAt: string;
  maxUses?: number;
  isActive: boolean;
}

export interface InviteCodeResponse {
  id: number;
  clubId: number;
  code: string;
  name: string;
  description?: string;
  membershipTypeId: number;
  membershipTypeName: string;
  expiresAt: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  joinUrl: string;
  qrCodeDataUrl?: string;
  createdAt: string;
}

export interface ValidateInviteCodeResponse {
  isValid: boolean;
  clubName: string;
  membershipTypeName: string;
  expiresAt: string;
  isExpired: boolean;
  isAtLimit: boolean;
  message?: string;
}

export interface RegisterWithInviteCodeRequest {
  inviteCode: string;
  fullName: string;
  email: string;
  password: string;
  customFields?: Record<string, string>;
}

/**
 * Service for managing invite codes
 */
class InviteCodeService {
  /**
   * Creates a new invite code for a club
   * @param clubId - The ID of the club
   * @param inviteCode - Invite code details
   * @returns Promise with created invite code
   */
  async createInviteCode(clubId: number, inviteCode: CreateInviteCodeRequest): Promise<InviteCodeResponse> {
    try {
      const response = await apiClient.post<{ data: InviteCodeResponse }>(
        `/clubs/${clubId}/invite-codes`, 
        inviteCode
      );
      return response.data.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'creating invite code',
        action: 'Please check the invite code details and try again',
        customMessages: {
          400: 'Please verify all invite code fields are correct',
          403: 'You do not have permission to create invite codes',
          409: `An invite code named "${inviteCode.name}" already exists`
        }
      });
    }
  }

  /**
   * Gets all invite codes for a club
   * @param clubId - The ID of the club
   * @returns Promise with list of invite codes
   */
  async getInviteCodes(clubId: number): Promise<InviteCodeResponse[]> {
    try {
      const response = await apiClient.get<{ data: InviteCodeResponse[] }>(
        `/clubs/${clubId}/invite-codes`
      );
      return response.data.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading invite codes',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view invite codes',
          404: 'Club not found or you do not have access to it'
        }
      });
    }
  }

  /**
   * Gets a specific invite code by ID
   * @param clubId - The ID of the club
   * @param inviteCodeId - The ID of the invite code
   * @returns Promise with invite code details
   */
  async getInviteCode(clubId: number, inviteCodeId: number): Promise<InviteCodeResponse> {
    try {
      const response = await apiClient.get<{ data: InviteCodeResponse }>(
        `/clubs/${clubId}/invite-codes/${inviteCodeId}`
      );
      return response.data.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading invite code details',
        action: 'Please try refreshing the page or go back to the invite codes list',
        customMessages: {
          404: 'Invite code not found or has been deleted',
          403: 'You do not have permission to view this invite code'
        }
      });
    }
  }

  /**
   * Toggles the active status of an invite code
   * @param clubId - The ID of the club
   * @param inviteCodeId - The ID of the invite code
   * @returns Promise that resolves when status is toggled
   */
  async toggleInviteCodeStatus(clubId: number, inviteCodeId: number): Promise<void> {
    try {
      await apiClient.patch(`/clubs/${clubId}/invite-codes/${inviteCodeId}/toggle-status`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating invite code status',
        action: 'Please try again',
        customMessages: {
          404: 'Invite code not found or has been deleted',
          403: 'You do not have permission to edit this invite code'
        }
      });
    }
  }

  /**
   * Deletes an invite code
   * @param clubId - The ID of the club
   * @param inviteCodeId - The ID of the invite code to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteInviteCode(clubId: number, inviteCodeId: number): Promise<void> {
    try {
      await apiClient.delete(`/clubs/${clubId}/invite-codes/${inviteCodeId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'deleting invite code',
        action: 'Please try again or contact support@gathergrove.club if the issue persists',
        customMessages: {
          404: 'Invite code not found or has already been deleted',
          403: 'You do not have permission to delete this invite code'
        }
      });
    }
  }

  /**
   * Validates an invite code (public endpoint)
   * @param code - The invite code to validate
   * @returns Promise with validation result
   */
  async validateInviteCode(code: string): Promise<ValidateInviteCodeResponse> {
    try {
      const response = await apiClient.get<{ data: ValidateInviteCodeResponse }>(
        `/invite-codes/${code}/validate`
      );
      return response.data.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'validating invite code',
        action: 'Please check the invite code and try again',
        customMessages: {
          404: 'Invite code not found or has expired',
          400: 'Invalid invite code format'
        }
      });
    }
  }

  /**
   * Gets invite code details by code (public endpoint)
   * @param code - The invite code
   * @returns Promise with invite code details
   */
  async getInviteCodeByCode(code: string): Promise<InviteCodeResponse> {
    try {
      const response = await apiClient.get<{ data: InviteCodeResponse }>(
        `/invite-codes/${code}`
      );
      return response.data.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading invite code details',
        action: 'Please check the invite code and try again',
        customMessages: {
          404: 'Invite code not found or has expired',
          400: 'Invalid invite code format'
        }
      });
    }
  }

  /**
   * Registers a new member using an invite code
   * @param request - Registration request with invite code
   * @returns Promise with registration result
   */
  async registerWithInviteCode(request: RegisterWithInviteCodeRequest): Promise<unknown> {
    try {
      const response = await apiClient.post<{ data: unknown }>(
        `/invite-codes/register`,
        request
      );
      return response.data.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'registering with invite code',
        action: 'Please check your details and try again',
        customMessages: {
          400: 'Please verify all registration fields are correct',
          404: 'Invite code not found or has expired',
          409: 'An account with this email already exists'
        }
      });
    }
  }
}

// Export singleton instance
const inviteCodeService = new InviteCodeService();
export default inviteCodeService;