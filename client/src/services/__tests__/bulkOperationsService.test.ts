/**
 * Test Suite: bulkOperationsService
 *
 * Verifies the client faithfully mirrors the backend BulkOperationsController
 * (mounted at `api/v1/clubs/{clubId}/bulk-operations`). Because the apiClient
 * axios instance already carries the `/api/v1` baseURL, every route asserted
 * here is relative to that prefix (i.e. `/clubs/{clubId}/bulk-operations/...`).
 *
 * Boundary mocking only: apiClient (HTTP), billingService (tier gate, itself an
 * API-backed boundary), and ErrorHandler (whose real implementation fans out to
 * Sentry + the error-logging service). The ErrorHandler mock reproduces the real
 * `Error <context>: <message> <action>` formatting so assertions remain faithful.
 */

import bulkOperationsService, {
  BulkOperationsService,
  BulkExportFormat,
  ImportFileType,
  TagRemovalMode,
  CustomFieldUpdateMode,
  ImportMode,
  MemberMatchCriteria,
  BulkOperationStatus,
  type BulkAssignTagsRequest,
  type BulkRemoveTagsRequest,
  type BulkUpdateCustomFieldsRequest,
  type BulkUpdateMemberStatusRequest,
  type BulkExportRequest,
  type BulkImportRequest,
} from '../bulkOperationsService';
import apiClient from '../apiClient';
import { billingService } from '../billingService';
import { ErrorHandler } from '@/lib/errorHandler';

// --- Mock 1: HTTP boundary -------------------------------------------------
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// --- Mock 2: tier gate (API-backed boundary) -------------------------------
jest.mock('../billingService', () => ({
  billingService: {
    getBillingStatus: jest.fn(),
  },
}));
const mockBillingService = billingService as jest.Mocked<typeof billingService>;

// --- Mock 3: ErrorHandler (real impl fans out to Sentry + error logging) ---
// jest.config sets resetMocks:true, which wipes factory-level implementations
// before every test, so the implementation is (re)applied in beforeEach below.
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: { handleApiError: jest.fn() },
}));
const mockErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;

// Reproduce the real `Error <context>: <message> <action>` shaping so error
// assertions verify the actual contract rather than a placeholder string.
const errorHandlerImpl = (
  error: unknown,
  options?: { context?: string; action?: string; customMessages?: Record<number, string> }
) => {
  const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
  const status = err?.response?.status ?? 0;
  let message =
    (status && options?.customMessages?.[status]) ||
    err?.response?.data?.message ||
    err?.message ||
    'Unknown error';
  if (options?.context) {
    message = `Error ${options.context}: ${message}`;
  }
  if (options?.action) {
    message = `${message} ${options.action}`;
  }
  const built = new Error(message) as Error & { status: number };
  built.status = status;
  return built;
};

const CLUB_ID = 42;

const expand = () =>
  mockBillingService.getBillingStatus.mockResolvedValue({ currentTier: 'Expand' } as never);

const httpError = (status: number, message?: string) => ({
  response: { status, data: message ? { message } : undefined },
  message: message ?? `HTTP ${status}`,
});

beforeEach(() => {
  jest.clearAllMocks();
  // resetMocks:true wipes this between tests — reapply the faithful impl.
  mockErrorHandler.handleApiError.mockImplementation(errorHandlerImpl as never);
  bulkOperationsService.clearCache();
});

describe('verifyUnlimitedAccess (tier gate)', () => {
  it('blocks bulk operations when the club is not on the Expand tier', async () => {
    mockBillingService.getBillingStatus.mockResolvedValue({ currentTier: 'Grow' } as never);

    await expect(
      bulkOperationsService.bulkAssignTags(CLUB_ID, { memberIds: [1], tagIds: [2] })
    ).rejects.toThrow('Bulk operations are only available for Expand tier subscribers');

    expect(mockApiClient.post).not.toHaveBeenCalled();
  });

  it('accepts legacy Unlimited tier while billing data migrates', async () => {
    mockBillingService.getBillingStatus.mockResolvedValue({ currentTier: 'Unlimited' } as never);
    mockApiClient.post.mockResolvedValue({
      data: { successCount: 1, errorCount: 0, totalCount: 1, errors: [] },
    } as never);

    await bulkOperationsService.bulkAssignTags(CLUB_ID, { memberIds: [1], tagIds: [2] });

    expect(mockApiClient.post).toHaveBeenCalledTimes(1);
  });

  it('proceeds when the billing service is unavailable (backend is authoritative)', async () => {
    mockBillingService.getBillingStatus.mockRejectedValue(new Error('billing down'));
    mockApiClient.post.mockResolvedValue({
      data: { successCount: 1, errorCount: 0, totalCount: 1, errors: [] },
    } as never);

    const result = await bulkOperationsService.bulkAssignTags(CLUB_ID, { memberIds: [1], tagIds: [2] });

    expect(result.successCount).toBe(1);
    expect(mockApiClient.post).toHaveBeenCalledTimes(1);
  });
});

describe('bulkAssignTags', () => {
  it('POSTs to the assign-tags route with the request body', async () => {
    expand();
    const data = { successCount: 2, errorCount: 0, totalCount: 2, errors: [] };
    mockApiClient.post.mockResolvedValue({ data } as never);
    const request: BulkAssignTagsRequest = { memberIds: [1, 2], tagIds: [10], skipExisting: true };

    const result = await bulkOperationsService.bulkAssignTags(CLUB_ID, request);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/clubs/${CLUB_ID}/bulk-operations/assign-tags`,
      request
    );
    expect(result).toEqual(data);
  });

  it('rejects an empty member list before calling the API', async () => {
    expand();
    await expect(
      bulkOperationsService.bulkAssignTags(CLUB_ID, { memberIds: [], tagIds: [1] })
    ).rejects.toThrow('At least one member ID is required for bulk operations');
    expect(mockApiClient.post).not.toHaveBeenCalled();
  });

  it('rejects more than 2,000 members before calling the API', async () => {
    expand();
    const memberIds = Array.from({ length: 2001 }, (_, i) => i + 1);
    await expect(
      bulkOperationsService.bulkAssignTags(CLUB_ID, { memberIds, tagIds: [1] })
    ).rejects.toThrow('Cannot process more than 2,000 members in a single bulk operation');
    expect(mockApiClient.post).not.toHaveBeenCalled();
  });

  it('wraps API failures with the assigning-tags context', async () => {
    expand();
    mockApiClient.post.mockRejectedValue(httpError(403));
    await expect(
      bulkOperationsService.bulkAssignTags(CLUB_ID, { memberIds: [1], tagIds: [2] })
    ).rejects.toThrow(
      'Error assigning tags in bulk: You do not have permission to perform bulk operations'
    );
  });
});

describe('bulkRemoveTags', () => {
  it('POSTs to the remove-tags route with numeric removal mode', async () => {
    expand();
    const data = { successCount: 1, errorCount: 0, totalCount: 1, errors: [] };
    mockApiClient.post.mockResolvedValue({ data } as never);
    const request: BulkRemoveTagsRequest = {
      memberIds: [5],
      tagIds: [9],
      removalMode: TagRemovalMode.Conditional,
    };

    await bulkOperationsService.bulkRemoveTags(CLUB_ID, request);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/clubs/${CLUB_ID}/bulk-operations/remove-tags`,
      request
    );
    expect(request.removalMode).toBe(2);
  });

  it('wraps API failures with the removing-tags context', async () => {
    expand();
    mockApiClient.post.mockRejectedValue(httpError(400));
    await expect(
      bulkOperationsService.bulkRemoveTags(CLUB_ID, { memberIds: [1], tagIds: [2] })
    ).rejects.toThrow('Error removing tags in bulk: Invalid bulk tag removal request');
  });
});

describe('bulkUpdateCustomFields', () => {
  it('POSTs to the update-custom-fields route', async () => {
    expand();
    const data = { successCount: 1, errorCount: 0, totalCount: 1, errors: [] };
    mockApiClient.post.mockResolvedValue({ data } as never);
    const request: BulkUpdateCustomFieldsRequest = {
      customFieldId: 7,
      updates: [{ memberId: 1, newValue: 'gold' }],
      updateMode: CustomFieldUpdateMode.SingleValue,
      singleValue: 'gold',
    };

    await bulkOperationsService.bulkUpdateCustomFields(CLUB_ID, request);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/clubs/${CLUB_ID}/bulk-operations/update-custom-fields`,
      request
    );
    expect(request.updateMode).toBe(1);
  });

  it('rejects an empty updates array before calling the API', async () => {
    expand();
    await expect(
      bulkOperationsService.bulkUpdateCustomFields(CLUB_ID, { customFieldId: 1, updates: [] })
    ).rejects.toThrow('At least one member update is required for bulk custom field operations');
    expect(mockApiClient.post).not.toHaveBeenCalled();
  });

  it('wraps API failures with the custom-fields context', async () => {
    expand();
    mockApiClient.post.mockRejectedValue(httpError(400));
    await expect(
      bulkOperationsService.bulkUpdateCustomFields(CLUB_ID, {
        customFieldId: 1,
        updates: [{ memberId: 1, newValue: 'x' }],
      })
    ).rejects.toThrow('Error updating custom fields in bulk: Invalid bulk custom field update request');
  });
});

describe('bulkUpdateMemberStatuses', () => {
  it('POSTs to the update-member-statuses route', async () => {
    expand();
    const data = {
      operationId: 'op-1',
      clubId: CLUB_ID,
      status: BulkOperationStatus.Completed,
      totalTargeted: 1,
      successfulUpdates: 1,
      failedUpdates: 0,
      skippedUpdates: 0,
      successRate: 100,
      successCount: 1,
      errorCount: 0,
      startedAt: '2026-01-01T00:00:00Z',
      completedAt: '2026-01-01T00:00:01Z',
    };
    mockApiClient.post.mockResolvedValue({ data } as never);
    const request: BulkUpdateMemberStatusRequest = { memberIds: [1, 2], newStatus: 'Archived' };

    const result = await bulkOperationsService.bulkUpdateMemberStatuses(CLUB_ID, request);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/clubs/${CLUB_ID}/bulk-operations/update-member-statuses`,
      request
    );
    expect(result.operationId).toBe('op-1');
  });

  it('rejects an empty member list before calling the API', async () => {
    expand();
    await expect(
      bulkOperationsService.bulkUpdateMemberStatuses(CLUB_ID, { memberIds: [], newStatus: 'Active' })
    ).rejects.toThrow('At least one member ID is required for bulk operations');
    expect(mockApiClient.post).not.toHaveBeenCalled();
  });
});

describe('bulkExportMembers', () => {
  it('POSTs to the export route with a numeric export format', async () => {
    expand();
    const data = {
      exportId: 'exp-1',
      clubId: CLUB_ID,
      status: 2,
      totalRecordsExported: 3,
      totalRecordsRequested: 3,
      recordCount: 3,
      fileInfo: { fileName: 'members.csv', fileSizeBytes: 100, fileFormat: 'CSV' },
      requestedAt: '2026-01-01T00:00:00Z',
      completedAt: '2026-01-01T00:00:05Z',
      expiresAt: null,
    };
    mockApiClient.post.mockResolvedValue({ data } as never);
    const request: BulkExportRequest = {
      exportFormat: BulkExportFormat.CSV,
      includeFields: ['firstName', 'lastName', 'email'],
    };

    const result = await bulkOperationsService.bulkExportMembers(CLUB_ID, request);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/clubs/${CLUB_ID}/bulk-operations/export`,
      request
    );
    expect(request.exportFormat).toBe(0);
    expect(result.exportId).toBe('exp-1');
  });

  it('rejects an export with no fields selected before calling the API', async () => {
    expand();
    await expect(
      bulkOperationsService.bulkExportMembers(CLUB_ID, {
        exportFormat: BulkExportFormat.Excel,
        includeFields: [],
      })
    ).rejects.toThrow('At least one field must be selected for export');
    expect(mockApiClient.post).not.toHaveBeenCalled();
  });

  it('surfaces a too-large export with the 413 custom message', async () => {
    expand();
    mockApiClient.post.mockRejectedValue(httpError(413));
    await expect(
      bulkOperationsService.bulkExportMembers(CLUB_ID, {
        exportFormat: BulkExportFormat.PDF,
        includeFields: ['email'],
      })
    ).rejects.toThrow(
      'Error exporting members in bulk: Export request too large - please reduce the number of members'
    );
  });
});

describe('bulkImportMembers', () => {
  it('POSTs to the import route with numeric file type and import mode', async () => {
    expand();
    const data = {
      importId: 'imp-1',
      clubId: CLUB_ID,
      status: BulkOperationStatus.Completed,
      totalRecordsInFile: 2,
      successfulImports: 2,
      failedImports: 0,
      skippedRecords: 0,
      duplicatesFound: 0,
      successRate: 100,
      successCount: 2,
      errorCount: 0,
      requestedAt: '2026-01-01T00:00:00Z',
      completedAt: '2026-01-01T00:00:10Z',
    };
    mockApiClient.post.mockResolvedValue({ data } as never);
    const request: BulkImportRequest = {
      fileContent: 'base64data',
      fileName: 'import.csv',
      fileType: ImportFileType.CSV,
      columnMapping: { Email: 'email' },
      importMode: ImportMode.Upsert,
      matchCriteria: MemberMatchCriteria.Email,
    };

    const result = await bulkOperationsService.bulkImportMembers(CLUB_ID, request);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/clubs/${CLUB_ID}/bulk-operations/import`,
      request
    );
    expect(request.fileType).toBe(0);
    expect(request.importMode).toBe(2);
    expect(request.matchCriteria).toBe(0);
    expect(result.importId).toBe('imp-1');
  });

  it('rejects an import with no file content before calling the API', async () => {
    expand();
    await expect(
      bulkOperationsService.bulkImportMembers(CLUB_ID, {
        fileContent: '',
        fileName: 'x.csv',
        fileType: ImportFileType.CSV,
        columnMapping: {},
      })
    ).rejects.toThrow('File content is required for bulk import');
    expect(mockApiClient.post).not.toHaveBeenCalled();
  });
});

describe('getOperationStatus', () => {
  it('GETs the status route and returns the numeric enum value', async () => {
    expand();
    mockApiClient.get.mockResolvedValue({ data: BulkOperationStatus.InProgress } as never);

    const status = await bulkOperationsService.getOperationStatus(CLUB_ID, 'op-9');

    expect(mockApiClient.get).toHaveBeenCalledWith(
      `/clubs/${CLUB_ID}/bulk-operations/status/op-9`
    );
    expect(status).toBe(BulkOperationStatus.InProgress);
  });

  it('caches terminal statuses so repeat calls do not re-hit the API', async () => {
    expand();
    mockApiClient.get.mockResolvedValue({ data: BulkOperationStatus.Completed } as never);

    const first = await bulkOperationsService.getOperationStatus(CLUB_ID, 'op-term');
    const second = await bulkOperationsService.getOperationStatus(CLUB_ID, 'op-term');

    expect(first).toBe(BulkOperationStatus.Completed);
    expect(second).toBe(BulkOperationStatus.Completed);
    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
  });

  it('maps a 404 to the not-found custom message', async () => {
    expand();
    mockApiClient.get.mockRejectedValue(httpError(404));
    await expect(
      bulkOperationsService.getOperationStatus(CLUB_ID, 'missing')
    ).rejects.toThrow('Error checking bulk operation status: Bulk operation not found or has expired');
  });
});

describe('cancelOperation', () => {
  it('POSTs the cancel route and clears the cached status', async () => {
    expand();
    // Prime the status cache (non-terminal so it would otherwise persist).
    mockApiClient.get.mockResolvedValue({ data: BulkOperationStatus.InProgress } as never);
    await bulkOperationsService.getOperationStatus(CLUB_ID, 'op-c');

    mockApiClient.post.mockResolvedValue({ data: { message: 'Cancellation requested' } } as never);
    const result = await bulkOperationsService.cancelOperation(CLUB_ID, 'op-c');

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/clubs/${CLUB_ID}/bulk-operations/cancel/op-c`
    );
    expect(result.message).toBe('Cancellation requested');

    // The cached status entry must have been evicted, forcing a fresh GET.
    mockApiClient.get.mockResolvedValue({ data: BulkOperationStatus.Cancelled } as never);
    await bulkOperationsService.getOperationStatus(CLUB_ID, 'op-c');
    expect(mockApiClient.get).toHaveBeenCalledTimes(2);
  });

  it('maps a 400 to the cannot-cancel custom message', async () => {
    expand();
    mockApiClient.post.mockRejectedValue(httpError(400));
    await expect(
      bulkOperationsService.cancelOperation(CLUB_ID, 'op-x')
    ).rejects.toThrow('Error cancelling bulk operation: Operation cannot be cancelled at this stage');
  });
});

describe('cache management', () => {
  it('reports cache statistics and clears state', () => {
    const service = new BulkOperationsService();
    expect(service.getCacheStats().size).toBe(0);
    service.clearCache();
    expect(service.getCacheStats()).toEqual({ size: 0, hitRatio: 0, avgAge: 0 });
  });

  it('invalidates cached statuses after a mutating operation', async () => {
    expand();
    // Cache a status.
    mockApiClient.get.mockResolvedValue({ data: BulkOperationStatus.InProgress } as never);
    await bulkOperationsService.getOperationStatus(CLUB_ID, 'op-inv');
    expect(mockApiClient.get).toHaveBeenCalledTimes(1);

    // A mutating op invalidates bulk-operations caches.
    mockApiClient.post.mockResolvedValue({
      data: { successCount: 1, errorCount: 0, totalCount: 1, errors: [] },
    } as never);
    await bulkOperationsService.bulkAssignTags(CLUB_ID, { memberIds: [1], tagIds: [2] });

    // The next status read must re-hit the API.
    await bulkOperationsService.getOperationStatus(CLUB_ID, 'op-inv');
    expect(mockApiClient.get).toHaveBeenCalledTimes(2);
  });
});

describe('enum ordinals match the backend', () => {
  it('encodes export formats as integers', () => {
    expect(BulkExportFormat.CSV).toBe(0);
    expect(BulkExportFormat.Excel).toBe(1);
    expect(BulkExportFormat.PDF).toBe(2);
    expect(BulkExportFormat.JSON).toBe(3);
  });

  it('encodes operation statuses as integers', () => {
    expect(BulkOperationStatus.Queued).toBe(0);
    expect(BulkOperationStatus.InProgress).toBe(1);
    expect(BulkOperationStatus.Completed).toBe(2);
    expect(BulkOperationStatus.CompletedWithErrors).toBe(3);
    expect(BulkOperationStatus.Failed).toBe(4);
    expect(BulkOperationStatus.Cancelled).toBe(5);
    expect(BulkOperationStatus.PartiallyCompleted).toBe(6);
  });
});
