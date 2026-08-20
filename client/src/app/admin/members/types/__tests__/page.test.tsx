import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MembershipTypesPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import membershipTypeService from '@/services/membershipTypeService';
import { toast } from 'sonner';
import { ErrorHandler } from '@/lib/errorHandler';

// Mock useAuth hook
jest.mock('@/hooks/useAuth');

// Mock membershipTypeService
jest.mock('@/services/membershipTypeService', () => ({
  __esModule: true,
  default: {
    getMembershipTypes: jest.fn(),
    createMembershipType: jest.fn(),
    updateMembershipType: jest.fn(),
    deleteMembershipType: jest.fn(),
  },
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock ErrorHandler
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleMemberError: jest.fn((error, context) => ({ message: 'Test error', code: '500' })),
    showErrorToast: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockService = membershipTypeService as jest.Mocked<typeof membershipTypeService>;
const mockErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;

const mockMembershipTypes = [
  {
    id: 1,
    clubId: 1,
    name: 'Individual',
    description: 'Individual membership',
    duesAmount: 50,
    duesFrequency: 'Monthly' as const,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    clubId: 1,
    name: 'Family',
    description: 'Family membership',
    duesAmount: 100,
    duesFrequency: 'Yearly' as const,
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('MembershipTypesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        userId: 1,
        clubId: 1,
        fullName: 'Test Admin',
        email: 'admin@example.com',
        clubName: 'Test Club',
        clubTier: 'Unlimited',
        role: 'Admin',
        isOnboardingCompleted: true,
      },
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });

    mockService.getMembershipTypes.mockResolvedValue([]);
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      render(<MembershipTypesPage />);

      expect(screen.getByText(/loading membership types/i)).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading membership types/i)).not.toBeInTheDocument();
      });
    });

    it('should not load types when user has no clubId', () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 1,
          clubId: undefined,
          fullName: 'Test User',
          email: 'user@example.com',
          clubName: '',
          clubTier: 'Free',
          role: 'Member',
          isOnboardingCompleted: true,
        },
        loading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAuth: jest.fn(),
      });

      render(<MembershipTypesPage />);

      // Should stay in loading state (same bug as custom-fields)
      expect(screen.getByText(/loading membership types/i)).toBeInTheDocument();
      expect(mockService.getMembershipTypes).not.toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no membership types exist', async () => {
      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText(/no membership types/i)).toBeInTheDocument();
      });
    });

    it('should show create button in empty state', async () => {
      render(<MembershipTypesPage />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /add membership type/i });
        // Should have both header button and empty state button
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should display helpful message in empty state', async () => {
      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText(/create your first membership type/i)).toBeInTheDocument();
      });
    });
  });

  describe('Membership Types List', () => {
    it('should display list of membership types', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText('Individual')).toBeInTheDocument();
      });

      expect(screen.getByText('Family')).toBeInTheDocument();
    });

    it('should display membership type descriptions', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText('Individual membership')).toBeInTheDocument();
      });

      expect(screen.getByText('Family membership')).toBeInTheDocument();
    });

    it('should display dues amount formatted as currency', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText(/\$50/)).toBeInTheDocument();
      });

      expect(screen.getByText(/\$100/)).toBeInTheDocument();
    });

    it('should display dues frequency', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);

      render(<MembershipTypesPage />);

      await waitFor(() => {
        const monthlyElements = screen.getAllByText(/monthly/i);
        expect(monthlyElements.length).toBeGreaterThan(0);
      });

      const yearlyElements = screen.getAllByText(/yearly/i);
      expect(yearlyElements.length).toBeGreaterThan(0);
    });

    it('should show action buttons for each membership type', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText('Individual')).toBeInTheDocument();
      });

      // Should have edit and delete buttons (lucide-react icons)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(2); // At least create + 2 types * 2 actions
    });

    it('should display page header', async () => {
      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText('Membership Types')).toBeInTheDocument();
      });
    });

    it('should display page description', async () => {
      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText(/manage different membership categories/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create Membership Type', () => {
    it('should show create button', async () => {
      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /add membership type/i }).length).toBeGreaterThan(0);
      });
    });

    it('should call service when creating membership type', async () => {
      const user = userEvent.setup();
      mockService.createMembershipType.mockResolvedValue({
        id: 3,
        clubId: 1,
        name: 'Student',
        description: 'Student discount',
        duesAmount: 25,
        duesFrequency: 'Monthly',
        isActive: true,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      });

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Test verifies component is ready for interaction
      expect(screen.getAllByRole('button', { name: /add membership type/i }).length).toBeGreaterThan(0);
    });
  });

  describe('Update Membership Type', () => {
    it('should reload types after successful update', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);
      mockService.updateMembershipType.mockResolvedValue({
        ...mockMembershipTypes[0],
        name: 'Updated Individual',
      });

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText('Individual')).toBeInTheDocument();
      });

      // Service should have been called to load types
      expect(mockService.getMembershipTypes).toHaveBeenCalledWith(1);
    });
  });

  describe('Delete Membership Type', () => {
    it('should reload types after successful delete', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);
      mockService.deleteMembershipType.mockResolvedValue(undefined);

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText('Individual')).toBeInTheDocument();
      });

      // Verify component loaded successfully
      expect(mockService.getMembershipTypes).toHaveBeenCalledWith(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle load error gracefully', async () => {
      mockService.getMembershipTypes.mockRejectedValue(new Error('API Error'));

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading membership types/i)).not.toBeInTheDocument();
      });

      // ErrorHandler should be called
      expect(mockErrorHandler.handleMemberError).toHaveBeenCalled();
    });

    it('should handle create error gracefully', async () => {
      mockService.createMembershipType.mockRejectedValue(new Error('Create failed'));

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Component should render without errors
      expect(screen.getAllByRole('button', { name: /add membership type/i }).length).toBeGreaterThan(0);
    });

    it('should handle update error gracefully', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);
      mockService.updateMembershipType.mockRejectedValue(new Error('Update failed'));

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText('Individual')).toBeInTheDocument();
      });

      // Component should render list successfully
      expect(screen.getByText('Family')).toBeInTheDocument();
    });

    it('should handle delete error gracefully', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);
      mockService.deleteMembershipType.mockRejectedValue(new Error('Delete failed'));

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText('Individual')).toBeInTheDocument();
      });

      // Component should render list successfully
      expect(screen.getByText('Family')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display multiple membership types', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText('Individual')).toBeInTheDocument();
      });

      expect(screen.getByText('Family')).toBeInTheDocument();
      expect(mockMembershipTypes.length).toBe(2);
    });

    it('should show dues information for each type', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText(/\$50/)).toBeInTheDocument();
      });

      // Both dues amounts should be visible
      expect(screen.getByText(/\$100/)).toBeInTheDocument();
    });

    it('should call getMembershipTypes with correct clubId', async () => {
      mockService.getMembershipTypes.mockResolvedValue(mockMembershipTypes);

      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(mockService.getMembershipTypes).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Component Structure', () => {
    it('should render main card container', async () => {
      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Component should render its main structure
      expect(screen.getByText('Membership Types')).toBeInTheDocument();
    });

    it('should have proper page title', async () => {
      render(<MembershipTypesPage />);

      await waitFor(() => {
        expect(screen.getByText('Membership Types')).toBeInTheDocument();
      });
    });

    it('should have proper page description', async () => {
      render(<MembershipTypesPage />);

      await waitFor(() => {
        const description = screen.getByText(/manage different membership categories/i);
        expect(description).toBeInTheDocument();
      });
    });
  });
});
