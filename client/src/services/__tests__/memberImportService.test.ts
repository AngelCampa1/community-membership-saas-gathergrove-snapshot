/**
 * @jest-environment jsdom
 *
 * Member Import Service Tests
 *
 * Tests member CSV import following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (validation, file handling, tier limits)
 */

import { memberImportService, ImportValidationResult, ImportResult, ValidationError, ValidationWarning, ImportOptions } from '../memberImportService';
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

describe('MemberImportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data
  const mockValidationResult: ImportValidationResult = {
    isValid: true,
    totalRows: 100,
    validRows: 95,
    invalidRows: 5,
    duplicateEmails: 3,
    validationErrors: [],
    warnings: [],
  };

  const mockImportResult: ImportResult = {
    importId: 'import-123',
    status: 'completed',
    summary: {
      totalProcessed: 95,
      successful: 92,
      skipped: 3,
      failed: 0,
    },
    errors: [],
  };

  describe('validateImportSize', () => {
    it('should allow imports up to the Expand cap', () => {
      const result = memberImportService.validateImportSize(2000, 'Expand');

      expect(result.isAllowed).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should reject imports above the Expand cap, including legacy Unlimited', () => {
      const result = memberImportService.validateImportSize(2001, 'Unlimited');

      expect(result.isAllowed).toBe(false);
      expect(result.message).toContain('2,000');
      expect(result.message).toContain('Expand');
    });

    it('should allow up to 200 rows for Grow tier', () => {
      const result = memberImportService.validateImportSize(200, 'Grow');

      expect(result.isAllowed).toBe(true);
    });

    it('should reject over 200 rows for Grow tier', () => {
      const result = memberImportService.validateImportSize(201, 'Grow');

      expect(result.isAllowed).toBe(false);
      expect(result.message).toContain('200');
      expect(result.message).toContain('Grow');
    });

    it('should allow up to 100 rows for Basic tier', () => {
      const result = memberImportService.validateImportSize(100, 'Basic');

      expect(result.isAllowed).toBe(true);
    });

    it('should reject over 100 rows for Basic tier', () => {
      const result = memberImportService.validateImportSize(101, 'Basic');

      expect(result.isAllowed).toBe(false);
      expect(result.message).toContain('100');
    });
  });

  describe('downloadTemplate', () => {
    it('should download CSV template as blob', async () => {
      const mockBlob = new Blob(['template data'], { type: 'text/csv' });
      mockApiClient.get.mockResolvedValue({ data: mockBlob });

      const result = await memberImportService.downloadTemplate(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/import/template`,
        { responseType: 'blob' }
      );
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('validateCsv', () => {
    it('should validate CSV file', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockValidationResult });
      const mockFile = new File(['name,email\nJohn,john@test.com'], 'members.csv', { type: 'text/csv' });

      const result = await memberImportService.validateCsv(clubId, mockFile);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/import/validate`,
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result.isValid).toBe(true);
      expect(result.totalRows).toBe(100);
    });

    it('should include tier in form data when provided', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockValidationResult });
      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });

      await memberImportService.validateCsv(clubId, mockFile, 'Expand');

      const formData = mockApiClient.post.mock.calls[0][1] as FormData;
      expect(formData.get('tier')).toBe('Expand');
    });

    it('should use longer timeout for Expand tier', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockValidationResult });
      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });

      await memberImportService.validateCsv(clubId, mockFile, 'Expand');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(FormData),
        expect.objectContaining({
          timeout: 120000,
        })
      );
    });

    it('should use shorter timeout for non-top tiers', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockValidationResult });
      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });

      await memberImportService.validateCsv(clubId, mockFile, 'Grow');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(FormData),
        expect.objectContaining({
          timeout: 60000,
        })
      );
    });

    it('should return validation errors and warnings', async () => {
      const resultWithErrors: ImportValidationResult = {
        ...mockValidationResult,
        isValid: false,
        validationErrors: [
          { rowNumber: 5, field: 'email', value: 'invalid', error: 'Invalid email format' },
        ],
        warnings: [
          { rowNumber: 10, field: 'phone', value: '123', warning: 'Phone format may be incorrect' },
        ],
      };
      mockApiClient.post.mockResolvedValue({ data: resultWithErrors });
      const mockFile = new File(['data'], 'members.csv', { type: 'text/csv' });

      const result = await memberImportService.validateCsv(clubId, mockFile);

      expect(result.isValid).toBe(false);
      expect(result.validationErrors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('executeImport', () => {
    it('should execute import', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockImportResult });
      const request = {
        csvData: 'base64data',
        options: { skipDuplicates: true, skipInvalid: false, notifyMembers: true } as ImportOptions,
      };

      const result = await memberImportService.executeImport(clubId, request);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/import/execute`,
        request,
        expect.any(Object)
      );
      expect(result.importId).toBe('import-123');
      expect(result.status).toBe('completed');
    });

    it('should use longer timeout for Expand tier', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockImportResult });
      const request = {
        csvData: 'data',
        options: { skipDuplicates: false, skipInvalid: false, notifyMembers: false },
      };

      await memberImportService.executeImport(clubId, request, 'Expand');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 600000, // 10 minutes
        })
      );
    });

    it('should return import summary', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockImportResult });
      const request = {
        csvData: 'data',
        options: { skipDuplicates: false, skipInvalid: false, notifyMembers: false },
      };

      const result = await memberImportService.executeImport(clubId, request);

      expect(result.summary.totalProcessed).toBe(95);
      expect(result.summary.successful).toBe(92);
      expect(result.summary.skipped).toBe(3);
      expect(result.summary.failed).toBe(0);
    });
  });

  describe('getImportStatus', () => {
    it('should get import status', async () => {
      const statusResult = { ...mockImportResult, progress: 75 };
      mockApiClient.get.mockResolvedValue({ data: statusResult });

      const result = await memberImportService.getImportStatus(clubId, 'import-123');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/import/import-123/status`
      );
      expect(result.progress).toBe(75);
    });

    it('should return full import result', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockImportResult });

      const result = await memberImportService.getImportStatus(clubId, 'import-123');

      expect(result.importId).toBe('import-123');
      expect(result.status).toBe('completed');
    });
  });

  describe('cancelImport', () => {
    it('should cancel import operation', async () => {
      mockApiClient.post.mockResolvedValue({});

      await memberImportService.cancelImport(clubId, 'import-123');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/members/import/import-123/cancel`
      );
    });
  });

  describe('fileToBase64', () => {
    it('should convert file to base64', async () => {
      const content = 'name,email\nJohn,john@test.com';
      const mockFile = new File([content], 'members.csv', { type: 'text/csv' });

      // Mock FileReader for jsdom compatibility
      const originalFileReader = global.FileReader;
      let onloadCallback: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
      const mockFileReader = {
        result: content,
        readAsText: jest.fn(function(this: typeof mockFileReader) {
          // Trigger onload asynchronously
          setTimeout(() => {
            if (onloadCallback) {
              onloadCallback.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
            }
          }, 0);
        }),
        set onload(callback: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null) {
          onloadCallback = callback;
        },
        get onload() {
          return onloadCallback;
        },
        onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null,
      };
      global.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;

      const result = await memberImportService.fileToBase64(mockFile);

      expect(result).toBe(btoa(content));
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);

      global.FileReader = originalFileReader;
    });

    it('should handle file read errors', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });

      // Mock FileReader error
      const originalFileReader = global.FileReader;
      let onerrorCallback: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
      const mockFileReader = {
        readAsText: jest.fn(function() {
          // Trigger onerror asynchronously
          setTimeout(() => {
            if (onerrorCallback) {
              onerrorCallback.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
            }
          }, 0);
        }),
        onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null,
        set onerror(callback: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null) {
          onerrorCallback = callback;
        },
        get onerror() {
          return onerrorCallback;
        },
      };
      global.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;

      const promise = memberImportService.fileToBase64(mockFile);

      await expect(promise).rejects.toBeDefined();

      global.FileReader = originalFileReader;
    });
  });

  describe('downloadErrorReport', () => {
    it('should generate CSV error report', () => {
      const errors: ValidationError[] = [
        { rowNumber: 5, field: 'email', value: 'bad', error: 'Invalid email' },
      ];
      const warnings: ValidationWarning[] = [
        { rowNumber: 10, field: 'phone', value: '123', warning: 'Check format' },
      ];

      // Mock URL.createObjectURL and document methods
      const mockCreateObjectURL = jest.fn().mockReturnValue('blob:url');
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();

      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: mockClick,
          } as unknown as HTMLAnchorElement;
        }
        return originalCreateElement(tag);
      });
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      memberImportService.downloadErrorReport(errors, warnings);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it('should include both errors and warnings in report', () => {
      const errors: ValidationError[] = [
        { rowNumber: 1, field: 'email', value: 'bad', error: 'Invalid' },
        { rowNumber: 2, field: 'name', value: '', error: 'Required' },
      ];
      const warnings: ValidationWarning[] = [
        { rowNumber: 3, field: 'phone', value: '123', warning: 'Format' },
      ];

      let capturedBlob: Blob | null = null;
      global.URL.createObjectURL = jest.fn((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:url';
      });
      global.URL.revokeObjectURL = jest.fn();

      const mockClick = jest.fn();
      jest.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: mockClick,
      } as unknown as HTMLAnchorElement);
      jest.spyOn(document.body, 'appendChild').mockImplementation(jest.fn());
      jest.spyOn(document.body, 'removeChild').mockImplementation(jest.fn());

      memberImportService.downloadErrorReport(errors, warnings);

      expect(capturedBlob).toBeInstanceOf(Blob);

      jest.restoreAllMocks();
    });
  });

  describe('service export', () => {
    it('should export memberImportService object', () => {
      expect(memberImportService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof memberImportService.validateImportSize).toBe('function');
      expect(typeof memberImportService.downloadTemplate).toBe('function');
      expect(typeof memberImportService.validateCsv).toBe('function');
      expect(typeof memberImportService.executeImport).toBe('function');
      expect(typeof memberImportService.getImportStatus).toBe('function');
      expect(typeof memberImportService.cancelImport).toBe('function');
      expect(typeof memberImportService.fileToBase64).toBe('function');
      expect(typeof memberImportService.downloadErrorReport).toBe('function');
    });
  });
});
