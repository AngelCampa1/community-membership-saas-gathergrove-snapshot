import { abTestingService } from '../abTestingService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('abTestingService', () => {
  const clubId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCampaigns', () => {
    it('should fetch A/B test campaigns for a club', async () => {
      const mockCampaigns = [
        { id: 1, campaignName: 'Campaign 1', status: 'Running' },
        { id: 2, campaignName: 'Campaign 2', status: 'Draft' },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: mockCampaigns,
      });

      const result = await abTestingService.getCampaigns(clubId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/ab-tests`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockCampaigns);
    });

    it('should handle fetch errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(abTestingService.getCampaigns(clubId)).rejects.toThrow('Network error');
    });
  });

  describe('getCampaign', () => {
    it('should fetch a single campaign', async () => {
      const mockCampaign = { id: 1, campaignName: 'Campaign 1', status: 'Running' };
      const campaignId = 1;

      mockedAxios.get.mockResolvedValueOnce({
        data: mockCampaign,
      });

      const result = await abTestingService.getCampaign(clubId, campaignId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/ab-tests/${campaignId}`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('createCampaign', () => {
    it('should create a new campaign', async () => {
      const mockCampaign = { id: 1, campaignName: 'New Campaign', status: 'Draft' };
      const campaignData = {
        campaignName: 'New Campaign',
        variantATemplateId: 1,
        variantBTemplateId: 2,
        testPercentage: 50,
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: mockCampaign,
      });

      const result = await abTestingService.createCampaign(clubId, campaignData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/ab-tests`),
        campaignData,
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockCampaign);
    });

    it('should handle create campaign errors', async () => {
      const campaignData = {
        campaignName: 'New Campaign',
        variantATemplateId: 1,
        variantBTemplateId: 2,
        testPercentage: 50,
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(abTestingService.createCampaign(clubId, campaignData)).rejects.toThrow('Network error');
    });
  });

  describe('startCampaign', () => {
    it('should start a campaign', async () => {
      const mockCampaign = { id: 1, campaignName: 'Campaign', status: 'Running' };
      const campaignId = 1;

      mockedAxios.post.mockResolvedValueOnce({
        data: mockCampaign,
      });

      const result = await abTestingService.startCampaign(clubId, campaignId, {});

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/ab-tests/${campaignId}/start`),
        {},
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockCampaign);
    });

    it('should handle start campaign errors', async () => {
      const campaignId = 1;

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(abTestingService.startCampaign(clubId, campaignId, {})).rejects.toThrow('Network error');
    });
  });

  describe('getCampaignResults', () => {
    it('should fetch campaign results', async () => {
      const mockResults = {
        winnerId: 1,
        winnerVariant: 'A',
        confidenceLevel: 95,
        variantAStats: {},
        variantBStats: {},
      };
      const campaignId = 1;

      mockedAxios.get.mockResolvedValueOnce({
        data: mockResults,
      });

      const result = await abTestingService.getCampaignResults(clubId, campaignId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/ab-tests/${campaignId}/results`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockResults);
    });

    it('should handle get campaign results errors', async () => {
      const campaignId = 1;

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(abTestingService.getCampaignResults(clubId, campaignId)).rejects.toThrow('Network error');
    });
  });

  describe('determineWinner', () => {
    it('should determine campaign winner', async () => {
      const mockResults = {
        winnerId: 1,
        winnerVariant: 'A',
        confidenceLevel: 95,
      };
      const campaignId = 1;

      mockedAxios.post.mockResolvedValueOnce({
        data: mockResults,
      });

      const result = await abTestingService.determineWinner(clubId, campaignId);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/ab-tests/${campaignId}/determine-winner`),
        {},
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockResults);
    });

    it('should handle determine winner errors', async () => {
      const campaignId = 1;

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(abTestingService.determineWinner(clubId, campaignId)).rejects.toThrow('Network error');
    });
  });
});

