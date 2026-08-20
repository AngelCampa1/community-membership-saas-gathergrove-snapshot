import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'next/navigation';
import LocationBrandingPage from '../page';
import { locationBrandingService } from '@/lib/api/locationBrandingService';
import { locationService } from '@/lib/api/locationService';
import { useToast } from '@/hooks/useToast';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

// Mock services
jest.mock('@/lib/api/locationBrandingService');
jest.mock('@/lib/api/locationService');

// Mock toast hook
jest.mock('@/hooks/useToast');

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('LocationBrandingPage', () => {
  const mockUseParams = useParams as jest.Mock;
  const mockUseToast = useToast as jest.Mock;
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  };

  const mockLocation = {
    locationId: 1,
    clubId: 1,
    locationName: 'Main Office',
    address: '123 Main St',
    city: 'Portland',
    state: 'OR',
    postalCode: '97201',
    country: 'US',
    phoneNumber: '555-0100',
    emailAddress: 'main@club.com',
    isPrimary: true,
    isActive: true,
    capacity: 100,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockBranding = {
    locationId: 1,
    customLogoUrl: 'https://example.com/logo.png',
    customNameOverride: 'Custom Location Name',
    colorScheme: JSON.stringify({
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
    }),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ locationId: '1' });
    mockUseToast.mockReturnValue(mockToast);

    (locationService.getLocation as jest.Mock).mockResolvedValue(mockLocation);
    (locationBrandingService.getLocationBranding as jest.Mock).mockResolvedValue(mockBranding);
  });

  describe('Loading State', () => {
    it('should show loading message initially', () => {
      render(<LocationBrandingPage />);

      expect(screen.getByText('Loading branding settings...')).toBeInTheDocument();
    });

    it('should hide loading message after data loads', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading branding settings...')).not.toBeInTheDocument();
      });
    });

    it('should load location data on mount', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(locationService.getLocation).toHaveBeenCalledWith(1);
      });
    });

    it('should load branding data on mount', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(locationBrandingService.getLocationBranding).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Invalid Location ID', () => {
    it('should show error for undefined locationId', () => {
      mockUseParams.mockReturnValue({ locationId: undefined });

      render(<LocationBrandingPage />);

      expect(screen.getByText('Invalid location ID')).toBeInTheDocument();
    });

    it('should show error for null locationId', () => {
      mockUseParams.mockReturnValue({ locationId: null });

      render(<LocationBrandingPage />);

      expect(screen.getByText('Invalid location ID')).toBeInTheDocument();
    });

    it('should show error for invalid locationId string', () => {
      mockUseParams.mockReturnValue({ locationId: 'invalid' });

      render(<LocationBrandingPage />);

      expect(screen.getByText('Invalid location ID')).toBeInTheDocument();
    });
  });

  describe('Page Header', () => {
    it('should render page title', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /location branding/i })).toBeInTheDocument();
      });
    });

    it('should render location name in description', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByText(/customize the appearance for main office/i)).toBeInTheDocument();
      });
    });

    it('should render info alert', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByText(/location-specific branding allows/i)).toBeInTheDocument();
      });
    });
  });

  describe('Logo & Name Section', () => {
    it('should render logo URL input', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/custom logo url/i)).toBeInTheDocument();
      });
    });

    it('should render custom name input', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/custom display name/i)).toBeInTheDocument();
      });
    });

    it('should populate logo URL from branding data', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        const input = screen.getByLabelText(/custom logo url/i) as HTMLInputElement;
        expect(input.value).toBe('https://example.com/logo.png');
      });
    });

    it('should populate custom name from branding data', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        const input = screen.getByLabelText(/custom display name/i) as HTMLInputElement;
        expect(input.value).toBe('Custom Location Name');
      });
    });

    it('should update logo URL on input change', async () => {
      const user = userEvent.setup();
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/custom logo url/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/custom logo url/i);
      await user.clear(input);
      await user.type(input, 'https://new-logo.com/logo.png');

      expect(input).toHaveValue('https://new-logo.com/logo.png');
    });

    it('should update custom name on input change', async () => {
      const user = userEvent.setup();
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/custom display name/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/custom display name/i);
      await user.clear(input);
      await user.type(input, 'New Custom Name');

      expect(input).toHaveValue('New Custom Name');
    });
  });

  describe('Color Scheme Section', () => {
    it('should render primary color input', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/primary color/i)).toBeInTheDocument();
      });
    });

    it('should render secondary color input', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/secondary color/i)).toBeInTheDocument();
      });
    });

    it('should render accent color input', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/accent color/i)).toBeInTheDocument();
      });
    });

    it('should populate primary color from branding data', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        const input = screen.getByLabelText(/primary color/i) as HTMLInputElement;
        expect(input.value).toBe('#ff0000');
      });
    });

    it('should populate secondary color from branding data', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        const input = screen.getByLabelText(/secondary color/i) as HTMLInputElement;
        expect(input.value).toBe('#00ff00');
      });
    });

    it('should populate accent color from branding data', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        const input = screen.getByLabelText(/accent color/i) as HTMLInputElement;
        expect(input.value).toBe('#0000ff');
      });
    });
  });

  describe('Preview Section', () => {
    it('should render preview card', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        const previews = screen.getAllByText(/preview/i);
        expect(previews.length).toBeGreaterThan(0);
      });
    });

    it('should show logo preview when URL is provided', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        const img = screen.getByAltText(/location logo/i);
        expect(img).toHaveAttribute('src', 'https://example.com/logo.png');
      });
    });

    it('should show custom name in preview', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByText('Custom Location Name')).toBeInTheDocument();
      });
    });

    it('should show default location name when no custom name', async () => {
      (locationBrandingService.getLocationBranding as jest.Mock).mockResolvedValue({
        ...mockBranding,
        customNameOverride: '',
      });

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });
    });

    it('should render color palette preview', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        const primaryElements = screen.getAllByText(/primary/i);
        const secondaryElements = screen.getAllByText(/secondary/i);
        const accentElements = screen.getAllByText(/accent/i);
        expect(primaryElements.length).toBeGreaterThan(0);
        expect(secondaryElements.length).toBeGreaterThan(0);
        expect(accentElements.length).toBeGreaterThan(0);
      });
    });

    it('should render sample component with colors', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByText(/sample card title/i)).toBeInTheDocument();
        expect(screen.getByText(/action button/i)).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('should render save button', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save branding/i })).toBeInTheDocument();
      });
    });

    it('should call service when save button is clicked', async () => {
      const user = userEvent.setup();
      (locationBrandingService.updateLocationBranding as jest.Mock).mockResolvedValue({});

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save branding/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save branding/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(locationBrandingService.updateLocationBranding).toHaveBeenCalledWith(1, {
          customLogoUrl: 'https://example.com/logo.png',
          customNameOverride: 'Custom Location Name',
          colorScheme: JSON.stringify({
            primary: '#ff0000',
            secondary: '#00ff00',
            accent: '#0000ff',
          }),
        });
      });
    });

    it('should show success toast on successful save', async () => {
      const user = userEvent.setup();
      (locationBrandingService.updateLocationBranding as jest.Mock).mockResolvedValue({});

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save branding/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save branding/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Location branding has been saved successfully');
      });
    });

    it('should show saving state while saving', async () => {
      const user = userEvent.setup();
      (locationBrandingService.updateLocationBranding as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save branding/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save branding/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
      });
    });

    it('should disable save button while saving', async () => {
      const user = userEvent.setup();
      (locationBrandingService.updateLocationBranding as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save branding/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save branding/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });

    it('should show error toast on save failure', async () => {
      const user = userEvent.setup();
      (locationBrandingService.updateLocationBranding as jest.Mock).mockRejectedValue({
        response: {
          data: {
            message: 'Failed to update branding',
          },
        },
      });

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save branding/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save branding/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to update branding');
      });
    });

    it('should reload branding data after successful save', async () => {
      const user = userEvent.setup();
      (locationBrandingService.updateLocationBranding as jest.Mock).mockResolvedValue({});

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save branding/i })).toBeInTheDocument();
      });

      // Clear previous calls
      jest.clearAllMocks();

      const saveButton = screen.getByRole('button', { name: /save branding/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(locationBrandingService.getLocationBranding).toHaveBeenCalledWith(1);
      });
    });

    it('should save empty strings as undefined', async () => {
      const user = userEvent.setup();
      (locationBrandingService.getLocationBranding as jest.Mock).mockResolvedValue({
        locationId: 1,
        customLogoUrl: '',
        customNameOverride: '',
        colorScheme: JSON.stringify({
          primary: '#4a9a72',
          secondary: '#4a5a52',
          accent: '#6b7d75',
        }),
      });
      (locationBrandingService.updateLocationBranding as jest.Mock).mockResolvedValue({});

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save branding/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save branding/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(locationBrandingService.updateLocationBranding).toHaveBeenCalledWith(1, {
          customLogoUrl: undefined,
          customNameOverride: undefined,
          colorScheme: expect.any(String),
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle location load error gracefully', async () => {
      (locationService.getLocation as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading branding settings...')).not.toBeInTheDocument();
      });
    });

    it('should handle 404 branding error gracefully (branding doesnt exist yet)', async () => {
      (locationBrandingService.getLocationBranding as jest.Mock).mockRejectedValue({
        response: { status: 404 },
      });

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading branding settings...')).not.toBeInTheDocument();
      });

      // Should still render the page
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /location branding/i })).toBeInTheDocument();
      });
    });

    it('should handle branding load error for non-404 status', async () => {
      (locationBrandingService.getLocationBranding as jest.Mock).mockRejectedValue({
        response: { status: 500 },
      });

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading branding settings...')).not.toBeInTheDocument();
      });
    });

    it('should handle malformed color scheme JSON gracefully', async () => {
      (locationBrandingService.getLocationBranding as jest.Mock).mockResolvedValue({
        ...mockBranding,
        colorScheme: 'invalid json',
      });

      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /location branding/i })).toBeInTheDocument();
      });
    });

    it('should still populate logo and name when branding has logo/name but no color scheme', async () => {
      // H-002: previously the entire form update was nested inside `if (data.colorScheme)`,
      // so logo/name from saved branding were dropped whenever colorScheme was absent.
      (locationBrandingService.getLocationBranding as jest.Mock).mockResolvedValue({
        locationId: 1,
        customLogoUrl: 'https://example.com/no-colors-logo.png',
        customNameOverride: 'Logo Only Branding',
        colorScheme: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      render(<LocationBrandingPage />);

      await waitFor(() => {
        const logo = screen.getByLabelText(/custom logo url/i) as HTMLInputElement;
        expect(logo.value).toBe('https://example.com/no-colors-logo.png');
      });
      const name = screen.getByLabelText(/custom display name/i) as HTMLInputElement;
      expect(name.value).toBe('Logo Only Branding');
      // Colors fall back to defaults since none were saved.
      expect((screen.getByLabelText(/primary color/i) as HTMLInputElement).value).toBe('#4a9a72');
    });

    it('preserves default colors and still applies logo/name when color JSON is malformed', async () => {
      // Guards against the stale-closure spread that previously rebuilt formData
      // from a captured (initial) value instead of the latest state.
      (locationBrandingService.getLocationBranding as jest.Mock).mockResolvedValue({
        locationId: 1,
        customLogoUrl: 'https://example.com/bad-colors-logo.png',
        customNameOverride: 'Bad Colors Branding',
        colorScheme: '{not valid json',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      render(<LocationBrandingPage />);

      await waitFor(() => {
        const logo = screen.getByLabelText(/custom logo url/i) as HTMLInputElement;
        expect(logo.value).toBe('https://example.com/bad-colors-logo.png');
      });
      expect((screen.getByLabelText(/custom display name/i) as HTMLInputElement).value).toBe('Bad Colors Branding');
      expect((screen.getByLabelText(/primary color/i) as HTMLInputElement).value).toBe('#4a9a72');
      expect((screen.getByLabelText(/secondary color/i) as HTMLInputElement).value).toBe('#4a5a52');
      expect((screen.getByLabelText(/accent color/i) as HTMLInputElement).value).toBe('#6b7d75');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /location branding/i });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should have labeled form inputs', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/custom logo url/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/custom display name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/primary color/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/secondary color/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/accent color/i)).toBeInTheDocument();
      });
    });

    it('should have accessible save button', async () => {
      render(<LocationBrandingPage />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /save branding/i });
        expect(button).toBeInTheDocument();
      });
    });
  });
});
