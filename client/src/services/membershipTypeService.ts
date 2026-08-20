import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';
import { DuesFrequency } from '@/constants/duesFrequency';

// Types for membership types
export interface CreateMembershipTypeRequest {
  name: string;
  description?: string;
  duesAmount: number;
  duesFrequency: DuesFrequency;
}

export interface UpdateMembershipTypeRequest {
  name: string;
  description?: string;
  duesAmount: number;
  duesFrequency?: DuesFrequency;
}

export interface MembershipTypeResponse {
  id: number;
  clubId: number;
  name: string;
  description: string;
  duesAmount: number;
  duesFrequency: DuesFrequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

/**
 * Service for managing membership types
 */
class MembershipTypeService {
  /**
   * Creates a new membership type for a club
   * @param clubId - The ID of the club
   * @param membershipType - Membership type details
   * @returns Promise with created membership type
   */
  async createMembershipType(clubId: number, membershipType: CreateMembershipTypeRequest): Promise<MembershipTypeResponse> {
    try {
      const response = await apiClient.post<MembershipTypeResponse>(
        `/clubs/${clubId}/membership-types`, 
        membershipType
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'creating membership type',
        action: 'Please check the membership type details and try again',
        customMessages: {
          400: 'Please verify all membership type fields are correct',
          403: 'You do not have permission to create membership types',
          409: `A membership type named "${membershipType.name}" already exists`
        }
      });
    }
  }

  /**
   * Gets all membership types for a club
   * @param clubId - The ID of the club
   * @returns Promise with list of membership types
   */
  async getMembershipTypes(clubId: number): Promise<MembershipTypeResponse[]> {
    try {
      const response = await apiClient.get<MembershipTypeResponse[]>(
        `/clubs/${clubId}/membership-types`
      );
      
      // The API returns a direct array
      const data = response.data;
      
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading membership types',
        action: 'Please try refreshing the page',
        customMessages: {
          403: 'You do not have permission to view membership types',
          404: 'Club not found or you do not have access to it'
        }
      });
    }
  }

  /**
   * Gets a specific membership type by ID
   * @param clubId - The ID of the club
   * @param membershipTypeId - The ID of the membership type
   * @returns Promise with membership type details
   */
  async getMembershipType(clubId: number, membershipTypeId: number): Promise<MembershipTypeResponse> {
    try {
      const response = await apiClient.get<MembershipTypeResponse>(
        `/clubs/${clubId}/membership-types/${membershipTypeId}`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading membership type details',
        action: 'Please try refreshing the page or go back to the membership types list',
        customMessages: {
          404: 'Membership type not found or has been deleted',
          403: 'You do not have permission to view this membership type'
        }
      });
    }
  }

  /**
   * Updates an existing membership type
   * @param clubId - The ID of the club
   * @param membershipTypeId - The ID of the membership type to update
   * @param membershipType - Updated membership type details
   * @returns Promise with updated membership type
   */
  async updateMembershipType(clubId: number, membershipTypeId: number, membershipType: UpdateMembershipTypeRequest): Promise<MembershipTypeResponse> {
    try {
      const response = await apiClient.put<MembershipTypeResponse>(
        `/clubs/${clubId}/membership-types/${membershipTypeId}`, 
        membershipType
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating membership type',
        action: 'Please check the membership type details and try again',
        customMessages: {
          400: 'Please verify all membership type fields are correct',
          404: 'Membership type not found or has been deleted',
          403: 'You do not have permission to edit this membership type',
          409: `A membership type named "${membershipType.name}" already exists`
        }
      });
    }
  }

  /**
   * Deletes a membership type
   * @param clubId - The ID of the club
   * @param membershipTypeId - The ID of the membership type to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteMembershipType(clubId: number, membershipTypeId: number): Promise<void> {
    try {
      await apiClient.delete(`/clubs/${clubId}/membership-types/${membershipTypeId}`);
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'deleting membership type',
        action: 'Please reassign members to a different membership type before attempting deletion',
        customMessages: {
          404: 'Membership type not found or has already been deleted',
          403: 'You do not have permission to delete this membership type'
        }
      });
    }
  }
}

// Export singleton instance
const membershipTypeService = new MembershipTypeService();
export default membershipTypeService;
export { membershipTypeService }; 