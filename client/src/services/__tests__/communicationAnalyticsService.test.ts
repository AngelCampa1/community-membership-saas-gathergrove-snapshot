import { communicationAnalyticsService } from '../communicationAnalyticsService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('communicationAnalyticsService', () => {
  const clubId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAnalyticsSummary', () => {
    it('should fetch analytics summary', async () => {
      const mockSummary = {
        totalCommunications: 100,
        totalRecipients: 500,
        openRate: 45.5,
        clickRate: 12.3,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSummary,
      });

      const result = await communicationAnalyticsService.getAnalyticsSummary(clubId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/communication-analytics/summary`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockSummary);
    });

    it('should include query parameters when provided', async () => {
      const mockSummary = { totalCommunications: 50 };
      const filters = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        communicationType: 'Email',
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSummary,
      });

      await communicationAnalyticsService.getAnalyticsSummary(clubId, filters);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2025-01-01'),
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('endDate=2025-01-31'),
        expect.any(Object)
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('communicationType=Email'),
        expect.any(Object)
      );
    });

    it('should handle fetch errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        communicationAnalyticsService.getAnalyticsSummary(clubId)
      ).rejects.toThrow('Network error');
    });

    it('should include templateId filter when provided', async () => {
      const mockSummary = { totalCommunications: 25 };
      const filters = {
        templateId: 42,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSummary,
      });

      await communicationAnalyticsService.getAnalyticsSummary(clubId, filters);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('templateId=42'),
        expect.any(Object)
      );
    });

    it('should include segmentId filter when provided', async () => {
      const mockSummary = { totalCommunications: 15 };
      const filters = {
        segmentId: 7,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSummary,
      });

      await communicationAnalyticsService.getAnalyticsSummary(clubId, filters);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('segmentId=7'),
        expect.any(Object)
      );
    });

    it('should include all filters when provided', async () => {
      const mockSummary = { totalCommunications: 10 };
      const filters = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        communicationType: 'Email',
        templateId: 5,
        segmentId: 3,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockSummary,
      });

      await communicationAnalyticsService.getAnalyticsSummary(clubId, filters);

      const callUrl = mockedAxios.get.mock.calls[0][0];
      expect(callUrl).toContain('startDate=2025-01-01');
      expect(callUrl).toContain('endDate=2025-01-31');
      expect(callUrl).toContain('communicationType=Email');
      expect(callUrl).toContain('templateId=5');
      expect(callUrl).toContain('segmentId=3');
    });
  });

  describe('getCommunicationDetails', () => {
    it('should fetch communication details', async () => {
      const mockDetails = {
        communicationId: 123,
        subject: 'Test Email',
        totalRecipients: 100,
        openCount: 45,
        clickCount: 12,
      };
      const communicationId = 123;

      mockedAxios.get.mockResolvedValueOnce({
        data: mockDetails,
      });

      const result = await communicationAnalyticsService.getCommunicationDetails(
        clubId,
        communicationId
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/communication-analytics/communications/${communicationId}`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockDetails);
    });

    it('should handle get communication details errors', async () => {
      const communicationId = 123;

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        communicationAnalyticsService.getCommunicationDetails(clubId, communicationId)
      ).rejects.toThrow('Network error');
    });
  });
});

