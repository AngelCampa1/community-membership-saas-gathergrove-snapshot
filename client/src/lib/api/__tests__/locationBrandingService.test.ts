/**
 * LocationBrandingService Tests - Full Coverage
 */

import { locationBrandingService, LocationBrandingResponse, UpdateLocationBrandingRequest } from '../locationBrandingService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LocationBrandingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const locationId = 1;
  const mockBrandingResponse: LocationBrandingResponse = {
    id: 1,
    locationId: 1,
    locationName: 'Main Location',
    customLogoUrl: 'https://example.com/logo.png',
    colorScheme: '#FF5733',
    customNameOverride: 'Custom Name',
    settingsJson: '{"theme":"dark"}',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  describe('getLocationBranding', () => {
    it('should fetch location branding successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockBrandingResponse });

      const result = await locationBrandingService.getLocationBranding(locationId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/locations/${locationId}/branding`),
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockBrandingResponse);
    });

    it('should return complete branding data', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockBrandingResponse });

      const result = await locationBrandingService.getLocationBranding(locationId);

      expect(result.id).toBe(1);
      expect(result.locationId).toBe(1);
      expect(result.customLogoUrl).toBe('https://example.com/logo.png');
      expect(result.colorScheme).toBe('#FF5733');
    });

    it('should handle branding with minimal data', async () => {
      const minimalResponse: LocationBrandingResponse = {
        id: 2,
        locationId: 2,
        locationName: 'Minimal Location',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedAxios.get.mockResolvedValue({ data: minimalResponse });

      const result = await locationBrandingService.getLocationBranding(2);

      expect(result.customLogoUrl).toBeUndefined();
      expect(result.colorScheme).toBeUndefined();
      expect(result.customNameOverride).toBeUndefined();
    });

    it('should handle different location IDs', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockBrandingResponse });

      await locationBrandingService.getLocationBranding(123);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/locations/123/branding'),
        expect.any(Object)
      );
    });

    it('should handle 404 errors', async () => {
      const error = { response: { status: 404, data: { message: 'Location not found' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationBrandingService.getLocationBranding(999)
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        locationBrandingService.getLocationBranding(locationId)
      ).rejects.toThrow('Network error');
    });

    it('should include credentials in request', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockBrandingResponse });

      await locationBrandingService.getLocationBranding(locationId);

      const callArgs = mockedAxios.get.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('withCredentials', true);
    });
  });

  describe('updateLocationBranding', () => {
    const updateRequest: UpdateLocationBrandingRequest = {
      customLogoUrl: 'https://example.com/new-logo.png',
      colorScheme: '#00BFFF',
      customNameOverride: 'Updated Name',
      settingsJson: '{"theme":"light"}',
    };

    it('should update location branding successfully', async () => {
      const updatedResponse: LocationBrandingResponse = {
        ...mockBrandingResponse,
        ...updateRequest,
        updatedAt: '2024-01-03T00:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: updatedResponse });

      const result = await locationBrandingService.updateLocationBranding(locationId, updateRequest);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/locations/${locationId}/branding`),
        updateRequest,
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(updatedResponse);
    });

    it('should update only custom logo', async () => {
      const logoUpdate: UpdateLocationBrandingRequest = {
        customLogoUrl: 'https://example.com/only-logo.png',
      };

      mockedAxios.put.mockResolvedValue({
        data: { ...mockBrandingResponse, ...logoUpdate },
      });

      const result = await locationBrandingService.updateLocationBranding(locationId, logoUpdate);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.any(String),
        logoUpdate,
        expect.any(Object)
      );
      expect(result.customLogoUrl).toBe('https://example.com/only-logo.png');
    });

    it('should update only color scheme', async () => {
      const colorUpdate: UpdateLocationBrandingRequest = {
        colorScheme: '#FF0000',
      };

      mockedAxios.put.mockResolvedValue({
        data: { ...mockBrandingResponse, ...colorUpdate },
      });

      const result = await locationBrandingService.updateLocationBranding(locationId, colorUpdate);

      expect(result.colorScheme).toBe('#FF0000');
    });

    it('should update only custom name', async () => {
      const nameUpdate: UpdateLocationBrandingRequest = {
        customNameOverride: 'Brand New Name',
      };

      mockedAxios.put.mockResolvedValue({
        data: { ...mockBrandingResponse, ...nameUpdate },
      });

      const result = await locationBrandingService.updateLocationBranding(locationId, nameUpdate);

      expect(result.customNameOverride).toBe('Brand New Name');
    });

    it('should update only settings JSON', async () => {
      const settingsUpdate: UpdateLocationBrandingRequest = {
        settingsJson: '{"customField":"value"}',
      };

      mockedAxios.put.mockResolvedValue({
        data: { ...mockBrandingResponse, ...settingsUpdate },
      });

      const result = await locationBrandingService.updateLocationBranding(locationId, settingsUpdate);

      expect(result.settingsJson).toBe('{"customField":"value"}');
    });

    it('should handle empty update request', async () => {
      const emptyUpdate: UpdateLocationBrandingRequest = {};

      mockedAxios.put.mockResolvedValue({ data: mockBrandingResponse });

      const result = await locationBrandingService.updateLocationBranding(locationId, emptyUpdate);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.any(String),
        emptyUpdate,
        expect.any(Object)
      );
      expect(result).toEqual(mockBrandingResponse);
    });

    it('should handle different location IDs', async () => {
      mockedAxios.put.mockResolvedValue({ data: mockBrandingResponse });

      await locationBrandingService.updateLocationBranding(456, updateRequest);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/locations/456/branding'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle validation errors', async () => {
      const error = { response: { status: 400, data: { message: 'Invalid color scheme' } } };
      mockedAxios.put.mockRejectedValue(error);

      await expect(
        locationBrandingService.updateLocationBranding(locationId, updateRequest)
      ).rejects.toEqual(error);
    });

    it('should handle unauthorized errors', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockedAxios.put.mockRejectedValue(error);

      await expect(
        locationBrandingService.updateLocationBranding(locationId, updateRequest)
      ).rejects.toEqual(error);
    });

    it('should handle network errors on update', async () => {
      const error = new Error('Network timeout');
      mockedAxios.put.mockRejectedValue(error);

      await expect(
        locationBrandingService.updateLocationBranding(locationId, updateRequest)
      ).rejects.toThrow('Network timeout');
    });

    it('should include credentials in update request', async () => {
      mockedAxios.put.mockResolvedValue({ data: mockBrandingResponse });

      await locationBrandingService.updateLocationBranding(locationId, updateRequest);

      const callArgs = mockedAxios.put.mock.calls[0];
      expect(callArgs[2]).toHaveProperty('withCredentials', true);
    });

    it('should update and return new timestamps', async () => {
      const updatedResponse: LocationBrandingResponse = {
        ...mockBrandingResponse,
        updatedAt: '2024-01-10T00:00:00Z',
      };

      mockedAxios.put.mockResolvedValue({ data: updatedResponse });

      const result = await locationBrandingService.updateLocationBranding(locationId, updateRequest);

      expect(result.updatedAt).toBe('2024-01-10T00:00:00Z');
      expect(result.createdAt).toBe(mockBrandingResponse.createdAt);
    });
  });
});
