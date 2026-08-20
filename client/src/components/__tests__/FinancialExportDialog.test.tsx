import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import FinancialExportDialog from '../FinancialExportDialog';
import { financialExportService } from '@/services/financialExportService';

// Mock only the HTTP-boundary collaborators
jest.mock('@/services/financialExportService', () => ({
  financialExportService: {
    exportFinancialData: jest.fn(),
    downloadFinancialExport: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockService = financialExportService as jest.Mocked<typeof financialExportService>;
const mockToast = toast as jest.Mocked<typeof toast>;

const completedResult = {
  exportId: 'fin-1',
  status: 'completed' as const,
  fileName: 'financial-export.csv',
  downloadUrl: '/api/clubs/123/exports/fin-1/download',
  fileSizeBytes: 1024,
  recordCount: 42,
  requestedAt: null,
  createdAt: null,
  completedAt: null,
  exportedAt: null,
  errorMessage: null,
};

const failedResult = {
  ...completedResult,
  status: 'failed' as const,
  fileName: null,
  downloadUrl: null,
  errorMessage: 'boom',
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  clubId: 123,
};

describe('FinancialExportDialog', () => {
  beforeEach(() => {
    // resetMocks:true resets mock state; set up URL stubs each test
    global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('renders the dialog when open', () => {
    render(<FinancialExportDialog {...defaultProps} />);
    // Both the dialog title heading and the submit button contain this text
    const matches = screen.getAllByText('Export Financial Data');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render dialog content when closed', () => {
    render(<FinancialExportDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    render(<FinancialExportDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('disables the export button when no categories are selected', async () => {
    render(<FinancialExportDialog {...defaultProps} />);

    // Use Clear All button to deselect all categories
    await userEvent.click(screen.getByRole('button', { name: /clear all/i }));

    // The export button must be disabled when no category is chosen
    const exportButton = screen.getByRole('button', { name: /export financial data/i });
    expect(exportButton).toBeDisabled();
    expect(mockService.exportFinancialData).not.toHaveBeenCalled();
  });

  it('downloads file on successful completed export', async () => {
    mockService.exportFinancialData.mockResolvedValue(completedResult);
    mockService.downloadFinancialExport.mockResolvedValue(
      new Blob(['csv data'], { type: 'text/csv' }),
    );

    const onExportComplete = jest.fn();
    render(<FinancialExportDialog {...defaultProps} onExportComplete={onExportComplete} />);

    await userEvent.click(screen.getByRole('button', { name: /export financial data/i }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Financial export downloaded successfully!');
    });

    expect(mockService.downloadFinancialExport).toHaveBeenCalledWith(123, 'fin-1');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    expect(onExportComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        fileName: 'financial-export.csv',
        downloadUrl: '/api/clubs/123/exports/fin-1/download',
        recordCount: 42,
      }),
    );
  });

  it('uses result.fileName for the download anchor', async () => {
    mockService.exportFinancialData.mockResolvedValue(completedResult);
    mockService.downloadFinancialExport.mockResolvedValue(new Blob(['data']));

    // Spy on createElement to capture the anchor before it is removed from the DOM
    const realCreateElement = document.createElement.bind(document);
    let capturedAnchor: HTMLAnchorElement | null = null;
    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation(((tagName: string) => {
        const el = realCreateElement(tagName);
        if (tagName === 'a') capturedAnchor = el as HTMLAnchorElement;
        return el;
      }) as typeof document.createElement);

    render(<FinancialExportDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /export financial data/i }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
    });

    expect(capturedAnchor).not.toBeNull();
    expect((capturedAnchor as unknown as HTMLAnchorElement).download).toBe('financial-export.csv');
    createElementSpy.mockRestore();
  });

  it('shows error toast when export returns failed status', async () => {
    mockService.exportFinancialData.mockResolvedValue(failedResult);

    render(<FinancialExportDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /export financial data/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('boom'));
    });

    expect(mockService.downloadFinancialExport).not.toHaveBeenCalled();
  });

  it('shows error toast when exportFinancialData rejects', async () => {
    mockService.exportFinancialData.mockRejectedValue(new Error('network error'));

    render(<FinancialExportDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /export financial data/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('network error'));
    });
  });

  it('shows error toast when downloadFinancialExport rejects', async () => {
    mockService.exportFinancialData.mockResolvedValue(completedResult);
    mockService.downloadFinancialExport.mockRejectedValue(new Error('download failed'));

    render(<FinancialExportDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /export financial data/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('download failed'));
    });
  });
});
