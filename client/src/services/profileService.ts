import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

export interface UpdateProfileRequest {
  fullName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Service for user profile management operations
 */
class ProfileService {
  /**
   * Updates the current user's profile information
   * @param request Profile update data
   * @returns Promise with success message
   */
  async updateProfile(request: UpdateProfileRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<{ message: string }>('/users/me/profile', request);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating your profile',
        action: 'Please check your information and try again',
        customMessages: {
          400: 'Please enter a valid full name',
          403: 'You do not have permission to update your profile at this time',
          409: 'This name is already in use by another user'
        }
      });
    }
  }

  /**
   * Changes the current user's password
   * @param request Password change data
   * @returns Promise with success message
   */
  async changePassword(request: ChangePasswordRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<{ message: string }>('/users/me/change-password', request);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'changing your password',
        action: 'Please verify your current password and try again',
        customMessages: {
          400: 'Please enter a valid current password and new password',
          401: 'Current password is incorrect',
          403: 'You do not have permission to change your password at this time',
          422: 'New password does not meet security requirements'
        }
      });
    }
  }
}

export const profileService = new ProfileService(); 