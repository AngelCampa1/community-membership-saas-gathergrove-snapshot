import { accountDeletionService } from '../accountDeletionService';
import { apiClient } from '../apiClient';

// Mock apiClient
jest.mock('../apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AccountDeletionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAccountDeletion', () => {
    it('should validate account deletion successfully', async () => {
      const mockResponse = {
        canDelete: true,
        restrictions: [],
        pendingObligations: [],
        dataRetentionDays: 30,
        alternativeOptions: ['Temporarily disable account', 'Download your data first'],
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.validateAccountDeletion();

      expect(result).toEqual(mockResponse);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/account-deletion/validate');
    });

    it('should handle restrictions preventing deletion', async () => {
      const mockResponse = {
        canDelete: false,
        restrictions: ['Outstanding payment required', 'Active subscription'],
        pendingObligations: ['Complete pending transfers', 'Cancel recurring events'],
        dataRetentionDays: 30,
        alternativeOptions: ['Pay outstanding balance', 'Cancel subscription'],
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.validateAccountDeletion();

      expect(result.canDelete).toBe(false);
      expect(result.restrictions).toHaveLength(2);
      expect(result.pendingObligations).toHaveLength(2);
    });
  });

  describe('requestDataExport', () => {
    it('should request data export in JSON format', async () => {
      const mockResponse = {
        exportId: 'export-123',
        downloadUrl: 'https://example.com/download/export-123.json',
      };

      const request = {
        format: 'json' as const,
        includeMedia: false,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.requestDataExport(request);

      expect(result).toEqual(mockResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/v1/account-deletion/export-data',
        request
      );
    });

    it('should request data export in CSV format with media', async () => {
      const mockResponse = {
        exportId: 'export-456',
        downloadUrl: 'https://example.com/download/export-456.zip',
      };

      const request = {
        format: 'csv' as const,
        includeMedia: true,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.requestDataExport(request);

      expect(result).toEqual(mockResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/v1/account-deletion/export-data',
        request
      );
    });

    it('should request data export in PDF format', async () => {
      const mockResponse = {
        exportId: 'export-789',
        downloadUrl: 'https://example.com/download/export-789.pdf',
      };

      const request = {
        format: 'pdf' as const,
        includeMedia: false,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.requestDataExport(request);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('initiateAccountDeletion', () => {
    it('should initiate account deletion with full request', async () => {
      const mockResponse = {
        deletionId: 'deletion-123',
        scheduledFor: '2025-02-01T00:00:00Z',
        gracePeriodEnds: '2025-01-15T00:00:00Z',
      };

      const request = {
        reason: 'No longer needed',
        confirmDataExport: true,
        confirmUnderstanding: true,
        password: 'user-password',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.initiateAccountDeletion(request);

      expect(result).toEqual(mockResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/v1/account-deletion/request',
        request
      );
    });

    it('should initiate account deletion without password', async () => {
      const mockResponse = {
        deletionId: 'deletion-456',
        scheduledFor: '2025-02-05T00:00:00Z',
        gracePeriodEnds: '2025-01-20T00:00:00Z',
      };

      const request = {
        reason: 'Privacy concerns',
        confirmDataExport: true,
        confirmUnderstanding: true,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.initiateAccountDeletion(request);

      expect(result).toEqual(mockResponse);
      expect(result.deletionId).toBe('deletion-456');
    });
  });

  describe('getAccountDeletionStatus', () => {
    it('should get pending deletion status', async () => {
      const mockResponse = {
        status: 'pending' as const,
        requestedAt: '2025-01-01T00:00:00Z',
        scheduledFor: '2025-02-01T00:00:00Z',
        gracePeriodEnds: '2025-01-15T00:00:00Z',
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.getAccountDeletionStatus();

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('pending');
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/account-deletion/status');
    });

    it('should get processing deletion status', async () => {
      const mockResponse = {
        status: 'processing' as const,
        requestedAt: '2025-01-01T00:00:00Z',
        scheduledFor: '2025-02-01T00:00:00Z',
        gracePeriodEnds: '2025-01-15T00:00:00Z',
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.getAccountDeletionStatus();

      expect(result.status).toBe('processing');
    });

    it('should get completed deletion status with export URL', async () => {
      const mockResponse = {
        status: 'completed' as const,
        requestedAt: '2025-01-01T00:00:00Z',
        scheduledFor: '2025-02-01T00:00:00Z',
        exportUrl: 'https://example.com/download/final-export.zip',
        gracePeriodEnds: '2025-01-15T00:00:00Z',
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.getAccountDeletionStatus();

      expect(result.status).toBe('completed');
      expect(result.exportUrl).toBeDefined();
    });

    it('should get cancelled deletion status', async () => {
      const mockResponse = {
        status: 'cancelled' as const,
        requestedAt: '2025-01-01T00:00:00Z',
        scheduledFor: '2025-02-01T00:00:00Z',
        gracePeriodEnds: '2025-01-15T00:00:00Z',
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.getAccountDeletionStatus();

      expect(result.status).toBe('cancelled');
    });
  });

  describe('cancelAccountDeletion', () => {
    it('should cancel pending account deletion', async () => {
      mockApiClient.post.mockResolvedValue(undefined);

      await expect(
        accountDeletionService.cancelAccountDeletion()
      ).resolves.not.toThrow();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/account-deletion/cancel');
    });
  });

  describe('confirmAccountDeletion', () => {
    it('should confirm account deletion with deletion ID', async () => {
      const deletionId = 'deletion-123';

      mockApiClient.post.mockResolvedValue(undefined);

      await expect(
        accountDeletionService.confirmAccountDeletion(deletionId)
      ).resolves.not.toThrow();

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/v1/account-deletion/confirm/${deletionId}`
      );
    });

    it('should handle different deletion ID formats', async () => {
      const deletionId = 'abc-123-xyz-789';

      mockApiClient.post.mockResolvedValue(undefined);

      await accountDeletionService.confirmAccountDeletion(deletionId);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/v1/account-deletion/confirm/${deletionId}`
      );
    });
  });
});
