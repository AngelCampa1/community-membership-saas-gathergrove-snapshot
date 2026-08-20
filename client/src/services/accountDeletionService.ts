import { apiClient } from '@/lib/axios';
import { ErrorHandler } from '@/lib/errorHandler';

/**
 * Impact summary returned by the backend validate endpoint.
 * Mirrors DeletionImpactSummary on the server (camelCased over the wire).
 */
export interface DeletionImpactSummary {
  clubsToDelete: number;
  clubsToTransfer: number;
  memberRecordsToAnonymize: number;
  eventsAffected: number;
  paymentRecordsAffected: number;
  dataExportSize: number;
}

/** A club that will be deleted because the user is its only admin. */
export interface ClubDeletionInfo {
  clubId: number;
  clubName: string;
  memberCount: number;
  eventCount: number;
  outstandingBalance?: number;
  hasActiveSubscription: boolean;
}

/** A club whose ownership must be transferred before the user can be deleted. */
export interface ClubTransferInfo {
  clubId: number;
  clubName: string;
  currentAdminCount: number;
  requiresNewAdmin: boolean;
}

/** An eligible administrator a club can be transferred to. */
export interface AdminTransferTarget {
  userId: number;
  fullName: string;
  email: string;
  clubIds: number[];
  role: string;
}

/** Admin-specific deletion details, present when the account administers clubs. */
export interface AdminDeletionInfo {
  primaryClubsCount: number;
  secondaryClubsCount: number;
  clubsToBeDeleted: ClubDeletionInfo[];
  clubsToTransfer: ClubTransferInfo[];
  availableTransferTargets: AdminTransferTarget[];
  hasActiveBilling: boolean;
  extendedGracePeriodDays: number;
}

/**
 * Result of GET /account-deletion/validate.
 * Matches the backend AccountDeletionValidationResponse DTO.
 */
export interface AccountDeletionValidationResponse {
  canDelete: boolean;
  validationErrors: string[];
  requiredActions: string[];
  /** TimeSpan serialized as a string, e.g. "30.00:00:00". */
  estimatedDeletionTime: string;
  impactSummary: DeletionImpactSummary;
  isAdminAccount: boolean;
  adminInfo: AdminDeletionInfo;
}

/**
 * Body for POST /account-deletion/request.
 * Mirrors the backend AccountDeletionRequest DTO (camelCased over the wire).
 */
export interface AccountDeletionRequest {
  reason: string;
  confirmationPhrase: string; // must be "DELETE MY ACCOUNT"
  requestDataExport?: boolean;
  transferClubOwnershipToUserId?: number;
  memberDataHandling?: 'Anonymize' | 'Remove' | 'Retain';
  clubTransferInstructions?: Array<{
    clubId: number;
    transferToUserId?: number | null;
    deleteClub: boolean;
    notes?: string;
  }>;
  deleteOrphanedClubs?: boolean;
  passwordConfirmation?: string;
}

/**
 * Result of POST /account-deletion/request.
 * Matches the backend AccountDeletionResponse DTO.
 */
export interface AccountDeletionResponse {
  deletionRequestId: string;
  status: string;
  requiresManualReview: boolean;
  estimatedCompletionDate: string;
  dataExportId?: string | null;
  dataExportFilePath?: string | null;
  requiredActions: string[];
  warnings: string[];
}

/**
 * Result of GET /account-deletion/{id}/status.
 * Matches the backend AccountDeletionStatusResponse DTO.
 */
export interface AccountDeletionStatusResponse {
  deletionRequestId: string;
  status: string;
  progress: number;
  estimatedCompletionDate?: string | null;
  completedSteps: string[];
  remainingSteps: string[];
  errorMessages: string[];
}

/** Body for POST /account-deletion/admin/transfer-ownership. */
export interface ClubOwnershipTransferRequest {
  fromUserId: number;
  toUserId: number;
  clubId: number;
}

/** Result of POST /account-deletion/admin/transfer-ownership. */
export interface ClubOwnershipTransferResponse {
  message: string;
  transferId: string;
  requiresConfirmation: boolean;
}

class AccountDeletionService {
  /**
   * Validate whether the current user's account can be deleted.
   */
  async validateAccountDeletion(): Promise<AccountDeletionValidationResponse> {
    try {
      const response = await apiClient.get<AccountDeletionValidationResponse>(
        '/account-deletion/validate'
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'validateAccountDeletion' });
    }
  }

  /**
   * Initiate the account deletion process. Creates a deletion request with a
   * grace period and produces a data export as part of the request.
   */
  async initiateAccountDeletion(request: AccountDeletionRequest): Promise<AccountDeletionResponse> {
    try {
      const response = await apiClient.post<AccountDeletionResponse>(
        '/account-deletion/request',
        request
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'initiateAccountDeletion' });
    }
  }

  /**
   * Get the status of an in-progress account deletion request.
   */
  async getAccountDeletionStatus(deletionRequestId: string): Promise<AccountDeletionStatusResponse> {
    try {
      const response = await apiClient.get<AccountDeletionStatusResponse>(
        `/account-deletion/${deletionRequestId}/status`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'getAccountDeletionStatus' });
    }
  }

  /**
   * Cancel a pending account deletion request during its grace period.
   */
  async cancelAccountDeletion(deletionRequestId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        `/account-deletion/${deletionRequestId}/cancel`
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'cancelAccountDeletion' });
    }
  }

  /**
   * Get the list of administrators a club can be transferred to.
   */
  async getAdminTransferTargets(): Promise<AdminTransferTarget[]> {
    try {
      const response = await apiClient.get<AdminTransferTarget[]>(
        '/account-deletion/admin/transfer-targets'
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'getAdminTransferTargets' });
    }
  }

  /**
   * Transfer ownership of a club to another administrator.
   */
  async transferClubOwnership(
    fromUserId: number,
    request: ClubOwnershipTransferRequest
  ): Promise<ClubOwnershipTransferResponse> {
    try {
      const response = await apiClient.post<ClubOwnershipTransferResponse>(
        '/account-deletion/admin/transfer-ownership',
        request
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'transferClubOwnership' });
    }
  }

  /**
   * Download a previously generated data export as a binary blob.
   * The request goes through apiClient so the JWT auth header is attached.
   */
  async downloadDataExport(exportId: string): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(
        `/account-deletion/exports/${exportId}/download`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, { context: 'downloadDataExport' });
    }
  }
}

export const accountDeletionService = new AccountDeletionService();
