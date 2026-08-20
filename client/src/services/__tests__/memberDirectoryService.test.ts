/**
 * MemberDirectoryService tests
 *
 * Boundary mocking: only the apiClient HTTP layer is mocked. The real
 * MemberDirectoryService runs, so these tests exercise the genuine bare-path
 * routing (apiClient baseURL `/api/v1` + `/users/me/directory-settings`),
 * response unwrapping, and error-message normalization against the backend
 * UserDirectorySettingsController contract.
 */
import apiClient from '../apiClient';
import { MemberDirectoryService } from '../memberDirectoryService';
import {
  MemberDirectorySettingsResponse,
  UpdateMemberDirectorySettingsRequest,
} from '../../types/memberDirectorySettings';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPut = apiClient.put as jest.Mock;

const PATH = '/users/me/directory-settings';

describe('MemberDirectoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDirectorySettings', () => {
    it('gets the bare directory-settings path and unwraps the response', async () => {
      const mockResponse: MemberDirectorySettingsResponse = {
        clubDirectoryEnabled: true,
        adminAllowedSharableFields: ['email', 'phoneNumber'],
        isListed: true,
        visibleFields: ['email'],
      };
      mockGet.mockResolvedValueOnce({ data: mockResponse });

      const result = await MemberDirectoryService.getDirectorySettings();

      expect(mockGet).toHaveBeenCalledWith(PATH);
      expect(result).toEqual(mockResponse);
    });

    it('surfaces a backend error message', async () => {
      mockGet.mockRejectedValueOnce({
        response: { data: { message: 'Failed to get directory settings' } },
      });

      await expect(MemberDirectoryService.getDirectorySettings()).rejects.toThrow(
        'Failed to get directory settings',
      );
    });

    it('propagates a network error message', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network Error'));

      await expect(MemberDirectoryService.getDirectorySettings()).rejects.toThrow(
        'Network Error',
      );
    });

    it('falls back to a default message when the error carries no message', async () => {
      mockGet.mockRejectedValueOnce({ response: { data: {} } });

      await expect(MemberDirectoryService.getDirectorySettings()).rejects.toThrow(
        'Failed to get directory settings',
      );
    });
  });

  describe('updateDirectorySettings', () => {
    it('puts the request body to the bare path and unwraps the response', async () => {
      const updateRequest: UpdateMemberDirectorySettingsRequest = {
        isListed: true,
        visibleFields: ['email'],
      };
      const mockResponse: MemberDirectorySettingsResponse = {
        clubDirectoryEnabled: true,
        adminAllowedSharableFields: ['email', 'phoneNumber'],
        isListed: true,
        visibleFields: ['email'],
      };
      mockPut.mockResolvedValueOnce({ data: mockResponse });

      const result = await MemberDirectoryService.updateDirectorySettings(updateRequest);

      expect(mockPut).toHaveBeenCalledWith(PATH, updateRequest);
      expect(result).toEqual(mockResponse);
    });

    it('supports unlisting with an empty field set', async () => {
      const updateRequest: UpdateMemberDirectorySettingsRequest = {
        isListed: false,
        visibleFields: [],
      };
      const mockResponse: MemberDirectorySettingsResponse = {
        clubDirectoryEnabled: true,
        adminAllowedSharableFields: ['email', 'phoneNumber'],
        isListed: false,
        visibleFields: [],
      };
      mockPut.mockResolvedValueOnce({ data: mockResponse });

      const result = await MemberDirectoryService.updateDirectorySettings(updateRequest);

      expect(result).toEqual(mockResponse);
    });

    it('surfaces a validation error message', async () => {
      mockPut.mockRejectedValueOnce({
        response: { data: { message: 'Invalid field selection' } },
      });

      await expect(
        MemberDirectoryService.updateDirectorySettings({
          isListed: true,
          visibleFields: ['invalid-field'],
        }),
      ).rejects.toThrow('Invalid field selection');
    });

    it('propagates a network error when updating', async () => {
      mockPut.mockRejectedValueOnce(new Error('Network Error'));

      await expect(
        MemberDirectoryService.updateDirectorySettings({ isListed: false, visibleFields: [] }),
      ).rejects.toThrow('Network Error');
    });

    it('falls back to a default message when the update error carries no message', async () => {
      mockPut.mockRejectedValueOnce({ response: { data: {} } });

      await expect(
        MemberDirectoryService.updateDirectorySettings({
          isListed: true,
          visibleFields: ['email'],
        }),
      ).rejects.toThrow('Failed to update directory settings');
    });
  });
});
