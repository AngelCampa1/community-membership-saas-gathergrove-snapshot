/**
 * Tests for AdminAccountDeletionDialog.tsx - Admin account deletion workflow
 *
 * Boundary mocking: mock only the accountDeletionService (service boundary),
 * useAuth, logger, and sonner. Real component + real multi-step state.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminAccountDeletionDialog } from '../AdminAccountDeletionDialog';
import { accountDeletionService } from '@/services/accountDeletionService';

// Mock account deletion service at the boundary
jest.mock('@/services/accountDeletionService', () => ({
  accountDeletionService: {
    validateAccountDeletion: jest.fn(),
    initiateAccountDeletion: jest.fn(),
    getAdminTransferTargets: jest.fn(),
    cancelAccountDeletion: jest.fn(),
    downloadDataExport: jest.fn(),
  },
}));

// Mock useAuth hook (auth boundary)
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, userId: 1, name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock logger (logging boundary)
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockService = accountDeletionService as jest.Mocked<typeof accountDeletionService>;

const adminValidation = {
  canDelete: true,
  validationErrors: [],
  requiredActions: [],
  estimatedDeletionTime: '30.00:00:00',
  impactSummary: {
    clubsToDelete: 0,
    clubsToTransfer: 0,
    memberRecordsToAnonymize: 0,
    eventsAffected: 0,
    paymentRecordsAffected: 0,
    dataExportSize: 1024,
  },
  isAdminAccount: true,
  adminInfo: {
    primaryClubsCount: 0,
    secondaryClubsCount: 0,
    clubsToBeDeleted: [],
    clubsToTransfer: [],
    availableTransferTargets: [],
    hasActiveBilling: false,
    extendedGracePeriodDays: 30,
  },
};

const deletionResponse = {
  deletionRequestId: '11111111-1111-1111-1111-111111111111',
  status: 'PendingGracePeriod',
  requiresManualReview: false,
  estimatedCompletionDate: '2025-02-15T10:00:00Z',
  dataExportId: 'export-abc',
  dataExportFilePath: null,
  requiredActions: [],
  warnings: [],
};

describe('AdminAccountDeletionDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService.validateAccountDeletion.mockResolvedValue(adminValidation);
    mockService.getAdminTransferTargets.mockResolvedValue([]);
    mockService.initiateAccountDeletion.mockResolvedValue(deletionResponse);
    mockService.cancelAccountDeletion.mockResolvedValue({ message: 'Cancelled' });
    mockService.downloadDataExport.mockResolvedValue(new Blob(['data']));
  });

  describe('Smoke tests', () => {
    it('renders without crashing when closed', () => {
      expect(() => render(
        <AdminAccountDeletionDialog open={false} onOpenChange={jest.fn()} />
      )).not.toThrow();
    });

    it('renders without crashing when open', () => {
      expect(() => render(
        <AdminAccountDeletionDialog open={true} onOpenChange={jest.fn()} />
      )).not.toThrow();
    });

    it('accepts onAccountDeleted prop', () => {
      expect(() => render(
        <AdminAccountDeletionDialog open={false} onOpenChange={jest.fn()} onAccountDeleted={jest.fn()} />
      )).not.toThrow();
    });
  });

  describe('Deletion flow', () => {
    const goToConfirmation = async (user: ReturnType<typeof userEvent.setup>) => {
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /manage club ownership/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /manage club ownership/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to deletion/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /continue to deletion/i }));
      await waitFor(() => {
        expect(screen.getByText(/final confirmation/i)).toBeInTheDocument();
      });
    };

    it('keeps the delete button disabled until the confirmation phrase is typed', async () => {
      const user = userEvent.setup();
      render(<AdminAccountDeletionDialog open={true} onOpenChange={jest.fn()} />);
      await goToConfirmation(user);

      await user.type(screen.getByLabelText(/password confirmation/i), 'pw');
      await user.type(screen.getByLabelText(/reason for deletion/i), 'Leaving');
      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }

      // All gates met except confirmation phrase
      expect(screen.getByRole('button', { name: /delete my admin account/i })).toBeDisabled();

      await user.type(screen.getByLabelText(/type delete my account to confirm/i), 'DELETE MY ACCOUNT');
      expect(screen.getByRole('button', { name: /delete my admin account/i })).toBeEnabled();
    });

    it('submits with confirmationPhrase = "DELETE MY ACCOUNT"', async () => {
      const user = userEvent.setup();
      render(<AdminAccountDeletionDialog open={true} onOpenChange={jest.fn()} />);
      await goToConfirmation(user);

      await user.type(screen.getByLabelText(/password confirmation/i), 'pw');
      await user.type(screen.getByLabelText(/reason for deletion/i), 'Leaving');
      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }
      await user.type(screen.getByLabelText(/type delete my account to confirm/i), 'DELETE MY ACCOUNT');
      await user.click(screen.getByRole('button', { name: /delete my admin account/i }));

      await waitFor(() => {
        expect(mockService.initiateAccountDeletion).toHaveBeenCalledWith(
          expect.objectContaining({
            confirmationPhrase: 'DELETE MY ACCOUNT',
            reason: 'Leaving',
            deleteOrphanedClubs: true,
            clubTransferInstructions: [],
          })
        );
      });
    });

    it('invokes onAccountDeleted after a successful request', async () => {
      const onAccountDeleted = jest.fn();
      const user = userEvent.setup();
      render(
        <AdminAccountDeletionDialog open={true} onOpenChange={jest.fn()} onAccountDeleted={onAccountDeleted} />
      );
      await goToConfirmation(user);

      await user.type(screen.getByLabelText(/password confirmation/i), 'pw');
      await user.type(screen.getByLabelText(/reason for deletion/i), 'Leaving');
      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }
      await user.type(screen.getByLabelText(/type delete my account to confirm/i), 'DELETE MY ACCOUNT');
      await user.click(screen.getByRole('button', { name: /delete my admin account/i }));

      await waitFor(() => {
        expect(onAccountDeleted).toHaveBeenCalledTimes(1);
      });
    });

    it('does not invoke onAccountDeleted when the request fails', async () => {
      mockService.initiateAccountDeletion.mockRejectedValue(new Error('Deletion failed'));
      const onAccountDeleted = jest.fn();
      const user = userEvent.setup();
      render(
        <AdminAccountDeletionDialog open={true} onOpenChange={jest.fn()} onAccountDeleted={onAccountDeleted} />
      );
      await goToConfirmation(user);

      await user.type(screen.getByLabelText(/password confirmation/i), 'pw');
      await user.type(screen.getByLabelText(/reason for deletion/i), 'Leaving');
      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }
      await user.type(screen.getByLabelText(/type delete my account to confirm/i), 'DELETE MY ACCOUNT');
      await user.click(screen.getByRole('button', { name: /delete my admin account/i }));

      await waitFor(() => {
        expect(mockService.initiateAccountDeletion).toHaveBeenCalled();
      });
      expect(onAccountDeleted).not.toHaveBeenCalled();
    });
  });
});
