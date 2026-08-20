import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';
import { billingService } from './billingService';
import { logger } from '@/lib/logger';
import type { CacheEntry, CacheStatistics } from '@/types/factories';

/**
 * Bulk Operations Service for Mass Member Management (Expand tier feature)
 *
 * This service is a faithful client for the backend BulkOperationsController,
 * mounted at `api/v1/clubs/{clubId}/bulk-operations`. The apiClient axios
 * instance already carries the `/api/v1` baseURL, so every route below is
 * expressed relative to that prefix (i.e. `/clubs/{clubId}/bulk-operations/...`).
 *
 * Backend endpoints mirrored here:
 *  - POST  assign-tags            -> BulkTagOperationResult
 *  - POST  remove-tags            -> BulkTagOperationResult
 *  - POST  update-custom-fields   -> BulkCustomFieldResult
 *  - POST  update-member-statuses -> BulkMemberUpdateResult
 *  - POST  export                 -> BulkExportResult
 *  - POST  import                 -> BulkImportResult
 *  - GET   status/{operationId}   -> BulkOperationStatus (numeric enum)
 *  - POST  cancel/{operationId}   -> { message }
 *
 * NOTE on enums: the API does not register a JsonStringEnumConverter, so
 * System.Text.Json (de)serializes enums by their integer ordinal. The numeric
 * enums below match the backend ordinals exactly and MUST be sent as numbers.
 *
 * `clubId` and `requestedByUserId` are derived server-side from the route and
 * the authenticated token; clients never send them in the request body.
 */

// ---------------------------------------------------------------------------
// Enums (numeric ordinals matching the backend C# enums)
// ---------------------------------------------------------------------------

/** Matches GatherGrove.Domain.Enums.ExportFormat */
export enum BulkExportFormat {
  CSV = 0,
  Excel = 1,
  PDF = 2,
  JSON = 3,
}

/** Matches GatherGrove.Application.DTOs.ImportFileType */
export enum ImportFileType {
  CSV = 0,
  Excel = 1,
  JSON = 2,
}

/** Matches GatherGrove.Application.DTOs.TagRemovalMode */
export enum TagRemovalMode {
  All = 0,
  First = 1,
  Conditional = 2,
}

/** Matches GatherGrove.Application.DTOs.CustomFieldUpdateMode */
export enum CustomFieldUpdateMode {
  Individual = 0,
  SingleValue = 1,
  Clear = 2,
}

/** Matches GatherGrove.Application.DTOs.ImportMode */
export enum ImportMode {
  Insert = 0,
  Update = 1,
  Upsert = 2,
}

/** Matches GatherGrove.Application.DTOs.MemberMatchCriteria */
export enum MemberMatchCriteria {
  Email = 0,
  MemberId = 1,
  FullName = 2,
  Phone = 3,
  CustomField = 4,
}

/** Matches GatherGrove.Application.DTOs.BulkOperationStatus */
export enum BulkOperationStatus {
  Queued = 0,
  InProgress = 1,
  Completed = 2,
  CompletedWithErrors = 3,
  Failed = 4,
  Cancelled = 5,
  PartiallyCompleted = 6,
}

// ---------------------------------------------------------------------------
// Request payloads (client-supplied fields only)
// ---------------------------------------------------------------------------

export interface BulkAssignTagsRequest {
  memberIds: number[];
  tagIds: number[];
  skipExisting?: boolean;
  notifyMembers?: boolean;
  reason?: string;
  executeImmediately?: boolean;
  scheduledFor?: string | null;
}

export interface BulkRemoveTagsRequest {
  memberIds: number[];
  tagIds: number[];
  removalMode?: TagRemovalMode;
  skipMissing?: boolean;
  notifyMembers?: boolean;
  reason?: string;
  executeImmediately?: boolean;
  scheduledFor?: string | null;
}

export interface MemberCustomFieldUpdate {
  memberId: number;
  newValue: string;
  notes?: string;
  forceUpdate?: boolean;
}

export interface BulkUpdateCustomFieldsRequest {
  customFieldId: number;
  updates: MemberCustomFieldUpdate[];
  updateMode?: CustomFieldUpdateMode;
  singleValue?: string;
  skipValidationErrors?: boolean;
  notifyMembers?: boolean;
  reason?: string;
  createBackup?: boolean;
  executeImmediately?: boolean;
  scheduledFor?: string | null;
}

export interface BulkUpdateMemberStatusRequest {
  memberIds: number[];
  /** One of: Active, Inactive, Suspended, Archived */
  newStatus: string;
  reason?: string;
  notifyMembers?: boolean;
  skipSameStatus?: boolean;
  enforceBusinessRules?: boolean;
  effectiveDate?: string | null;
  createAuditTrail?: boolean;
  metadata?: Record<string, string>;
  executeImmediately?: boolean;
  scheduledFor?: string | null;
}

export interface BulkExportRequest {
  exportFormat: BulkExportFormat;
  /** Explicit member IDs to export (mutually exclusive with filterCriteria). */
  memberIds?: number[];
  /** At least one field name is required by the backend. */
  includeFields: string[];
  includeCustomFields?: boolean;
  customFieldIds?: number[];
  includeTags?: boolean;
  includeEngagementData?: boolean;
  includeEventData?: boolean;
  includePaymentHistory?: boolean;
  maxRecords?: number;
  fileName?: string;
  compressFile?: boolean;
  emailResults?: boolean;
  additionalEmailAddresses?: string[];
}

export interface BulkImportRequest {
  /** Base64 encoded file content. */
  fileContent: string;
  fileName: string;
  fileType: ImportFileType;
  /** Maps source file columns to member properties. */
  columnMapping: Record<string, string>;
  importMode?: ImportMode;
  matchCriteria?: MemberMatchCriteria;
  validateBeforeImport?: boolean;
  skipInvalidRows?: boolean;
  skipDuplicates?: boolean;
  notifyMembers?: boolean;
  defaultMembershipTypeId?: number;
  defaultStatus?: string;
  autoAssignTagIds?: number[];
  maxRows?: number;
  startRow?: number;
  hasHeaderRow?: boolean;
  batchSize?: number;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Response payloads (lean projections of the backend result DTOs)
// ---------------------------------------------------------------------------

export interface BulkOperationError {
  errorCode?: string;
  errorMessage: string;
  memberId?: number;
  field?: string;
}

export interface BulkTagOperationResult {
  successCount: number;
  errorCount: number;
  totalCount: number;
  errors: BulkOperationError[];
  successfulAssignments?: unknown[];
}

export interface BulkCustomFieldResult {
  successCount: number;
  errorCount: number;
  totalCount: number;
  errors: BulkOperationError[];
}

export interface BulkMemberUpdateResult {
  operationId: string;
  clubId: number;
  status: BulkOperationStatus;
  totalTargeted: number;
  successfulUpdates: number;
  failedUpdates: number;
  skippedUpdates: number;
  successRate: number;
  successCount: number;
  errorCount: number;
  startedAt: string;
  completedAt: string | null;
}

export interface BulkExportFileInfo {
  fileName: string;
  fileSizeBytes: number;
  fileFormat: string;
  downloadUrl?: string | null;
}

export interface BulkExportResult {
  exportId: string;
  clubId: number;
  status: number;
  totalRecordsExported: number;
  totalRecordsRequested: number;
  recordCount: number;
  fileInfo: BulkExportFileInfo;
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
}

export interface BulkImportResult {
  importId: string;
  clubId: number;
  status: BulkOperationStatus;
  totalRecordsInFile: number;
  successfulImports: number;
  failedImports: number;
  skippedRecords: number;
  duplicatesFound: number;
  successRate: number;
  successCount: number;
  errorCount: number;
  requestedAt: string;
  completedAt: string | null;
}

export interface CancelOperationResponse {
  message: string;
}

const BULK_BASE = (clubId: number) => `/clubs/${clubId}/bulk-operations`;

export class BulkOperationsService {
  private cache = new Map<string, CacheEntry>();
  private requestQueue = new Map<string, Promise<unknown>>();

  /**
   * Verify the club has Expand tier access for bulk operations.
   * Throws when the tier is insufficient. If the billing service itself is
   * unavailable we proceed (the backend re-checks the tier and is the
   * authoritative gate); this avoids blocking on a transient billing outage.
   */
  private async verifyUnlimitedAccess(): Promise<void> {
    try {
      const billingStatus = await billingService.getBillingStatus();
      if (billingStatus.currentTier !== 'Unlimited' && billingStatus.currentTier !== 'Expand') {
        throw new Error('Bulk operations are only available for Expand tier subscribers');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Bulk operations are only available')) {
        throw error;
      }
      logger.error('Billing service unavailable, proceeding with bulk operation');
    }
  }

  /**
   * Bulk assign tags to multiple members.
   */
  async bulkAssignTags(clubId: number, request: BulkAssignTagsRequest): Promise<BulkTagOperationResult> {
    await this.verifyUnlimitedAccess();
    this.assertMemberIds(request.memberIds);

    try {
      const response = await apiClient.post<BulkTagOperationResult>(
        `${BULK_BASE(clubId)}/assign-tags`,
        request
      );
      this.invalidateBulkOperationCaches(clubId);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'assigning tags in bulk',
        action: 'Please check the request parameters and try again',
        customMessages: {
          400: 'Invalid bulk tag assignment request',
          403: 'You do not have permission to perform bulk operations',
        },
      });
    }
  }

  /**
   * Bulk remove tags from multiple members.
   */
  async bulkRemoveTags(clubId: number, request: BulkRemoveTagsRequest): Promise<BulkTagOperationResult> {
    await this.verifyUnlimitedAccess();
    this.assertMemberIds(request.memberIds);

    try {
      const response = await apiClient.post<BulkTagOperationResult>(
        `${BULK_BASE(clubId)}/remove-tags`,
        request
      );
      this.invalidateBulkOperationCaches(clubId);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'removing tags in bulk',
        action: 'Please check the request parameters and try again',
        customMessages: {
          400: 'Invalid bulk tag removal request',
          403: 'You do not have permission to perform bulk operations',
        },
      });
    }
  }

  /**
   * Bulk update a custom field value across multiple members.
   */
  async bulkUpdateCustomFields(
    clubId: number,
    request: BulkUpdateCustomFieldsRequest
  ): Promise<BulkCustomFieldResult> {
    await this.verifyUnlimitedAccess();

    if (!request.updates || request.updates.length === 0) {
      throw new Error('At least one member update is required for bulk custom field operations');
    }

    try {
      const response = await apiClient.post<BulkCustomFieldResult>(
        `${BULK_BASE(clubId)}/update-custom-fields`,
        request
      );
      this.invalidateBulkOperationCaches(clubId);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating custom fields in bulk',
        action: 'Please check the request parameters and try again',
        customMessages: {
          400: 'Invalid bulk custom field update request',
          403: 'You do not have permission to perform bulk operations',
        },
      });
    }
  }

  /**
   * Bulk update member statuses.
   */
  async bulkUpdateMemberStatuses(
    clubId: number,
    request: BulkUpdateMemberStatusRequest
  ): Promise<BulkMemberUpdateResult> {
    await this.verifyUnlimitedAccess();
    this.assertMemberIds(request.memberIds);

    try {
      const response = await apiClient.post<BulkMemberUpdateResult>(
        `${BULK_BASE(clubId)}/update-member-statuses`,
        request
      );
      this.invalidateBulkOperationCaches(clubId);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'updating member statuses in bulk',
        action: 'Please check the request parameters and try again',
        customMessages: {
          400: 'Invalid bulk member status update request',
          403: 'You do not have permission to perform bulk operations',
        },
      });
    }
  }

  /**
   * Bulk export member data. Returns the export result, including file info
   * with a download URL once the export completes.
   */
  async bulkExportMembers(clubId: number, request: BulkExportRequest): Promise<BulkExportResult> {
    await this.verifyUnlimitedAccess();

    if (!request.includeFields || request.includeFields.length === 0) {
      throw new Error('At least one field must be selected for export');
    }

    try {
      const response = await apiClient.post<BulkExportResult>(
        `${BULK_BASE(clubId)}/export`,
        request
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'exporting members in bulk',
        action: 'Please check the export parameters and try again',
        customMessages: {
          400: 'Invalid export parameters',
          403: 'You do not have permission to perform bulk operations',
          413: 'Export request too large - please reduce the number of members',
        },
      });
    }
  }

  /**
   * Bulk import members from an uploaded file (base64 encoded content).
   */
  async bulkImportMembers(clubId: number, request: BulkImportRequest): Promise<BulkImportResult> {
    await this.verifyUnlimitedAccess();

    if (!request.fileContent) {
      throw new Error('File content is required for bulk import');
    }

    try {
      const response = await apiClient.post<BulkImportResult>(
        `${BULK_BASE(clubId)}/import`,
        request
      );
      this.invalidateBulkOperationCaches(clubId);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'importing members in bulk',
        action: 'Please check the import file and try again',
        customMessages: {
          400: 'Invalid import request',
          403: 'You do not have permission to perform bulk operations',
          413: 'Import file too large',
        },
      });
    }
  }

  /**
   * Get the status of a bulk operation. The backend returns a numeric
   * BulkOperationStatus enum value.
   */
  async getOperationStatus(clubId: number, operationId: string): Promise<BulkOperationStatus> {
    await this.verifyUnlimitedAccess();

    const cacheKey = this.generateCacheKey('operation-status', { clubId, operationId });
    const cachedResult = this.getFromCache<BulkOperationStatus>(cacheKey, 30 * 1000);
    if (cachedResult !== null) {
      return cachedResult;
    }

    try {
      const response = await apiClient.get<BulkOperationStatus>(
        `${BULK_BASE(clubId)}/status/${operationId}`
      );

      const result = response.data;
      const isTerminal =
        result === BulkOperationStatus.Completed ||
        result === BulkOperationStatus.CompletedWithErrors ||
        result === BulkOperationStatus.Failed ||
        result === BulkOperationStatus.Cancelled;
      const ttl = isTerminal ? 5 * 60 * 1000 : 30 * 1000;
      this.setCache(cacheKey, result, ttl);

      return result;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'checking bulk operation status',
        action: 'Please try refreshing or check the operation ID',
        customMessages: {
          404: 'Bulk operation not found or has expired',
          403: 'You do not have permission to view this operation',
        },
      });
    }
  }

  /**
   * Cancel a running bulk operation.
   */
  async cancelOperation(clubId: number, operationId: string): Promise<CancelOperationResponse> {
    await this.verifyUnlimitedAccess();

    try {
      const response = await apiClient.post<CancelOperationResponse>(
        `${BULK_BASE(clubId)}/cancel/${operationId}`
      );

      const cacheKey = this.generateCacheKey('operation-status', { clubId, operationId });
      this.cache.delete(cacheKey);

      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'cancelling bulk operation',
        action: 'Please check if the operation is still running and try again',
        customMessages: {
          400: 'Operation cannot be cancelled at this stage',
          404: 'Bulk operation not found',
        },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Validation helpers
  // -------------------------------------------------------------------------

  private assertMemberIds(memberIds: number[]): void {
    if (!memberIds || memberIds.length === 0) {
      throw new Error('At least one member ID is required for bulk operations');
    }
    if (memberIds.length > 2000) {
      throw new Error('Cannot process more than 2,000 members in a single bulk operation');
    }
  }

  // -------------------------------------------------------------------------
  // Cache management
  // -------------------------------------------------------------------------

  private generateCacheKey(operation: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, unknown>);

    return `bulk-operations:${operation}:${JSON.stringify(sortedParams)}`;
  }

  private getFromCache<T = unknown>(key: string, customTtl?: number): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const ttl = customTtl || item.ttl;
    if (Date.now() - item.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private setCache<T = unknown>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private invalidateBulkOperationCaches(clubId: number): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(`"clubId":${clubId}`) || key.includes('bulk-operations:')) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all caches.
   */
  clearCache(): void {
    this.cache.clear();
    this.requestQueue.clear();
  }

  /**
   * Get cache statistics.
   */
  getCacheStats(): CacheStatistics {
    const now = Date.now();
    let totalAge = 0;

    for (const item of this.cache.values()) {
      totalAge += now - item.timestamp;
    }

    return {
      size: this.cache.size,
      hitRatio: 0,
      avgAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
    };
  }
}

// Export singleton instance
const bulkOperationsService = new BulkOperationsService();
export default bulkOperationsService;
