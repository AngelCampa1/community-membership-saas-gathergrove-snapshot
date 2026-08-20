/**
 * LocationPermissionsService Tests - Full Coverage
 */

import { locationPermissionsService, LocationPermissionLevel, AssignLocationAdminRequest, LocationAdminResponse } from '../locationPermissionsService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LocationPermissionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const locationId = 1;
  const userId = 5;
  const clubId = 10;

  const mockAdminResponse: LocationAdminResponse = {
    id: 1,
    locationId: 1,
    locationName: 'Main Location',
    userId: 5,
    userFullName: 'John Doe',
    userEmail: 'john@example.com',
    permissionLevel: LocationPermissionLevel.LocationAdmin,
    permissionLevelName: 'Location Admin',
    assignedAt: '2024-01-01T00:00:00Z',
    assignedBy: 2,
    assignedByName: 'Jane Admin',
  };

  describe('assignLocationAdmin', () => {
    const assignRequest: AssignLocationAdminRequest = {
      userId: 5,
      permissionLevel: LocationPermissionLevel.LocationAdmin,
    };

    it('should assign location admin successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockAdminResponse });

      const result = await locationPermissionsService.assignLocationAdmin(locationId, assignRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/locations/${locationId}/admins`),
        assignRequest,
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockAdminResponse);
    });

    it('should assign SuperAdmin permission level', async () => {
      const superAdminRequest: AssignLocationAdminRequest = {
        userId: 3,
        permissionLevel: LocationPermissionLevel.SuperAdmin,
      };
      const superAdminResponse = { ...mockAdminResponse, permissionLevel: LocationPermissionLevel.SuperAdmin };

      mockedAxios.post.mockResolvedValue({ data: superAdminResponse });

      const result = await locationPermissionsService.assignLocationAdmin(locationId, superAdminRequest);

      expect(result.permissionLevel).toBe(LocationPermissionLevel.SuperAdmin);
    });

    it('should assign RegionalManager permission level', async () => {
      const regionalRequest: AssignLocationAdminRequest = {
        userId: 4,
        permissionLevel: LocationPermissionLevel.RegionalManager,
      };
      const regionalResponse = { ...mockAdminResponse, permissionLevel: LocationPermissionLevel.RegionalManager };

      mockedAxios.post.mockResolvedValue({ data: regionalResponse });

      const result = await locationPermissionsService.assignLocationAdmin(locationId, regionalRequest);

      expect(result.permissionLevel).toBe(LocationPermissionLevel.RegionalManager);
    });

    it('should assign LocationModerator permission level', async () => {
      const moderatorRequest: AssignLocationAdminRequest = {
        userId: 6,
        permissionLevel: LocationPermissionLevel.LocationModerator,
      };
      const moderatorResponse = { ...mockAdminResponse, permissionLevel: LocationPermissionLevel.LocationModerator };

      mockedAxios.post.mockResolvedValue({ data: moderatorResponse });

      const result = await locationPermissionsService.assignLocationAdmin(locationId, moderatorRequest);

      expect(result.permissionLevel).toBe(LocationPermissionLevel.LocationModerator);
    });

    it('should assign Staff permission level', async () => {
      const staffRequest: AssignLocationAdminRequest = {
        userId: 7,
        permissionLevel: LocationPermissionLevel.Staff,
      };
      const staffResponse = { ...mockAdminResponse, permissionLevel: LocationPermissionLevel.Staff };

      mockedAxios.post.mockResolvedValue({ data: staffResponse });

      const result = await locationPermissionsService.assignLocationAdmin(locationId, staffRequest);

      expect(result.permissionLevel).toBe(LocationPermissionLevel.Staff);
    });

    it('should handle different location IDs', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockAdminResponse });

      await locationPermissionsService.assignLocationAdmin(999, assignRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/locations/999/admins'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should return admin response without optional assignedBy fields', async () => {
      const minimalResponse: LocationAdminResponse = {
        id: 2,
        locationId: 1,
        locationName: 'Branch Location',
        userId: 8,
        userFullName: 'Alice Smith',
        userEmail: 'alice@example.com',
        permissionLevel: LocationPermissionLevel.LocationAdmin,
        permissionLevelName: 'Location Admin',
        assignedAt: '2024-01-02T00:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: minimalResponse });

      const result = await locationPermissionsService.assignLocationAdmin(locationId, assignRequest);

      expect(result.assignedBy).toBeUndefined();
      expect(result.assignedByName).toBeUndefined();
    });

    it('should handle validation errors', async () => {
      const error = { response: { status: 400, data: { message: 'User already assigned' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(
        locationPermissionsService.assignLocationAdmin(locationId, assignRequest)
      ).rejects.toEqual(error);
    });

    it('should handle unauthorized errors', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(
        locationPermissionsService.assignLocationAdmin(locationId, assignRequest)
      ).rejects.toEqual(error);
    });

    it('should include credentials in request', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockAdminResponse });

      await locationPermissionsService.assignLocationAdmin(locationId, assignRequest);

      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[2]).toHaveProperty('withCredentials', true);
    });
  });

  describe('getLocationAdmins', () => {
    const mockAdmins: LocationAdminResponse[] = [
      mockAdminResponse,
      {
        id: 2,
        locationId: 1,
        locationName: 'Main Location',
        userId: 6,
        userFullName: 'Jane Manager',
        userEmail: 'jane@example.com',
        permissionLevel: LocationPermissionLevel.RegionalManager,
        permissionLevelName: 'Regional Manager',
        assignedAt: '2024-01-01T00:00:00Z',
      },
    ];

    it('should get all location admins successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAdmins });

      const result = await locationPermissionsService.getLocationAdmins(locationId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/locations/${locationId}/admins`),
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockAdmins);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no admins exist', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await locationPermissionsService.getLocationAdmins(locationId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return admins with different permission levels', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAdmins });

      const result = await locationPermissionsService.getLocationAdmins(locationId);

      expect(result[0].permissionLevel).toBe(LocationPermissionLevel.LocationAdmin);
      expect(result[1].permissionLevel).toBe(LocationPermissionLevel.RegionalManager);
    });

    it('should handle different location IDs', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAdmins });

      await locationPermissionsService.getLocationAdmins(456);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/locations/456/admins'),
        expect.any(Object)
      );
    });

    it('should handle 404 errors', async () => {
      const error = { response: { status: 404, data: { message: 'Location not found' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationPermissionsService.getLocationAdmins(999)
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationPermissionsService.getLocationAdmins(locationId)
      ).rejects.toThrow('Network error');
    });

    it('should include credentials in request', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockAdmins });

      await locationPermissionsService.getLocationAdmins(locationId);

      const callArgs = mockedAxios.get.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('withCredentials', true);
    });
  });

  describe('removeLocationAdmin', () => {
    it('should remove location admin successfully', async () => {
      mockedAxios.delete.mockResolvedValue({ data: undefined });

      await locationPermissionsService.removeLocationAdmin(locationId, userId);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining(`/locations/${locationId}/admins/${userId}`),
        expect.objectContaining({ withCredentials: true })
      );
    });

    it('should handle different location and user IDs', async () => {
      mockedAxios.delete.mockResolvedValue({ data: undefined });

      await locationPermissionsService.removeLocationAdmin(123, 456);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/locations/123/admins/456'),
        expect.any(Object)
      );
    });

    it('should handle 404 errors when admin not found', async () => {
      const error = { response: { status: 404, data: { message: 'Admin not found' } } };
      mockedAxios.delete.mockRejectedValue(error);

      await expect(
        locationPermissionsService.removeLocationAdmin(locationId, 999)
      ).rejects.toEqual(error);
    });

    it('should handle unauthorized errors', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockedAxios.delete.mockRejectedValue(error);

      await expect(
        locationPermissionsService.removeLocationAdmin(locationId, userId)
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Connection timeout');
      mockedAxios.delete.mockRejectedValue(error);

      await expect(
        locationPermissionsService.removeLocationAdmin(locationId, userId)
      ).rejects.toThrow('Connection timeout');
    });

    it('should include credentials in request', async () => {
      mockedAxios.delete.mockResolvedValue({ data: undefined });

      await locationPermissionsService.removeLocationAdmin(locationId, userId);

      const callArgs = mockedAxios.delete.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('withCredentials', true);
    });

    it('should return void on success', async () => {
      mockedAxios.delete.mockResolvedValue({ data: undefined });

      const result = await locationPermissionsService.removeLocationAdmin(locationId, userId);

      expect(result).toBeUndefined();
    });
  });

  describe('getUserLocationPermissions', () => {
    const mockUserPermissions: LocationAdminResponse[] = [
      {
        id: 1,
        locationId: 1,
        locationName: 'Location A',
        userId: 5,
        userFullName: 'John Doe',
        userEmail: 'john@example.com',
        permissionLevel: LocationPermissionLevel.LocationAdmin,
        permissionLevelName: 'Location Admin',
        assignedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        locationId: 2,
        locationName: 'Location B',
        userId: 5,
        userFullName: 'John Doe',
        userEmail: 'john@example.com',
        permissionLevel: LocationPermissionLevel.LocationModerator,
        permissionLevelName: 'Location Moderator',
        assignedAt: '2024-01-02T00:00:00Z',
      },
    ];

    it('should get user location permissions successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockUserPermissions });

      const result = await locationPermissionsService.getUserLocationPermissions(userId, clubId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/users/${userId}/clubs/${clubId}/location-permissions`),
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockUserPermissions);
      expect(result).toHaveLength(2);
    });

    it('should return permissions across multiple locations', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockUserPermissions });

      const result = await locationPermissionsService.getUserLocationPermissions(userId, clubId);

      expect(result[0].locationId).toBe(1);
      expect(result[1].locationId).toBe(2);
      expect(result[0].locationName).toBe('Location A');
      expect(result[1].locationName).toBe('Location B');
    });

    it('should return empty array when user has no permissions', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await locationPermissionsService.getUserLocationPermissions(userId, clubId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return permissions with different levels', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockUserPermissions });

      const result = await locationPermissionsService.getUserLocationPermissions(userId, clubId);

      expect(result[0].permissionLevel).toBe(LocationPermissionLevel.LocationAdmin);
      expect(result[1].permissionLevel).toBe(LocationPermissionLevel.LocationModerator);
    });

    it('should handle different user and club IDs', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockUserPermissions });

      await locationPermissionsService.getUserLocationPermissions(789, 321);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/users/789/clubs/321/location-permissions'),
        expect.any(Object)
      );
    });

    it('should handle 404 errors when user not found', async () => {
      const error = { response: { status: 404, data: { message: 'User not found' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationPermissionsService.getUserLocationPermissions(999, clubId)
      ).rejects.toEqual(error);
    });

    it('should handle 404 errors when club not found', async () => {
      const error = { response: { status: 404, data: { message: 'Club not found' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationPermissionsService.getUserLocationPermissions(userId, 999)
      ).rejects.toEqual(error);
    });

    it('should handle unauthorized errors', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationPermissionsService.getUserLocationPermissions(userId, clubId)
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Request timeout');
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationPermissionsService.getUserLocationPermissions(userId, clubId)
      ).rejects.toThrow('Request timeout');
    });

    it('should include credentials in request', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockUserPermissions });

      await locationPermissionsService.getUserLocationPermissions(userId, clubId);

      const callArgs = mockedAxios.get.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('withCredentials', true);
    });

    it('should handle single permission response', async () => {
      const singlePermission = [mockUserPermissions[0]];
      mockedAxios.get.mockResolvedValue({ data: singlePermission });

      const result = await locationPermissionsService.getUserLocationPermissions(userId, clubId);

      expect(result).toHaveLength(1);
      expect(result[0].locationId).toBe(1);
    });
  });
});
