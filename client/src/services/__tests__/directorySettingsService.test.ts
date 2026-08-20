/**
 * @jest-environment jsdom
 *
 * Directory Settings Service Tests
 *
 * Tests directory settings management following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, error handling)
 */

import { directorySettingsService } from '../directorySettingsService';
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

describe('DirectorySettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data
  const mockDirectorySettings = {
    clubId: 1,
    isEnabled: true,
    showEmail: true,
    showPhone: false,
    showJoinDate: true,
    showMembershipType: true,
    showBio: true,
    showSocialLinks: false,
    showLocation: false,
    showCustomFields: true,
    visibleCustomFieldIds: [1, 2, 3],
    defaultSortField: 'fullName',
    defaultSortDirection: 'asc',
    membersPerPage: 25,
    updatedAt: '2025-01-15T10:00:00Z',
  };

  describe('getDirectorySettings', () => {
    it('should fetch directory settings successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockDirectorySettings });

      const result = await directorySettingsService.getDirectorySettings(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/settings/directory`);
      expect(result).toEqual(mockDirectorySettings);
    });

    it('should return settings with all properties', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockDirectorySettings });

      const result = await directorySettingsService.getDirectorySettings(clubId);

      expect(result.isEnabled).toBe(true);
      expect(result.showEmail).toBe(true);
      expect(result.showPhone).toBe(false);
      expect(result.defaultSortField).toBe('fullName');
      expect(result.membersPerPage).toBe(25);
    });

    it('should return visible custom field IDs', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockDirectorySettings });

      const result = await directorySettingsService.getDirectorySettings(clubId);

      expect(result.visibleCustomFieldIds).toEqual([1, 2, 3]);
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(directorySettingsService.getDirectorySettings(clubId)).rejects.toBeDefined();
    });

    it('should throw error when not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.get.mockRejectedValue(error);

      await expect(directorySettingsService.getDirectorySettings(clubId)).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(directorySettingsService.getDirectorySettings(clubId)).rejects.toBeDefined();
    });
  });

  describe('updateDirectorySettings', () => {
    const updateRequest = {
      isEnabled: true,
      showEmail: false,
      showPhone: true,
      showJoinDate: true,
      membersPerPage: 50,
    };

    it('should update directory settings successfully', async () => {
      const updatedSettings = { ...mockDirectorySettings, ...updateRequest };
      mockApiClient.put.mockResolvedValue({ data: updatedSettings });

      const result = await directorySettingsService.updateDirectorySettings(clubId, updateRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/clubs/${clubId}/settings/directory`,
        updateRequest
      );
      expect(result.showEmail).toBe(false);
      expect(result.showPhone).toBe(true);
      expect(result.membersPerPage).toBe(50);
    });

    it('should update visibility settings', async () => {
      const visibilityRequest = {
        showEmail: true,
        showPhone: true,
        showBio: false,
        showSocialLinks: true,
      };
      const updatedSettings = { ...mockDirectorySettings, ...visibilityRequest };
      mockApiClient.put.mockResolvedValue({ data: updatedSettings });

      const result = await directorySettingsService.updateDirectorySettings(clubId, visibilityRequest);

      expect(result.showEmail).toBe(true);
      expect(result.showPhone).toBe(true);
      expect(result.showBio).toBe(false);
      expect(result.showSocialLinks).toBe(true);
    });

    it('should update custom field visibility', async () => {
      const fieldRequest = {
        showCustomFields: true,
        visibleCustomFieldIds: [4, 5, 6],
      };
      const updatedSettings = { ...mockDirectorySettings, ...fieldRequest };
      mockApiClient.put.mockResolvedValue({ data: updatedSettings });

      const result = await directorySettingsService.updateDirectorySettings(clubId, fieldRequest);

      expect(result.showCustomFields).toBe(true);
      expect(result.visibleCustomFieldIds).toEqual([4, 5, 6]);
    });

    it('should update sort settings', async () => {
      const sortRequest = {
        defaultSortField: 'joinedAt',
        defaultSortDirection: 'desc',
      };
      const updatedSettings = { ...mockDirectorySettings, ...sortRequest };
      mockApiClient.put.mockResolvedValue({ data: updatedSettings });

      const result = await directorySettingsService.updateDirectorySettings(clubId, sortRequest);

      expect(result.defaultSortField).toBe('joinedAt');
      expect(result.defaultSortDirection).toBe('desc');
    });

    it('should throw error on invalid data (400)', async () => {
      const error = { response: { status: 400, data: { message: 'Bad Request' } } };
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        directorySettingsService.updateDirectorySettings(clubId, updateRequest)
      ).rejects.toBeDefined();
    });

    it('should throw error when forbidden (403)', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        directorySettingsService.updateDirectorySettings(clubId, updateRequest)
      ).rejects.toBeDefined();
    });

    it('should throw error when not found (404)', async () => {
      const error = { response: { status: 404, data: { message: 'Not Found' } } };
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        directorySettingsService.updateDirectorySettings(clubId, updateRequest)
      ).rejects.toBeDefined();
    });

    it('should throw error on network failure', async () => {
      mockApiClient.put.mockRejectedValue(new Error('Network Error'));

      await expect(
        directorySettingsService.updateDirectorySettings(clubId, updateRequest)
      ).rejects.toBeDefined();
    });
  });

  describe('service export', () => {
    it('should export directorySettingsService instance', () => {
      expect(directorySettingsService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof directorySettingsService.getDirectorySettings).toBe('function');
      expect(typeof directorySettingsService.updateDirectorySettings).toBe('function');
    });
  });
});
