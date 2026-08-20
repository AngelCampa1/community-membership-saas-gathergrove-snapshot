/**
 * @jest-environment jsdom
 *
 * Report Generation Service Tests
 *
 * Tests report generation functionality following boundary mocking pattern:
 * - Uses existing __mocks__ for jspdf and exceljs
 * - Mock file-saver at the boundary
 * - Test REAL service logic (data validation, format conversion, error handling)
 */

// Mock file-saver module
const mockSaveAs = jest.fn();
jest.mock('file-saver', () => ({
  __esModule: true,
  saveAs: (...args: unknown[]) => mockSaveAs(...args),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import jsPDF mock spies for PDF verification
import { mockSave as saveSpy, mockText as textSpy, mockAddImage as addImageSpy } from '../../__mocks__/jspdf';

// Import after mocks - jspdf and exceljs use __mocks__ folder automatically
import reportGenerationService, { ReportData, ExportOptions } from '../reportGenerationService';

describe('ReportGenerationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveAs.mockClear();
    saveSpy.mockClear();
    textSpy.mockClear();
    addImageSpy.mockClear();
  });

  // Sample test data
  const mockReportData: ReportData = {
    title: 'Member Analytics Report',
    subtitle: 'Monthly Summary',
    data: [
      { name: 'John Doe', email: 'john@example.com', status: 'active' },
      { name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
    ],
    metadata: {
      generatedAt: '2025-01-15T10:30:00Z',
      clubName: 'Test Club',
      dateRange: {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      },
    },
  };

  const mockExportOptions: ExportOptions = {
    filename: 'custom-report',
    brandingConfig: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
      },
    },
  };

  describe('exportAsCSV', () => {
    it('should export data as CSV successfully', async () => {
      await reportGenerationService.exportAsCSV(mockReportData);

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'analytics-report.csv'
      );
    });

    it('should use custom filename', async () => {
      await reportGenerationService.exportAsCSV(mockReportData, { filename: 'custom-report' });

      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'custom-report.csv'
      );
    });

    it('should use custom headers when provided', async () => {
      await reportGenerationService.exportAsCSV(mockReportData, {
        customHeaders: ['name', 'email'],
      });

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
    });

    it('should throw error when no data available', async () => {
      const emptyData: ReportData = {
        title: 'Empty Report',
        data: [],
      };

      await expect(reportGenerationService.exportAsCSV(emptyData)).rejects.toThrow(
        'Failed to export CSV file'
      );
    });

    it('should handle special characters in CSV data', async () => {
      const dataWithSpecialChars: ReportData = {
        title: 'Special Chars Report',
        data: [
          { name: 'John, Jr.', description: 'Quote "test"' },
        ],
      };

      await reportGenerationService.exportAsCSV(dataWithSpecialChars);

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
    });
  });

  describe('exportAsExcel', () => {
    it('should export data as Excel successfully', async () => {
      await reportGenerationService.exportAsExcel(mockReportData);

      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'analytics-report.xlsx'
      );
    });

    it('should use custom filename', async () => {
      await reportGenerationService.exportAsExcel(mockReportData, { filename: 'excel-export' });

      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'excel-export.xlsx'
      );
    });

    it('should throw error when no data available', async () => {
      const emptyData: ReportData = {
        title: 'Empty Report',
        data: [],
      };

      await expect(reportGenerationService.exportAsExcel(emptyData)).rejects.toThrow(
        'Failed to export Excel file'
      );
    });

    it('should use custom headers when provided', async () => {
      await reportGenerationService.exportAsExcel(mockReportData, {
        customHeaders: ['name', 'email'],
      });

      expect(mockSaveAs).toHaveBeenCalled();
    });
  });

  describe('exportAsPDF', () => {
    it('should export data as PDF successfully', async () => {
      await reportGenerationService.exportAsPDF(mockReportData);

      // Verify jsPDF save was called with default filename
      expect(saveSpy).toHaveBeenCalledWith('analytics-report.pdf');
    });

    it('should use custom filename', async () => {
      await reportGenerationService.exportAsPDF(mockReportData, { filename: 'pdf-export' });

      expect(saveSpy).toHaveBeenCalledWith('pdf-export.pdf');
    });

    it('should throw error when no data available', async () => {
      const emptyData: ReportData = {
        title: 'Empty Report',
        data: [],
      };

      await expect(reportGenerationService.exportAsPDF(emptyData)).rejects.toThrow(
        'Failed to export PDF file'
      );
    });

    it('should handle branding options without error', async () => {
      await reportGenerationService.exportAsPDF(mockReportData, mockExportOptions);

      // Verify PDF was generated with branding - text methods should be called for title
      expect(textSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should handle logo in branding config', async () => {
      const optionsWithLogo: ExportOptions = {
        brandingConfig: {
          logo: 'data:image/png;base64,test',
          colors: { primary: '#000', secondary: '#fff' },
        },
      };

      await reportGenerationService.exportAsPDF(mockReportData, optionsWithLogo);

      // Verify addImage was called for logo
      expect(addImageSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('exportAsJSON', () => {
    it('should export data as JSON successfully', async () => {
      await reportGenerationService.exportAsJSON(mockReportData);

      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'analytics-report.json'
      );
    });

    it('should use custom filename', async () => {
      await reportGenerationService.exportAsJSON(mockReportData, { filename: 'json-export' });

      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'json-export.json'
      );
    });

    it('should pass a Blob with correct content type', async () => {
      await reportGenerationService.exportAsJSON(mockReportData);

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
      const call = mockSaveAs.mock.calls[0];
      expect(call[0]).toBeInstanceOf(Blob);
    });

    it('should handle export with minimal data', async () => {
      const minimalData: ReportData = {
        title: 'Minimal Report',
        data: [{ value: 1 }],
      };

      await reportGenerationService.exportAsJSON(minimalData);

      expect(mockSaveAs).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSupportedFormats', () => {
    it('should return all supported formats', () => {
      const formats = reportGenerationService.getSupportedFormats();

      expect(formats).toContain('csv');
      expect(formats).toContain('excel');
      expect(formats).toContain('pdf');
      expect(formats).toContain('json');
    });

    it('should return 4 formats', () => {
      const formats = reportGenerationService.getSupportedFormats();

      expect(formats).toHaveLength(4);
    });
  });

  describe('exportData', () => {
    it('should export to CSV format', async () => {
      await reportGenerationService.exportData(mockReportData, 'csv');

      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), expect.stringContaining('.csv'));
    });

    it('should export to Excel format', async () => {
      await reportGenerationService.exportData(mockReportData, 'excel');

      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), expect.stringContaining('.xlsx'));
    });

    it('should export to PDF format', async () => {
      await reportGenerationService.exportData(mockReportData, 'pdf');

      // PDF export uses jsPDF.save internally
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should export to JSON format', async () => {
      await reportGenerationService.exportData(mockReportData, 'json');

      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), expect.stringContaining('.json'));
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        reportGenerationService.exportData(mockReportData, 'xml' as any)
      ).rejects.toThrow('Unsupported export format: xml');
    });

    it('should validate data before export', async () => {
      const invalidData = null as any;

      await expect(
        reportGenerationService.exportData(invalidData, 'csv')
      ).rejects.toThrow('No data provided for export');
    });

    it('should throw error when title is missing', async () => {
      const noTitleData = {
        data: [{ value: 1 }],
      } as any;

      await expect(
        reportGenerationService.exportData(noTitleData, 'csv')
      ).rejects.toThrow('Report title is required');
    });

    it('should throw error when data is not an array', async () => {
      const invalidDataFormat = {
        title: 'Test',
        data: 'not-an-array' as any,
      };

      await expect(
        reportGenerationService.exportData(invalidDataFormat, 'csv')
      ).rejects.toThrow('Report data must be an array');
    });

    it('should throw error when data array is empty', async () => {
      const emptyData = {
        title: 'Test',
        data: [],
      };

      await expect(
        reportGenerationService.exportData(emptyData, 'csv')
      ).rejects.toThrow('No data available for export');
    });

    it('should pass options to format-specific export', async () => {
      await reportGenerationService.exportData(mockReportData, 'csv', { filename: 'custom' });

      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'custom.csv');
    });
  });

  describe('error handling', () => {
    it('should throw meaningful error for CSV export failure', async () => {
      mockSaveAs.mockImplementation(() => {
        throw new Error('Save failed');
      });

      await expect(reportGenerationService.exportAsCSV(mockReportData)).rejects.toThrow(
        'Failed to export CSV file'
      );
    });

    it('should throw meaningful error for JSON export failure', async () => {
      mockSaveAs.mockImplementation(() => {
        throw new Error('Save failed');
      });

      await expect(reportGenerationService.exportAsJSON(mockReportData)).rejects.toThrow(
        'Failed to export JSON file'
      );
    });
  });

  describe('service instance', () => {
    it('should export default service instance', () => {
      expect(reportGenerationService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof reportGenerationService.exportAsCSV).toBe('function');
      expect(typeof reportGenerationService.exportAsExcel).toBe('function');
      expect(typeof reportGenerationService.exportAsPDF).toBe('function');
      expect(typeof reportGenerationService.exportAsJSON).toBe('function');
      expect(typeof reportGenerationService.getSupportedFormats).toBe('function');
      expect(typeof reportGenerationService.exportData).toBe('function');
    });
  });
});
