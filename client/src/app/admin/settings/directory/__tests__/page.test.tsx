import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils/testHelpers';
import DirectorySettingsPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { directorySettingsService } from '@/services/directorySettingsService';
import { toast } from 'sonner';
import userEvent from '@testing-library/user-event';

// CRITICAL: Apply EXACT proven RadixUI React.forwardRef pattern for 100% success
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {})});
    }
    return React.createElement('div', props, children);
  },
  Slottable: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

jest.mock('@radix-ui/react-switch', () => ({
  Root: React.forwardRef<HTMLButtonElement, any>(function SwitchRoot({ checked, onCheckedChange, className, ...props }, ref) {
    return React.createElement('button', { 
      ref, 
      role: 'switch',
      'aria-checked': checked,
      className: `switch ${className || ''}`,
      'data-testid': 'switch',
      onClick: () => onCheckedChange?.(!checked),
      ...props 
    });
  }),
  Thumb: React.forwardRef<HTMLSpanElement, any>(function SwitchThumb({ className, ...props }, ref) {
    return React.createElement('span', { ref, className: `switch-thumb ${className || ''}`, 'data-testid': 'switch-thumb', ...props });
  }),
}));

jest.mock('@radix-ui/react-select', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(function SelectRoot({ children, value, onValueChange, ...props }, ref) {
    return React.createElement('div', { ref, 'data-testid': 'select-root', 'data-value': value, ...props }, children);
  }),
  Trigger: React.forwardRef<HTMLButtonElement, any>(function SelectTrigger({ children, className, ...props }, ref) {
    return React.createElement('button', { ref, className: `select-trigger ${className || ''}`, 'data-testid': 'select-trigger', ...props }, children);
  }),
  Value: React.forwardRef<HTMLSpanElement, any>(function SelectValue({ placeholder, className, ...props }, ref) {
    return React.createElement('span', { ref, className: `select-value ${className || ''}`, 'data-testid': 'select-value', ...props }, placeholder);
  }),
  Content: React.forwardRef<HTMLDivElement, any>(function SelectContent({ children, className, ...props }, ref) {
    return React.createElement('div', { ref, className: `select-content ${className || ''}`, 'data-testid': 'select-content', ...props }, children);
  }),
  Item: React.forwardRef<HTMLDivElement, any>(function SelectItem({ children, value, className, ...props }, ref) {
    return React.createElement('div', { ref, className: `select-item ${className || ''}`, 'data-testid': 'select-item', 'data-value': value, ...props }, children);
  }),
  Portal: ({ children }: any) => React.createElement('div', { 'data-testid': 'select-portal' }, children),
  Viewport: React.forwardRef<HTMLDivElement, any>(function SelectViewport({ children, className, ...props }, ref) {
    return React.createElement('div', { ref, className: `select-viewport ${className || ''}`, 'data-testid': 'select-viewport', ...props }, children);
  }),
}));

jest.mock('@/components/ui/card', () => ({
  Card: React.forwardRef<HTMLDivElement, any>(function Card({ children, className, ...props }, ref) {
    return React.createElement('div', { ref, className: `card ${className || ''}`, 'data-testid': 'card', ...props }, children);
  }),
  CardHeader: React.forwardRef<HTMLDivElement, any>(function CardHeader({ children, className, ...props }, ref) {
    return React.createElement('div', { ref, className: `card-header ${className || ''}`, 'data-testid': 'card-header', ...props }, children);
  }),
  CardTitle: React.forwardRef<HTMLHeadingElement, any>(function CardTitle({ children, className, ...props }, ref) {
    return React.createElement('h3', { ref, className: `card-title ${className || ''}`, 'data-testid': 'card-title', ...props }, children);
  }),
  CardDescription: React.forwardRef<HTMLParagraphElement, any>(function CardDescription({ children, className, ...props }, ref) {
    return React.createElement('p', { ref, className: `card-description ${className || ''}`, 'data-testid': 'card-description', ...props }, children);
  }),
  CardContent: React.forwardRef<HTMLDivElement, any>(function CardContent({ children, className, ...props }, ref) {
    return React.createElement('div', { ref, className: `card-content ${className || ''}`, 'data-testid': 'card-content', ...props }, children);
  }),
  CardFooter: React.forwardRef<HTMLDivElement, any>(function CardFooter({ children, className, ...props }, ref) {
    return React.createElement('div', { ref, className: `card-footer ${className || ''}`, 'data-testid': 'card-footer', ...props }, children);
  }),
}));

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(function Button({ children, className, variant, size, asChild, ...props }, ref) {
    if (asChild && children) {
      return React.createElement(React.Fragment, null, children);
    }
    return React.createElement('button', { 
      ref, 
      className: `button ${variant || ''} ${size || ''} ${className || ''}`, 
      'data-testid': 'button', 
      ...props 
    }, children);
  })
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: React.forwardRef<HTMLButtonElement, any>(function Switch({ checked, onCheckedChange, className, ...props }, ref) {
    return React.createElement('button', { 
      ref, 
      role: 'switch',
      'aria-checked': checked,
      className: `switch ${className || ''}`,
      'data-testid': 'switch',
      onClick: () => onCheckedChange?.(!checked),
      ...props 
    });
  })
}));

jest.mock('@/components/ui/label', () => ({
  Label: React.forwardRef<HTMLLabelElement, any>(function Label({ className, children, ...props }, ref) {
    return React.createElement('label', {
      ref,
      className: `label ${className || ''}`,
      'data-testid': 'label',
      ...props
    }, children);
  })
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: React.forwardRef<HTMLButtonElement, any>(function Checkbox({ checked, onCheckedChange, className, ...props }, ref) {
    return React.createElement('button', {
      ref,
      role: 'checkbox',
      'aria-checked': checked,
      className: `checkbox ${className || ''}`,
      'data-testid': props['data-testid'] || 'checkbox',
      onClick: () => onCheckedChange?.(!checked),
      ...props
    });
  })
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Settings: (props: any) => React.createElement('div', { 'data-testid': 'settings-icon', ...props }),
  Users: (props: any) => React.createElement('div', { 'data-testid': 'users-icon', ...props }),
  Save: (props: any) => React.createElement('div', { 'data-testid': 'save-icon', ...props }),
  Eye: (props: any) => React.createElement('div', { 'data-testid': 'eye-icon', ...props }),
  EyeOff: (props: any) => React.createElement('div', { 'data-testid': 'eye-off-icon', ...props }),
  Shield: (props: any) => React.createElement('div', { 'data-testid': 'shield-icon', ...props }),
  Globe: (props: any) => React.createElement('div', { 'data-testid': 'globe-icon', ...props }),
}));

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/directorySettingsService');
jest.mock('sonner');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockDirectorySettingsService = directorySettingsService as jest.Mocked<typeof directorySettingsService>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('Directory Settings Page', () => {
  const mockUser = {
    userId: 1,
    email: 'admin@example.com',
    fullName: 'Admin User',
    clubId: 1,
    clubName: 'Test Club',
    clubTier: 'Grow',
    role: 'Admin',
    isOnboardingCompleted: true,
  };

  const mockSettings = {
    isEnabled: true,
    allowedSharableFields: ['email', 'phoneNumber']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      clearError: jest.fn(),
      retryLastOperation: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshSession: jest.fn(),
      completeOnboarding: jest.fn(),
    });

    // Mock the service to return settings
    mockDirectorySettingsService.getDirectorySettings = jest.fn().mockResolvedValue(mockSettings);
    mockDirectorySettingsService.updateDirectorySettings = jest.fn().mockResolvedValue(mockSettings);
  });

  describe('Page Structure', () => {
    it('renders the page title and description', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Member Directory Settings')).toBeInTheDocument();
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Member Directory Configuration')).toBeInTheDocument();
      expect(screen.getByText(/Configure whether the member directory is available/i)).toBeInTheDocument();
    });

    it('displays directory enable toggle section', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Enable Member Directory for this Club')).toBeInTheDocument();
      });
      expect(screen.getByText(/Allow club members to view and search the member directory/i)).toBeInTheDocument();
    });

    it('displays shareable profile fields section when enabled', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Shareable Profile Fields')).toBeInTheDocument();
      });
      expect(screen.getByText(/Select which member profile fields can be optionally shared/i)).toBeInTheDocument();
    });
  });

  describe('Directory Enable Controls', () => {
    it('displays enable directory toggle switch', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        const toggleSwitch = screen.getByTestId('switch-directory-enabled');
        expect(toggleSwitch).toBeInTheDocument();
      });
    });

    it('displays proper label for directory enable setting', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Enable Member Directory for this Club')).toBeInTheDocument();
      });
    });

    it('toggle switch reflects the current enabled state', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        const toggleSwitch = screen.getByTestId('switch-directory-enabled');
        expect(toggleSwitch).toHaveAttribute('aria-checked', 'true');
      });
    });
  });

  describe('Member Information Controls', () => {
    it('displays field checkboxes when directory is enabled', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        const emailCheckbox = screen.getByTestId('checkbox-field-email');
        expect(emailCheckbox).toBeInTheDocument();
      });

      const phoneCheckbox = screen.getByTestId('checkbox-field-phoneNumber');
      expect(phoneCheckbox).toBeInTheDocument();
    });

    it('displays proper labels for field settings', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Email Address')).toBeInTheDocument();
      });
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getByText('Members can share their email address')).toBeInTheDocument();
      expect(screen.getByText('Members can share their phone number')).toBeInTheDocument();
    });

    it('does not display field checkboxes when directory is disabled', async () => {
      mockDirectorySettingsService.getDirectorySettings = jest.fn().mockResolvedValue({
        isEnabled: false,
        allowedSharableFields: []
      });

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Member Directory Settings')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('checkbox-field-email')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkbox-field-phoneNumber')).not.toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('displays save button', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        const saveButton = screen.getByTestId('button-save-directory-settings');
        expect(saveButton).toBeInTheDocument();
      });
    });

    it('handles save action when button is clicked', async () => {
      const user = userEvent.setup();
      mockDirectorySettingsService.updateDirectorySettings = jest.fn().mockResolvedValue(mockSettings);

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-save-directory-settings')).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId('button-save-directory-settings');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockDirectorySettingsService.updateDirectorySettings).toHaveBeenCalledWith(1, {
          isEnabled: true,
          allowedSharableFields: ['email', 'phoneNumber']
        });
      });
    });

    it('shows success toast on successful save', async () => {
      const user = userEvent.setup();
      mockToast.success = jest.fn();

      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-save-directory-settings')).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId('button-save-directory-settings');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Directory settings updated');
      });
    });
  });

  describe('Loading States', () => {
    it('displays loading state before settings are loaded', () => {
      mockDirectorySettingsService.getDirectorySettings = jest.fn(() =>
        new Promise(() => {}) // Never resolves to keep in loading state
      );

      render(<DirectorySettingsPage />);

      expect(screen.getByText('Member Directory Settings')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders settings after loading completes', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Member Directory Configuration')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Member Directory Settings' })).toBeInTheDocument();
      });
    });

    it('provides accessible labels for form controls', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        const labels = screen.getAllByTestId('label');
        expect(labels.length).toBeGreaterThan(0);
      });
    });

    it('switch has proper aria attributes', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        const toggleSwitch = screen.getByTestId('switch-directory-enabled');
        expect(toggleSwitch).toHaveAttribute('role', 'switch');
        expect(toggleSwitch).toHaveAttribute('aria-checked');
      });
    });

    it('checkboxes have proper aria attributes', async () => {
      render(<DirectorySettingsPage />);

      await waitFor(() => {
        const emailCheckbox = screen.getByTestId('checkbox-field-email');
        expect(emailCheckbox).toHaveAttribute('role', 'checkbox');
        expect(emailCheckbox).toHaveAttribute('aria-checked');
      });
    });
  });
});