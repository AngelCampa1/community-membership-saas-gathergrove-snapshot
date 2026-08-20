import apiClient from './apiClient';

export interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateEmails: number;
  validationErrors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  rowNumber: number;
  field: string;
  value: string;
  error: string;
}

export interface ValidationWarning {
  rowNumber: number;
  field: string;
  value: string;
  warning: string;
}

export interface ImportRequest {
  csvData: string;
  options: ImportOptions;
}

export interface ImportOptions {
  skipDuplicates: boolean;
  skipInvalid: boolean;
  notifyMembers: boolean;
}

export interface ImportResult {
  importId: string;
  status: string;
  summary: ImportSummary;
  errors: ImportError[];
}

export interface ImportSummary {
  totalProcessed: number;
  successful: number;
  skipped: number;
  failed: number;
}

export interface ImportError {
  rowNumber: number;
  memberData: Record<string, unknown>;
  error: string;
}

export const memberImportService = {
  /**
   * Check if import size is allowed for current tier
   * US-002: Enforce tier import limits, including the Expand cap.
   */
  validateImportSize: (rowCount: number, tier: string): { isAllowed: boolean; message?: string } => {
    const isExpandTier = tier === 'Expand' || tier === 'Unlimited';
    const maxRows = isExpandTier ? 2000 : tier === 'Grow' ? 200 : 100;
    
    if (rowCount > maxRows) {
      return {
        isAllowed: false,
        message: `Your ${isExpandTier ? 'Expand' : tier} tier allows importing up to ${maxRows.toLocaleString()} members at once.`
      };
    }
    
    return { isAllowed: true };
  },

  /**
   * Downloads a CSV template for member import
   */
  downloadTemplate: async (clubId: number): Promise<Blob> => {
    const response = await apiClient.get(`/clubs/${clubId}/members/import/template`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Validates a CSV file before import
   * US-002: Enhanced validation for large datasets
   */
  validateCsv: async (clubId: number, file: File, tier?: string): Promise<ImportValidationResult> => {
    const formData = new FormData();
    formData.append('csvFile', file);
    
    // Add tier information for server-side validation
    if (tier) {
      formData.append('tier', tier);
    }

    const response = await apiClient.post(
      `/clubs/${clubId}/members/import/validate`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Longer timeout for larger top-plan files
        timeout: tier === 'Unlimited' || tier === 'Expand' ? 120000 : 60000
      }
    );

    return response.data;
  },

  /**
   * Executes the member import
   * US-002: Enhanced import with progress tracking for large datasets
   */
  executeImport: async (clubId: number, request: ImportRequest, tier?: string): Promise<ImportResult> => {
    const response = await apiClient.post(
      `/clubs/${clubId}/members/import/execute`,
      request,
      {
        // Extended timeout for large imports
        timeout: tier === 'Unlimited' || tier === 'Expand' ? 600000 : 300000
      }
    );

    return response.data;
  },

  /**
   * Gets the status of an import operation
   * US-002: Enhanced status tracking with progress percentage
   */
  getImportStatus: async (clubId: number, importId: string): Promise<ImportResult & { progress?: number }> => {
    const response = await apiClient.get(
      `/clubs/${clubId}/members/import/${importId}/status`
    );

    return response.data;
  },

  /**
   * Cancels a running import operation
   * US-002: Allow cancellation of long-running imports
   */
  cancelImport: async (clubId: number, importId: string): Promise<void> => {
    await apiClient.post(
      `/clubs/${clubId}/members/import/${importId}/cancel`
    );
  },

  /**
   * Helper function to convert file to base64
   */
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        const text = reader.result as string;
        const base64 = btoa(text);
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  },

  /**
   * Downloads the validation/error report as CSV
   */
  downloadErrorReport: (errors: ValidationError[], warnings: ValidationWarning[]): void => {
    const report = [
      'Row,Field,Value,Type,Message',
      ...errors.map(error => 
        `${error.rowNumber},"${error.field}","${error.value}",Error,"${error.error}"`
      ),
      ...warnings.map(warning => 
        `${warning.rowNumber},"${warning.field}","${warning.value}",Warning,"${warning.warning}"`
      )
    ].join('\n');

    const blob = new Blob([report], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-validation-report.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
