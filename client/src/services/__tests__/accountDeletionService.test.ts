/**
 * @jest-environment jsdom
 *
 * Account Deletion Service Tests
 *
 * Tests account deletion workflow following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer) — accountDeletionService imports
 *   apiClient from '@/lib/axios', which re-exports '@/services/apiClient'.
 * - Test REAL service logic (corrected URL construction, error handling/propagation).
 */

import {
  accountDeletionService,
  AccountDeletionRequest,
  ClubOwnershipTransferRequest,
} from '../accountDeletionService';
import { apiClient } from '@/lib/axios';

// Mock apiClient at the HTTP boundary (single boundary mock)
jest.mock('@/lib/axios', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AccountDeletionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockValidationResponse = {
    canDelete: true,
    validationErrors: [],
    requiredActions: [],
    estimatedDeletionTime: '30.00:00:00',
    impactSummary: {
      clubsToDelete: 0,
      clubsToTransfer: 0,
      memberRecordsToAnonymize: 5,
      eventsAffected: 2,
      paymentRecordsAffected: 1,
      dataExportSize: 1024,
    },
    isAdminAccount: false,
    adminInfo: {
      primaryClubsCount: 0,
      secondaryClubsCount: 0,
      clubsToBeDeleted: [],
      clubsToTransfer: [],
      availableTransferTargets: [],
      hasActiveBilling: false,
      extendedGracePeriodDays: 30,
    },
  };

  const mockDeletionResponse = {
    deletionRequestId: '11111111-1111-1111-1111-111111111111',
    status: 'PendingGracePeriod',
    requiresManualReview: false,
    estimatedCompletionDate: '2025-02-15T10:00:00Z',
    dataExportId: 'export-abc',
    dataExportFilePath: '/exports/export-abc.zip',
    requiredActions: [],
    warnings: [],
  };

  const mockStatusResponse = {
    deletionRequestId: '11111111-1111-1111-1111-111111111111',
    status: 'Processing',
    progress: 40,
    estimatedCompletionDate: '2025-02-15T10:00:00Z',
    completedSteps: ['validate', 'export'],
    remainingSteps: ['anonymize', 'finalize'],
    errorMessages: [],
  };

  const mockTransferTargets = [
    { userId: 123, fullName: 'John Doe', email: 'john@example.com', clubIds: [1], role: 'Administrator' },
    { userId: 456, fullName: 'Jane Smith', email: 'jane@example.com', clubIds: [2], role: 'Administrator' },
  ];

  describe('validateAccountDeletion', () => {
    it('calls the corrected validate path (no /api/v1 prefix)', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockValidationResponse });

      const result = await accountDeletionService.validateAccountDeletion();

      expect(mockApiClient.get).toHaveBeenCalledWith('/account-deletion/validate');
      expect(result).toEqual(mockValidationResponse);
    });

    it('returns the real validation shape', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockValidationResponse });

      const result = await accountDeletionService.validateAccountDeletion();

      expect(result.canDelete).toBe(true);
      expect(result.validationErrors).toEqual([]);
      expect(result.impactSummary.memberRecordsToAnonymize).toBe(5);
      expect(result.adminInfo.extendedGracePeriodDays).toBe(30);
    });

    it('propagates errors via ErrorHandler with the method-name context', async () => {
      mockApiClient.get.mockRejectedValue({ response: { status: 401, data: { message: 'Unauthorized' } } });

      await expect(accountDeletionService.validateAccountDeletion()).rejects.toMatchObject({
        message: expect.stringContaining('Error validateAccountDeletion:'),
      });
    });
  });

  describe('initiateAccountDeletion', () => {
    const deletionRequest: AccountDeletionRequest = {
      reason: 'No longer using the service',
      confirmationPhrase: 'DELETE MY ACCOUNT',
      requestDataExport: true,
      passwordConfirmation: 'SecurePassword123',
    };

    it('posts to the corrected request path and returns AccountDeletionResponse', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockDeletionResponse });

      const result = await accountDeletionService.initiateAccountDeletion(deletionRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/account-deletion/request', deletionRequest);
      const postedBody = mockApiClient.post.mock.calls[0][1] as AccountDeletionRequest;
      expect(postedBody.confirmationPhrase).toBe('DELETE MY ACCOUNT');
      expect(result.deletionRequestId).toBe('11111111-1111-1111-1111-111111111111');
      expect(result.dataExportId).toBe('export-abc');
    });

    it('propagates errors with the initiateAccountDeletion context', async () => {
      mockApiClient.post.mockRejectedValue({ response: { status: 400, data: { message: 'Invalid' } } });

      await expect(
        accountDeletionService.initiateAccountDeletion(deletionRequest)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error initiateAccountDeletion:') });
    });
  });

  describe('getAccountDeletionStatus', () => {
    const id = '11111111-1111-1111-1111-111111111111';

    it('threads the guid into the corrected status path', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockStatusResponse });

      const result = await accountDeletionService.getAccountDeletionStatus(id);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/account-deletion/${id}/status`);
      expect(result.status).toBe('Processing');
      expect(result.progress).toBe(40);
      expect(result.completedSteps).toContain('export');
    });

    it('propagates errors with the getAccountDeletionStatus context', async () => {
      mockApiClient.get.mockRejectedValue({ response: { status: 404, data: { message: 'Not Found' } } });

      await expect(
        accountDeletionService.getAccountDeletionStatus(id)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error getAccountDeletionStatus:') });
    });
  });

  describe('cancelAccountDeletion', () => {
    const id = '11111111-1111-1111-1111-111111111111';

    it('threads the guid into the corrected cancel path', async () => {
      mockApiClient.post.mockResolvedValue({ data: { message: 'Cancelled' } });

      const result = await accountDeletionService.cancelAccountDeletion(id);

      expect(mockApiClient.post).toHaveBeenCalledWith(`/account-deletion/${id}/cancel`);
      expect(result.message).toBe('Cancelled');
    });

    it('propagates errors with the cancelAccountDeletion context', async () => {
      mockApiClient.post.mockRejectedValue({ response: { status: 409, data: { message: 'Cannot cancel' } } });

      await expect(
        accountDeletionService.cancelAccountDeletion(id)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error cancelAccountDeletion:') });
    });
  });

  describe('getAdminTransferTargets', () => {
    it('calls the corrected transfer-targets path', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockTransferTargets });

      const result = await accountDeletionService.getAdminTransferTargets();

      expect(mockApiClient.get).toHaveBeenCalledWith('/account-deletion/admin/transfer-targets');
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('Administrator');
    });

    it('propagates errors with the getAdminTransferTargets context', async () => {
      mockApiClient.get.mockRejectedValue({ response: { status: 500, data: { message: 'Server error' } } });

      await expect(
        accountDeletionService.getAdminTransferTargets()
      ).rejects.toMatchObject({ message: expect.stringContaining('Error getAdminTransferTargets:') });
    });
  });

  describe('transferClubOwnership', () => {
    const fromUserId = 100;
    const transferRequest: ClubOwnershipTransferRequest = {
      fromUserId: 100,
      toUserId: 123,
      clubId: 1,
    };

    const mockTransferResponse = {
      message: 'Ownership transferred successfully',
      transferId: 'transfer-1',
      requiresConfirmation: false,
    };

    it('posts to the corrected transfer-ownership path', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockTransferResponse });

      const result = await accountDeletionService.transferClubOwnership(fromUserId, transferRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/account-deletion/admin/transfer-ownership',
        transferRequest
      );
      expect(result.transferId).toBe('transfer-1');
    });

    it('propagates errors with the transferClubOwnership context', async () => {
      mockApiClient.post.mockRejectedValue({ response: { status: 403, data: { message: 'Forbidden' } } });

      await expect(
        accountDeletionService.transferClubOwnership(fromUserId, transferRequest)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error transferClubOwnership:') });
    });
  });

  describe('downloadDataExport', () => {
    const exportId = '22222222-2222-2222-2222-222222222222';

    it('requests the export download path as a blob', async () => {
      const blob = new Blob(['data'], { type: 'application/zip' });
      mockApiClient.get.mockResolvedValue({ data: blob });

      const result = await accountDeletionService.downloadDataExport(exportId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/account-deletion/exports/${exportId}/download`,
        { responseType: 'blob' }
      );
      expect(result).toBe(blob);
    });

    it('propagates errors with the downloadDataExport context', async () => {
      mockApiClient.get.mockRejectedValue({ response: { status: 404, data: { message: 'Not Found' } } });

      await expect(
        accountDeletionService.downloadDataExport(exportId)
      ).rejects.toMatchObject({ message: expect.stringContaining('Error downloadDataExport:') });
    });
  });

  describe('service surface', () => {
    it('exposes the corrected method set (no requestDataExport / confirmAccountDeletion)', () => {
      expect(typeof accountDeletionService.validateAccountDeletion).toBe('function');
      expect(typeof accountDeletionService.initiateAccountDeletion).toBe('function');
      expect(typeof accountDeletionService.getAccountDeletionStatus).toBe('function');
      expect(typeof accountDeletionService.cancelAccountDeletion).toBe('function');
      expect(typeof accountDeletionService.getAdminTransferTargets).toBe('function');
      expect(typeof accountDeletionService.transferClubOwnership).toBe('function');
      expect(typeof accountDeletionService.downloadDataExport).toBe('function');
      const surface = accountDeletionService as unknown as Record<string, unknown>;
      expect(surface.requestDataExport).toBeUndefined();
      expect(surface.confirmAccountDeletion).toBeUndefined();
    });
  });
});
