/**
 * Unit Tests for Bulk Operations Service
 * Test coverage for mass operations on member segments with error handling
 */

import { bulkOperationsService } from '@/services/bulkOperationsService';
import { apiClient } from '@/services/apiClient';
import { 
  BulkOperation, 
  BulkOperationType, 
  BulkOperationStatus,
  BulkOperationResult 
} from '@/types/bulkOperations';

// Mock the API client
jest.mock('@/services/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('BulkOperationsService', () => {
  const mockClubId = 'club-123';
  
  const mockBulkOperation: BulkOperation = {
    id: 'bulk-op-1',
    clubId: mockClubId,
    operationType: BulkOperationType.UPDATE_CUSTOM_FIELDS,
    status: BulkOperationStatus.PENDING,
    totalRecords: 100,
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    targetMemberIds: ['member-1', 'member-2'],
    operationData: {
      fieldUpdates: {
        'customField.emergencyContact': 'Updated Contact'
      }
    },
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    completedAt: null,
    errors: []
  };

  const mockBulkResult: BulkOperationResult = {
    operationId: 'bulk-op-1',
    success: true,
    totalRecords: 100,
    successfulRecords: 95,
    failedRecords: 5,
    errors: [
      { memberId: 'member-x', error: 'Member not found' },
      { memberId: 'member-y', error: 'Invalid field value' }
    ],
    warnings: [],
    executionTimeMs: 15000
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBulkOperation', () => {
    it('should create a bulk custom field update operation', async () => {
      const operationData = {
        operationType: BulkOperationType.UPDATE_CUSTOM_FIELDS,
        targetMemberIds: ['member-1', 'member-2', 'member-3'],
        operationData: {
          fieldUpdates: {
            'customField.emergencyContact': 'New Contact',
            'customField.dietaryRestrictions': 'None'
          }
        }
      };

      mockApiClient.post.mockResolvedValue({ data: mockBulkOperation });

      const result = await bulkOperationsService.createBulkOperation(
        mockClubId,
        operationData,
        'admin-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations`,
        {
          ...operationData,
          createdBy: 'admin-1'
        }
      );
      expect(result).toEqual(mockBulkOperation);
    });

    it('should create a bulk tag assignment operation', async () => {
      const tagOperationData = {
        operationType: BulkOperationType.ASSIGN_TAGS,
        targetMemberIds: ['member-1', 'member-2'],
        operationData: {
          tagIds: ['tag-1', 'tag-2'],
          action: 'add'
        }
      };

      mockApiClient.post.mockResolvedValue({ data: mockBulkOperation });

      await bulkOperationsService.createBulkOperation(
        mockClubId,
        tagOperationData,
        'admin-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations`,
        {
          ...tagOperationData,
          createdBy: 'admin-1'
        }
      );
    });

    it('should create a bulk member status update operation', async () => {
      const statusOperationData = {
        operationType: BulkOperationType.UPDATE_MEMBER_STATUS,
        targetMemberIds: ['member-1', 'member-2'],
        operationData: {
          newStatus: 'Active',
          reason: 'Bulk activation after payment'
        }
      };

      mockApiClient.post.mockResolvedValue({ data: mockBulkOperation });

      await bulkOperationsService.createBulkOperation(
        mockClubId,
        statusOperationData,
        'admin-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations`,
        statusOperationData
      );
    });

    it('should validate operation type is supported', async () => {
      const invalidOperationData = {
        operationType: 'INVALID_TYPE' as BulkOperationType,
        targetMemberIds: ['member-1'],
        operationData: {}
      };

      await expect(bulkOperationsService.createBulkOperation(
        mockClubId,
        invalidOperationData,
        'admin-1'
      )).rejects.toThrow('Unsupported bulk operation type');
    });

    it('should validate target member IDs are provided', async () => {
      const invalidOperationData = {
        operationType: BulkOperationType.UPDATE_CUSTOM_FIELDS,
        targetMemberIds: [],
        operationData: {}
      };

      await expect(bulkOperationsService.createBulkOperation(
        mockClubId,
        invalidOperationData,
        'admin-1'
      )).rejects.toThrow('At least one target member ID is required');
    });

    it('should validate member limit for bulk operations', async () => {
      const tooManyMembers = Array.from({ length: 1001 }, (_, i) => `member-${i}`);
      const invalidOperationData = {
        operationType: BulkOperationType.UPDATE_CUSTOM_FIELDS,
        targetMemberIds: tooManyMembers,
        operationData: {}
      };

      await expect(bulkOperationsService.createBulkOperation(
        mockClubId,
        invalidOperationData,
        'admin-1'
      )).rejects.toThrow('Maximum 1000 members allowed per bulk operation');
    });
  });

  describe('getBulkOperations', () => {
    it('should fetch all bulk operations for a club', async () => {
      const mockOperations = [mockBulkOperation];
      mockApiClient.get.mockResolvedValue({ data: mockOperations });

      const result = await bulkOperationsService.getBulkOperations(mockClubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations`
      );
      expect(result).toEqual(mockOperations);
    });

    it('should support filtering by status', async () => {
      mockApiClient.get.mockResolvedValue({ data: [mockBulkOperation] });

      await bulkOperationsService.getBulkOperations(mockClubId, {
        status: BulkOperationStatus.RUNNING
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations?status=RUNNING`
      );
    });

    it('should support filtering by operation type', async () => {
      mockApiClient.get.mockResolvedValue({ data: [mockBulkOperation] });

      await bulkOperationsService.getBulkOperations(mockClubId, {
        operationType: BulkOperationType.ASSIGN_TAGS
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations?operationType=ASSIGN_TAGS`
      );
    });

    it('should support pagination', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: {
          operations: [mockBulkOperation],
          totalCount: 50,
          page: 1,
          pageSize: 20
        }
      });

      const result = await bulkOperationsService.getBulkOperations(mockClubId, {
        page: 1,
        pageSize: 20
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations?page=1&pageSize=20`
      );
      expect(result.totalCount).toBe(50);
    });
  });

  describe('getBulkOperation', () => {
    it('should fetch a specific bulk operation', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockBulkOperation });

      const result = await bulkOperationsService.getBulkOperation(
        mockClubId,
        'bulk-op-1'
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/bulk-op-1`
      );
      expect(result).toEqual(mockBulkOperation);
    });

    it('should handle operation not found error', async () => {
      mockApiClient.get.mockRejectedValue({
        response: { status: 404, data: { message: 'Bulk operation not found' } }
      });

      await expect(bulkOperationsService.getBulkOperation(
        mockClubId,
        'invalid-id'
      )).rejects.toThrow('Bulk operation not found');
    });
  });

  describe('executeBulkOperation', () => {
    it('should execute a pending bulk operation', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockBulkResult });

      const result = await bulkOperationsService.executeBulkOperation(
        mockClubId,
        'bulk-op-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/bulk-op-1/execute`
      );
      expect(result).toEqual(mockBulkResult);
    });

    it('should handle execution of already completed operation', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { 
          status: 400, 
          data: { message: 'Operation already completed' } 
        }
      });

      await expect(bulkOperationsService.executeBulkOperation(
        mockClubId,
        'bulk-op-1'
      )).rejects.toThrow('Operation already completed');
    });
  });

  describe('cancelBulkOperation', () => {
    it('should cancel a running bulk operation', async () => {
      mockApiClient.post.mockResolvedValue({ 
        data: { 
          success: true, 
          operationId: 'bulk-op-1',
          status: BulkOperationStatus.CANCELLED
        } 
      });

      const result = await bulkOperationsService.cancelBulkOperation(
        mockClubId,
        'bulk-op-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/bulk-op-1/cancel`
      );
      expect(result.status).toBe(BulkOperationStatus.CANCELLED);
    });

    it('should handle cancellation of non-cancellable operation', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { 
          status: 400, 
          data: { message: 'Operation cannot be cancelled' } 
        }
      });

      await expect(bulkOperationsService.cancelBulkOperation(
        mockClubId,
        'bulk-op-1'
      )).rejects.toThrow('Operation cannot be cancelled');
    });
  });

  describe('getBulkOperationProgress', () => {
    it('should fetch real-time progress of bulk operation', async () => {
      const mockProgress = {
        operationId: 'bulk-op-1',
        status: BulkOperationStatus.RUNNING,
        progress: 65,
        processedRecords: 65,
        totalRecords: 100,
        estimatedTimeRemaining: 45000,
        currentBatch: 7,
        totalBatches: 10
      };

      mockApiClient.get.mockResolvedValue({ data: mockProgress });

      const result = await bulkOperationsService.getBulkOperationProgress(
        mockClubId,
        'bulk-op-1'
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/bulk-op-1/progress`
      );
      expect(result).toEqual(mockProgress);
    });
  });

  describe('retryFailedRecords', () => {
    it('should retry failed records from a bulk operation', async () => {
      mockApiClient.post.mockResolvedValue({ 
        data: { 
          operationId: 'bulk-op-1-retry',
          retriedRecords: 5,
          newOperationCreated: true
        } 
      });

      const result = await bulkOperationsService.retryFailedRecords(
        mockClubId,
        'bulk-op-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/bulk-op-1/retry-failed`
      );
      expect(result.retriedRecords).toBe(5);
    });

    it('should handle retry when no failed records exist', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { 
          status: 400, 
          data: { message: 'No failed records to retry' } 
        }
      });

      await expect(bulkOperationsService.retryFailedRecords(
        mockClubId,
        'bulk-op-1'
      )).rejects.toThrow('No failed records to retry');
    });
  });

  describe('getBulkOperationErrors', () => {
    it('should fetch detailed error information', async () => {
      const mockErrors = {
        operationId: 'bulk-op-1',
        totalErrors: 5,
        errors: [
          {
            memberId: 'member-x',
            error: 'Member not found',
            errorCode: 'MEMBER_NOT_FOUND',
            attemptedAction: 'UPDATE_CUSTOM_FIELD',
            timestamp: new Date('2024-01-01T12:30:00Z')
          },
          {
            memberId: 'member-y',
            error: 'Invalid field value',
            errorCode: 'VALIDATION_ERROR',
            attemptedAction: 'UPDATE_CUSTOM_FIELD',
            timestamp: new Date('2024-01-01T12:30:05Z')
          }
        ]
      };

      mockApiClient.get.mockResolvedValue({ data: mockErrors });

      const result = await bulkOperationsService.getBulkOperationErrors(
        mockClubId,
        'bulk-op-1'
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/bulk-op-1/errors`
      );
      expect(result).toEqual(mockErrors);
    });

    it('should support error filtering by type', async () => {
      mockApiClient.get.mockResolvedValue({ data: { errors: [] } });

      await bulkOperationsService.getBulkOperationErrors(
        mockClubId,
        'bulk-op-1',
        { errorCode: 'VALIDATION_ERROR' }
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/bulk-op-1/errors?errorCode=VALIDATION_ERROR`
      );
    });
  });

  describe('bulkUpdateCustomFields', () => {
    it('should create and execute custom field bulk update', async () => {
      const fieldUpdates = {
        'customField.emergencyContact': 'Updated Contact',
        'customField.dietaryRestrictions': 'None'
      };
      const memberIds = ['member-1', 'member-2', 'member-3'];

      mockApiClient.post.mockResolvedValue({ data: mockBulkResult });

      const result = await bulkOperationsService.bulkUpdateCustomFields(
        mockClubId,
        memberIds,
        fieldUpdates,
        'admin-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/custom-fields`,
        {
          memberIds,
          fieldUpdates,
          createdBy: 'admin-1'
        }
      );
      expect(result).toEqual(mockBulkResult);
    });

    it('should validate field updates are provided', async () => {
      await expect(bulkOperationsService.bulkUpdateCustomFields(
        mockClubId,
        ['member-1'],
        {},
        'admin-1'
      )).rejects.toThrow('At least one field update is required');
    });
  });

  describe('bulkAssignTags', () => {
    it('should create and execute bulk tag assignment', async () => {
      const tagIds = ['tag-1', 'tag-2'];
      const memberIds = ['member-1', 'member-2'];

      mockApiClient.post.mockResolvedValue({ data: mockBulkResult });

      const result = await bulkOperationsService.bulkAssignTags(
        mockClubId,
        memberIds,
        tagIds,
        'admin-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/assign-tags`,
        {
          memberIds,
          tagIds,
          createdBy: 'admin-1'
        }
      );
      expect(result).toEqual(mockBulkResult);
    });
  });

  describe('bulkRemoveTags', () => {
    it('should create and execute bulk tag removal', async () => {
      const tagIds = ['tag-1', 'tag-2'];
      const memberIds = ['member-1', 'member-2'];

      mockApiClient.post.mockResolvedValue({ data: mockBulkResult });

      const result = await bulkOperationsService.bulkRemoveTags(
        mockClubId,
        memberIds,
        tagIds,
        'admin-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/remove-tags`,
        {
          memberIds,
          tagIds,
          createdBy: 'admin-1'
        }
      );
      expect(result).toEqual(mockBulkResult);
    });
  });

  describe('bulkUpdateMemberStatus', () => {
    it('should create and execute bulk member status update', async () => {
      const memberIds = ['member-1', 'member-2'];
      const newStatus = 'Active';
      const reason = 'Payment received';

      mockApiClient.post.mockResolvedValue({ data: mockBulkResult });

      const result = await bulkOperationsService.bulkUpdateMemberStatus(
        mockClubId,
        memberIds,
        newStatus,
        reason,
        'admin-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/member-status`,
        {
          memberIds,
          newStatus,
          reason,
          createdBy: 'admin-1'
        }
      );
      expect(result).toEqual(mockBulkResult);
    });

    it('should validate status is provided', async () => {
      await expect(bulkOperationsService.bulkUpdateMemberStatus(
        mockClubId,
        ['member-1'],
        '',
        'reason',
        'admin-1'
      )).rejects.toThrow('Member status is required');
    });
  });

  describe('bulkExportMembers', () => {
    it('should create bulk member export operation', async () => {
      const exportOptions = {
        format: 'csv' as const,
        includeCustomFields: true,
        includeTags: true,
        dateRange: {
          from: '2024-01-01',
          to: '2024-12-31'
        }
      };

      mockApiClient.post.mockResolvedValue({ 
        data: { 
          operationId: 'export-op-1',
          downloadUrl: 'https://example.com/export.csv',
          expiresAt: new Date('2024-01-02')
        } 
      });

      const result = await bulkOperationsService.bulkExportMembers(
        mockClubId,
        ['member-1', 'member-2'],
        exportOptions,
        'admin-1'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/export-members`,
        {
          memberIds: ['member-1', 'member-2'],
          exportOptions,
          createdBy: 'admin-1'
        }
      );
      expect(result.downloadUrl).toBeDefined();
    });
  });

  describe('validateBulkOperationData', () => {
    it('should validate custom field update data', () => {
      const validData = {
        fieldUpdates: {
          'customField.emergencyContact': 'New Contact'
        }
      };

      expect(() => bulkOperationsService.validateBulkOperationData(
        BulkOperationType.UPDATE_CUSTOM_FIELDS,
        validData
      )).not.toThrow();
    });

    it('should validate tag assignment data', () => {
      const validData = {
        tagIds: ['tag-1', 'tag-2']
      };

      expect(() => bulkOperationsService.validateBulkOperationData(
        BulkOperationType.ASSIGN_TAGS,
        validData
      )).not.toThrow();

      const invalidData = {
        tagIds: []
      };

      expect(() => bulkOperationsService.validateBulkOperationData(
        BulkOperationType.ASSIGN_TAGS,
        invalidData
      )).toThrow('At least one tag ID is required');
    });

    it('should validate member status update data', () => {
      const validData = {
        newStatus: 'Active',
        reason: 'Payment received'
      };

      expect(() => bulkOperationsService.validateBulkOperationData(
        BulkOperationType.UPDATE_MEMBER_STATUS,
        validData
      )).not.toThrow();

      const invalidData = {
        newStatus: '',
        reason: 'Payment received'
      };

      expect(() => bulkOperationsService.validateBulkOperationData(
        BulkOperationType.UPDATE_MEMBER_STATUS,
        invalidData
      )).toThrow('New status is required');
    });
  });

  describe('getBulkOperationStats', () => {
    it('should return bulk operation statistics', async () => {
      const mockStats = {
        totalOperations: 50,
        operationsByType: {
          [BulkOperationType.UPDATE_CUSTOM_FIELDS]: 20,
          [BulkOperationType.ASSIGN_TAGS]: 15,
          [BulkOperationType.UPDATE_MEMBER_STATUS]: 10,
          [BulkOperationType.EXPORT_MEMBERS]: 5
        },
        operationsByStatus: {
          [BulkOperationStatus.COMPLETED]: 45,
          [BulkOperationStatus.RUNNING]: 2,
          [BulkOperationStatus.FAILED]: 2,
          [BulkOperationStatus.CANCELLED]: 1
        },
        averageExecutionTime: 12500,
        totalRecordsProcessed: 25000
      };

      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await bulkOperationsService.getBulkOperationStats(mockClubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/clubs/${mockClubId}/bulk-operations/stats`
      );
      expect(result).toEqual(mockStats);
    });
  });
});