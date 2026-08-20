/**
 * ExportJobTracker tests — boundary-mock only (apiClient HTTP layer).
 * Uses REAL ExportJobTracker + REAL memberDataExportService.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ExportJobTracker from '@/components/ExportJobTracker';

// Mock only the HTTP boundary — the service and component are real.
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import apiClient from '@/services/apiClient';

const mockGet = apiClient.get as jest.Mock;

// Status ordinal constants matching the backend enum.
const STATUS = { queued: 0, processing: 1, completed: 2, failed: 3, cancelled: 4, expired: 5 };

const CLUB_ID = 42;
const EXPORT_ID = 'exp-1';
const STATUS_URL = `http://localhost:8050/api/clubs/${CLUB_ID}/members/export/${EXPORT_ID}/status`;
const DOWNLOAD_URL = `http://localhost:8050/api/clubs/${CLUB_ID}/exports/${EXPORT_ID}/download`;

function makeStatusResponse(status: number, progressPercentage = 0, extra: Record<string, unknown> = {}) {
  return {
    data: {
      exportId: EXPORT_ID,
      status,
      progressPercentage,
      progress: progressPercentage,
      downloadUrl: null,
      ...extra,
    },
  };
}

const defaultProps = {
  clubId: CLUB_ID,
  exportId: EXPORT_ID,
  onComplete: jest.fn(),
  onError: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  // Stub URL methods absent in jsdom.
  global.URL.createObjectURL = jest.fn(() => 'blob:x');
  global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// In-progress render
// ---------------------------------------------------------------------------
describe('in-progress render (status processing = 1)', () => {
  it('shows progress percentage and Processing badge', async () => {
    mockGet.mockResolvedValue(makeStatusResponse(STATUS.processing, 45));

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    expect(mockGet).toHaveBeenCalledWith(STATUS_URL);
  });

  it('shows Queued badge for status 0', async () => {
    mockGet.mockResolvedValue(makeStatusResponse(STATUS.queued, 0));

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Queued')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Completed render + onComplete callback
// ---------------------------------------------------------------------------
describe('completed render', () => {
  it('shows Completed badge, download button, and calls onComplete', async () => {
    mockGet.mockResolvedValue(
      makeStatusResponse(STATUS.completed, 100, { downloadUrl: '/dl/file.csv' }),
    );

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('status-completed')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByTestId('download-button')).toBeInTheDocument();
    });

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    expect(defaultProps.onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed', progressPercentage: 100 }),
    );
  });

  it('stops polling after completed', async () => {
    mockGet.mockResolvedValue(makeStatusResponse(STATUS.completed, 100, { downloadUrl: '/dl/f.csv' }));

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => expect(screen.getByTestId('status-completed')).toBeInTheDocument());

    act(() => { jest.advanceTimersByTime(6000); });

    // Only one GET call; polling stopped.
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Failed render + onError callback
// ---------------------------------------------------------------------------
describe('failed render', () => {
  it('shows Failed badge, error message, and calls onError', async () => {
    mockGet.mockResolvedValue(
      makeStatusResponse(STATUS.failed, 30, { errorMessage: 'Database timeout' }),
    );

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('status-failed')).toBeInTheDocument();
      expect(screen.getByText('Database timeout')).toBeInTheDocument();
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    expect(defaultProps.onError).toHaveBeenCalledTimes(1);
    expect(defaultProps.onError).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    );
  });

  it('stops polling after failed', async () => {
    mockGet.mockResolvedValue(makeStatusResponse(STATUS.failed, 50));

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => expect(screen.getByTestId('status-failed')).toBeInTheDocument());

    act(() => { jest.advanceTimersByTime(6000); });

    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------
describe('download', () => {
  it('calls downloadExport and triggers browser download', async () => {
    mockGet
      .mockResolvedValueOnce(
        makeStatusResponse(STATUS.completed, 100, { downloadUrl: '/dl/file.csv' }),
      )
      .mockResolvedValueOnce({ data: new Blob(['col1,col2\nval1,val2']) });

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => expect(screen.getByTestId('download-button')).toBeInTheDocument());

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByTestId('download-button'));

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        DOWNLOAD_URL,
        { responseType: 'blob' },
      );
    });

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });
});

// ---------------------------------------------------------------------------
// Retry
// ---------------------------------------------------------------------------
describe('retry after error', () => {
  it('shows error card then re-fetches on Retry click', async () => {
    mockGet
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(makeStatusResponse(STATUS.processing, 10));

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Error loading export status')).toBeInTheDocument());
    expect(screen.getByText('Network error')).toBeInTheDocument();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Retry'));

    await waitFor(() => expect(screen.getByText('Processing')).toBeInTheDocument());
  });
});

// ---------------------------------------------------------------------------
// Polling lifecycle
// ---------------------------------------------------------------------------
describe('polling', () => {
  it('continues polling while processing and stops at completed', async () => {
    mockGet
      .mockResolvedValueOnce(makeStatusResponse(STATUS.processing, 20))
      .mockResolvedValueOnce(makeStatusResponse(STATUS.processing, 60))
      .mockResolvedValueOnce(makeStatusResponse(STATUS.completed, 100, { downloadUrl: '/d' }));

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Processing')).toBeInTheDocument());

    act(() => { jest.advanceTimersByTime(2000); });
    await waitFor(() => expect(screen.getByText('60%')).toBeInTheDocument());

    act(() => { jest.advanceTimersByTime(2000); });
    await waitFor(() => expect(screen.getByTestId('status-completed')).toBeInTheDocument());

    act(() => { jest.advanceTimersByTime(6000); });
    expect(mockGet).toHaveBeenCalledTimes(3);
  });

  it('cleans up polling on unmount', async () => {
    mockGet.mockResolvedValue(makeStatusResponse(STATUS.processing, 30));

    const { unmount } = render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Processing')).toBeInTheDocument());

    const callCount = mockGet.mock.calls.length;
    unmount();

    act(() => { jest.advanceTimersByTime(6000); });

    expect(mockGet.mock.calls.length).toBe(callCount);
  });

  it('stops polling for cancelled status', async () => {
    mockGet.mockResolvedValue(makeStatusResponse(STATUS.cancelled, 0));

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Cancelled')).toBeInTheDocument());

    act(() => { jest.advanceTimersByTime(6000); });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
describe('accessibility', () => {
  it('has a live region that announces completed status', async () => {
    mockGet
      .mockResolvedValueOnce(makeStatusResponse(STATUS.processing, 50))
      .mockResolvedValueOnce(makeStatusResponse(STATUS.completed, 100, { downloadUrl: '/d' }));

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Processing')).toBeInTheDocument());

    act(() => { jest.advanceTimersByTime(2000); });

    await waitFor(() => {
      const region = screen.getByTestId('status-announcement');
      expect(region).toHaveAttribute('role', 'status');
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(region).toHaveTextContent('Export completed successfully');
    });
  });

  it('renders two progressbar roles when status is processing', async () => {
    mockGet.mockResolvedValue(makeStatusResponse(STATUS.processing, 50));

    render(<ExportJobTracker {...defaultProps} />);

    await waitFor(() => {
      const bars = screen.getAllByRole('progressbar');
      expect(bars.length).toBeGreaterThanOrEqual(2);
    });
  });
});
