/**
 * @jest-environment jsdom
 *
 * Branding Settings Page Tests
 *
 * Tests branding configuration page following boundary mocking pattern:
 * - MSW for HTTP mocking only
 * - Real component rendering
 * - Real form validation and state management
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrandingSettingsPage from '../page';
import { brandingService } from '@/services/brandingService';
import { themeService } from '@/services/themeService';

// Boundary mocks: the page's HTTP boundary is the branding/theme services.
// (The shared MSW harness overrides global.fetch and does not intercept the
// axios requests these services make, so service-level mocking is the only
// deterministic boundary for this page.)
jest.mock('@/services/brandingService', () => ({
  brandingService: {
    getBrandSettings: jest.fn(),
    saveBrandSettings: jest.fn(),
    uploadLogo: jest.fn(),
    uploadFavicon: jest.fn(),
    deleteBrandSettings: jest.fn(),
    createBrandSettings: jest.fn(),
  },
}));

jest.mock('@/services/themeService', () => ({
  themeService: {
    applyTheme: jest.fn(),
  },
}));

const mockBrandingService = brandingService as jest.Mocked<typeof brandingService>;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/admin/settings/branding',
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      userId: 1,
      clubId: 1,
      role: 'admin',
      email: 'admin@test.com',
      firstName: 'Test',
      lastName: 'Admin',
      fullName: 'Test Admin',
      clubName: 'Test Club',
      clubTier: 'Unlimited',
    },
    loading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    refreshSession: jest.fn(),
    completeOnboarding: jest.fn(),
    clearError: jest.fn(),
    retryLastOperation: jest.fn(),
  }),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

describe('BrandingSettingsPage', () => {
  const mockBrandSettings = {
    clubId: 1,
    primaryColor: '#4a9a72',
    secondaryColor: '#4a5a52',
    hideGatherGroveBranding: false,
    customClubName: 'Loaded Club Name',
    logoUrl: 'https://example.com/logo.png',
    faviconUrl: 'https://example.com/favicon.ico',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockBrandingService.getBrandSettings.mockResolvedValue(mockBrandSettings);
    mockBrandingService.saveBrandSettings.mockResolvedValue(mockBrandSettings);
    mockBrandingService.uploadLogo.mockResolvedValue({
      logoUrl: 'https://example.com/logo.png',
      uploadedAt: '2024-01-01T00:00:00Z',
      fileSizeBytes: 102400,
      contentType: 'image/png',
    });
    mockBrandingService.uploadFavicon.mockResolvedValue({
      faviconUrl: 'https://example.com/favicon.ico',
      uploadedAt: '2024-01-01T00:00:00Z',
      fileSizeBytes: 51200,
      contentType: 'image/x-icon',
    });
  });

  describe('Rendering', () => {
    it('should render branding settings page', async () => {
      render(<BrandingSettingsPage />);
      await waitFor(() => {
        expect(screen.getByText(/white-label branding/i)).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<BrandingSettingsPage />);
      expect(screen.getByText(/loading branding settings/i)).toBeInTheDocument();
    });

    it('should load and display existing brand settings', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Loaded Club Name')).toBeInTheDocument();
      });
    });

    it('should display color pickers', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getAllByText(/primary color/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/secondary color/i)[0]).toBeInTheDocument();
      });
    });

    it('should display logo uploader section', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/organization logo/i)).toBeInTheDocument();
      });
    });

    it('should display brand preview', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getAllByText(/live preview/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Form Interactions', () => {
    it('should update club name', async () => {
      const user = userEvent.setup();

      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Loaded Club Name')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Loaded Club Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Club Name');

      expect(nameInput).toHaveValue('New Club Name');
    });

    it('should render color scheme picker', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getAllByText(/primary color/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/secondary color/i)[0]).toBeInTheDocument();
      });
    });

    it('should toggle hide GatherGrove branding option', async () => {
      const user = userEvent.setup();

      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/hide.*powered by gathergrove.*branding/i)).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /hide.*powered by gathergrove.*branding/i });
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });
  });

  describe('Validation', () => {
    it('should validate club name is required', async () => {
      const user = userEvent.setup();

      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Loaded Club Name')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Loaded Club Name');
      await user.clear(nameInput);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/club name.*required/i)).toBeInTheDocument();
      });
    });

    it('should display validation errors when present', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/white-label branding/i)).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('should render save button for branding settings', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });
    });

    it('should show loading state during save', async () => {
      const user = userEvent.setup();

      // Keep the save in-flight so the button stays in its loading state.
      mockBrandingService.saveBrandSettings.mockReturnValue(
        new Promise(() => {})
      );

      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Loaded Club Name')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
    });

    it('should show save button', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });
    });

    it('should handle save error gracefully', async () => {
      const user = userEvent.setup();

      mockBrandingService.saveBrandSettings.mockRejectedValue(
        new Error('Error saving branding settings')
      );

      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Loaded Club Name')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/error.*saving.*branding/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle loading error gracefully', async () => {
      mockBrandingService.getBrandSettings.mockRejectedValue(
        new Error('Failed to load branding settings')
      );

      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/white-label branding/i)).toBeInTheDocument();
      });

      // Should still render with default values
      expect(screen.getAllByText(/primary color/i)[0]).toBeInTheDocument();

      // And surface a visible warning so the user knows the shown values are
      // defaults (not their saved settings) and saving could overwrite them.
      await waitFor(() => {
        expect(
          screen.getByText(/couldn't load your saved branding settings/i)
        ).toBeInTheDocument();
      });
    });

    it('should use default values when no settings exist', async () => {
      mockBrandingService.getBrandSettings.mockResolvedValue(
        null as unknown as typeof mockBrandSettings
      );

      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getAllByText(/primary color/i)[0]).toBeInTheDocument();
      });

      // No load error should be shown when the API simply returns no settings.
      expect(
        screen.queryByText(/couldn't load your saved branding settings/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Logo Upload', () => {
    it('should show logo upload section', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/organization logo/i)).toBeInTheDocument();
      });
    });

    it('should display logo upload input', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        const logoInput = screen.getByLabelText(/upload logo/i);
        expect(logoInput).toBeInTheDocument();
      });
    });
  });

  describe('Tier-specific Features', () => {
    it('should enable hide branding option for Unlimited tier', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox', { name: /hide.*powered by gathergrove.*branding/i });
        expect(checkbox).not.toBeDisabled();
      });
    });
  });

  describe('Navigation', () => {
    it('should display back button', async () => {
      render(<BrandingSettingsPage />);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /back to settings/i })).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Preview', () => {
    it('should render live preview section', async () => {
      render(<BrandingSettingsPage />);

      await waitFor(() => {
        expect(screen.getAllByText(/live preview/i).length).toBeGreaterThan(0);
      });
    });
  });
});
