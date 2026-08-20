/**
 * @jest-environment jsdom
 *
 * Chat Settings Service Tests
 *
 * Tests chat settings management following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, error handling)
 */

import { chatSettingsService } from '../chatSettingsService';
import apiClient from '../apiClient';

// Mock apiClient at the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ChatSettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data
  const mockChatSettings = {
    clubId: 1,
    isEnabled: true,
    allowFileSharing: true,
    allowLinks: true,
    maxMessageLength: 2000,
    messageRetentionDays: 90,
    requireMembership: true,
    allowedMembershipTypes: [1, 2],
    moderationEnabled: true,
    autoModerationLevel: 'medium',
    profanityFilterEnabled: true,
    notificationsEnabled: true,
    updatedAt: '2025-01-15T10:00:00Z',
  };

  describe('getChatSettings', () => {
    it('should fetch chat settings successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockChatSettings });

      const result = await chatSettingsService.getChatSettings(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/settings/chat`);
      expect(result).toEqual(mockChatSettings);
    });

    it('should return settings with all properties', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockChatSettings });

      const result = await chatSettingsService.getChatSettings(clubId);

      expect(result.isEnabled).toBe(true);
      expect(result.allowFileSharing).toBe(true);
      expect(result.maxMessageLength).toBe(2000);
      expect(result.moderationEnabled).toBe(true);
    });

    it('should return membership type restrictions', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockChatSettings });

      const result = await chatSettingsService.getChatSettings(clubId);

      expect(result.requireMembership).toBe(true);
      expect(result.allowedMembershipTypes).toEqual([1, 2]);
    });

    it('should return moderation settings', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockChatSettings });

      const result = await chatSettingsService.getChatSettings(clubId);

      expect(result.autoModerationLevel).toBe('medium');
      expect(result.profanityFilterEnabled).toBe(true);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(chatSettingsService.getChatSettings(clubId)).rejects.toBeDefined();
    });

    it('should throw error when not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(chatSettingsService.getChatSettings(clubId)).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(chatSettingsService.getChatSettings(clubId)).rejects.toBeDefined();
    });
  });

  describe('updateChatSettings', () => {
    const updateRequest = {
      isEnabled: false,
      allowFileSharing: false,
      maxMessageLength: 1000,
    };

    it('should update chat settings successfully', async () => {
      const updatedSettings = { ...mockChatSettings, ...updateRequest };
      mockApiClient.put.mockResolvedValue({ data: updatedSettings });

      const result = await chatSettingsService.updateChatSettings(clubId, updateRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/clubs/${clubId}/settings/chat`,
        updateRequest
      );
      expect(result.isEnabled).toBe(false);
      expect(result.allowFileSharing).toBe(false);
      expect(result.maxMessageLength).toBe(1000);
    });

    it('should update moderation settings', async () => {
      const moderationRequest = {
        moderationEnabled: true,
        autoModerationLevel: 'high',
        profanityFilterEnabled: true,
      };
      const updatedSettings = { ...mockChatSettings, ...moderationRequest };
      mockApiClient.put.mockResolvedValue({ data: updatedSettings });

      const result = await chatSettingsService.updateChatSettings(clubId, moderationRequest);

      expect(result.autoModerationLevel).toBe('high');
    });

    it('should update membership restrictions', async () => {
      const membershipRequest = {
        requireMembership: true,
        allowedMembershipTypes: [1, 2, 3],
      };
      const updatedSettings = { ...mockChatSettings, ...membershipRequest };
      mockApiClient.put.mockResolvedValue({ data: updatedSettings });

      const result = await chatSettingsService.updateChatSettings(clubId, membershipRequest);

      expect(result.allowedMembershipTypes).toEqual([1, 2, 3]);
    });

    it('should throw error on invalid data (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Bad Request' } } };
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        chatSettingsService.updateChatSettings(clubId, updateRequest)
      ).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        chatSettingsService.updateChatSettings(clubId, updateRequest)
      ).rejects.toBeDefined();
    });

    it('should throw error when not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        chatSettingsService.updateChatSettings(clubId, updateRequest)
      ).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.put.mockRejectedValue(new Error('Network Error'));

      await expect(
        chatSettingsService.updateChatSettings(clubId, updateRequest)
      ).rejects.toBeDefined();
    });
  });

  describe('service export', () => {
    it('should export chatSettingsService instance', () => {
      expect(chatSettingsService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof chatSettingsService.getChatSettings).toBe('function');
      expect(typeof chatSettingsService.updateChatSettings).toBe('function');
    });
  });
});
