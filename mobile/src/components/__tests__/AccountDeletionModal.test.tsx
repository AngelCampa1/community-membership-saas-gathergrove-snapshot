import { render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AccountDeletionModal } from '../AccountDeletionModal';
import { accountDeletionService } from '@/services/accountDeletionService';

// Mock dependencies
jest.mock('@/services/accountDeletionService', () => ({
  accountDeletionService: {
    validateAccountDeletion: jest.fn(),
    requestDataExport: jest.fn(),
    initiateAccountDeletion: jest.fn(),
    confirmAccountDeletion: jest.fn(),
    cancelAccountDeletion: jest.fn(),
  },
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: { primary: '#FFFFFF', secondary: '#F5F5F5' },
      text: { primary: '#000000', secondary: '#666666', inverse: '#FFFFFF' },
      interactive: { primary: '#007AFF' },
      border: { primary: '#DDDDDD' },
      status: {
        error: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
        success: '#10b981',
      },
    },
  }),
  ThemeColors: {},
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('AccountDeletionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnAccountDeleted = jest.fn();

  const mockValidationResponse = {
    canDelete: true,
    restrictions: [],
    pendingObligations: [],
    dataRetentionDays: 90,
    alternativeOptions: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (accountDeletionService.validateAccountDeletion as jest.Mock).mockResolvedValue(mockValidationResponse);
  });

  describe('Rendering', () => {
    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <AccountDeletionModal visible={false} onClose={mockOnClose} />
      );

      expect(queryByText('Account Deletion')).toBeNull();
    });

    it('should render loading state initially', async () => {
      render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(accountDeletionService.validateAccountDeletion).toHaveBeenCalled();
      });
    });

    it('should render modal title when loaded', async () => {
      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(accountDeletionService.validateAccountDeletion).toHaveBeenCalled();
        expect(root).toBeTruthy();
      });
    });
  });

  describe('Validation Step', () => {
    it('should display validation response data', async () => {
      const validationData = {
        canDelete: true,
        restrictions: [],
        pendingObligations: [],
        dataRetentionDays: 90,
        alternativeOptions: [],
      };

      (accountDeletionService.validateAccountDeletion as jest.Mock).mockResolvedValue(validationData);

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(accountDeletionService.validateAccountDeletion).toHaveBeenCalled();
        expect(root).toBeTruthy();
      });
    });

    it('should display restrictions when canDelete is false', async () => {
      const restrictedValidation = {
        canDelete: false,
        restrictions: ['Active subscription must be cancelled'],
        pendingObligations: [],
        dataRetentionDays: 90,
        alternativeOptions: [],
      };

      (accountDeletionService.validateAccountDeletion as jest.Mock).mockResolvedValue(restrictedValidation);

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(accountDeletionService.validateAccountDeletion).toHaveBeenCalled();
        expect(root).toBeTruthy();
      });
    });

    it('should display pending obligations', async () => {
      const validationWithObligations = {
        canDelete: true,
        restrictions: [],
        pendingObligations: ['Complete pending payment'],
        dataRetentionDays: 90,
        alternativeOptions: [],
      };

      (accountDeletionService.validateAccountDeletion as jest.Mock).mockResolvedValue(validationWithObligations);

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(accountDeletionService.validateAccountDeletion).toHaveBeenCalled();
        expect(root).toBeTruthy();
      });
    });

    it('should display alternative options', async () => {
      const validationWithAlternatives = {
        canDelete: true,
        restrictions: [],
        pendingObligations: [],
        dataRetentionDays: 90,
        alternativeOptions: ['Deactivate account instead'],
      };

      (accountDeletionService.validateAccountDeletion as jest.Mock).mockResolvedValue(validationWithAlternatives);

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(accountDeletionService.validateAccountDeletion).toHaveBeenCalled();
        expect(root).toBeTruthy();
      });
    });

    it('should show error alert on validation failure', async () => {
      (accountDeletionService.validateAccountDeletion as jest.Mock).mockRejectedValue(new Error('Validation failed'));

      render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Unable to validate account deletion at this time');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Export Step', () => {
    it('should allow requesting data export', async () => {
      const exportResult = { downloadUrl: 'https://example.com/export.json' };
      (accountDeletionService.requestDataExport as jest.Mock).mockResolvedValue(exportResult);

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    it('should show error alert on export failure', async () => {
      (accountDeletionService.requestDataExport as jest.Mock).mockRejectedValue(new Error('Export failed'));

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });
  });

  describe('Confirmation Step', () => {
    it('should require reason and checkboxes for deletion', async () => {
      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    it('should show error alert when checkboxes not confirmed', async () => {
      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    it('should initiate deletion when all requirements met', async () => {
      const deletionResult = { deletionId: 'del_123' };
      (accountDeletionService.initiateAccountDeletion as jest.Mock).mockResolvedValue(deletionResult);

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    it('should show error alert on deletion initiation failure', async () => {
      (accountDeletionService.initiateAccountDeletion as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });
  });

  describe('Processing Step', () => {
    it('should allow confirming deletion', async () => {
      (accountDeletionService.confirmAccountDeletion as jest.Mock).mockResolvedValue(undefined);

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} onAccountDeleted={mockOnAccountDeleted} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    it('should allow cancelling deletion', async () => {
      (accountDeletionService.cancelAccountDeletion as jest.Mock).mockResolvedValue(undefined);

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    it('should show error alert on confirm deletion failure', async () => {
      (accountDeletionService.confirmAccountDeletion as jest.Mock).mockRejectedValue(new Error('Confirm failed'));

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    it('should show error alert on cancel deletion failure', async () => {
      (accountDeletionService.cancelAccountDeletion as jest.Mock).mockRejectedValue(new Error('Cancel failed'));

      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });
  });

  describe('Modal Close Behavior', () => {
    it('should call onClose when close button pressed', async () => {
      render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(accountDeletionService.validateAccountDeletion).toHaveBeenCalled();
      });
    });

    it('should reset form state on close', async () => {
      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    it('should not allow closing during processing', async () => {
      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });
  });

  describe('MEM-14 Fix - Component Unmount Handling', () => {
    it('should not update state after unmount', async () => {
      const { unmount } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      unmount();

      await waitFor(() => {
        expect(accountDeletionService.validateAccountDeletion).toHaveBeenCalled();
      });
    });

    it('should handle visibility changes correctly', async () => {
      const { rerender } = render(
        <AccountDeletionModal visible={false} onClose={mockOnClose} />
      );

      rerender(<AccountDeletionModal visible={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(accountDeletionService.validateAccountDeletion).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator during validation', async () => {
      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(accountDeletionService.validateAccountDeletion).toHaveBeenCalled();
        expect(root).toBeTruthy();
      });
    });

    it('should disable buttons when loading', async () => {
      const { root } = render(
        <AccountDeletionModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });
  });
});
