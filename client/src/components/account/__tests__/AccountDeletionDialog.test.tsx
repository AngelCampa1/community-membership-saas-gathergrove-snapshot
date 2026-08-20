/**
 * @jest-environment jsdom
 *
 * Account Deletion Dialog Tests
 *
 * Tests account deletion flow following boundary mocking pattern:
 * - Mock accountDeletionService at service boundary (MSW is disabled due to ESM issues)
 * - Real component rendering
 * - Real validation and form logic
 *
 * Flow under test (post-rewrite): validation → confirmation → processing.
 * There is no longer a separate export step, "Request Export" button, or
 * "Confirm Deletion Now" button — those endpoints do not exist on the backend.
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountDeletionDialog } from '../AccountDeletionDialog';
import { renderWithProviders } from '@/__tests__/testUtils';
import { accountDeletionService } from '@/services/accountDeletionService';

// Mock the service at the boundary (MSW is disabled)
jest.mock('@/services/accountDeletionService', () => ({
  accountDeletionService: {
    validateAccountDeletion: jest.fn(),
    initiateAccountDeletion: jest.fn(),
    getAccountDeletionStatus: jest.fn(),
    cancelAccountDeletion: jest.fn(),
    downloadDataExport: jest.fn(),
  },
}));

const mockAccountDeletionService = accountDeletionService as jest.Mocked<typeof accountDeletionService>;

describe('AccountDeletionDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnAccountDeleted = jest.fn();

  const mockValidationResponse = {
    canDelete: true,
    validationErrors: [],
    requiredActions: ['Resolve outstanding dues before deletion'],
    estimatedDeletionTime: '30.00:00:00',
    impactSummary: {
      clubsToDelete: 1,
      clubsToTransfer: 0,
      memberRecordsToAnonymize: 5,
      eventsAffected: 2,
      paymentRecordsAffected: 1,
      dataExportSize: 1024,
    },
    isAdminAccount: false,
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

  const mockValidationBlocked = {
    ...mockValidationResponse,
    canDelete: false,
    validationErrors: ['You have pending payments that must be resolved'],
  };

  const mockDeletionResponse = {
    deletionRequestId: '11111111-1111-1111-1111-111111111111',
    status: 'PendingGracePeriod',
    requiresManualReview: false,
    estimatedCompletionDate: '2025-02-15T10:00:00Z',
    dataExportId: 'export-abc',
    dataExportFilePath: '/exports/export-abc.zip',
    requiredActions: [],
    warnings: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAccountDeletionService.validateAccountDeletion.mockResolvedValue(mockValidationResponse);
    mockAccountDeletionService.initiateAccountDeletion.mockResolvedValue(mockDeletionResponse);
    mockAccountDeletionService.cancelAccountDeletion.mockResolvedValue({ message: 'Cancelled' });
    mockAccountDeletionService.downloadDataExport.mockResolvedValue(
      new Blob(['data'], { type: 'application/zip' })
    );
  });

  const navigateToConfirmation = async (user: ReturnType<typeof userEvent.setup>) => {
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue to deletion/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /continue to deletion/i }));
    await waitFor(() => {
      expect(screen.getByText(/confirm account deletion/i)).toBeInTheDocument();
    });
  };

  const fillAndSubmitConfirmation = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/reason for deletion/i), 'No longer need the service');
    const checkboxes = screen.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      await user.click(checkbox);
    }
    await user.type(screen.getByLabelText(/type delete my account to confirm/i), 'DELETE MY ACCOUNT');
    await user.click(screen.getByRole('button', { name: /delete my account/i }));
  };

  describe('Rendering', () => {
    it('should not render when closed', () => {
      renderWithProviders(<AccountDeletionDialog open={false} onOpenChange={mockOnOpenChange} />);
      expect(screen.queryByText(/delete account/i)).not.toBeInTheDocument();
    });

    it('should render dialog when open', async () => {
      renderWithProviders(<AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} />);
      await waitFor(() => {
        expect(screen.getByTestId('radix-dialog-title')).toBeInTheDocument();
      });
      expect(screen.getByTestId('radix-dialog-title').textContent).toMatch(/account deletion/i);
    });
  });

  describe('Validation Step', () => {
    it('should validate account on open and show required actions', async () => {
      renderWithProviders(<AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(mockAccountDeletionService.validateAccountDeletion).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(screen.getByText(/resolve outstanding dues/i)).toBeInTheDocument();
      });
    });

    it('should display validation errors when account cannot be deleted', async () => {
      mockAccountDeletionService.validateAccountDeletion.mockResolvedValue(mockValidationBlocked);

      renderWithProviders(<AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText(/you have pending payments/i)).toBeInTheDocument();
      });
    });

    it('should show the impact summary from the real shape', async () => {
      renderWithProviders(<AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText(/member record\(s\) will be anonymized/i)).toBeInTheDocument();
      });
    });

    it('should proceed to confirmation when continue clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} />);
      await navigateToConfirmation(user);
      expect(screen.getByText(/confirm account deletion/i)).toBeInTheDocument();
    });
  });

  describe('Confirmation Step', () => {
    it('should disable delete button when form incomplete', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} />);
      await navigateToConfirmation(user);

      expect(screen.getByRole('button', { name: /delete my account/i })).toBeDisabled();
    });

    it('should submit deletion request when form completed', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} onAccountDeleted={mockOnAccountDeleted} />
      );
      await navigateToConfirmation(user);
      await fillAndSubmitConfirmation(user);

      await waitFor(() => {
        expect(mockAccountDeletionService.initiateAccountDeletion).toHaveBeenCalledWith(
          expect.objectContaining({ confirmationPhrase: 'DELETE MY ACCOUNT' })
        );
      });
      await waitFor(() => {
        expect(screen.getByText(/account deletion scheduled/i)).toBeInTheDocument();
      });
    });

    it('should notify the caller via onAccountDeleted after a successful request', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} onAccountDeleted={mockOnAccountDeleted} />
      );
      await navigateToConfirmation(user);
      await fillAndSubmitConfirmation(user);

      await waitFor(() => {
        expect(mockOnAccountDeleted).toHaveBeenCalledTimes(1);
      });
    });

    it('should NOT notify the caller via onAccountDeleted when the request fails', async () => {
      mockAccountDeletionService.initiateAccountDeletion.mockRejectedValue(new Error('Deletion failed'));

      const user = userEvent.setup();
      renderWithProviders(
        <AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} onAccountDeleted={mockOnAccountDeleted} />
      );
      await navigateToConfirmation(user);
      await fillAndSubmitConfirmation(user);

      await waitFor(() => {
        expect(screen.getByText(/confirm account deletion/i)).toBeInTheDocument();
      });
      expect(mockOnAccountDeleted).not.toHaveBeenCalled();
    });
  });

  describe('Processing Step', () => {
    it('should cancel deletion using the returned guid', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} />);
      await navigateToConfirmation(user);
      await fillAndSubmitConfirmation(user);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel deletion/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /cancel deletion/i }));

      await waitFor(() => {
        expect(mockAccountDeletionService.cancelAccountDeletion).toHaveBeenCalledWith(
          '11111111-1111-1111-1111-111111111111'
        );
      });
    });

    it('should download the data export via blob when available', async () => {
      const createObjectURL = jest.fn().mockReturnValue('blob:mock');
      const revokeObjectURL = jest.fn();
      (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;
      (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL;

      const user = userEvent.setup();
      renderWithProviders(<AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} />);
      await navigateToConfirmation(user);
      await fillAndSubmitConfirmation(user);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /download/i }));

      await waitFor(() => {
        expect(mockAccountDeletionService.downloadDataExport).toHaveBeenCalledWith('export-abc');
      });
      expect(createObjectURL).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should close the dialog when validation fails', async () => {
      mockAccountDeletionService.validateAccountDeletion.mockRejectedValue(new Error('Validation failed'));

      renderWithProviders(<AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should stay on confirmation step when deletion fails', async () => {
      mockAccountDeletionService.initiateAccountDeletion.mockRejectedValue(new Error('Deletion failed'));

      const user = userEvent.setup();
      renderWithProviders(<AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} />);
      await navigateToConfirmation(user);
      await fillAndSubmitConfirmation(user);

      await waitFor(() => {
        expect(screen.getByText(/confirm account deletion/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Close', () => {
    it('should call onOpenChange when cancel clicked on validation step', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccountDeletionDialog open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /^cancel$/i }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
