import { apiClient } from './apiClient';

export interface AccountDeletionValidationResponse {
  canDelete: boolean;
  restrictions: string[];
  pendingObligations: string[];
  dataRetentionDays: number;
  alternativeOptions: string[];
}

export interface AccountDeletionRequest {
  reason: string;
  confirmDataExport: boolean;
  confirmUnderstanding: boolean;
  password?: string;
}

export interface DataExportRequest {
  format: 'json' | 'csv' | 'pdf';
  includeMedia: boolean;
}

export interface AccountDeletionStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  requestedAt: string;
  scheduledFor: string;
  exportUrl?: string;
  gracePeriodEnds: string;
}

class AccountDeletionService {
  /**
   * Validate if user's account can be deleted
   */
  async validateAccountDeletion(): Promise<AccountDeletionValidationResponse> {
    const response = await apiClient.get<AccountDeletionValidationResponse>('/api/v1/account-deletion/validate');
    return response;
  }

  /**
   * Request account data export
   */
  async requestDataExport(request: DataExportRequest): Promise<{ exportId: string; downloadUrl: string }> {
    const response = await apiClient.post<{ exportId: string; downloadUrl: string }>('/api/v1/account-deletion/export-data', request);
    return response;
  }

  /**
   * Initiate account deletion process
   */
  async initiateAccountDeletion(request: AccountDeletionRequest): Promise<{
    deletionId: string;
    scheduledFor: string;
    gracePeriodEnds: string;
  }> {
    const response = await apiClient.post<{
      deletionId: string;
      scheduledFor: string;
      gracePeriodEnds: string;
    }>('/api/v1/account-deletion/request', request);
    return response;
  }

  /**
   * Get current account deletion status
   */
  async getAccountDeletionStatus(): Promise<AccountDeletionStatusResponse> {
    const response = await apiClient.get<AccountDeletionStatusResponse>('/api/v1/account-deletion/status');
    return response;
  }

  /**
   * Cancel pending account deletion
   */
  async cancelAccountDeletion(): Promise<void> {
    await apiClient.post('/api/v1/account-deletion/cancel');
  }

  /**
   * Confirm account deletion (final confirmation)
   */
  async confirmAccountDeletion(deletionId: string): Promise<void> {
    await apiClient.post(`/api/v1/account-deletion/confirm/${deletionId}`);
  }
}

export const accountDeletionService = new AccountDeletionService();