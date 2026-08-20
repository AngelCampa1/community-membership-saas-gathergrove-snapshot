import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DirectorySettingsPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { directorySettingsService } from '@/services/directorySettingsService';
import { toast } from 'sonner';
import { ErrorHandler } from '@/lib/errorHandler';

// Mock useAuth hook
jest.mock('@/hooks/useAuth');

// Mock directorySettingsService
jest.mock('@/services/directorySettingsService', () => ({
  directorySettingsService: {
    getDirectorySettings: jest.fn(),
    updateDirectorySettings: jest.fn(),
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
    handleApiError: jest.fn((error) => ({ message: 'Test error', code: '500' })),
    showErrorToast: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockService = directorySettingsService as jest.Mocked<typeof directorySettingsService>;
const mockErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;

const mockSettings = {
  isEnabled: true,
  allowedSharableFields: ['email', 'phoneNumber'],
};

describe('DirectorySettingsPage', () => {
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

    mockService.getDirectorySettings.mockResolvedValue({
      isEnabled: false,
      allowedSharableFields: [],
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      render(<DirectorySettingsPage />);

      expect(screen.getByText(/loading directory settings/i)).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading directory settings/i)).not.toBeInTheDocument();
      });
    });

    it('should not load settings when clubId is 0', () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 1,
          clubId: 0,
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

      render(<DirectorySettingsPage />);

      // Should stay in loading state
      expect(screen.getByText(/loading directory settings/i)).toBeInTheDocument();
      expect(mockService.getDirectorySettings).not.toHaveBeenCalled();
    });
  });

  describe('Page Header', () => {
    it('should display page title', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Member Directory Configuration')).toBeInTheDocument();
      });
    });

    it('should display page description', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/configure whether the member directory is available/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Directory Enable/Disable Toggle', () => {
    it('should display directory toggle switch', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('switch-directory-enabled')).toBeInTheDocument();
      });
    });

    it('should reflect disabled state from API', async () => {
      mockService.getDirectorySettings.mockResolvedValue({
        isEnabled: false,
        allowedSharableFields: [],
      });

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        const toggle = screen.getByTestId('switch-directory-enabled');
        expect(toggle).toHaveAttribute('data-state', 'unchecked');
      });
    });

    it('should reflect enabled state from API', async () => {
      mockService.getDirectorySettings.mockResolvedValue({
        isEnabled: true,
        allowedSharableFields: [],
      });

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        const toggle = screen.getByTestId('switch-directory-enabled');
        expect(toggle).toHaveAttribute('data-state', 'checked');
      });
    });

    it('should toggle directory enabled state when clicked', async () => {
      const user = userEvent.setup();
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('switch-directory-enabled')).toBeInTheDocument();
      });

      const toggle = screen.getByTestId('switch-directory-enabled');
      await user.click(toggle);

      // State should change locally (will be saved on save button click)
      await waitFor(() => {
        expect(toggle).toHaveAttribute('data-state', 'checked');
      });
    });
  });

  describe('Shareable Fields Section', () => {
    it('should hide shareable fields when directory is disabled', async () => {
      mockService.getDirectorySettings.mockResolvedValue({
        isEnabled: false,
        allowedSharableFields: [],
      });

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Shareable Profile Fields')).not.toBeInTheDocument();
      });
    });

    it('should show shareable fields when directory is enabled', async () => {
      mockService.getDirectorySettings.mockResolvedValue({
        isEnabled: true,
        allowedSharableFields: [],
      });

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Shareable Profile Fields')).toBeInTheDocument();
      });
    });

    it('should display email field checkbox', async () => {
      mockService.getDirectorySettings.mockResolvedValue({
        isEnabled: true,
        allowedSharableFields: [],
      });

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-field-email')).toBeInTheDocument();
      });

      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Members can share their email address')).toBeInTheDocument();
    });

    it('should display phone number field checkbox', async () => {
      mockService.getDirectorySettings.mockResolvedValue({
        isEnabled: true,
        allowedSharableFields: [],
      });

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-field-phoneNumber')).toBeInTheDocument();
      });

      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getByText('Members can share their phone number')).toBeInTheDocument();
    });

    it('should check fields that are already allowed', async () => {
      mockService.getDirectorySettings.mockResolvedValue({
        isEnabled: true,
        allowedSharableFields: ['email'],
      });

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        const emailCheckbox = screen.getByTestId('checkbox-field-email');
        expect(emailCheckbox).toHaveAttribute('data-state', 'checked');
      });

      const phoneCheckbox = screen.getByTestId('checkbox-field-phoneNumber');
      expect(phoneCheckbox).toHaveAttribute('data-state', 'unchecked');
    });

    it('should toggle field selection when checkbox is clicked', async () => {
      const user = userEvent.setup();
      mockService.getDirectorySettings.mockResolvedValue({
        isEnabled: true,
        allowedSharableFields: [],
      });

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-field-email')).toBeInTheDocument();
      });

      const emailCheckbox = screen.getByTestId('checkbox-field-email');
      await user.click(emailCheckbox);

      await waitFor(() => {
        expect(emailCheckbox).toHaveAttribute('data-state', 'checked');
      });
    });

    it('should allow multiple fields to be selected', async () => {
      const user = userEvent.setup();
      mockService.getDirectorySettings.mockResolvedValue({
        isEnabled: true,
        allowedSharableFields: [],
      });

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-field-email')).toBeInTheDocument();
      });

      const emailCheckbox = screen.getByTestId('checkbox-field-email');
      const phoneCheckbox = screen.getByTestId('checkbox-field-phoneNumber');

      await user.click(emailCheckbox);
      await user.click(phoneCheckbox);

      await waitFor(() => {
        expect(emailCheckbox).toHaveAttribute('data-state', 'checked');
        expect(phoneCheckbox).toHaveAttribute('data-state', 'checked');
      });
    });
  });

  describe('Save Functionality', () => {
    it('should display save button', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-save-directory-settings')).toBeInTheDocument();
      });
    });

    it('should save settings when save button is clicked', async () => {
      const user = userEvent.setup();
      mockService.updateDirectorySettings.mockResolvedValue(undefined);

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-save-directory-settings')).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId('button-save-directory-settings');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockService.updateDirectorySettings).toHaveBeenCalledWith(1, {
          isEnabled: false,
          allowedSharableFields: [],
        });
      });
    });

    it('should show success toast after successful save', async () => {
      const user = userEvent.setup();
      mockService.updateDirectorySettings.mockResolvedValue(undefined);

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-save-directory-settings')).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId('button-save-directory-settings');
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Directory settings updated');
      });
    });

    it('should save modified settings', async () => {
      const user = userEvent.setup();
      mockService.getDirectorySettings.mockResolvedValue({
        isEnabled: false,
        allowedSharableFields: [],
      });
      mockService.updateDirectorySettings.mockResolvedValue(undefined);

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('switch-directory-enabled')).toBeInTheDocument();
      });

      // Enable directory
      const toggle = screen.getByTestId('switch-directory-enabled');
      await user.click(toggle);

      // Wait for fields to appear
      await waitFor(() => {
        expect(screen.getByTestId('checkbox-field-email')).toBeInTheDocument();
      });

      // Select email field
      const emailCheckbox = screen.getByTestId('checkbox-field-email');
      await user.click(emailCheckbox);

      // Save
      const saveButton = screen.getByTestId('button-save-directory-settings');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockService.updateDirectorySettings).toHaveBeenCalledWith(1, {
          isEnabled: true,
          allowedSharableFields: ['email'],
        });
      });
    });

    it('should show saving state while save is in progress', async () => {
      const user = userEvent.setup();
      let resolveUpdate: () => void;
      const updatePromise = new Promise<void>((resolve) => {
        resolveUpdate = resolve;
      });
      mockService.updateDirectorySettings.mockReturnValue(updatePromise);

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-save-directory-settings')).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId('button-save-directory-settings');
      await user.click(saveButton);

      // Should show saving text
      expect(screen.getByText('Saving...')).toBeInTheDocument();

      // Resolve the promise
      resolveUpdate!();

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('should disable save button while saving', async () => {
      const user = userEvent.setup();
      let resolveUpdate: () => void;
      const updatePromise = new Promise<void>((resolve) => {
        resolveUpdate = resolve;
      });
      mockService.updateDirectorySettings.mockReturnValue(updatePromise);

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-save-directory-settings')).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId('button-save-directory-settings');
      await user.click(saveButton);

      // Button should be disabled
      expect(saveButton).toBeDisabled();

      // Resolve the promise
      resolveUpdate!();

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast when loading fails', async () => {
      mockService.getDirectorySettings.mockRejectedValue(new Error('API Error'));

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading directory settings/i)).not.toBeInTheDocument();
      });

      // ErrorHandler.showErrorToast should have been called
      expect(mockErrorHandler.showErrorToast).toHaveBeenCalled();
    });

    it('should show error toast when save fails', async () => {
      const user = userEvent.setup();
      mockService.updateDirectorySettings.mockRejectedValue(new Error('Save failed'));

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-save-directory-settings')).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId('button-save-directory-settings');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockErrorHandler.showErrorToast).toHaveBeenCalled();
      });
    });
  });

  describe('Information Section', () => {
    it('should display how directory works section', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('How the Member Directory Works')).toBeInTheDocument();
      });
    });

    it('should display directory information bullets', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Members can opt-in to be listed in the directory/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Member names are always visible when they opt-in/i)).toBeInTheDocument();
      expect(screen.getByText(/Members choose which additional fields to share/i)).toBeInTheDocument();
      expect(screen.getByText(/Only members who have opted-in will be visible/i)).toBeInTheDocument();
      expect(screen.getByText(/Members can update their privacy settings/i)).toBeInTheDocument();
    });
  });
});
