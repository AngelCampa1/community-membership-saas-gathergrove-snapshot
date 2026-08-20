import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

// Types for admin management
export interface CreateAdminInviteRequest {
  email: string;
}

export interface AdminInviteResponse {
  inviteId: number;
  email: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  invitedByName: string;
}

export interface ClubAdminResponse {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  isCurrentUser: boolean;
}

/**
 * Service for managing club administrators and invitations
 */
export const adminService = {
  /**
   * Gets all administrators for a specific club
   */
  async getClubAdmins(clubId: number): Promise<ClubAdminResponse[]> {
    try {
      const response = await apiClient.get(`/clubs/${clubId}/admins`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading club administrators',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view club administrators',
          404: 'Club not found or you do not have access to it'
        }
      });
    }
  },

  /**
   * Creates a new administrator invitation for a club (Grow tier only)
   */
  async createAdminInvite(clubId: number, request: CreateAdminInviteRequest): Promise<AdminInviteResponse> {
    try {
      const response = await apiClient.post(`/clubs/${clubId}/admins/invites`, request);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'sending administrator invitation',
        action: 'Please check the email address and try again',
        customMessages: {
          400: 'Please enter a valid email address',
          403: 'You do not have permission to invite administrators or your club needs to upgrade to Grow tier',
          409: `An invitation has already been sent to ${request.email}`,
          422: 'This email is already associated with an administrator account'
        }
      });
    }
  },

  /**
   * Gets all pending invitations for a specific club
   */
  async getPendingInvites(clubId: number): Promise<AdminInviteResponse[]> {
    try {
      const response = await apiClient.get(`/clubs/${clubId}/admins/invites`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading pending invitations',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view pending invitations',
          404: 'Club not found or you do not have access to it'
        }
      });
    }
  },

  /**
   * Cancels a pending invitation
   */
  async cancelInvite(clubId: number, inviteId: number): Promise<void> {
    try {
      await apiClient.delete(`/clubs/${clubId}/admins/invites/${inviteId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'cancelling invitation',
        action: 'Please try again or contact support@gathergrove.club if the issue persists',
        customMessages: {
          404: 'Invitation not found or has already been cancelled',
          403: 'You do not have permission to cancel this invitation',
          409: 'Cannot cancel invitation - it may have already been accepted'
        }
      });
    }
  },

  /**
   * Removes an administrator from a club (Grow tier only)
   */
  async removeAdmin(clubId: number, userId: number): Promise<void> {
    try {
      await apiClient.delete(`/clubs/${clubId}/admins/${userId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'removing administrator',
        action: 'Please try again or contact support@gathergrove.club if the issue persists',
        customMessages: {
          404: 'Administrator not found or has already been removed',
          403: 'You do not have permission to remove administrators or your club needs to upgrade to Grow tier',
          409: 'Cannot remove the last administrator from the club'
        }
      });
    }
  }
}; 