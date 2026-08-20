import membershipTypeService, { CreateMembershipTypeRequest, UpdateMembershipTypeRequest } from '../membershipTypeService';
import apiClient from '../apiClient';
import type { AxiosRequestConfig } from 'axios';
import { ApiErrorClass } from '@/types/errors';

// Mock the apiClient module
jest.mock('../apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('membershipTypeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockMembershipType = {
    id: 1,
    clubId: 1,
    name: 'Individual',
    description: 'Standard individual membership',
    duesAmount: 25.00,
    duesFrequency: 'Monthly',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };

  describe('createMembershipType', () => {
    it('should create a membership type successfully', async () => {
      const clubId = 1;
      const request: CreateMembershipTypeRequest = {
        name: 'Individual',
        duesAmount: 25.00,
        duesFrequency: 'Monthly'
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: mockMembershipType,
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await membershipTypeService.createMembershipType(clubId, request);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/membership-types`,
        request
      );

      expect(result).toEqual(mockMembershipType);
    });

    it('should throw error when creation fails with 400 Bad Request', async () => {
      const clubId = 1;
      const request: CreateMembershipTypeRequest = {
        name: 'Duplicate',
        duesAmount: 25.00,
        duesFrequency: 'Monthly'
      };

      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'A membership type with this name already exists'
          }
        }
      };

      mockApiClient.post.mockRejectedValueOnce(errorResponse);

      await expect(membershipTypeService.createMembershipType(clubId, request))
        .rejects.toBeInstanceOf(ApiErrorClass);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/membership-types`,
        request
      );
    });

    it('should throw error when creation fails with 500 Internal Server Error', async () => {
      const clubId = 1;
      const request: CreateMembershipTypeRequest = {
        name: 'Test',
        duesAmount: 25.00,
        duesFrequency: 'Monthly'
      };

      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      mockApiClient.post.mockRejectedValueOnce(errorResponse);

      await expect(membershipTypeService.createMembershipType(clubId, request))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when network request fails', async () => {
      const clubId = 1;
      const request: CreateMembershipTypeRequest = {
        name: 'Test',
        duesAmount: 25.00,
        duesFrequency: 'Monthly'
      };

      const networkError = new Error('Network error');
      mockApiClient.post.mockRejectedValueOnce(networkError);

      await expect(membershipTypeService.createMembershipType(clubId, request))
        .rejects.toThrow('Network error');
    });
  });

  describe('getMembershipTypes', () => {
    it('should fetch membership types for a club successfully', async () => {
      const clubId = 1;
      const mockMembershipTypes = [
        mockMembershipType,
        {
          ...mockMembershipType,
          id: 2,
          name: 'Family',
          description: 'Family membership',
          duesAmount: 40.00
        }
      ];

      mockApiClient.get.mockResolvedValueOnce({
        data: mockMembershipTypes,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await membershipTypeService.getMembershipTypes(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/membership-types`
      );

      expect(result).toEqual(mockMembershipTypes);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when club has no membership types', async () => {
      const clubId = 1;

      mockApiClient.get.mockResolvedValueOnce({
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await membershipTypeService.getMembershipTypes(clubId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error when fetch fails', async () => {
      const clubId = 1;

      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Club not found' }
        }
      };

      mockApiClient.get.mockRejectedValueOnce(errorResponse);

      await expect(membershipTypeService.getMembershipTypes(clubId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should return empty array when API returns non-array data', async () => {
      const clubId = 1;

      // API returns unexpected object instead of array
      mockApiClient.get.mockResolvedValueOnce({
        data: { unexpected: 'object' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await membershipTypeService.getMembershipTypes(clubId);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when API returns null', async () => {
      const clubId = 1;

      mockApiClient.get.mockResolvedValueOnce({
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await membershipTypeService.getMembershipTypes(clubId);

      expect(result).toEqual([]);
    });
  });

  describe('getMembershipType', () => {
    it('should fetch a specific membership type successfully', async () => {
      const clubId = 1;
      const membershipTypeId = 1;

      mockApiClient.get.mockResolvedValueOnce({
        data: mockMembershipType,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await membershipTypeService.getMembershipType(clubId, membershipTypeId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/membership-types/${membershipTypeId}`
      );

      expect(result).toEqual(mockMembershipType);
    });

    it('should throw error when membership type not found', async () => {
      const clubId = 1;
      const membershipTypeId = 999;

      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Membership type not found' }
        }
      };

      mockApiClient.get.mockRejectedValueOnce(errorResponse);

      await expect(membershipTypeService.getMembershipType(clubId, membershipTypeId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });
  });

  describe('updateMembershipType', () => {
    it('should update a membership type successfully', async () => {
      const clubId = 1;
      const membershipTypeId = 1;
      const request: UpdateMembershipTypeRequest = {
        name: 'Updated Individual',
        duesAmount: 30.00
      };

      const updatedMembershipType = {
        ...mockMembershipType,
        name: 'Updated Individual',
        duesAmount: 30.00,
        updatedAt: '2023-01-02T00:00:00Z'
      };

      mockApiClient.put.mockResolvedValueOnce({
        data: updatedMembershipType,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await membershipTypeService.updateMembershipType(clubId, membershipTypeId, request);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/clubs/${clubId}/membership-types/${membershipTypeId}`,
        request
      );

      expect(result).toEqual(updatedMembershipType);
      expect(result.name).toBe('Updated Individual');
      expect(result.duesAmount).toBe(30.00);
    });

    it('should throw error when update fails with 400 Bad Request (duplicate name)', async () => {
      const clubId = 1;
      const membershipTypeId = 1;
      const request: UpdateMembershipTypeRequest = {
        name: 'Existing Name',
        duesAmount: 30.00
      };

      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'A membership type with the name "Existing Name" already exists in this club'
          }
        }
      };

      mockApiClient.put.mockRejectedValueOnce(errorResponse);

      await expect(membershipTypeService.updateMembershipType(clubId, membershipTypeId, request))
        .rejects.toBeInstanceOf(ApiErrorClass);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/clubs/${clubId}/membership-types/${membershipTypeId}`,
        request
      );
    });

    it('should throw error when membership type not found', async () => {
      const clubId = 1;
      const membershipTypeId = 999;
      const request: UpdateMembershipTypeRequest = {
        name: 'Updated Name',
        duesAmount: 30.00
      };

      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Membership type with ID 999 not found in club 1'
          }
        }
      };

      mockApiClient.put.mockRejectedValueOnce(errorResponse);

      await expect(membershipTypeService.updateMembershipType(clubId, membershipTypeId, request))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when update fails with 500 Internal Server Error', async () => {
      const clubId = 1;
      const membershipTypeId = 1;
      const request: UpdateMembershipTypeRequest = {
        name: 'Updated Name',
        duesAmount: 30.00
      };

      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      mockApiClient.put.mockRejectedValueOnce(errorResponse);

      await expect(membershipTypeService.updateMembershipType(clubId, membershipTypeId, request))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when network request fails', async () => {
      const clubId = 1;
      const membershipTypeId = 1;
      const request: UpdateMembershipTypeRequest = {
        name: 'Updated Name',
        duesAmount: 30.00
      };

      const networkError = new Error('Network error');
      mockApiClient.put.mockRejectedValueOnce(networkError);

      await expect(membershipTypeService.updateMembershipType(clubId, membershipTypeId, request))
        .rejects.toThrow('Network error');
    });
  });

  describe('deleteMembershipType', () => {
    it('should delete a membership type successfully', async () => {
      const clubId = 1;
      const membershipTypeId = 1;

      mockApiClient.delete.mockResolvedValueOnce({
        data: undefined,
        status: 204,
        statusText: 'No Content',
        headers: {},
        config: {} as AxiosRequestConfig
      });

      const result = await membershipTypeService.deleteMembershipType(clubId, membershipTypeId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/clubs/${clubId}/membership-types/${membershipTypeId}`
      );

      expect(result).toBeUndefined();
    });

    it('should throw error when membership type not found', async () => {
      const clubId = 1;
      const membershipTypeId = 999;

      const errorResponse = {
        response: {
          status: 404,
          data: {
            message: 'Membership type not found'
          }
        }
      };

      mockApiClient.delete.mockRejectedValueOnce(errorResponse);

      await expect(membershipTypeService.deleteMembershipType(clubId, membershipTypeId))
        .rejects.toBeInstanceOf(ApiErrorClass);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/clubs/${clubId}/membership-types/${membershipTypeId}`
      );
    });

    it('should throw error when membership type is assigned to members', async () => {
      const clubId = 1;
      const membershipTypeId = 1;

      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Cannot delete membership type because it is assigned to one or more members'
          }
        }
      };

      mockApiClient.delete.mockRejectedValueOnce(errorResponse);

      await expect(membershipTypeService.deleteMembershipType(clubId, membershipTypeId))
        .rejects.toBeInstanceOf(ApiErrorClass);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/clubs/${clubId}/membership-types/${membershipTypeId}`
      );
    });

    it('should throw error when delete fails with 500 Internal Server Error', async () => {
      const clubId = 1;
      const membershipTypeId = 1;

      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      mockApiClient.delete.mockRejectedValueOnce(errorResponse);

      await expect(membershipTypeService.deleteMembershipType(clubId, membershipTypeId))
        .rejects.toBeInstanceOf(ApiErrorClass);
    });

    it('should throw error when network request fails', async () => {
      const clubId = 1;
      const membershipTypeId = 1;

      const networkError = new Error('Network error');
      mockApiClient.delete.mockRejectedValueOnce(networkError);

      await expect(membershipTypeService.deleteMembershipType(clubId, membershipTypeId))
        .rejects.toThrow('Network error');
    });
  });
}); 