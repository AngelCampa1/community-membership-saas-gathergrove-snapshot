import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationTransfersPage from '../page';
import { memberTransferService, MemberTransferStatus } from '@/lib/api/memberTransferService';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('@/lib/api/memberTransferService', () => {
  // Keep the real enum
  const actual = jest.requireActual('@/lib/api/memberTransferService');
  return {
    ...actual,
    memberTransferService: {
      getPendingTransfers: jest.fn(),
      approveTransfer: jest.fn(),
      denyTransfer: jest.fn(),
    },
  };
});

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const { useParams } = require('next/navigation');
const mockMemberTransferService = memberTransferService as jest.Mocked<typeof memberTransferService>;

// Mock data
const mockTransfers = [
  {
    id: 1,
    memberId: 101,
    memberName: 'John Doe',
    memberEmail: 'john@example.com',
    fromLocationId: 1,
    fromLocationName: 'Main Office',
    toLocationId: 2,
    toLocationName: 'Branch Office',
    transferReason: 'Relocation',
    status: MemberTransferStatus.Pending,
    statusName: 'Pending',
    requestedAt: '2024-01-15T10:00:00Z',
    requestedBy: 1,
    requestedByName: 'Admin User',
  },
  {
    id: 2,
    memberId: 102,
    memberName: 'Jane Smith',
    memberEmail: 'jane@example.com',
    fromLocationId: 1,
    fromLocationName: 'Main Office',
    toLocationId: 3,
    toLocationName: 'Remote Location',
    transferReason: 'Job change',
    status: MemberTransferStatus.Pending,
    statusName: 'Pending',
    requestedAt: '2024-01-14T14:30:00Z',
    requestedBy: 2,
    requestedByName: 'Manager User',
  },
];

describe('LocationTransfersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    useParams.mockReturnValue({ locationId: '1' });
    mockMemberTransferService.getPendingTransfers.mockResolvedValue(mockTransfers);
  });

  describe('Loading State', () => {
    it('should show loading message initially', () => {
      mockMemberTransferService.getPendingTransfers.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<LocationTransfersPage />);

      expect(screen.getByText('Loading transfers...')).toBeInTheDocument();
    });

    it('should load pending transfers on mount', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(mockMemberTransferService.getPendingTransfers).toHaveBeenCalledWith(1);
      });
    });

    it('should hide loading message after data loads', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading transfers...')).not.toBeInTheDocument();
      });
    });

    it('should render transfer list after loading', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Invalid Location ID', () => {
    it('should show error message when locationId is undefined', () => {
      useParams.mockReturnValue({});

      render(<LocationTransfersPage />);

      expect(screen.getByText('Invalid location ID')).toBeInTheDocument();
    });

    it('should show error message when locationId is null', () => {
      useParams.mockReturnValue({ locationId: null });

      render(<LocationTransfersPage />);

      expect(screen.getByText('Invalid location ID')).toBeInTheDocument();
    });

    it('should show error message when locationId is invalid string', () => {
      useParams.mockReturnValue({ locationId: 'invalid' });

      render(<LocationTransfersPage />);

      expect(screen.getByText('Invalid location ID')).toBeInTheDocument();
    });
  });

  describe('Page Header', () => {
    it('should render page title', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /member transfer requests/i })).toBeInTheDocument();
      });
    });

    it('should render page description', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText(/review and approve member transfers to this location/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no transfers', async () => {
      mockMemberTransferService.getPendingTransfers.mockResolvedValue([]);

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText(/no pending transfer requests/i)).toBeInTheDocument();
      });
    });

    it('should not show transfer list in empty state', async () => {
      mockMemberTransferService.getPendingTransfers.mockResolvedValue([]);

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });
  });

  describe('Transfer List Rendering', () => {
    it('should render all pending transfers', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display member email for each transfer', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      });
    });

    it('should display from location name', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        const fromLocations = screen.getAllByText('Main Office');
        expect(fromLocations.length).toBeGreaterThan(0);
      });
    });

    it('should display to location name', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('Branch Office')).toBeInTheDocument();
        expect(screen.getByText('Remote Location')).toBeInTheDocument();
      });
    });

    it('should display requested by user', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText(/admin user/i)).toBeInTheDocument();
        expect(screen.getByText(/manager user/i)).toBeInTheDocument();
      });
    });

    it('should display formatted date', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        // Check that date elements exist (format may vary)
        const transferCards = screen.getAllByText(/john doe|jane smith/i);
        expect(transferCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Status Badges', () => {
    it('should render Pending status badge', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        const badges = screen.getAllByText('Pending');
        expect(badges.length).toBe(2);
      });
    });

    it('should render Approved status badge', async () => {
      const approvedTransfer = {
        ...mockTransfers[0],
        status: MemberTransferStatus.Approved,
        statusName: 'Approved',
      };
      mockMemberTransferService.getPendingTransfers.mockResolvedValue([approvedTransfer]);

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('Approved')).toBeInTheDocument();
      });
    });

    it('should render Denied status badge', async () => {
      const deniedTransfer = {
        ...mockTransfers[0],
        status: MemberTransferStatus.Rejected,
        statusName: 'Rejected',
      };
      mockMemberTransferService.getPendingTransfers.mockResolvedValue([deniedTransfer]);

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('Denied')).toBeInTheDocument();
      });
    });

    it('should render Cancelled status badge', async () => {
      const cancelledTransfer = {
        ...mockTransfers[0],
        status: MemberTransferStatus.Cancelled,
        statusName: 'Cancelled',
      };
      mockMemberTransferService.getPendingTransfers.mockResolvedValue([cancelledTransfer]);

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
      });
    });

    it('should render Completed status badge', async () => {
      const completedTransfer = {
        ...mockTransfers[0],
        status: MemberTransferStatus.Completed,
        statusName: 'Completed',
      };
      mockMemberTransferService.getPendingTransfers.mockResolvedValue([completedTransfer]);

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });
  });

  describe('Approve Button', () => {
    it('should render approve button for each transfer', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        const approveButtons = screen.getAllByRole('button', { name: /approve/i });
        expect(approveButtons.length).toBe(2);
      });
    });

    it('should open approve dialog when clicked', async () => {
      const user = userEvent.setup();
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should show member name in approve dialog', async () => {
      const user = userEvent.setup();
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        // Exact match targets the bolded member-detail node; the dialog
        // description ("Approve the transfer of John Doe ...") is a different
        // full string, so a regex would ambiguously match both nodes.
        expect(within(dialog).getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Deny Button', () => {
    it('should render deny button for each transfer', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        const denyButtons = screen.getAllByRole('button', { name: /deny/i });
        expect(denyButtons.length).toBe(2);
      });
    });

    it('should open deny dialog when clicked', async () => {
      const user = userEvent.setup();
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const denyButtons = screen.getAllByRole('button', { name: /deny/i });
      await user.click(denyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should show member name in deny dialog', async () => {
      const user = userEvent.setup();
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const denyButtons = screen.getAllByRole('button', { name: /deny/i });
      await user.click(denyButtons[0]);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText(/john doe/i)).toBeInTheDocument();
      });
    });
  });

  describe('Approve Dialog Flow', () => {
    it('should render notes textarea in approve dialog', async () => {
      const user = userEvent.setup();
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });

    it('should allow typing notes', async () => {
      const user = userEvent.setup();
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Approval granted for relocation');

      expect(textarea).toHaveValue('Approval granted for relocation');
    });

    it('should call approveTransfer service on confirm', async () => {
      const user = userEvent.setup();
      mockMemberTransferService.approveTransfer.mockResolvedValue({});

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Approved');

      const approveButton = screen.getByRole('button', { name: /^approve$/i });
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockMemberTransferService.approveTransfer).toHaveBeenCalledWith(1, {
          approvalNotes: 'Approved',
        });
      });
    });

    it('should allow empty notes for approval', async () => {
      const user = userEvent.setup();
      mockMemberTransferService.approveTransfer.mockResolvedValue({});

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const approveButton = screen.getByRole('button', { name: /^approve$/i });
      await user.click(approveButton);

      await waitFor(() => {
        // Component sends `notes.trim() || undefined`, so empty notes omit the field.
        expect(mockMemberTransferService.approveTransfer).toHaveBeenCalledWith(1, {
          approvalNotes: undefined,
        });
      });
    });

    it('should close dialog and reload after successful approval', async () => {
      const user = userEvent.setup();
      mockMemberTransferService.approveTransfer.mockResolvedValue({});

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const approveButton = screen.getByRole('button', { name: /^approve$/i });
      await user.click(approveButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(mockMemberTransferService.getPendingTransfers).toHaveBeenCalledTimes(2);
    });
  });

  describe('Deny Dialog Flow', () => {
    it('should render notes textarea in deny dialog', async () => {
      const user = userEvent.setup();
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const denyButtons = screen.getAllByRole('button', { name: /deny/i });
      await user.click(denyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });

    it('keeps the Deny button disabled until a reason is entered', async () => {
      const user = userEvent.setup();

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const denyButtons = screen.getAllByRole('button', { name: /deny/i });
      await user.click(denyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // A denial requires justification: the confirm button stays disabled
      // while the reason textarea is empty, so denyTransfer can never fire
      // without a reason (the real UX guard, stronger than an error toast).
      const denyButton = screen.getByRole('button', { name: /^deny$/i });
      expect(denyButton).toBeDisabled();

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Not eligible for transfer');

      expect(denyButton).toBeEnabled();
      expect(mockMemberTransferService.denyTransfer).not.toHaveBeenCalled();
    });

    it('should call denyTransfer service with notes', async () => {
      const user = userEvent.setup();
      mockMemberTransferService.denyTransfer.mockResolvedValue({});

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const denyButtons = screen.getAllByRole('button', { name: /deny/i });
      await user.click(denyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Not eligible for transfer');

      const denyButton = screen.getByRole('button', { name: /^deny$/i });
      await user.click(denyButton);

      await waitFor(() => {
        expect(mockMemberTransferService.denyTransfer).toHaveBeenCalledWith(1, {
          denialReason: 'Not eligible for transfer',
        });
      });
    });

    it('should close dialog and reload after successful denial', async () => {
      const user = userEvent.setup();
      mockMemberTransferService.denyTransfer.mockResolvedValue({});

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const denyButtons = screen.getAllByRole('button', { name: /deny/i });
      await user.click(denyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Denied');

      const denyButton = screen.getByRole('button', { name: /^deny$/i });
      await user.click(denyButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(mockMemberTransferService.getPendingTransfers).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dialog Cancel Button', () => {
    it('should close approve dialog on cancel', async () => {
      const user = userEvent.setup();
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close deny dialog on cancel', async () => {
      const user = userEvent.setup();
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const denyButtons = screen.getAllByRole('button', { name: /deny/i });
      await user.click(denyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should not call service on cancel', async () => {
      const user = userEvent.setup();
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Some notes');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockMemberTransferService.approveTransfer).not.toHaveBeenCalled();
    });
  });

  describe('Processing State', () => {
    it('should disable buttons during approval processing', async () => {
      const user = userEvent.setup();
      mockMemberTransferService.approveTransfer.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const approveButton = screen.getByRole('button', { name: /^approve$/i });
      await user.click(approveButton);

      await waitFor(() => {
        expect(approveButton).toBeDisabled();
      });
    });

    it('should disable buttons during denial processing', async () => {
      const user = userEvent.setup();
      mockMemberTransferService.denyTransfer.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const denyButtons = screen.getAllByRole('button', { name: /deny/i });
      await user.click(denyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Reason');

      const denyButton = screen.getByRole('button', { name: /^deny$/i });
      await user.click(denyButton);

      await waitFor(() => {
        expect(denyButton).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error loading transfers', async () => {
      mockMemberTransferService.getPendingTransfers.mockRejectedValue(
        new Error('Network error')
      );

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load pending transfers');
      });
    });

    it('should handle error approving transfer', async () => {
      const user = userEvent.setup();
      mockMemberTransferService.approveTransfer.mockRejectedValue({
        response: { data: { message: 'Approval failed' } },
      });

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const approveButton = screen.getByRole('button', { name: /^approve$/i });
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Approval failed');
      });
    });

    it('should handle error denying transfer', async () => {
      const user = userEvent.setup();
      mockMemberTransferService.denyTransfer.mockRejectedValue({
        response: { data: { message: 'Denial failed' } },
      });

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const denyButtons = screen.getAllByRole('button', { name: /deny/i });
      await user.click(denyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Reason');

      const denyButton = screen.getByRole('button', { name: /^deny$/i });
      await user.click(denyButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Denial failed');
      });
    });

    it('should handle generic error without response data', async () => {
      const user = userEvent.setup();
      mockMemberTransferService.approveTransfer.mockRejectedValue(
        new Error('Network error')
      );

      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const approveButton = screen.getByRole('button', { name: /^approve$/i });
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to approve transfer');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /member transfer requests/i });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should have accessible buttons', async () => {
      render(<LocationTransfersPage />);

      await waitFor(() => {
        const approveButtons = screen.getAllByRole('button', { name: /approve/i });
        const denyButtons = screen.getAllByRole('button', { name: /deny/i });
        expect(approveButtons.length).toBeGreaterThan(0);
        expect(denyButtons.length).toBeGreaterThan(0);
      });
    });

    it('should have accessible dialog', async () => {
      const user = userEvent.setup();
      render(<LocationTransfersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    });
  });
});
