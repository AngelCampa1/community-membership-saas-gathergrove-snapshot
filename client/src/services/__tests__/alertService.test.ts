/**
 * @jest-environment jsdom
 *
 * Alert Service Tests
 *
 * Tests alert configuration functionality following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, parameter handling, error handling)
 */

import alertService, {
  AlertConfigResponse,
  UpdateAlertConfigRequest,
  CreateAlertConfigRequest,
} from '../alertService';
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

describe('AlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data
  const mockAlertConfig: AlertConfigResponse = {
    id: 1,
    clubId: 1,
    engagementAlerts: true,
    churnRiskAlerts: true,
    eventReminderAlerts: false,
    engagementThreshold: 30,
    churnRiskThreshold: 60,
    eventReminderDays: 7,
    emailRecipients: ['admin@club.com', 'manager@club.com'],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  };

  describe('getAlertConfig', () => {
    it('should fetch alert configuration for a club', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockAlertConfig });

      const result = await alertService.getAlertConfig(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/v1/clubs/${clubId}/alerts/config`);
      expect(result).toEqual(mockAlertConfig);
    });

    it('should handle not found error (404)', async () => {
      const error = { response: { status: 404 } };
      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(alertService.getAlertConfig(clubId)).rejects.toEqual(error);
      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/v1/clubs/${clubId}/alerts/config`);
    });

    it('should handle unauthorized error (401)', async () => {
      const error = { response: { status: 401 } };
      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(alertService.getAlertConfig(clubId)).rejects.toEqual(error);
    });

    it('should handle server error (500)', async () => {
      const error = { response: { status: 500, data: { message: 'Internal server error' } } };
      mockApiClient.get.mockRejectedValueOnce(error);

      await expect(alertService.getAlertConfig(clubId)).rejects.toEqual(error);
    });
  });

  describe('createAlertConfig', () => {
    const createRequest: CreateAlertConfigRequest = {
      engagementAlerts: true,
      churnRiskAlerts: true,
      eventReminderAlerts: false,
      engagementThreshold: 30,
      churnRiskThreshold: 60,
      eventReminderDays: 7,
      emailRecipients: ['admin@club.com'],
    };

    it('should create alert configuration for a club', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockAlertConfig });

      const result = await alertService.createAlertConfig(clubId, createRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/v1/clubs/${clubId}/alerts/config`,
        createRequest
      );
      expect(result).toEqual(mockAlertConfig);
    });

    it('should handle validation error (400)', async () => {
      const error = {
        response: {
          status: 400,
          data: { errors: { engagementThreshold: ['Must be between 1 and 100'] } },
        },
      };
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(alertService.createAlertConfig(clubId, createRequest)).rejects.toEqual(error);
    });

    it('should handle unauthorized error (401)', async () => {
      const error = { response: { status: 401 } };
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(alertService.createAlertConfig(clubId, createRequest)).rejects.toEqual(error);
    });

    it('should handle forbidden error (403)', async () => {
      const error = { response: { status: 403 } };
      mockApiClient.post.mockRejectedValueOnce(error);

      await expect(alertService.createAlertConfig(clubId, createRequest)).rejects.toEqual(error);
    });
  });

  describe('updateAlertConfig', () => {
    const updateRequest: UpdateAlertConfigRequest = {
      engagementAlerts: false,
      churnRiskAlerts: true,
      eventReminderAlerts: true,
      engagementThreshold: 25,
      churnRiskThreshold: 45,
      eventReminderDays: 3,
      emailRecipients: ['admin@club.com', 'new-admin@club.com'],
    };

    const updatedConfig: AlertConfigResponse = {
      ...mockAlertConfig,
      ...updateRequest,
      updatedAt: '2025-01-20T00:00:00Z',
    };

    it('should update alert configuration for a club', async () => {
      mockApiClient.put.mockResolvedValueOnce({ data: updatedConfig });

      const result = await alertService.updateAlertConfig(clubId, updateRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/v1/clubs/${clubId}/alerts/config`,
        updateRequest
      );
      expect(result).toEqual(updatedConfig);
    });

    it('should handle not found error (404)', async () => {
      const error = { response: { status: 404 } };
      mockApiClient.put.mockRejectedValueOnce(error);

      await expect(alertService.updateAlertConfig(clubId, updateRequest)).rejects.toEqual(error);
    });

    it('should handle validation error (400)', async () => {
      const error = {
        response: {
          status: 400,
          data: { errors: { churnRiskThreshold: ['Must be between 1 and 365'] } },
        },
      };
      mockApiClient.put.mockRejectedValueOnce(error);

      await expect(alertService.updateAlertConfig(clubId, updateRequest)).rejects.toEqual(error);
    });

    it('should handle unauthorized error (401)', async () => {
      const error = { response: { status: 401 } };
      mockApiClient.put.mockRejectedValueOnce(error);

      await expect(alertService.updateAlertConfig(clubId, updateRequest)).rejects.toEqual(error);
    });

    it('should handle forbidden error (403)', async () => {
      const error = { response: { status: 403 } };
      mockApiClient.put.mockRejectedValueOnce(error);

      await expect(alertService.updateAlertConfig(clubId, updateRequest)).rejects.toEqual(error);
    });

    it('should handle server error (500)', async () => {
      const error = { response: { status: 500 } };
      mockApiClient.put.mockRejectedValueOnce(error);

      await expect(alertService.updateAlertConfig(clubId, updateRequest)).rejects.toEqual(error);
    });
  });

  describe('parameter validation', () => {
    it('should pass correct clubId to API endpoints', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockAlertConfig });

      await alertService.getAlertConfig(123);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/clubs/123/alerts/config');
    });

    it('should include all request fields in create request', async () => {
      const fullRequest: CreateAlertConfigRequest = {
        engagementAlerts: true,
        churnRiskAlerts: false,
        eventReminderAlerts: true,
        engagementThreshold: 50,
        churnRiskThreshold: 90,
        eventReminderDays: 14,
        emailRecipients: ['a@b.com', 'c@d.com', 'e@f.com'],
      };

      mockApiClient.post.mockResolvedValueOnce({ data: mockAlertConfig });

      await alertService.createAlertConfig(clubId, fullRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/v1/clubs/${clubId}/alerts/config`,
        fullRequest
      );
    });
  });
});
