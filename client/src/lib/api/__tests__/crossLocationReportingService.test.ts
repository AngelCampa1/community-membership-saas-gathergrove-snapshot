/**
 * CrossLocationReportingService Tests - Full Coverage
 */

import { crossLocationReportingService, ConsolidatedDashboardResponse } from '../crossLocationReportingService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CrossLocationReportingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConsolidatedDashboard', () => {
    const clubId = 1;
    const mockResponse: ConsolidatedDashboardResponse = {
      clubId: 1,
      clubName: 'Test Club',
      locations: [
        {
          id: 1,
          locationName: 'Main Location',
          locationCode: 'MAIN',
          activeMembers: 150,
          upcomingEvents: 5,
          isActive: true,
        },
        {
          id: 2,
          locationName: 'Branch Location',
          locationCode: 'BRANCH',
          activeMembers: 75,
          upcomingEvents: 2,
          isActive: true,
        },
      ],
      totalMembers: 225,
      totalEvents: 7,
      totalActiveLocations: 2,
    };

    it('should fetch consolidated dashboard for a club', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await crossLocationReportingService.getConsolidatedDashboard(clubId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/clubs/${clubId}/reports/consolidated-dashboard`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return correct club information', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await crossLocationReportingService.getConsolidatedDashboard(clubId);

      expect(result.clubId).toBe(1);
      expect(result.clubName).toBe('Test Club');
    });

    it('should return all locations with details', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await crossLocationReportingService.getConsolidatedDashboard(clubId);

      expect(result.locations).toHaveLength(2);
      expect(result.locations[0].locationName).toBe('Main Location');
      expect(result.locations[1].locationName).toBe('Branch Location');
    });

    it('should return aggregated totals', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await crossLocationReportingService.getConsolidatedDashboard(clubId);

      expect(result.totalMembers).toBe(225);
      expect(result.totalEvents).toBe(7);
      expect(result.totalActiveLocations).toBe(2);
    });

    it('should handle empty locations', async () => {
      const emptyResponse: ConsolidatedDashboardResponse = {
        clubId: 2,
        clubName: 'Empty Club',
        locations: [],
        totalMembers: 0,
        totalEvents: 0,
        totalActiveLocations: 0,
      };

      mockedAxios.get.mockResolvedValue({ data: emptyResponse });

      const result = await crossLocationReportingService.getConsolidatedDashboard(2);

      expect(result.locations).toHaveLength(0);
      expect(result.totalMembers).toBe(0);
    });

    it('should handle single location', async () => {
      const singleLocationResponse: ConsolidatedDashboardResponse = {
        clubId: 3,
        clubName: 'Single Location Club',
        locations: [
          {
            id: 1,
            locationName: 'Only Location',
            locationCode: 'ONLY',
            activeMembers: 100,
            upcomingEvents: 3,
            isActive: true,
          },
        ],
        totalMembers: 100,
        totalEvents: 3,
        totalActiveLocations: 1,
      };

      mockedAxios.get.mockResolvedValue({ data: singleLocationResponse });

      const result = await crossLocationReportingService.getConsolidatedDashboard(3);

      expect(result.locations).toHaveLength(1);
      expect(result.totalActiveLocations).toBe(1);
    });

    it('should handle inactive locations', async () => {
      const inactiveResponse: ConsolidatedDashboardResponse = {
        clubId: 4,
        clubName: 'Mixed Status Club',
        locations: [
          {
            id: 1,
            locationName: 'Active Location',
            locationCode: 'ACTIVE',
            activeMembers: 50,
            upcomingEvents: 2,
            isActive: true,
          },
          {
            id: 2,
            locationName: 'Inactive Location',
            locationCode: 'INACTIVE',
            activeMembers: 0,
            upcomingEvents: 0,
            isActive: false,
          },
        ],
        totalMembers: 50,
        totalEvents: 2,
        totalActiveLocations: 1,
      };

      mockedAxios.get.mockResolvedValue({ data: inactiveResponse });

      const result = await crossLocationReportingService.getConsolidatedDashboard(4);

      expect(result.locations.some(loc => !loc.isActive)).toBe(true);
      expect(result.totalActiveLocations).toBe(1);
    });

    it('should throw error when API fails', async () => {
      const error = new Error('API Error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        crossLocationReportingService.getConsolidatedDashboard(clubId)
      ).rejects.toThrow('API Error');
    });

    it('should handle 404 errors', async () => {
      const error = { response: { status: 404, data: { message: 'Club not found' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        crossLocationReportingService.getConsolidatedDashboard(999)
      ).rejects.toEqual(error);
    });

    it('should handle 401 unauthorized errors', async () => {
      const error = { response: { status: 401, data: { message: 'Unauthorized' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        crossLocationReportingService.getConsolidatedDashboard(clubId)
      ).rejects.toEqual(error);
    });

    it('should include credentials in request', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      await crossLocationReportingService.getConsolidatedDashboard(clubId);

      const callArgs = mockedAxios.get.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('withCredentials', true);
    });

    it('should use correct API endpoint', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      await crossLocationReportingService.getConsolidatedDashboard(clubId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/reports/consolidated-dashboard'),
        expect.any(Object)
      );
    });

    it('should handle different club IDs', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      await crossLocationReportingService.getConsolidatedDashboard(123);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/clubs/123/'),
        expect.any(Object)
      );
    });

    it('should handle large numbers of locations', async () => {
      const locations = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        locationName: `Location ${i + 1}`,
        locationCode: `LOC${i + 1}`,
        activeMembers: 10,
        upcomingEvents: 1,
        isActive: true,
      }));

      const largeResponse: ConsolidatedDashboardResponse = {
        clubId: 5,
        clubName: 'Large Club',
        locations,
        totalMembers: 500,
        totalEvents: 50,
        totalActiveLocations: 50,
      };

      mockedAxios.get.mockResolvedValue({ data: largeResponse });

      const result = await crossLocationReportingService.getConsolidatedDashboard(5);

      expect(result.locations).toHaveLength(50);
      expect(result.totalMembers).toBe(500);
    });
  });
});
