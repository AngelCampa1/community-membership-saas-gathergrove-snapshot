import apiClient from './apiClient';
import { ChatSettingsResponse, UpdateChatSettingsRequest } from '@/types/chatSettings';

/**
 * Service for managing club chat settings
 */
export const chatSettingsService = {
  /**
   * Gets the chat settings for a club
   */
  async getChatSettings(clubId: number): Promise<ChatSettingsResponse> {
    const response = await apiClient.get(`/clubs/${clubId}/settings/chat`);
    return response.data;
  },

  /**
   * Updates the chat settings for a club
   */
  async updateChatSettings(
    clubId: number, 
    settings: UpdateChatSettingsRequest
  ): Promise<ChatSettingsResponse> {
    const response = await apiClient.put(`/clubs/${clubId}/settings/chat`, settings);
    return response.data;
  }
}; 