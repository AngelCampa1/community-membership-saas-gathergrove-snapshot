import { authService } from './authService';
import { API_CONFIG } from '@/constants';
import { MemberDirectorySettingsResponse, UpdateMemberDirectorySettingsRequest } from '@/types';
import { ErrorHandler } from '@/utils/errorHandler';

/**
 * Service for directory settings operations
 */
export class DirectorySettingsService {
  /**
   * Get user's directory settings
   */
  static async getDirectorySettings(): Promise<MemberDirectorySettingsResponse> {
    try {
      const token = await authService.getStoredToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // MEM-07 fix: Use finally block for guaranteed timeout cleanup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/users/me/directory-settings`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Mobile-Client': 'true',
            'User-Agent': 'GatherGrove-Mobile/1.0.0',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Directory settings request timed out. Please check your connection and try again.');
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const appError = ErrorHandler.handleDirectoryError(error, 'Directory Settings Load');
      throw new Error(appError.message);
    }
  }

  /**
   * Update user's directory settings
   */
  static async updateDirectorySettings(
    settings: UpdateMemberDirectorySettingsRequest
  ): Promise<MemberDirectorySettingsResponse> {
    try {
      const token = await authService.getStoredToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // MEM-07 fix: Use finally block for guaranteed timeout cleanup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/users/me/directory-settings`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Mobile-Client': 'true',
            'User-Agent': 'GatherGrove-Mobile/1.0.0',
          },
          body: JSON.stringify(settings),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Directory settings update timed out. Please check your connection and try again.');
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const appError = ErrorHandler.handleDirectoryError(error, 'Directory Settings Update');
      throw new Error(appError.message);
    }
  }
}

// Export singleton instance
export const directorySettingsService = DirectorySettingsService; 