/**
 * LocationService Tests - Full Coverage
 */

import { locationService, CreateLocationRequest, UpdateLocationRequest, LocationResponse } from '../locationService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;
  const locationId = 10;

  const mockLocationResponse: LocationResponse = {
    id: 10,
    parentClubId: 1,
    locationName: 'Main Location',
    locationCode: 'MAIN',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    country: 'USA',
    timezone: 'America/Chicago',
    contactEmail: 'contact@main.com',
    contactPhone: '555-0100',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    settings: { theme: 'light', lang: 'en' },
  };

  describe('createLocation', () => {
    const createRequest: CreateLocationRequest = {
      locationName: 'New Location',
      locationCode: 'NEW',
      address: '456 New St',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      timezone: 'America/Chicago',
      contactEmail: 'new@location.com',
      contactPhone: '555-0200',
      isActive: true,
    };

    it('should create location successfully with all fields', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockLocationResponse });

      const result = await locationService.createLocation(clubId, createRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/clubs/${clubId}/locations`),
        createRequest,
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockLocationResponse);
    });

    it('should create location with minimal required fields only', async () => {
      const minimalRequest: CreateLocationRequest = {
        locationName: 'Minimal Location',
        locationCode: 'MIN',
      };
      const minimalResponse: LocationResponse = {
        id: 11,
        parentClubId: 1,
        locationName: 'Minimal Location',
        locationCode: 'MIN',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: minimalResponse });

      const result = await locationService.createLocation(clubId, minimalRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        minimalRequest,
        expect.any(Object)
      );
      expect(result.address).toBeUndefined();
      expect(result.contactEmail).toBeUndefined();
    });

    it('should create inactive location when isActive is false', async () => {
      const inactiveRequest: CreateLocationRequest = {
        ...createRequest,
        isActive: false,
      };
      const inactiveResponse = { ...mockLocationResponse, isActive: false };

      mockedAxios.post.mockResolvedValue({ data: inactiveResponse });

      const result = await locationService.createLocation(clubId, inactiveRequest);

      expect(result.isActive).toBe(false);
    });

    it('should handle different club IDs', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockLocationResponse });

      await locationService.createLocation(999, createRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/clubs/999/locations'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle validation errors', async () => {
      const error = { response: { status: 400, data: { message: 'Invalid location code' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(
        locationService.createLocation(clubId, createRequest)
      ).rejects.toEqual(error);
    });

    it('should handle duplicate location code errors', async () => {
      const error = { response: { status: 409, data: { message: 'Location code already exists' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(
        locationService.createLocation(clubId, createRequest)
      ).rejects.toEqual(error);
    });

    it('should include credentials in request', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockLocationResponse });

      await locationService.createLocation(clubId, createRequest);

      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[2]).toHaveProperty('withCredentials', true);
    });
  });

  describe('getClubLocations', () => {
    const mockLocations: LocationResponse[] = [
      mockLocationResponse,
      {
        id: 11,
        parentClubId: 1,
        locationName: 'Branch Location',
        locationCode: 'BRANCH',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    it('should get all club locations successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockLocations });

      const result = await locationService.getClubLocations(clubId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/clubs/${clubId}/locations`),
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockLocations);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no locations exist', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await locationService.getClubLocations(clubId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return locations with different active statuses', async () => {
      const mixedLocations: LocationResponse[] = [
        { ...mockLocations[0], isActive: true },
        { ...mockLocations[1], isActive: false },
      ];

      mockedAxios.get.mockResolvedValue({ data: mixedLocations });

      const result = await locationService.getClubLocations(clubId);

      expect(result.some(loc => loc.isActive)).toBe(true);
      expect(result.some(loc => !loc.isActive)).toBe(true);
    });

    it('should handle different club IDs', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockLocations });

      await locationService.getClubLocations(456);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/clubs/456/locations'),
        expect.any(Object)
      );
    });

    it('should handle 404 errors', async () => {
      const error = { response: { status: 404, data: { message: 'Club not found' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationService.getClubLocations(999)
      ).rejects.toEqual(error);
    });

    it('should include credentials in request', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockLocations });

      await locationService.getClubLocations(clubId);

      const callArgs = mockedAxios.get.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('withCredentials', true);
    });
  });

  describe('getLocation', () => {
    it('should get single location successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockLocationResponse });

      const result = await locationService.getLocation(locationId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/locations/${locationId}`),
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockLocationResponse);
    });

    it('should return location with all fields', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockLocationResponse });

      const result = await locationService.getLocation(locationId);

      expect(result.locationName).toBe('Main Location');
      expect(result.address).toBe('123 Main St');
      expect(result.contactEmail).toBe('contact@main.com');
      expect(result.settings).toEqual({ theme: 'light', lang: 'en' });
    });

    it('should return location with minimal fields', async () => {
      const minimalLocation: LocationResponse = {
        id: 12,
        parentClubId: 1,
        locationName: 'Minimal',
        locationCode: 'MIN',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedAxios.get.mockResolvedValue({ data: minimalLocation });

      const result = await locationService.getLocation(12);

      expect(result.address).toBeUndefined();
      expect(result.settings).toBeUndefined();
    });

    it('should handle different location IDs', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockLocationResponse });

      await locationService.getLocation(789);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/locations/789'),
        expect.any(Object)
      );
    });

    it('should handle 404 errors', async () => {
      const error = { response: { status: 404, data: { message: 'Location not found' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationService.getLocation(999)
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network timeout');
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationService.getLocation(locationId)
      ).rejects.toThrow('Network timeout');
    });

    it('should include credentials in request', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockLocationResponse });

      await locationService.getLocation(locationId);

      const callArgs = mockedAxios.get.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('withCredentials', true);
    });
  });

  describe('updateLocation', () => {
    const updateRequest: UpdateLocationRequest = {
      locationName: 'Updated Location',
      address: '789 Updated St',
      contactEmail: 'updated@location.com',
    };

    it('should update location successfully', async () => {
      const updatedResponse: LocationResponse = {
        ...mockLocationResponse,
        ...updateRequest,
        updatedAt: '2024-01-10T00:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: updatedResponse });

      const result = await locationService.updateLocation(locationId, updateRequest);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/locations/${locationId}`),
        updateRequest,
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(updatedResponse);
    });

    it('should update only location name', async () => {
      const nameUpdate: UpdateLocationRequest = {
        locationName: 'New Name',
      };

      mockedAxios.put.mockResolvedValue({
        data: { ...mockLocationResponse, locationName: 'New Name' },
      });

      const result = await locationService.updateLocation(locationId, nameUpdate);

      expect(result.locationName).toBe('New Name');
    });

    it('should update only contact information', async () => {
      const contactUpdate: UpdateLocationRequest = {
        contactEmail: 'new@email.com',
        contactPhone: '555-9999',
      };

      mockedAxios.put.mockResolvedValue({
        data: { ...mockLocationResponse, ...contactUpdate },
      });

      const result = await locationService.updateLocation(locationId, contactUpdate);

      expect(result.contactEmail).toBe('new@email.com');
      expect(result.contactPhone).toBe('555-9999');
    });

    it('should update isActive status', async () => {
      const statusUpdate: UpdateLocationRequest = {
        isActive: false,
      };

      mockedAxios.put.mockResolvedValue({
        data: { ...mockLocationResponse, isActive: false },
      });

      const result = await locationService.updateLocation(locationId, statusUpdate);

      expect(result.isActive).toBe(false);
    });

    it('should handle empty update request', async () => {
      const emptyUpdate: UpdateLocationRequest = {};

      mockedAxios.put.mockResolvedValue({ data: mockLocationResponse });

      const result = await locationService.updateLocation(locationId, emptyUpdate);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.any(String),
        emptyUpdate,
        expect.any(Object)
      );
      expect(result).toEqual(mockLocationResponse);
    });

    it('should handle different location IDs', async () => {
      mockedAxios.put.mockResolvedValue({ data: mockLocationResponse });

      await locationService.updateLocation(321, updateRequest);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/locations/321'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle validation errors', async () => {
      const error = { response: { status: 400, data: { message: 'Invalid timezone' } } };
      mockedAxios.put.mockRejectedValue(error);

      await expect(
        locationService.updateLocation(locationId, updateRequest)
      ).rejects.toEqual(error);
    });

    it('should include credentials in request', async () => {
      mockedAxios.put.mockResolvedValue({ data: mockLocationResponse });

      await locationService.updateLocation(locationId, updateRequest);

      const callArgs = mockedAxios.put.mock.calls[0];
      expect(callArgs[2]).toHaveProperty('withCredentials', true);
    });
  });

  describe('deactivateLocation', () => {
    it('should deactivate location successfully', async () => {
      mockedAxios.delete.mockResolvedValue({ data: undefined });

      await locationService.deactivateLocation(locationId);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining(`/locations/${locationId}`),
        expect.objectContaining({ withCredentials: true })
      );
    });

    it('should return void on success', async () => {
      mockedAxios.delete.mockResolvedValue({ data: undefined });

      const result = await locationService.deactivateLocation(locationId);

      expect(result).toBeUndefined();
    });

    it('should handle different location IDs', async () => {
      mockedAxios.delete.mockResolvedValue({ data: undefined });

      await locationService.deactivateLocation(654);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/locations/654'),
        expect.any(Object)
      );
    });

    it('should handle 404 errors', async () => {
      const error = { response: { status: 404, data: { message: 'Location not found' } } };
      mockedAxios.delete.mockRejectedValue(error);

      await expect(
        locationService.deactivateLocation(999)
      ).rejects.toEqual(error);
    });

    it('should handle unauthorized errors', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockedAxios.delete.mockRejectedValue(error);

      await expect(
        locationService.deactivateLocation(locationId)
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Connection refused');
      mockedAxios.delete.mockRejectedValue(error);

      await expect(
        locationService.deactivateLocation(locationId)
      ).rejects.toThrow('Connection refused');
    });

    it('should include credentials in request', async () => {
      mockedAxios.delete.mockResolvedValue({ data: undefined });

      await locationService.deactivateLocation(locationId);

      const callArgs = mockedAxios.delete.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('withCredentials', true);
    });
  });

  describe('getLocationStats', () => {
    it('should get location stats successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockLocationResponse });

      const result = await locationService.getLocationStats(locationId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/locations/${locationId}/stats`),
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockLocationResponse);
    });

    it('should return stats with all location details', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockLocationResponse });

      const result = await locationService.getLocationStats(locationId);

      expect(result.id).toBe(10);
      expect(result.locationName).toBe('Main Location');
      expect(result.settings).toEqual({ theme: 'light', lang: 'en' });
    });

    it('should handle different location IDs', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockLocationResponse });

      await locationService.getLocationStats(987);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/locations/987/stats'),
        expect.any(Object)
      );
    });

    it('should handle 404 errors', async () => {
      const error = { response: { status: 404, data: { message: 'Location not found' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationService.getLocationStats(999)
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Request failed');
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationService.getLocationStats(locationId)
      ).rejects.toThrow('Request failed');
    });

    it('should include credentials in request', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockLocationResponse });

      await locationService.getLocationStats(locationId);

      const callArgs = mockedAxios.get.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('withCredentials', true);
    });
  });
});
