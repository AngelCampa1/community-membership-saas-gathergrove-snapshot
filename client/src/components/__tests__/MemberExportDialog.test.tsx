/**
 * MemberExportDialog Component Tests
 *
 * Boundary-mocking policy: ONLY apiClient is mocked.
 * The real memberDataExportService and real MemberExportDialog are used.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import MemberExportDialog from '@/components/MemberExportDialog';
import apiClient from '@/services/apiClient';

// ── Only boundary mock: the HTTP client ──────────────────────────────────────
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// ── Sonner toast mock ─────────────────────────────────────────────────────────
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

// ── UI shims ─────────────────────────────────────────────────────────────────
jest.mock('@/components/ui/dialog', () => ({
  Dialog: React.forwardRef<HTMLDivElement, any>(function Dialog({ children, open }: any, ref) {
    return open ? <div ref={ref} data-testid="dialog-root">{children}</div> : null;
  }),
  DialogContent: React.forwardRef<HTMLDivElement, any>(function DialogContent({ children, ...props }: any, ref) {
    const { onOpenChange: _oc, ...rest } = props;
    return <div ref={ref} data-testid="dialog-content" {...rest}>{children}</div>;
  }),
  DialogHeader: React.forwardRef<HTMLDivElement, any>(function DialogHeader({ children }: any, ref) {
    return <div ref={ref}>{children}</div>;
  }),
  DialogTitle: React.forwardRef<HTMLHeadingElement, any>(function DialogTitle({ children, id }: any, ref) {
    return <h2 ref={ref} id={id}>{children}</h2>;
  }),
  DialogDescription: React.forwardRef<HTMLParagraphElement, any>(function DialogDescription({ children }: any, ref) {
    return <p ref={ref}>{children}</p>;
  }),
  DialogFooter: React.forwardRef<HTMLDivElement, any>(function DialogFooter({ children }: any, ref) {
    return <div ref={ref} data-testid="dialog-footer">{children}</div>;
  }),
}));

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(function Button({ children, onClick, disabled, className, ...props }: any, ref) {
    if (props.asChild && children) return <>{children}</>;
    return <button ref={ref} onClick={onClick} disabled={disabled} className={className} {...props}>{children}</button>;
  }),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: React.forwardRef<HTMLInputElement, any>(function Checkbox({ id, checked, onCheckedChange, className, ...props }: any, ref) {
    return (
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={className}
        {...props}
      />
    );
  }),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(function Input(props: any, ref) {
    return <input ref={ref} {...props} />;
  }),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, id }: any) => <label htmlFor={htmlFor} id={id}>{children}</label>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children, id, 'aria-label': ariaLabel }: any) => (
    <button id={id} aria-label={ariaLabel}>{children}</button>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value, onValueChange }: any) => (
    <div data-value={value} onClick={() => onValueChange?.(value)}>{children}</div>
  ),
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: any) => <div>{children}</div>,
  CollapsibleTrigger: ({ children, asChild }: any) => {
    if (asChild && children) return <>{children}</>;
    return <button>{children}</button>;
  },
  CollapsibleContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('lucide-react', () => ({
  Users: () => null,
  Download: () => null,
  Settings: () => null,
  FileText: () => null,
  Database: () => null,
  Calendar: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
  UserCheck: () => null,
}));

// ── jsdom URL stubs ───────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  // Re-assign after clearAllMocks so the implementations survive
  global.URL.createObjectURL = jest.fn(() => 'blob:x');
  global.URL.revokeObjectURL = jest.fn();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Backend returns integer ordinals: queued=0, processing=1, completed=2, failed=3
const makeExportResult = (status: number, extra: Record<string, unknown> = {}) => ({
  data: {
    exportId: 'exp-1',
    status,
    fileName: 'members.csv',
    downloadUrl: '/api/clubs/123/exports/exp-1/download',
    ...extra,
  },
});

const makeStatusResponse = (status: number, progressPercentage = 0, extra: Record<string, unknown> = {}) => ({
  data: {
    exportId: 'exp-1',
    status,
    progressPercentage,
    progress: progressPercentage,
    ...extra,
  },
});

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  clubId: 123,
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('MemberExportDialog', () => {
  describe('Rendering', () => {
    it('renders when open', () => {
      render(<MemberExportDialog {...defaultProps} />);
      expect(screen.getByText('Export Member Data')).toBeInTheDocument();
      expect(screen.getByText('Configure your member data export settings')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<MemberExportDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Export Member Data')).not.toBeInTheDocument();
    });

    it('displays all four format options', () => {
      render(<MemberExportDialog {...defaultProps} />);
      expect(screen.getByLabelText('CSV')).toBeInTheDocument();
      expect(screen.getByLabelText('Excel')).toBeInTheDocument();
      expect(screen.getByLabelText('PDF')).toBeInTheDocument();
      expect(screen.getByLabelText('JSON')).toBeInTheDocument();
    });

    it('shows field selection section with default count', () => {
      render(<MemberExportDialog {...defaultProps} />);
      expect(screen.getByText('Select Fields to Export')).toBeInTheDocument();
      expect(screen.getByText(/4 of 16 selected/)).toBeInTheDocument();
    });

    it('shows advanced options checkboxes', () => {
      render(<MemberExportDialog {...defaultProps} />);
      expect(screen.getByLabelText('Include Engagement Data')).toBeInTheDocument();
      expect(screen.getByLabelText('Include Custom Fields')).toBeInTheDocument();
      expect(screen.getByLabelText('Include Attendance History')).toBeInTheDocument();
    });

    it('shows Export Data and Cancel buttons', () => {
      render(<MemberExportDialog {...defaultProps} />);
      expect(screen.getByText('Export Data')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Format selection', () => {
    it('defaults to CSV', () => {
      render(<MemberExportDialog {...defaultProps} />);
      expect(screen.getByLabelText('CSV')).toBeChecked();
    });

    it('updates preview when Excel is selected', () => {
      render(<MemberExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Excel'));
      expect(screen.getByTestId('export-format-preview')).toHaveTextContent('EXCEL');
    });
  });

  describe('Field selection', () => {
    it('toggles field checkbox on and off', () => {
      render(<MemberExportDialog {...defaultProps} />);
      const cb = screen.getByLabelText('First Name') as HTMLInputElement;
      expect(cb).toBeChecked();
      fireEvent.click(cb);
      expect(cb).not.toBeChecked();
      fireEvent.click(cb);
      expect(cb).toBeChecked();
    });

    it('Clear All removes all fields (All Fields category)', async () => {
      render(<MemberExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('All Fields'));
      fireEvent.click(screen.getByText('Clear All'));
      await waitFor(() => {
        expect(screen.getByText(/0 of \d+ selected/)).toBeInTheDocument();
      });
    });

    it('Select All selects all visible fields', async () => {
      render(<MemberExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('All Fields'));
      fireEvent.click(screen.getByText('Clear All'));
      await waitFor(() => expect(screen.getByText(/0 of \d+ selected/)).toBeInTheDocument());
      fireEvent.click(screen.getByText('Select All'));
      await waitFor(() => {
        expect(screen.getByText(/16 of 16 selected/)).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('shows error and does not call exportMembers when no fields selected', async () => {
      render(<MemberExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('All Fields'));
      fireEvent.click(screen.getByText('Clear All'));
      await waitFor(() => expect(screen.getByText(/0 of \d+ selected/)).toBeInTheDocument());

      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please select at least one field to export');
      });
      expect(mockApiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('Successful completed export', () => {
    it('calls exportMembers with correct args, downloads, shows success toast', async () => {
      mockApiClient.post.mockResolvedValueOnce(makeExportResult(2)); // completed
      mockApiClient.get.mockResolvedValueOnce({ data: new Blob(['csv'], { type: 'text/csv' }) });

      // Render FIRST before setting up DOM spies so React can append its container
      render(<MemberExportDialog {...defaultProps} />);

      // Set up spies AFTER render so React DOM manipulation is not blocked
      const mockAnchor = { href: '', download: '', click: jest.fn() } as unknown as HTMLAnchorElement;
      const origCreate = document.createElement.bind(document);
      const createElSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') return mockAnchor;
        return origCreate(tag);
      });
      const appendSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(n => n);
      const removeSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(n => n);

      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          'http://localhost:8050/api/clubs/123/members/export',
          expect.objectContaining({ format: 0 }) // csv ordinal
        );
      });

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith(
          'http://localhost:8050/api/clubs/123/exports/exp-1/download',
          { responseType: 'blob' }
        );
      });

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockAnchor.click).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
        expect(mockToast.success).toHaveBeenCalledWith('Export completed successfully!');
      });

      appendSpy.mockRestore();
      removeSpy.mockRestore();
      createElSpy.mockRestore();
    });
  });

  describe('In-progress / polling path', () => {
    it('shows exporting state, polls status, downloads on completed', async () => {
      // POST returns queued (0)
      mockApiClient.post.mockResolvedValueOnce(makeExportResult(0));

      // We'll control setInterval manually
      let intervalCallback: (() => void) | null = null;
      const setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation((fn: any) => {
        intervalCallback = fn;
        return 999 as any;
      });
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval').mockImplementation(() => {});

      render(<MemberExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Export Data'));

      // POST resolves → queued → polling starts, exporting state shown
      await waitFor(() => {
        expect(screen.getByText('Exporting...')).toBeInTheDocument();
      });
      expect(setIntervalSpy).toHaveBeenCalled();

      // First poll: processing (1)
      mockApiClient.get.mockResolvedValueOnce(makeStatusResponse(1, 50));
      await act(async () => {
        if (intervalCallback) intervalCallback();
        await Promise.resolve();
        await Promise.resolve();
      });

      // Second poll: completed (2)
      mockApiClient.get
        .mockResolvedValueOnce(makeStatusResponse(2, 100))
        .mockResolvedValueOnce({ data: new Blob(['data']) });

      await act(async () => {
        if (intervalCallback) intervalCallback();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Export completed successfully!');
      });

      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Error path', () => {
    it('shows error toast when exportMembers rejects', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      render(<MemberExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Export failed: Network error');
      });
    });

    it('shows error toast when export status is failed', async () => {
      mockApiClient.post.mockResolvedValueOnce(makeExportResult(3, { errorMessage: 'Disk full' }));

      render(<MemberExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Export failed: Disk full');
      });
    });
  });

  describe('Loading state', () => {
    it('disables Export Data button while exporting', async () => {
      // Never resolves to keep loading
      mockApiClient.post.mockImplementation(() => new Promise(() => {}));

      render(<MemberExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(screen.getByText('Exporting...')).toBeInTheDocument();
      });
      const btn = screen.getByRole('button', { name: /exporting/i });
      expect(btn).toBeDisabled();
    });
  });

  describe('Dialog actions', () => {
    it('calls onClose when Cancel is clicked', () => {
      const onClose = jest.fn();
      render(<MemberExportDialog {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls toast.success on a completed export (onClose follows via 1s setTimeout)', async () => {
      const onClose = jest.fn();
      mockApiClient.post.mockResolvedValueOnce(makeExportResult(2));
      mockApiClient.get.mockResolvedValueOnce({ data: new Blob(['data']) });

      render(<MemberExportDialog {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('Export Data'));

      // Verify the export succeeded (onClose will be called after 1s setTimeout)
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Export completed successfully!');
      });
    });
  });

  describe('Date range', () => {
    it('includes dateFrom/dateTo in export request when both dates are provided', async () => {
      const user = userEvent.setup();
      mockApiClient.post.mockResolvedValueOnce(makeExportResult(2));
      mockApiClient.get.mockResolvedValueOnce({ data: new Blob(['data']) });

      render(<MemberExportDialog {...defaultProps} />);

      // Click Advanced Options button to reveal date inputs
      fireEvent.click(screen.getByText('Advanced Options'));

      const startInput = screen.getByLabelText('Start Date');
      const endInput = screen.getByLabelText('End Date');
      await user.clear(startInput);
      await user.type(startInput, '2024-01-01');
      await user.clear(endInput);
      await user.type(endInput, '2024-01-31');

      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            dateFrom: '2024-01-01T00:00:00.000Z',
            dateTo: '2024-01-31T23:59:59.999Z',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has dialog role', () => {
      render(<MemberExportDialog {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('announces validation errors via role=alert', async () => {
      render(<MemberExportDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('All Fields'));
      fireEvent.click(screen.getByText('Clear All'));
      await waitFor(() => expect(screen.getByText(/0 of/)).toBeInTheDocument());
      fireEvent.click(screen.getByText('Export Data'));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('onExportComplete callback', () => {
    it('calls onExportComplete with success=true on completed export', async () => {
      const onExportComplete = jest.fn();
      mockApiClient.post.mockResolvedValueOnce(makeExportResult(2));
      mockApiClient.get.mockResolvedValueOnce({ data: new Blob(['data']) });

      render(<MemberExportDialog {...defaultProps} onExportComplete={onExportComplete} />);
      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(onExportComplete).toHaveBeenCalledWith(
          expect.objectContaining({ success: true })
        );
      });
    });

    it('calls onExportComplete with success=false on failed export', async () => {
      const onExportComplete = jest.fn();
      mockApiClient.post.mockResolvedValueOnce(makeExportResult(3, { errorMessage: 'Server error' }));

      render(<MemberExportDialog {...defaultProps} onExportComplete={onExportComplete} />);
      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(onExportComplete).toHaveBeenCalledWith(
          expect.objectContaining({ success: false, errorMessage: 'Server error' })
        );
      });
    });
  });
});
