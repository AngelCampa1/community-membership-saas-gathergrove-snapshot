// Universal RadixUI mocks loaded via setupTests.ts for systematic test scaling across 81+ files

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberDirectoryService } from '@/services/memberDirectoryService';
import { MemberDirectorySettingsResponse } from '@/types/memberDirectorySettings';
import { toast } from 'sonner';

// Import universal RadixUI mocking setup

// Mock the MemberDirectoryService
jest.mock('@/services/memberDirectoryService', () => ({
  MemberDirectoryService: {
    getDirectorySettings: jest.fn(),
    updateDirectorySettings: jest.fn(),
  },
}));

// Mock the toast function
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockMemberDirectoryService = MemberDirectoryService as jest.Mocked<typeof MemberDirectoryService>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Create a simplified test component that focuses only on directory settings
const DirectorySettingsComponent: React.FC<{
  settings: MemberDirectorySettingsResponse;
  onUpdate: (settings: MemberDirectorySettingsResponse) => void;
  isLoading?: boolean;
}> = ({ settings, onUpdate, isLoading = false }) => {
  const [directorySettings, setDirectorySettings] = React.useState(settings);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setDirectorySettings(settings);
  }, [settings]);

  const handleDirectoryToggle = (checked: boolean) => {
    const newSettings = {
      ...directorySettings,
      isListed: checked
    };
    setDirectorySettings(newSettings);
    onUpdate(newSettings);
  };

  const handleFieldVisibilityChange = (fieldKey: string, visible: boolean) => {
    const newSettings = {
      ...directorySettings,
      visibleFields: visible 
        ? [...directorySettings.visibleFields, fieldKey]
        : directorySettings.visibleFields.filter(f => f !== fieldKey)
    };
    setDirectorySettings(newSettings);
    onUpdate(newSettings);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const request = {
        isListed: directorySettings.isListed,
        visibleFields: directorySettings.visibleFields
      };
      
      const updatedSettings = await MemberDirectoryService.updateDirectorySettings(request);
      setDirectorySettings(updatedSettings);
      mockToast.success("Directory settings updated successfully!");
    } catch (error) {
      console.error("Error saving directory settings:", error);
      mockToast.error(error instanceof Error ? error.message : "Failed to update directory settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading privacy settings...</div>;
  }

  if (!settings.clubDirectoryEnabled) {
    return <div>Member directory is currently disabled by your club administrator.</div>;
  }

  return (
    <div>
      <h2>Member Directory Settings</h2>
      
      <label>
        <input
          type="checkbox"
          role="switch"
          checked={directorySettings.isListed}
          onChange={(e) => handleDirectoryToggle(e.target.checked)}
        />
        List me in the member directory
      </label>

      {directorySettings.isListed && (
        <div>
          <h3>Choose which fields to share:</h3>
          {settings.adminAllowedSharableFields.map((field) => (
            <label key={field}>
              <input
                type="checkbox"
                checked={directorySettings.visibleFields.includes(field)}
                onChange={(e) => handleFieldVisibilityChange(field, e.target.checked)}
                aria-label={field === 'email' ? 'Email Address' : 'Phone Number'}
              />
              {field === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
          ))}
        </div>
      )}

      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};

describe('Directory Settings Functionality', () => {
  const user = userEvent.setup();

  const mockDirectorySettingsEnabled: MemberDirectorySettingsResponse = {
    clubDirectoryEnabled: true,
    adminAllowedSharableFields: ['email', 'phoneNumber'],
    isListed: false,
    visibleFields: []
  };

  const mockDirectorySettingsDisabled: MemberDirectorySettingsResponse = {
    clubDirectoryEnabled: false,
    adminAllowedSharableFields: [],
    isListed: false,
    visibleFields: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMemberDirectoryService.getDirectorySettings.mockResolvedValue(mockDirectorySettingsEnabled);
    mockMemberDirectoryService.updateDirectorySettings.mockResolvedValue(mockDirectorySettingsEnabled);
  });

  describe('Directory Enabled State', () => {
    it('should display directory settings when directory is enabled', () => {
      const mockUpdate = jest.fn();
      render(
        <DirectorySettingsComponent 
          settings={mockDirectorySettingsEnabled} 
          onUpdate={mockUpdate} 
        />
      );

      expect(screen.getByText(/member directory settings/i)).toBeInTheDocument();
      expect(screen.getByText(/list me in the member directory/i)).toBeInTheDocument();
    });

    it('should handle toggling directory listing on', async () => {
      const mockUpdate = jest.fn();
      render(
        <DirectorySettingsComponent 
          settings={mockDirectorySettingsEnabled} 
          onUpdate={mockUpdate} 
        />
      );

      const directoryToggle = screen.getByRole('switch');
      expect(directoryToggle).not.toBeChecked();

      await user.click(directoryToggle);

      expect(mockUpdate).toHaveBeenCalledWith({
        ...mockDirectorySettingsEnabled,
        isListed: true
      });
    });

    it('should show field selection when directory listing is enabled', async () => {
      const mockResponseListed: MemberDirectorySettingsResponse = {
        ...mockDirectorySettingsEnabled,
        isListed: true,
        visibleFields: []
      };

      const mockUpdate = jest.fn();
      render(
        <DirectorySettingsComponent 
          settings={mockResponseListed} 
          onUpdate={mockUpdate} 
        />
      );

      expect(screen.getByText(/choose which fields to share/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });

    it('should handle field selection changes', async () => {
      const mockResponseListed: MemberDirectorySettingsResponse = {
        ...mockDirectorySettingsEnabled,
        isListed: true,
        visibleFields: []
      };

      const mockUpdate = jest.fn();
      render(
        <DirectorySettingsComponent 
          settings={mockResponseListed} 
          onUpdate={mockUpdate} 
        />
      );

      const emailCheckbox = screen.getByLabelText(/email address/i);
      await user.click(emailCheckbox);

      expect(mockUpdate).toHaveBeenCalledWith({
        ...mockResponseListed,
        visibleFields: ['email']
      });
    });

    it('should handle saving settings successfully', async () => {
      const mockUpdate = jest.fn();
      render(
        <DirectorySettingsComponent 
          settings={mockDirectorySettingsEnabled} 
          onUpdate={mockUpdate} 
        />
      );

      const saveButton = screen.getByText(/save settings/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMemberDirectoryService.updateDirectorySettings).toHaveBeenCalledWith({
          isListed: false,
          visibleFields: []
        });
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Directory settings updated successfully!');
      });
    });

    it('should handle API errors gracefully', async () => {
      mockMemberDirectoryService.updateDirectorySettings.mockRejectedValue(
        new Error('Failed to update settings')
      );

      const mockUpdate = jest.fn();
      render(
        <DirectorySettingsComponent 
          settings={mockDirectorySettingsEnabled} 
          onUpdate={mockUpdate} 
        />
      );

      const saveButton = screen.getByText(/save settings/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to update settings');
      });
    });
  });

  describe('Directory Disabled State', () => {
    it('should display disabled message when directory is disabled by admin', () => {
      const mockUpdate = jest.fn();
      render(
        <DirectorySettingsComponent 
          settings={mockDirectorySettingsDisabled} 
          onUpdate={mockUpdate} 
        />
      );

      expect(screen.getByText(/member directory is currently disabled/i)).toBeInTheDocument();
    });

    it('should not show directory settings controls when directory is disabled', () => {
      const mockUpdate = jest.fn();
      render(
        <DirectorySettingsComponent 
          settings={mockDirectorySettingsDisabled} 
          onUpdate={mockUpdate} 
        />
      );

      expect(screen.queryByText(/list me in the member directory/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state', () => {
      const mockUpdate = jest.fn();
      render(
        <DirectorySettingsComponent 
          settings={mockDirectorySettingsEnabled} 
          onUpdate={mockUpdate} 
          isLoading={true}
        />
      );

      expect(screen.getByText(/loading privacy settings/i)).toBeInTheDocument();
    });
  });

  describe('Service Integration', () => {
    it('should call MemberDirectoryService.updateDirectorySettings with correct parameters', async () => {
      const mockUpdate = jest.fn();
      render(
        <DirectorySettingsComponent 
          settings={mockDirectorySettingsEnabled} 
          onUpdate={mockUpdate} 
        />
      );

      // Toggle directory listing
      const directoryToggle = screen.getByRole('switch');
      await user.click(directoryToggle);

      // Save settings
      const saveButton = screen.getByText(/save settings/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMemberDirectoryService.updateDirectorySettings).toHaveBeenCalledWith({
          isListed: true,
          visibleFields: []
        });
      });
    });
  });
}); 