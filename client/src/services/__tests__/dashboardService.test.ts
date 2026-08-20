import dashboardService, { DashboardSummary } from '../dashboardService';
import apiClient from '../apiClient';
import { ApiErrorClass } from '@/types/errors';

// Mock the API client
jest.mock('../apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardSummary', () => {
    it('should make a GET request to /clubs/{clubId}/dashboard/summary', async () => {
      const clubId = 1;
      const mockResponse: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 25,
        memberLimit: 50,
        duesCollectedYTD: 1250.00,
        upcomingEventCount: 3,
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await dashboardService.getDashboardSummary(clubId);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/clubs/1/dashboard/summary');
      expect(result).toEqual(mockResponse);
    });

    it('should handle Grow tier data correctly', async () => {
      const clubId = 1;
      const mockResponse: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 10,
        memberLimit: 50,
        duesCollectedYTD: 500.00,
        upcomingEventCount: 1,
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await dashboardService.getDashboardSummary(clubId);

      expect(result.currentTier).toBe('Grow');
      expect(result.memberLimit).toBe(50);
      expect(result.memberCount).toBe(10);
    });

    it('should handle Grow tier data correctly', async () => {
      const clubId = 2;
      const mockResponse: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 150,
        memberLimit: 200,
        duesCollectedYTD: 7500.00,
        upcomingEventCount: 5,
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await dashboardService.getDashboardSummary(clubId);

      expect(result.currentTier).toBe('Grow');
      expect(result.memberLimit).toBe(200);
      expect(result.memberCount).toBe(150);
    });

    it('should handle zero member count correctly', async () => {
      const clubId = 3;
      const mockResponse: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 0,
        memberLimit: 50,
        duesCollectedYTD: 0.00,
        upcomingEventCount: 0,
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await dashboardService.getDashboardSummary(clubId);

      expect(result.memberCount).toBe(0);
      expect(result.duesCollectedYTD).toBe(0.00);
      expect(result.upcomingEventCount).toBe(0);
    });

    it('should handle large numbers correctly', async () => {
      const clubId = 4;
      const mockResponse: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 195,
        memberLimit: 200,
        duesCollectedYTD: 15750.50,
        upcomingEventCount: 25,
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await dashboardService.getDashboardSummary(clubId);

      expect(result.memberCount).toBe(195);
      expect(result.duesCollectedYTD).toBe(15750.50);
      expect(result.upcomingEventCount).toBe(25);
    });

    it('should throw error when API request fails with 401 Unauthorized', async () => {
      const clubId = 1;
      const error = { 
        response: { 
          status: 401, 
          data: { message: 'Unauthorized access' } 
        } 
      };
      
      mockedApiClient.get.mockRejectedValueOnce(error);

      await expect(dashboardService.getDashboardSummary(clubId)).rejects.toBeInstanceOf(ApiErrorClass);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/clubs/1/dashboard/summary');
    });

    it('should throw error when API request fails with 403 Forbidden', async () => {
      const clubId = 999;
      const error = { 
        response: { 
          status: 403, 
          data: { message: 'Access denied to club' } 
        } 
      };
      
      mockedApiClient.get.mockRejectedValueOnce(error);

      await expect(dashboardService.getDashboardSummary(clubId)).rejects.toBeInstanceOf(ApiErrorClass);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/clubs/999/dashboard/summary');
    });

    it('should throw error when API request fails with 404 Not Found', async () => {
      const clubId = 999;
      const error = { 
        response: { 
          status: 404, 
          data: { message: 'Club not found' } 
        } 
      };
      
      mockedApiClient.get.mockRejectedValueOnce(error);

      await expect(dashboardService.getDashboardSummary(clubId)).rejects.toBeInstanceOf(ApiErrorClass);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/clubs/999/dashboard/summary');
    });

    it('should throw error when API request fails with 500 Server Error', async () => {
      const clubId = 1;
      const error = { 
        response: { 
          status: 500, 
          data: { message: 'Internal server error' } 
        } 
      };
      
      mockedApiClient.get.mockRejectedValueOnce(error);

      await expect(dashboardService.getDashboardSummary(clubId)).rejects.toBeInstanceOf(ApiErrorClass);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/clubs/1/dashboard/summary');
    });

    it('should handle network errors', async () => {
      const clubId = 1;
      const error = new Error('Network error');
      
      mockedApiClient.get.mockRejectedValueOnce(error);

      await expect(dashboardService.getDashboardSummary(clubId)).rejects.toBeInstanceOf(ApiErrorClass);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/clubs/1/dashboard/summary');
    });

    it('should work with different club IDs', async () => {
      const clubIds = [1, 5, 100, 999];
      
      for (const clubId of clubIds) {
        const mockResponse: DashboardSummary = {
          currentTier: 'Grow',
          memberCount: clubId,
          memberLimit: 50,
          duesCollectedYTD: clubId * 50,
          upcomingEventCount: Math.floor(clubId / 10),
        };

        mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

        const result = await dashboardService.getDashboardSummary(clubId);

        expect(mockedApiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/dashboard/summary`);
        expect(result).toEqual(mockResponse);
      }
    });
  });
}); 