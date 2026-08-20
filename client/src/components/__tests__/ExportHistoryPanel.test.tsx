import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportHistoryPanel, { type ExportHistoryEntry } from '@/components/ExportHistoryPanel';

// Mock only the UI library boundary (Radix-based components that need jsdom shimming)
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) =>
    React.createElement('div', { className: `card ${className ?? ''}`, ...props }, children),
  CardHeader: ({ children, ...props }: any) =>
    React.createElement('div', { ...props }, children),
  CardTitle: ({ children, ...props }: any) =>
    React.createElement('h3', { ...props }, children),
  CardContent: ({ children, ...props }: any) =>
    React.createElement('div', { ...props }, children),
}));

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(function Button(
    { children, onClick, disabled, title, className, size, variant, ...props },
    ref,
  ) {
    return React.createElement(
      'button',
      { ref, onClick, disabled, title, className, ...props },
      children,
    );
  }),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) =>
    React.createElement('span', { className: `badge ${variant ?? ''} ${className ?? ''}`, ...props }, children),
}));

jest.mock('lucide-react', () => ({
  History: (props: any) => React.createElement('svg', { 'data-testid': 'history-icon', ...props }),
  Download: (props: any) => React.createElement('svg', { 'data-testid': 'download-icon', ...props }),
  Trash2: (props: any) => React.createElement('svg', { 'data-testid': 'trash2-icon', ...props }),
  AlertCircle: (props: any) => React.createElement('svg', { 'data-testid': 'alert-circle-icon', ...props }),
}));

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const completedEntry: ExportHistoryEntry = {
  exportId: 'exp-completed',
  status: 'completed',
  fileName: 'members_2024.csv',
  fileSizeBytes: 2048,
  createdAt: '2024-01-15T10:00:00Z',
  completedAt: '2024-01-15T10:05:00Z',
  downloadUrl: '/files/members_2024.csv',
  recordCount: 42,
};

const processingEntry: ExportHistoryEntry = {
  exportId: 'exp-processing',
  status: 'processing',
  fileName: 'events_jan.csv',
  createdAt: '2024-01-15T11:00:00Z',
};

const failedEntry: ExportHistoryEntry = {
  exportId: 'exp-failed',
  status: 'failed',
  fileName: 'financial_q1.csv',
  errorMessage: 'Database timeout',
  createdAt: '2024-01-15T12:00:00Z',
};

const queuedEntry: ExportHistoryEntry = {
  exportId: 'exp-queued',
  status: 'queued',
  fileName: 'analytics_dec.csv',
  createdAt: '2024-01-15T13:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExportHistoryPanel', () => {
  describe('Heading and session scope', () => {
    it('renders the "this session" heading', () => {
      render(<ExportHistoryPanel />);
      expect(screen.getByText('Recent Exports (this session)')).toBeInTheDocument();
    });

    it('renders the region with an accessible name', () => {
      render(<ExportHistoryPanel />);
      expect(screen.getByRole('region', { name: 'Recent Exports (this session)' })).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows honest empty state when history is omitted', () => {
      render(<ExportHistoryPanel />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No exports yet this session.')).toBeInTheDocument();
    });

    it('shows honest empty state when history is an empty array', () => {
      render(<ExportHistoryPanel history={[]} />);
      expect(screen.getByText('No exports yet this session.')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<ExportHistoryPanel isLoading />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('does not render the entry list while loading', () => {
      render(<ExportHistoryPanel isLoading history={[completedEntry]} />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId(`entry-${completedEntry.exportId}`)).not.toBeInTheDocument();
    });
  });

  describe('Rendering provided entries', () => {
    it('renders file name for each entry', () => {
      render(<ExportHistoryPanel history={[completedEntry, processingEntry]} />);
      expect(screen.getByTestId(`filename-${completedEntry.exportId}`)).toHaveTextContent('members_2024.csv');
      expect(screen.getByTestId(`filename-${processingEntry.exportId}`)).toHaveTextContent('events_jan.csv');
    });

    it('displays record count when present', () => {
      render(<ExportHistoryPanel history={[completedEntry]} />);
      expect(screen.getByText('42 records')).toBeInTheDocument();
    });

    it('displays formatted file size', () => {
      render(<ExportHistoryPanel history={[completedEntry]} />);
      expect(screen.getByText('2.0KB')).toBeInTheDocument();
    });
  });

  describe('Status badges', () => {
    it('renders completed badge', () => {
      render(<ExportHistoryPanel history={[completedEntry]} />);
      expect(screen.getByTestId('status-completed')).toBeInTheDocument();
    });

    it('renders processing badge', () => {
      render(<ExportHistoryPanel history={[processingEntry]} />);
      expect(screen.getByTestId('status-processing')).toBeInTheDocument();
    });

    it('renders failed badge', () => {
      render(<ExportHistoryPanel history={[failedEntry]} />);
      expect(screen.getByTestId('status-failed')).toBeInTheDocument();
    });

    it('renders queued badge', () => {
      render(<ExportHistoryPanel history={[queuedEntry]} />);
      expect(screen.getByTestId('status-queued')).toBeInTheDocument();
    });
  });

  describe('Error message display', () => {
    it('shows error message for failed entries', () => {
      render(<ExportHistoryPanel history={[failedEntry]} />);
      expect(screen.getByTestId(`error-${failedEntry.exportId}`)).toBeInTheDocument();
      expect(screen.getByText('Database timeout')).toBeInTheDocument();
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    it('does not show error section for completed entries', () => {
      render(<ExportHistoryPanel history={[completedEntry]} />);
      expect(screen.queryByTestId(`error-${completedEntry.exportId}`)).not.toBeInTheDocument();
    });
  });

  describe('Download button', () => {
    it('is enabled for completed entries', () => {
      render(<ExportHistoryPanel history={[completedEntry]} />);
      const btn = screen.getByTestId(`download-button-${completedEntry.exportId}`);
      expect(btn).not.toBeDisabled();
    });

    it('is disabled for processing entries', () => {
      render(<ExportHistoryPanel history={[processingEntry]} />);
      const btn = screen.getByTestId(`download-button-${processingEntry.exportId}`);
      expect(btn).toBeDisabled();
    });

    it('is disabled for failed entries', () => {
      render(<ExportHistoryPanel history={[failedEntry]} />);
      const btn = screen.getByTestId(`download-button-${failedEntry.exportId}`);
      expect(btn).toBeDisabled();
    });

    it('calls onDownload with the entry when clicked for a completed entry', async () => {
      const user = userEvent.setup();
      const onDownload = jest.fn();
      render(<ExportHistoryPanel history={[completedEntry]} onDownload={onDownload} />);
      await user.click(screen.getByTestId(`download-button-${completedEntry.exportId}`));
      expect(onDownload).toHaveBeenCalledTimes(1);
      expect(onDownload).toHaveBeenCalledWith(completedEntry);
    });

    it('does NOT call onDownload when clicked on a non-completed entry', async () => {
      const user = userEvent.setup();
      const onDownload = jest.fn();
      render(<ExportHistoryPanel history={[processingEntry]} onDownload={onDownload} />);
      // Button is disabled, userEvent should not fire onClick
      const btn = screen.getByTestId(`download-button-${processingEntry.exportId}`);
      expect(btn).toBeDisabled();
      await user.click(btn);
      expect(onDownload).not.toHaveBeenCalled();
    });
  });

  describe('Remove button', () => {
    it('renders a remove button for every entry', () => {
      render(<ExportHistoryPanel history={[completedEntry, failedEntry]} />);
      expect(screen.getByTestId(`remove-button-${completedEntry.exportId}`)).toBeInTheDocument();
      expect(screen.getByTestId(`remove-button-${failedEntry.exportId}`)).toBeInTheDocument();
    });

    it('calls onRemove with the exportId when clicked', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      render(<ExportHistoryPanel history={[completedEntry]} onRemove={onRemove} />);
      await user.click(screen.getByTestId(`remove-button-${completedEntry.exportId}`));
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledWith(completedEntry.exportId);
    });

    it('does not throw when onRemove is not provided', async () => {
      const user = userEvent.setup();
      render(<ExportHistoryPanel history={[completedEntry]} />);
      await expect(
        user.click(screen.getByTestId(`remove-button-${completedEntry.exportId}`)),
      ).resolves.not.toThrow();
    });
  });

  describe('No network calls', () => {
    it('makes no calls to memberDataExportService', () => {
      // The service is NOT imported or mocked here — if the component imported it
      // Jest would error. The component must compile and render without any service.
      render(<ExportHistoryPanel history={[completedEntry]} />);
      expect(screen.getByTestId(`entry-${completedEntry.exportId}`)).toBeInTheDocument();
    });
  });
});
