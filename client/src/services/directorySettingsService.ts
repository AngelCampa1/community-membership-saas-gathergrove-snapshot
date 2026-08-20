import apiClient from './apiClient';
import { DirectorySettingsResponse, UpdateDirectorySettingsRequest } from '@/types/directorySettings';

/**
 * Service for managing club directory settings
 */
export const directorySettingsService = {
  /**
   * Gets the directory settings for a club
   */
  async getDirectorySettings(clubId: number): Promise<DirectorySettingsResponse> {
    const response = await apiClient.get(`/clubs/${clubId}/settings/directory`);
    return response.data;
  },

  /**
   * Updates the directory settings for a club
   */
  async updateDirectorySettings(
    clubId: number, 
    settings: UpdateDirectorySettingsRequest
  ): Promise<DirectorySettingsResponse> {
    const response = await apiClient.put(`/clubs/${clubId}/settings/directory`, settings);
    return response.data;
  }
}; 